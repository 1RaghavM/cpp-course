import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { applyAttempt } from "@/lib/content/review";
import type { Database } from "@/lib/supabase/types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

const skipIfNoLocalSupabase = !SUPABASE_URL || !SERVICE_KEY || !ANON_KEY;

describe.skipIf(skipIfNoLocalSupabase)("review-attempt integration", () => {
  let admin: ReturnType<typeof createClient<Database>>;
  let userA = "";
  let userB = "";
  let userAEmail = "";
  let userBEmail = "";
  let checkId = "";
  const PASSWORD = "pw-test-1234";

  beforeAll(async () => {
    admin = createClient<Database>(SUPABASE_URL, SERVICE_KEY);
    const stamp = Date.now();
    userAEmail = `ra+${stamp}@test.local`;
    userBEmail = `rb+${stamp}@test.local`;
    const a = await admin.auth.admin.createUser({
      email: userAEmail,
      password: PASSWORD,
      email_confirm: true,
    });
    const b = await admin.auth.admin.createUser({
      email: userBEmail,
      password: PASSWORD,
      email_confirm: true,
    });
    userA = a.data.user!.id;
    userB = b.data.user!.id;

    const { data: anyCheck } = await admin.from("concept_checks").select("id").limit(1).single();
    checkId = anyCheck!.id;
  });

  afterAll(async () => {
    if (userA) {
      await admin.from("concept_check_attempts").delete().eq("user_id", userA);
      await admin.from("concept_check_reviews").delete().eq("user_id", userA);
      await admin.auth.admin.deleteUser(userA);
    }
    if (userB) {
      await admin.from("concept_check_attempts").delete().eq("user_id", userB);
      await admin.from("concept_check_reviews").delete().eq("user_id", userB);
      await admin.auth.admin.deleteUser(userB);
    }
  });

  it("two attempts on the same card produce one reviews row and two attempts rows", async () => {
    // We need a user-scoped client (anon key + signed-in session) so the RPC's
    // auth.uid() resolves to the user, not the service role.
    const userClient = createClient<Database>(SUPABASE_URL, ANON_KEY);
    const signIn = await userClient.auth.signInWithPassword({ email: userAEmail, password: PASSWORD });
    expect(signIn.error).toBeNull();

    await applyAttempt(userClient, userA, checkId, false, new Date("2026-06-10"));
    await applyAttempt(userClient, userA, checkId, true, new Date("2026-06-11"));

    const { data: attempts } = await admin
      .from("concept_check_attempts")
      .select("id")
      .eq("user_id", userA)
      .eq("check_id", checkId);
    expect(attempts).toHaveLength(2);

    const { data: reviews } = await admin
      .from("concept_check_reviews")
      .select("interval_index, next_due, last_correct")
      .eq("user_id", userA)
      .eq("check_id", checkId);
    expect(reviews).toHaveLength(1);
    // Second attempt (correct) follows a previous incorrect → intervalIndex resets to 0
    // then advances to 1 (3 days after 2026-06-11 = 2026-06-14)
    expect(reviews![0]).toMatchObject({ interval_index: 1, last_correct: true, next_due: "2026-06-14" });
  });

  it("RLS prevents user B from reading user A's reviews row", async () => {
    const bClient = createClient<Database>(SUPABASE_URL, ANON_KEY);
    const signIn = await bClient.auth.signInWithPassword({ email: userBEmail, password: PASSWORD });
    expect(signIn.error).toBeNull();

    const { data } = await bClient
      .from("concept_check_reviews")
      .select("id")
      .eq("user_id", userA);
    expect(data ?? []).toHaveLength(0);
  });
});

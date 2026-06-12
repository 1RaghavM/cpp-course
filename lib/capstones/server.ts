import type { AppSupabaseClient } from "@/lib/supabase/types";
import type {
  CapstoneSlug,
  CapstoneAttempt,
  InternalCapstone,
  PublicCapstone,
  CapstoneMilestone,
  MilestoneTest,
} from "@/lib/capstones/types";
import type { Stage } from "@/lib/dashboard/types";

export async function fetchPublicCapstone(
  supabase: AppSupabaseClient,
  slug: CapstoneSlug,
): Promise<PublicCapstone | null> {
  const internal = await fetchInternalCapstone(supabase, slug);
  if (!internal) return null;
  // Strip reference_solution before returning to clients.
  const { reference_solution, ...rest } = internal;
  void reference_solution;
  return rest;
}

export async function fetchInternalCapstone(
  supabase: AppSupabaseClient,
  slug: CapstoneSlug,
): Promise<InternalCapstone | null> {
  const { data: capstone, error } = await supabase
    .from("capstones")
    .select(
      "id, slug, stage, title, description_md, language_standard, compile_flags, starter_code, reference_solution",
    )
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  if (!capstone) return null;

  const { data: milestones, error: mErr } = await supabase
    .from("capstone_milestones")
    .select("id, ordinal, title, spec_anchor, tests")
    .eq("capstone_id", capstone.id)
    .order("ordinal", { ascending: true });
  if (mErr) throw mErr;

  return {
    id: capstone.id,
    slug: capstone.slug as CapstoneSlug,
    stage: capstone.stage as Stage,
    title: capstone.title,
    description_md: capstone.description_md,
    language_standard: capstone.language_standard,
    compile_flags: capstone.compile_flags,
    starter_code: capstone.starter_code,
    reference_solution: capstone.reference_solution,
    milestones: (milestones ?? []).map(
      (m): CapstoneMilestone => ({
        id: m.id,
        ordinal: m.ordinal,
        title: m.title,
        spec_anchor: m.spec_anchor,
        tests: m.tests as unknown as MilestoneTest[],
      }),
    ),
  };
}

export async function fetchUserAttempts(
  supabase: AppSupabaseClient,
  userId: string,
  milestoneIds: string[],
): Promise<CapstoneAttempt[]> {
  if (milestoneIds.length === 0) return [];
  const { data, error } = await supabase
    .from("capstone_attempts")
    .select("milestone_id, passed, last_attempted_at")
    .eq("user_id", userId)
    .in("milestone_id", milestoneIds);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    milestone_id: row.milestone_id,
    passed: row.passed,
    last_attempted_at: row.last_attempted_at,
  }));
}

export async function upsertAttempt(
  supabase: AppSupabaseClient,
  userId: string,
  milestoneId: string,
  passed: boolean,
  submissionId: string | null,
): Promise<void> {
  const { error } = await supabase.from("capstone_attempts").upsert(
    {
      user_id: userId,
      milestone_id: milestoneId,
      passed,
      submission_id: submissionId,
      last_attempted_at: new Date().toISOString(),
    },
    { onConflict: "user_id,milestone_id" },
  );
  if (error) throw error;
}

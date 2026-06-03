import type { AppSupabaseClient } from "@/lib/supabase/types";

/**
 * Per-user rate limiter for `/api/playground/run` backed by the
 * `playground_runs` table. Counts rows in the last 60 seconds and rejects
 * when the user has already used the per-minute quota.
 *
 * Insertion happens here too so the next request sees this run reflected in
 * the rolling window, even before Judge0 returns.
 *
 * Note: the `playground_runs` table is created by a migration owned by a
 * parallel agent. Its row type is not yet in `lib/supabase/types.ts`, so we
 * cast through `unknown` here to keep types honest without `any`.
 */

const WINDOW_MS = 60_000;
const MAX_RUNS_PER_WINDOW = 10;

export interface PlaygroundRateLimitResult {
  allowed: boolean;
  reason?: string;
}

export async function checkPlaygroundRateLimit(
  supabase: AppSupabaseClient,
  userId: string,
): Promise<PlaygroundRateLimitResult> {
  const since = new Date(Date.now() - WINDOW_MS).toISOString();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- table created in parallel migration, not yet in types
  const sb = supabase as any;

  const { count } = await sb
    .from("playground_runs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", since);

  if ((count ?? 0) >= MAX_RUNS_PER_WINDOW) {
    return { allowed: false, reason: `Max ${MAX_RUNS_PER_WINDOW} runs per minute` };
  }

  await sb.from("playground_runs").insert({ user_id: userId });

  return { allowed: true };
}

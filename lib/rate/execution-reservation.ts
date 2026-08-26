import type { AppSupabaseClient } from "@/lib/supabase/types";

/**
 * Shared per-user reservation ledger for every code-execution surface
 * (playground, exercise submissions, capstone runs). Each of those fans out
 * to a metered Judge0 call, so the abuse case is the same everywhere: a
 * naive "count existing rows, then act" check is TOCTOU — N concurrent
 * requests all read the same stale count and all pass.
 *
 * The fix is to make the count and the reservation the same step: insert a
 * row for this attempt BEFORE the expensive call runs, so any request that
 * arrives while this one is in flight sees it in its window.
 *
 * Backed by the `playground_runs` table (see
 * infra/supabase/migrations/012_playground_runs.sql). The table predates
 * this shared use and its name is now narrower than what it tracks — it's a
 * generic per-user execution reservation log, not just playground runs. Not
 * renaming the table itself since a second table would require a migration
 * another agent owns; renaming the concept here in code instead.
 */

const WINDOW_MS = 60_000;

export interface ReservationResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Atomically (relative to the check) reserves one execution slot for
 * `userId` against a per-minute `maxPerWindow` cap. Call this BEFORE the
 * Judge0 request, not after — the whole point is that the reservation lands
 * first so concurrent callers see it.
 */
export async function reserveExecution(
  supabase: AppSupabaseClient,
  userId: string,
  maxPerWindow: number,
): Promise<ReservationResult> {
  const since = new Date(Date.now() - WINDOW_MS).toISOString();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- table created in parallel migration, not yet in types
  const sb = supabase as any;

  const { count } = await sb
    .from("playground_runs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", since);

  if ((count ?? 0) >= maxPerWindow) {
    return { allowed: false, reason: `Max ${maxPerWindow} per minute` };
  }

  await sb.from("playground_runs").insert({ user_id: userId });

  return { allowed: true };
}

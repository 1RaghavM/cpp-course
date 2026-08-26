import type { AppSupabaseClient } from "@/lib/supabase/types";
import { reserveExecution } from "@/lib/rate/execution-reservation";

/**
 * Per-user rate limiter for `/api/playground/run`. Thin wrapper around the
 * shared `reserveExecution` ledger (see lib/rate/execution-reservation.ts)
 * with the playground's own per-minute cap.
 */

const MAX_RUNS_PER_WINDOW = 10;

export interface PlaygroundRateLimitResult {
  allowed: boolean;
  reason?: string;
}

export async function checkPlaygroundRateLimit(
  supabase: AppSupabaseClient,
  userId: string,
): Promise<PlaygroundRateLimitResult> {
  return reserveExecution(supabase, userId, MAX_RUNS_PER_WINDOW);
}

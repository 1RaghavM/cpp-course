import type {
  AppSupabaseClient,
  ConceptCheck,
} from "@/lib/supabase/types";

export const INTERVALS_DAYS = [1, 3, 7, 16, 30] as const;
const MAX_INTERVAL_INDEX = INTERVALS_DAYS.length - 1;

export interface ReviewState {
  intervalIndex: number;
  nextDue: string;
  lastCorrect: boolean;
  lastAnsweredAt: string;
}

export interface DueCandidate {
  checkId: string;
  nextDue: string;
  intervalIndex: number;
}

function addDays(today: Date, days: number): string {
  const d = new Date(today);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function initialReviewState(correct: boolean, today: Date): ReviewState {
  const intervalIndex = correct ? 1 : 0;
  return {
    intervalIndex,
    nextDue: addDays(today, INTERVALS_DAYS[intervalIndex]!),
    lastCorrect: correct,
    lastAnsweredAt: today.toISOString(),
  };
}

export function advanceReviewState(prev: ReviewState, correct: boolean, today: Date): ReviewState {
  const intervalIndex = correct ? Math.min(prev.intervalIndex + 1, MAX_INTERVAL_INDEX) : 0;
  return {
    intervalIndex,
    nextDue: addDays(today, INTERVALS_DAYS[intervalIndex]!),
    lastCorrect: correct,
    lastAnsweredAt: today.toISOString(),
  };
}

export function pickDueCards(
  candidates: DueCandidate[],
  today: Date,
  max = 20,
): string[] {
  const todayIso = today.toISOString().slice(0, 10);
  return candidates
    .filter((c) => c.nextDue <= todayIso)
    .sort((a, b) => {
      if (a.nextDue !== b.nextDue) return a.nextDue.localeCompare(b.nextDue);
      return a.intervalIndex - b.intervalIndex;
    })
    .slice(0, max)
    .map((c) => c.checkId);
}

export function nextDueDate(candidates: DueCandidate[]): string | null {
  if (candidates.length === 0) return null;
  return candidates.reduce((min, c) => (c.nextDue < min ? c.nextDue : min), candidates[0]!.nextDue);
}

export interface DueQueueItem {
  check: ConceptCheck;
  lessonNumber: string;
  intervalIndex: number;
}

export async function loadDueReviewQueue(
  supabase: AppSupabaseClient,
  userId: string,
  today: Date,
  max = 20,
): Promise<DueQueueItem[]> {
  const todayIso = today.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("concept_check_reviews")
    .select("check_id, interval_index, next_due, concept_checks(*, lessons(number))")
    .eq("user_id", userId)
    .lte("next_due", todayIso)
    .order("next_due", { ascending: true })
    .order("interval_index", { ascending: true })
    .limit(max);

  if (error) throw new Error(`loadDueReviewQueue failed: ${error.message}`);

  return (data ?? [])
    .filter(
      (row): row is typeof row & { concept_checks: ConceptCheck & { lessons: { number: string } } } =>
        row.concept_checks !== null && (row.concept_checks as unknown as { lessons: unknown }).lessons !== null,
    )
    .map((row) => ({
      check: row.concept_checks,
      lessonNumber: row.concept_checks.lessons.number,
      intervalIndex: row.interval_index,
    }));
}

export async function applyAttempt(
  supabase: AppSupabaseClient,
  userId: string,
  checkId: string,
  correct: boolean,
  today: Date,
): Promise<void> {
  const { data: existing, error: readError } = await supabase
    .from("concept_check_reviews")
    .select("interval_index, next_due, last_correct, last_answered_at")
    .eq("user_id", userId)
    .eq("check_id", checkId)
    .maybeSingle();

  if (readError) throw new Error(`applyAttempt read failed: ${readError.message}`);

  const newState: ReviewState = existing
    ? advanceReviewState(
        {
          intervalIndex: existing.interval_index,
          nextDue: existing.next_due,
          lastCorrect: existing.last_correct,
          lastAnsweredAt: existing.last_answered_at,
        },
        correct,
        today,
      )
    : initialReviewState(correct, today);

  // The record_check_attempt RPC is not in the auto-generated Supabase types
  // (types.ts is hand-edited; only table rows are typed, not Functions). Cast
  // the RPC name to bypass the literal-union check without going full any.
  const { error: rpcError } = await supabase.rpc(
    "record_check_attempt" as Parameters<typeof supabase.rpc>[0],
    {
      p_check_id: checkId,
      p_correct: correct,
      p_interval_index: newState.intervalIndex,
      p_next_due: newState.nextDue,
    } as never,
  );

  if (rpcError) throw new Error(`applyAttempt rpc failed: ${rpcError.message}`);
}

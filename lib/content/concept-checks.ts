import type { AppSupabaseClient, ConceptCheck, Lesson } from "@/lib/supabase/types";

// ---------------------------------------------------------------------------
// Pure warm-up selection
// ---------------------------------------------------------------------------

export interface WarmupCandidate {
  checkId: string;
  /** null = never answered */
  lastCorrect: boolean | null;
  lastAnsweredAt: string | null;
}

/**
 * Pick warm-up check ids: wrong answers first (oldest first), then never-seen
 * (caller's order preserved), then correct answers least-recently-answered.
 */
export function pickWarmupIds(candidates: WarmupCandidate[], max = 3): string[] {
  const byAnsweredAt = (a: WarmupCandidate, b: WarmupCandidate) =>
    (a.lastAnsweredAt ?? "").localeCompare(b.lastAnsweredAt ?? "");

  const wrong = candidates.filter((c) => c.lastCorrect === false).sort(byAnsweredAt);
  const unseen = candidates.filter((c) => c.lastCorrect === null);
  const correct = candidates.filter((c) => c.lastCorrect === true).sort(byAnsweredAt);

  return [...wrong, ...unseen, ...correct].slice(0, max).map((c) => c.checkId);
}

// ---------------------------------------------------------------------------
// Loaders
// ---------------------------------------------------------------------------

export async function loadConceptChecks(
  supabase: AppSupabaseClient,
  lessonId: string,
): Promise<ConceptCheck[]> {
  const { data, error } = await supabase
    .from("concept_checks")
    .select("*")
    .eq("lesson_id", lessonId)
    .order("position", { ascending: true });
  if (error) throw new Error(`Failed to load concept checks: ${error.message}`);
  return data ?? [];
}

export interface WarmupCheck {
  check: ConceptCheck;
  /** Lesson number the check came from, e.g. "13.5" — shown as a badge. */
  lessonNumber: string;
}

/**
 * Select up to `max` warm-up checks from prior lessons (same chapter earlier
 * lessons + everything in the previous two chapters). SQL + pure picker only —
 * never calls the LLM. Returns [] gracefully when no prior content exists.
 */
export async function loadWarmupChecks(
  supabase: AppSupabaseClient,
  userId: string,
  lesson: Lesson,
  max = 3,
): Promise<WarmupCheck[]> {
  const { data: chapters, error: chaptersError } = await supabase
    .from("chapters")
    .select("id, sort_order");
  if (chaptersError) {
    console.error("loadWarmupChecks: chapters query failed:", chaptersError.message);
    return [];
  }
  const current = (chapters ?? []).find((c) => c.id === lesson.chapter_id);
  if (!current) return [];

  const priorChapterIds = (chapters ?? [])
    .filter((c) => c.sort_order < current.sort_order && c.sort_order >= current.sort_order - 2)
    .map((c) => c.id);

  const [
    { data: sameChapter, error: sameChapterError },
    { data: prevChapters, error: prevChaptersError },
  ] = await Promise.all([
    supabase
      .from("lessons")
      .select("id, number, sort_order")
      .eq("chapter_id", lesson.chapter_id)
      .lt("sort_order", lesson.sort_order),
    priorChapterIds.length > 0
      ? supabase.from("lessons").select("id, number, sort_order").in("chapter_id", priorChapterIds)
      : Promise.resolve({
          data: [] as Array<{ id: string; number: string; sort_order: number }>,
          error: null,
        }),
  ]);
  if (sameChapterError) {
    console.error("loadWarmupChecks: same-chapter lessons query failed:", sameChapterError.message);
    return [];
  }
  if (prevChaptersError) {
    console.error(
      "loadWarmupChecks: previous-chapters lessons query failed:",
      prevChaptersError.message,
    );
    return [];
  }

  const priorLessons = [...(prevChapters ?? []), ...(sameChapter ?? [])];
  if (priorLessons.length === 0) return [];
  const numberByLessonId = new Map(priorLessons.map((l) => [l.id, l.number]));

  const { data: checks, error: checksError } = await supabase
    .from("concept_checks")
    .select("*")
    .in(
      "lesson_id",
      priorLessons.map((l) => l.id),
    );
  if (checksError) {
    console.error("loadWarmupChecks: concept_checks query failed:", checksError.message);
    return [];
  }
  if (!checks || checks.length === 0) return [];

  const { data: attempts, error: attemptsError } = await supabase
    .from("concept_check_attempts")
    .select("check_id, correct, answered_at")
    .eq("user_id", userId)
    .in(
      "check_id",
      checks.map((c) => c.id),
    )
    .order("answered_at", { ascending: false });
  if (attemptsError) {
    // Attempts are enhancement data only — log and continue, treating every
    // candidate as unseen rather than dropping valid warm-up checks.
    console.error("loadWarmupChecks: attempts query failed:", attemptsError.message);
  }

  // Latest attempt per check (rows are newest-first).
  const latest = new Map<string, { correct: boolean; answered_at: string }>();
  for (const a of attempts ?? []) {
    if (!latest.has(a.check_id)) latest.set(a.check_id, a);
  }

  // Closest prior lesson first so unseen items skew recent.
  const sorted = [...checks].sort((a, b) => {
    const na = numberByLessonId.get(a.lesson_id) ?? "";
    const nb = numberByLessonId.get(b.lesson_id) ?? "";
    return nb.localeCompare(na, undefined, { numeric: true });
  });

  const candidates: WarmupCandidate[] = sorted.map((c) => ({
    checkId: c.id,
    lastCorrect: latest.get(c.id)?.correct ?? null,
    lastAnsweredAt: latest.get(c.id)?.answered_at ?? null,
  }));

  const pickedIds = pickWarmupIds(candidates, max);
  const checkById = new Map(checks.map((c) => [c.id, c]));
  return pickedIds.map((id) => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- picked ids always come from the checks array
    const check = checkById.get(id)!;
    return { check, lessonNumber: numberByLessonId.get(check.lesson_id) ?? "" };
  });
}

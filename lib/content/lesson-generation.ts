import type { Lesson, Exercise, TestCase, AppSupabaseClient } from "@/lib/supabase/types";

// ---------------------------------------------------------------------------
// Return types
// ---------------------------------------------------------------------------

export interface ExerciseWithTestCases extends Exercise {
  testCases: TestCase[];
}

export interface LessonContent {
  lesson: Lesson;
  exercises: ExerciseWithTestCases[];
}

// ---------------------------------------------------------------------------
// Cache-hit path: load exercises + test cases from DB
// ---------------------------------------------------------------------------

async function loadExercisesFromDb(
  supabase: AppSupabaseClient,
  lessonId: string,
): Promise<ExerciseWithTestCases[]> {
  const { data: exercises, error: exError } = await supabase
    .from("exercises")
    .select("*")
    .eq("lesson_id", lessonId)
    .order("sort_order", { ascending: true });

  if (exError) {
    throw new Error(`Failed to load exercises: ${exError.message}`);
  }

  if (!exercises || exercises.length === 0) {
    return [];
  }

  const exerciseIds = exercises.map((ex) => ex.id);

  const { data: testCases, error: tcError } = await supabase
    .from("test_cases")
    .select("*")
    .in("exercise_id", exerciseIds)
    .order("sort_order", { ascending: true });

  if (tcError) {
    throw new Error(`Failed to load test cases: ${tcError.message}`);
  }

  const tcByExercise = new Map<string, TestCase[]>();
  for (const tc of testCases ?? []) {
    const existing = tcByExercise.get(tc.exercise_id) ?? [];
    existing.push(tc);
    tcByExercise.set(tc.exercise_id, existing);
  }

  return exercises.map((ex) => ({
    ...ex,
    testCases: tcByExercise.get(ex.id) ?? [],
  }));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch a lesson by slug. If the lesson has cached content, return it with
 * exercises. If not, return the lesson with null summary (shown as "coming
 * soon" in the UI). No LLM generation is triggered from the user side.
 */
export async function getOrGenerateLesson(
  supabase: AppSupabaseClient,
  slug: string,
): Promise<LessonContent> {
  const { data: lesson, error: lessonError } = await supabase
    .from("lessons")
    .select("*")
    .eq("slug", slug)
    .single();

  if (lessonError || !lesson) {
    throw new Error(`Lesson not found for slug "${slug}": ${lessonError?.message ?? "no data"}`);
  }

  if (lesson.summary_md !== null) {
    const exercises = await loadExercisesFromDb(supabase, lesson.id);
    return { lesson, exercises };
  }

  return { lesson, exercises: [] };
}

import type { Lesson, Exercise, TestCase, AppSupabaseClient } from '@/lib/supabase/types';
import { createCompletion } from '@/lib/anthropic/client';
import {
  buildLessonSummaryPrompt,
  buildExercisePrompt,
  shouldGenerateExercises,
  MODEL_HAIKU,
} from '@/lib/anthropic/prompts';

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
// Private helpers
// ---------------------------------------------------------------------------

/**
 * Returns titles of lessons in the same chapter that come before the current
 * lesson (lower sort_order). Used to give the LLM context about what the
 * student has already covered.
 */
async function getPriorLessonTitles(
  supabase: AppSupabaseClient,
  chapterId: number,
  sortOrder: number,
): Promise<string[]> {
  const { data, error } = await supabase
    .from('lessons')
    .select('learncpp_title')
    .eq('chapter_id', chapterId)
    .lt('sort_order', sortOrder)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Failed to fetch prior lesson titles:', error);
    return [];
  }

  return (data ?? []).map((row) => row.learncpp_title);
}

/**
 * Returns the chapter title and number for context in the prompt.
 */
async function getChapterContext(
  supabase: AppSupabaseClient,
  chapterId: number,
): Promise<{ title: string; number: string }> {
  const { data, error } = await supabase
    .from('chapters')
    .select('learncpp_title, number')
    .eq('id', chapterId)
    .single();

  if (error || !data) {
    throw new Error(
      `Failed to fetch chapter context for chapter_id=${chapterId}: ${error?.message ?? 'no data'}`,
    );
  }

  return { title: data.learncpp_title, number: data.number };
}

// ---------------------------------------------------------------------------
// Exercise response parsing
// ---------------------------------------------------------------------------

interface ParsedExercise {
  title: string;
  prompt_md: string;
  starter_code: string;
  solution_code: string | null;
  difficulty: string;
  test_cases: ParsedTestCase[];
}

interface ParsedTestCase {
  label: string;
  is_sample: boolean;
  stdin: string;
  expected_stdout: string;
}

/**
 * Parse the JSON response from the exercise generation LLM call.
 *
 * Validates:
 * - At least 1 exercise
 * - Each exercise has at least 3 test cases
 * - Each exercise has non-empty starter_code
 *
 * The LLM may wrap the JSON in a markdown code fence; we strip that first.
 */
function parseExerciseResponse(raw: string): ParsedExercise[] {
  // Strip markdown code fences if present (```json ... ``` or ``` ... ```)
  let cleaned = raw.trim();
  const fenceMatch = cleaned.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?\s*```$/);
  if (fenceMatch) {
    cleaned = fenceMatch[1]!.trim();
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(
      `Failed to parse exercise JSON from LLM response. Raw (first 500 chars): ${raw.slice(0, 500)}`,
    );
  }

  if (!Array.isArray(parsed)) {
    throw new Error(
      `Exercise response is not an array. Got: ${typeof parsed}`,
    );
  }

  if (parsed.length < 1) {
    throw new Error('Exercise response contains zero exercises');
  }

  const exercises: ParsedExercise[] = [];

  for (let i = 0; i < parsed.length; i++) {
    const ex = parsed[i] as Record<string, unknown>;

    if (typeof ex.title !== 'string' || ex.title.trim() === '') {
      throw new Error(`Exercise ${i}: missing or empty title`);
    }
    if (typeof ex.prompt_md !== 'string' || ex.prompt_md.trim() === '') {
      throw new Error(`Exercise ${i}: missing or empty prompt_md`);
    }
    if (typeof ex.starter_code !== 'string' || ex.starter_code.trim() === '') {
      throw new Error(`Exercise ${i}: missing or empty starter_code`);
    }
    if (!Array.isArray(ex.test_cases)) {
      throw new Error(`Exercise ${i}: test_cases is not an array`);
    }
    if (ex.test_cases.length < 3) {
      throw new Error(
        `Exercise ${i}: needs at least 3 test cases, got ${ex.test_cases.length}`,
      );
    }

    const testCases: ParsedTestCase[] = [];
    for (let j = 0; j < ex.test_cases.length; j++) {
      const tc = ex.test_cases[j] as Record<string, unknown>;
      testCases.push({
        label: typeof tc.label === 'string' ? tc.label : `Test ${j + 1}`,
        is_sample: typeof tc.is_sample === 'boolean' ? tc.is_sample : j === 0,
        stdin: typeof tc.stdin === 'string' ? tc.stdin : '',
        expected_stdout:
          typeof tc.expected_stdout === 'string' ? tc.expected_stdout : '',
      });
    }

    exercises.push({
      title: ex.title as string,
      prompt_md: ex.prompt_md as string,
      starter_code: ex.starter_code as string,
      solution_code:
        typeof ex.solution_code === 'string' && ex.solution_code.trim() !== ''
          ? (ex.solution_code as string)
          : null,
      difficulty:
        typeof ex.difficulty === 'string' ? ex.difficulty : 'practice',
      test_cases: testCases,
    });
  }

  return exercises;
}

/**
 * Extract the text content from an Anthropic Message response.
 */
function extractTextContent(
  response: Awaited<ReturnType<typeof createCompletion>>,
): string {
  for (const block of response.content) {
    if (block.type === 'text') {
      return block.text;
    }
  }
  throw new Error('LLM response contained no text blocks');
}

// ---------------------------------------------------------------------------
// Cache-hit path: load exercises + test cases from DB
// ---------------------------------------------------------------------------

async function loadExercisesFromDb(
  supabase: AppSupabaseClient,
  lessonId: string,
): Promise<ExerciseWithTestCases[]> {
  const { data: exercises, error: exError } = await supabase
    .from('exercises')
    .select('*')
    .eq('lesson_id', lessonId)
    .order('sort_order', { ascending: true });

  if (exError) {
    throw new Error(`Failed to load exercises: ${exError.message}`);
  }

  if (!exercises || exercises.length === 0) {
    return [];
  }

  const exerciseIds = exercises.map((ex) => ex.id);

  const { data: testCases, error: tcError } = await supabase
    .from('test_cases')
    .select('*')
    .in('exercise_id', exerciseIds)
    .order('sort_order', { ascending: true });

  if (tcError) {
    throw new Error(`Failed to load test cases: ${tcError.message}`);
  }

  // Group test cases by exercise_id
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
// Cache-miss path: generate via LLM and persist
// ---------------------------------------------------------------------------

async function generateAndPersist(
  supabase: AppSupabaseClient,
  lesson: Lesson,
  userId?: string,
): Promise<{ lesson: Lesson; exercises: ExerciseWithTestCases[] }> {
  // Load context for the prompt
  const [chapterCtx, priorTitles] = await Promise.all([
    getChapterContext(supabase, lesson.chapter_id),
    getPriorLessonTitles(supabase, lesson.chapter_id, lesson.sort_order),
  ]);

  const lessonTitle = lesson.my_title ?? lesson.learncpp_title;
  const chapterLabel = `${chapterCtx.number}: ${chapterCtx.title}`;

  // --- Step 1: Generate lesson summary ---
  const summaryPrompt = buildLessonSummaryPrompt(
    lessonTitle,
    chapterLabel,
    priorTitles,
    lesson.tags ?? [],
  );

  const summaryResponse = await createCompletion(
    {
      model: summaryPrompt.model,
      system: summaryPrompt.system,
      messages: summaryPrompt.messages,
      maxTokens: summaryPrompt.maxTokens,
    },
    {
      callType: 'lesson_summary',
      lessonId: lesson.id,
      userId,
      supabase,
    },
  );

  const summaryMd = extractTextContent(summaryResponse);

  // --- Persist summary to lesson row ---
  console.log(`[lesson-gen] Persisting summary for lesson ${lesson.id}...`);
  
  const { data: updatedLesson, error: updateError } = await supabase
    .from('lessons')
    .update({
      summary_md: summaryMd,
      summary_generated_at: new Date().toISOString(),
      summary_model: MODEL_HAIKU,
    })
    .eq('id', lesson.id)
    .select()
    .single();

  if (updateError) {
    console.error(`[lesson-gen] Update error:`, updateError);
    throw new Error(`Failed to persist lesson summary: ${updateError.message}`);
  }
  
  if (!updatedLesson) {
    console.error(`[lesson-gen] No data returned from update`);
    throw new Error(`Failed to persist lesson summary: no data returned`);
  }
  
  console.log(`[lesson-gen] Successfully persisted summary for lesson ${lesson.id}`);
  console.log(`[lesson-gen] Updated lesson summary_md is: ${updatedLesson.summary_md ? 'SET (' + updatedLesson.summary_md.length + ' chars)' : 'NULL'}`);
  
  // Verification: re-read from DB to confirm the update was committed
  const { data: verifyLesson } = await supabase
    .from('lessons')
    .select('summary_md')
    .eq('id', lesson.id)
    .single();
  console.log(`[lesson-gen] VERIFY re-read: summary_md is: ${verifyLesson?.summary_md ? 'SET (' + verifyLesson.summary_md.length + ' chars)' : 'NULL'}`);

  // --- Step 2: Generate exercises (skip for intro chapters) ---
  const exercises: ExerciseWithTestCases[] = [];

  if (!shouldGenerateExercises(chapterCtx.number)) {
    console.log(`[lesson-gen] Skipping exercises for intro chapter ${chapterCtx.number}`);
    return { lesson: updatedLesson, exercises };
  }

  try {
    const exercisePrompt = buildExercisePrompt(
      lessonTitle,
      summaryMd,
      chapterCtx.number,
      chapterCtx.title,
    );

    const exerciseResponse = await createCompletion(
      {
        model: exercisePrompt.model,
        system: exercisePrompt.system,
        messages: exercisePrompt.messages,
        maxTokens: exercisePrompt.maxTokens,
      },
      {
        callType: 'exercise_gen',
        lessonId: lesson.id,
        userId,
        supabase,
      },
    );

    const exerciseRaw = extractTextContent(exerciseResponse);
    const parsedExercises = parseExerciseResponse(exerciseRaw);

    // --- Persist exercises ---
    for (let i = 0; i < parsedExercises.length; i++) {
      const pe = parsedExercises[i]!;

      const { data: insertedExercise, error: exInsertError } = await supabase
        .from('exercises')
        .insert({
          lesson_id: lesson.id,
          title: pe.title,
          prompt_md: pe.prompt_md,
          starter_code: pe.starter_code,
          solution_code: pe.solution_code,
          difficulty: pe.difficulty,
          sort_order: i + 1,
          generated_model: MODEL_HAIKU,
        })
        .select()
        .single();

      if (exInsertError || !insertedExercise) {
        console.error(
          `Failed to insert exercise ${i}:`,
          exInsertError?.message,
        );
        continue;
      }

      // --- Persist test cases for this exercise ---
      const testCaseRows = pe.test_cases.map((tc, j) => ({
        exercise_id: insertedExercise.id,
        label: tc.label,
        is_sample: tc.is_sample,
        stdin: tc.stdin,
        expected_stdout: tc.expected_stdout,
        sort_order: j + 1,
      }));

      const { data: insertedTestCases, error: tcInsertError } = await supabase
        .from('test_cases')
        .insert(testCaseRows)
        .select();

      if (tcInsertError) {
        console.error(
          `Failed to insert test cases for exercise ${i}:`,
          tcInsertError.message,
        );
      }

      exercises.push({
        ...insertedExercise,
        testCases: insertedTestCases ?? [],
      });
    }
  } catch (err) {
    // Exercise generation failed, but summary is already saved.
    // Next visit will have the summary (cache hit) but empty exercises.
    // This is acceptable degradation per the spec.
    console.error(
      'Exercise generation failed (summary already persisted):',
      err,
    );
  }

  return { lesson: updatedLesson, exercises };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * The core cache-or-generate function. Called by the lesson API route.
 *
 * CACHE INVARIANT: If `summary_md IS NOT NULL`, this function returns cached
 * content from the database with ZERO LLM calls. The Anthropic API is only
 * contacted when `summary_md IS NULL` (first visit or after regeneration).
 */
export async function getOrGenerateLesson(
  supabase: AppSupabaseClient,
  slug: string,
  userId?: string,
): Promise<LessonContent> {
  // --- Step 1: Fetch lesson by slug ---
  const { data: lesson, error: lessonError } = await supabase
    .from('lessons')
    .select('*')
    .eq('slug', slug)
    .single();

  if (lessonError || !lesson) {
    throw new Error(
      `Lesson not found for slug "${slug}": ${lessonError?.message ?? 'no data'}`,
    );
  }

  console.log(`[lesson-gen] Fetched lesson "${slug}", summary_md is: ${lesson.summary_md ? 'SET (' + lesson.summary_md.length + ' chars)' : 'NULL'}`);

  // --- Step 2: Cache check ---
  if (lesson.summary_md !== null) {
    // CACHE HIT: summary exists, return from DB only. Zero LLM calls.
    console.log(`[lesson-gen] CACHE HIT for "${slug}" - loading from DB`);
    const exercises = await loadExercisesFromDb(supabase, lesson.id);
    return { lesson, exercises };
  }

  // --- Step 3: Cache miss — generate via LLM and persist ---
  console.log(`[lesson-gen] CACHE MISS for "${slug}" - generating via LLM...`);
  return generateAndPersist(supabase, lesson, userId);
}

/**
 * Clear all cached content for a lesson and regenerate from scratch.
 *
 * This is the ONLY function that clears cached content. Called by the
 * regenerate API route.
 *
 * Flow:
 * 1. Delete test_cases (via exercise cascade)
 * 2. Delete exercises for this lesson
 * 3. Set summary_md = NULL on the lesson row
 * 4. Call getOrGenerateLesson() which now sees a cache miss
 */
export async function regenerateLesson(
  supabase: AppSupabaseClient,
  slug: string,
  userId?: string,
): Promise<LessonContent> {
  // Fetch lesson to get its ID
  const { data: lesson, error: lessonError } = await supabase
    .from('lessons')
    .select('*')
    .eq('slug', slug)
    .single();

  if (lessonError || !lesson) {
    throw new Error(
      `Lesson not found for slug "${slug}": ${lessonError?.message ?? 'no data'}`,
    );
  }

  // --- Step 1: Delete test_cases for all exercises of this lesson ---
  const { data: exercises } = await supabase
    .from('exercises')
    .select('id')
    .eq('lesson_id', lesson.id);

  if (exercises && exercises.length > 0) {
    const exerciseIds = exercises.map((ex) => ex.id);

    const { error: tcDeleteError } = await supabase
      .from('test_cases')
      .delete()
      .in('exercise_id', exerciseIds);

    if (tcDeleteError) {
      console.error('Failed to delete test cases during regeneration:', tcDeleteError.message);
    }
  }

  // --- Step 2: Delete exercises ---
  const { error: exDeleteError } = await supabase
    .from('exercises')
    .delete()
    .eq('lesson_id', lesson.id);

  if (exDeleteError) {
    console.error('Failed to delete exercises during regeneration:', exDeleteError.message);
  }

  // --- Step 3: Clear summary on lesson row ---
  const { error: updateError } = await supabase
    .from('lessons')
    .update({
      summary_md: null,
      summary_generated_at: null,
      summary_model: null,
    })
    .eq('id', lesson.id);

  if (updateError) {
    throw new Error(
      `Failed to clear lesson summary during regeneration: ${updateError.message}`,
    );
  }

  // --- Step 4: Re-generate (getOrGenerateLesson now sees a cache miss) ---
  return getOrGenerateLesson(supabase, slug, userId);
}

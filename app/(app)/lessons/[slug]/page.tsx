import { notFound } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { getOrGenerateLesson } from "@/lib/content/lesson-generation";
import LessonClient from "./LessonClient";
import type { Lesson, Exercise } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps {
  params: { slug: string };
  searchParams: { ex?: string };
}

interface NavInfo {
  chapter: { title: string };
  currentIndex: number;
  totalInChapter: number;
  prevSlug: string | null;
  nextSlug: string | null;
}

export default async function LessonPage({ params, searchParams }: PageProps) {
  // Disable all caching for this page
  noStore();

  // Use service client for all DB operations (bypasses RLS)
  // Auth is handled by the (app) layout which requires owner session
  const supabase = createServiceClient();
  const { slug } = params;
  const initialExerciseIndex = parseInt(searchParams.ex ?? "0", 10) || 0;

  // ------ Fetch lesson content (cache-hit or generate) ------
  let lesson: Lesson;
  let exercises: Array<Exercise & { testCases: unknown[] }>;

  try {
    const result = await getOrGenerateLesson(supabase, slug);
    lesson = result.lesson;
    exercises = result.exercises;
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message.includes("not found")) {
      notFound();
    }
    throw err;
  }

  // ------ Fetch chapter info and neighboring lessons for nav ------
  const { data: chapter } = await supabase
    .from("chapters")
    .select("id, learncpp_title, my_title")
    .eq("id", lesson.chapter_id)
    .single();

  const { data: chapterLessons } = await supabase
    .from("lessons")
    .select("slug, sort_order")
    .eq("chapter_id", lesson.chapter_id)
    .order("sort_order", { ascending: true });

  let navInfo: NavInfo | null = null;
  if (chapter && chapterLessons) {
    const currentIdx = chapterLessons.findIndex((l) => l.slug === slug);
    navInfo = {
      chapter: { title: chapter.my_title ?? chapter.learncpp_title },
      currentIndex: currentIdx + 1,
      totalInChapter: chapterLessons.length,
      prevSlug: currentIdx > 0 ? chapterLessons[currentIdx - 1]?.slug ?? null : null,
      nextSlug:
        currentIdx < chapterLessons.length - 1
          ? chapterLessons[currentIdx + 1]?.slug ?? null
          : null,
    };
  }

  // ------ Mark progress as in_progress (fire-and-forget) ------
  // Check current progress first to avoid unnecessary writes
  const { data: progress } = (await supabase
    .from("progress")
    .select("state")
    .eq("lesson_id", lesson.id)
    .single()) as unknown as {
    data: { state: string } | null;
  };

  if (!progress) {
    // No progress row yet -- insert in_progress
    await supabase.from("progress").insert({
      lesson_id: lesson.id,
      state: "in_progress",
      first_visit_at: new Date().toISOString(),
      last_visit_at: new Date().toISOString(),
    });
  } else if (progress.state === "not_started") {
    // Upgrade from not_started to in_progress
    await supabase
      .from("progress")
      .update({
        state: "in_progress",
        first_visit_at: new Date().toISOString(),
        last_visit_at: new Date().toISOString(),
      })
      .eq("lesson_id", lesson.id);
  } else {
    // Just update last_visit_at
    await supabase
      .from("progress")
      .update({ last_visit_at: new Date().toISOString() })
      .eq("lesson_id", lesson.id);
  }

  // ------ Fetch sample test cases for each exercise ------
  const exerciseIds = exercises.map((ex) => ex.id);
  const testCasesMap = new Map<
    string,
    Array<{ label: string; stdin: string; expected_stdout: string }>
  >();

  if (exerciseIds.length > 0) {
    const { data: rawTestCases } = await supabase
      .from("test_cases")
      .select("exercise_id, label, stdin, expected_stdout, sort_order")
      .in("exercise_id", exerciseIds)
      .eq("is_sample", true)
      .order("sort_order", { ascending: true });

    for (const tc of rawTestCases ?? []) {
      const exerciseId = tc.exercise_id as string;
      if (!testCasesMap.has(exerciseId)) {
        testCasesMap.set(exerciseId, []);
      }
      testCasesMap.get(exerciseId)!.push({
        label: tc.label as string,
        stdin: tc.stdin as string,
        expected_stdout: tc.expected_stdout as string,
      });
    }
  }

  // ------ Fetch last passing submission for each exercise ------
  const lastPassingMap = new Map<string, string>();

  if (exerciseIds.length > 0) {
    for (const exId of exerciseIds) {
      const { data: rawSub } = await supabase
        .from("submissions")
        .select("source_code")
        .eq("exercise_id", exId)
        .eq("mode", "submit")
        .eq("status", "passed")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (rawSub?.source_code) {
        lastPassingMap.set(exId, rawSub.source_code as string);
      }
    }
  }

  // ------ Build exercise data for client ------
  const exercisesForClient = exercises.map((ex) => ({
    id: ex.id,
    title: ex.title,
    promptMd: ex.prompt_md,
    starterCode: ex.starter_code,
    difficulty: ex.difficulty,
    sampleTestCases: (testCasesMap.get(ex.id) ?? []).map((tc) => ({
      label: tc.label,
      stdin: tc.stdin,
      expectedStdout: tc.expected_stdout,
    })),
    lastPassingCode: lastPassingMap.get(ex.id) ?? null,
  }));

  const title = lesson.my_title ?? lesson.learncpp_title;

  // Clamp initialExerciseIndex to valid range
  const clampedIndex = Math.max(
    0,
    Math.min(initialExerciseIndex, exercisesForClient.length - 1)
  );

  return (
    <LessonClient
      lesson={{
        id: lesson.id,
        number: lesson.number,
        title,
        summaryMd: lesson.summary_md,
        learncppUrl: lesson.learncpp_url,
      }}
      exercises={exercisesForClient}
      initialExerciseIndex={exercisesForClient.length > 0 ? clampedIndex : 0}
      nav={navInfo}
    />
  );
}

import { notFound } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { requireServerSession } from "@/lib/auth/require-auth";
import { getOrGenerateLesson, type ExerciseWithTestCases } from "@/lib/content/lesson-generation";
import { touchLessonProgress } from "@/lib/content/lesson-progress";
import LessonClient from "./LessonClient";
import type { Lesson } from "@/lib/supabase/types";

interface PageProps {
  params: { slug: string };
  searchParams: { ex?: string };
}

interface ChapterLesson {
  slug: string;
  title: string;
  status: string;
}

interface NavInfo {
  chapter: { title: string };
  currentIndex: number;
  totalInChapter: number;
  prevSlug: string | null;
  nextSlug: string | null;
  chapterLessons: ChapterLesson[];
}

export default async function LessonPage({ params, searchParams }: PageProps) {
  // Disable all caching for this page
  noStore();

  const { supabase, userId } = await requireServerSession();
  const serviceClient = createServiceClient();
  const { slug } = params;
  const initialExerciseIndex = parseInt(searchParams.ex ?? "0", 10) || 0;

  // ------ Fetch lesson content (cache-hit or generate) ------
  let lesson: Lesson;
  let exercises: ExerciseWithTestCases[];

  try {
    const result = await getOrGenerateLesson(serviceClient, slug);
    lesson = result.lesson;
    exercises = result.exercises;
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message.includes("not found")) {
      notFound();
    }
    throw err;
  }

  const exerciseIds = exercises.map((ex) => ex.id);

  // ------ Parallel fetches: nav + last passing submissions + progress ------
  const [
    { data: chapter },
    { data: chapterLessons },
    { data: passingSubmissions },
    { data: progressRows },
  ] = await Promise.all([
    serviceClient
      .from("chapters")
      .select("id, learncpp_title, my_title")
      .eq("id", lesson.chapter_id)
      .single(),
    serviceClient
      .from("lessons")
      .select("id, slug, sort_order, learncpp_title, my_title")
      .eq("chapter_id", lesson.chapter_id)
      .order("sort_order", { ascending: true }),
    exerciseIds.length > 0
      ? supabase
          .from("submissions")
          .select("exercise_id, source_code")
          .eq("user_id", userId)
          .in("exercise_id", exerciseIds)
          .eq("mode", "submit")
          .eq("status", "passed")
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as Array<{ exercise_id: string; source_code: string }> }),
    supabase.from("progress").select("lesson_id, state"),
  ]);

  let navInfo: NavInfo | null = null;
  if (chapter && chapterLessons) {
    const progressMap = new Map<string, string>();
    for (const p of progressRows ?? []) {
      progressMap.set(p.lesson_id, p.state);
    }

    const currentIdx = chapterLessons.findIndex((l) => l.slug === slug);
    navInfo = {
      chapter: { title: chapter.my_title ?? chapter.learncpp_title },
      currentIndex: currentIdx + 1,
      totalInChapter: chapterLessons.length,
      prevSlug: currentIdx > 0 ? (chapterLessons[currentIdx - 1]?.slug ?? null) : null,
      nextSlug:
        currentIdx < chapterLessons.length - 1
          ? (chapterLessons[currentIdx + 1]?.slug ?? null)
          : null,
      chapterLessons: chapterLessons.map((l) => ({
        slug: l.slug,
        title: l.my_title ?? l.learncpp_title,
        status: progressMap.get(l.id) ?? "not_started",
      })),
    };
  }

  // Non-blocking: progress write must not delay HTML
  // Reading-only lessons auto-complete on visit; exercise-based stay in_progress.
  touchLessonProgress(supabase, userId, lesson.id, exercises.length > 0);

  // Sample test cases already loaded by getOrGenerateLesson
  const lastPassingMap = new Map<string, string>();
  for (const sub of passingSubmissions ?? []) {
    if (!lastPassingMap.has(sub.exercise_id) && sub.source_code) {
      lastPassingMap.set(sub.exercise_id, sub.source_code);
    }
  }

  const firstExercise = exercises[0];
  const exercisesForClient = firstExercise
    ? [
        {
          id: firstExercise.id,
          title: firstExercise.title,
          promptMd: firstExercise.prompt_md,
          starterCode: firstExercise.starter_code,
          solutionCode: firstExercise.solution_code ?? null,
          difficulty: firstExercise.difficulty,
          sampleTestCases: firstExercise.testCases
            .filter((tc) => tc.is_sample)
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((tc) => ({
              label: tc.label,
              stdin: tc.stdin ?? "",
              expectedStdout: tc.expected_stdout,
            })),
          lastPassingCode: lastPassingMap.get(firstExercise.id) ?? null,
        },
      ]
    : [];

  const title = lesson.my_title ?? lesson.learncpp_title;

  const clampedIndex = Math.max(0, Math.min(initialExerciseIndex, exercisesForClient.length - 1));

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

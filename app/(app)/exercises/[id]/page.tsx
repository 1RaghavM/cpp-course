import { notFound } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { requireServerSession } from "@/lib/auth/require-auth";
import { getOrGenerateLesson, type ExerciseWithTestCases } from "@/lib/content/lesson-generation";
import LessonClient from "@/app/(app)/lessons/[slug]/LessonClient";
import type { Lesson } from "@/lib/supabase/types";

interface Props {
  params: { id: string };
}

export default async function ExercisePage({ params }: Props) {
  noStore();

  const { supabase, userId } = await requireServerSession();
  const serviceClient = createServiceClient();
  const { id } = params;

  const { data: exercise, error } = await serviceClient
    .from("exercises")
    .select("id, lesson_id, sort_order")
    .eq("id", id)
    .single();

  if (error || !exercise) notFound();

  const { data: lessonRow } = await serviceClient
    .from("lessons")
    .select("slug, chapter_id")
    .eq("id", exercise.lesson_id)
    .single();

  if (!lessonRow) notFound();

  let lesson: Lesson;
  let exercises: ExerciseWithTestCases[];

  try {
    const result = await getOrGenerateLesson(serviceClient, lessonRow.slug);
    lesson = result.lesson;
    exercises = result.exercises;
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message.includes("not found")) notFound();
    throw err;
  }

  const exerciseIds = exercises.map((ex) => ex.id);

  const [{ data: passingSubmissions }, { data: chapter }, { data: chapterLessons }] =
    await Promise.all([
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
      serviceClient
        .from("chapters")
        .select("id, learncpp_title, my_title")
        .eq("id", lessonRow.chapter_id)
        .single(),
      serviceClient
        .from("lessons")
        .select("slug, sort_order")
        .eq("chapter_id", lessonRow.chapter_id)
        .order("sort_order", { ascending: true }),
    ]);

  const lastPassingMap = new Map<string, string>();
  for (const sub of passingSubmissions ?? []) {
    if (!lastPassingMap.has(sub.exercise_id) && sub.source_code) {
      lastPassingMap.set(sub.exercise_id, sub.source_code);
    }
  }

  const exercisesForClient = exercises.map((ex) => {
    const sampleTestCases = ex.testCases
      .filter((tc) => tc.is_sample)
      .sort((a, b) => a.sort_order - b.sort_order);

    return {
      id: ex.id,
      title: ex.title,
      promptMd: ex.prompt_md,
      starterCode: ex.starter_code,
      solutionCode: ex.solution_code ?? null,
      difficulty: ex.difficulty,
      sampleTestCases: sampleTestCases.map((tc) => ({
        label: tc.label,
        stdin: tc.stdin ?? "",
        expectedStdout: tc.expected_stdout,
      })),
      lastPassingCode: lastPassingMap.get(ex.id) ?? null,
    };
  });

  const exerciseIndex = exercises.findIndex((ex) => ex.id === id);
  const targetIndex = exerciseIndex >= 0 ? exerciseIndex : 0;

  let navInfo = null;
  if (chapter && chapterLessons) {
    const currentIdx = chapterLessons.findIndex((l) => l.slug === lessonRow.slug);
    navInfo = {
      chapter: { title: chapter.my_title ?? chapter.learncpp_title },
      currentIndex: currentIdx + 1,
      totalInChapter: chapterLessons.length,
      prevSlug: currentIdx > 0 ? (chapterLessons[currentIdx - 1]?.slug ?? null) : null,
      nextSlug:
        currentIdx < chapterLessons.length - 1
          ? (chapterLessons[currentIdx + 1]?.slug ?? null)
          : null,
    };
  }

  const title = lesson.my_title ?? lesson.learncpp_title;

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
      initialExerciseIndex={targetIndex}
      nav={navInfo}
      exerciseOnly
    />
  );
}

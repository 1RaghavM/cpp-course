import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { getOrGenerateLesson } from "@/lib/content/lesson-generation";
import { SummaryView } from "@/components/lesson/SummaryView";
import { ExerciseCard } from "@/components/lesson/ExerciseCard";
import { RegenerateButton } from "./RegenerateButton";
import type { Lesson, Exercise, Submission } from "@/lib/supabase/types";

interface PageProps {
  params: { slug: string };
}

export default async function LessonPage({ params }: PageProps) {
  const supabase = createServerClient();
  const { slug } = params;

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

  // ------ Check which exercises are completed ------
  const exerciseIds = exercises.map((ex) => ex.id);
  const completedSet = new Set<string>();

  if (exerciseIds.length > 0) {
    const { data: submissions } = (await supabase
      .from("submissions")
      .select("exercise_id, status")
      .in("exercise_id", exerciseIds)
      .eq("status", "pass")) as unknown as {
      data: Pick<Submission, "exercise_id" | "status">[] | null;
    };

    for (const sub of submissions ?? []) {
      completedSet.add(sub.exercise_id);
    }
  }

  const title = lesson.my_title ?? lesson.learncpp_title;

  return (
    <div className="pb-12">
      {/* Header */}
      <div className="mb-8">
        <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
          Lesson {lesson.number}
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
          {title}
        </h1>
      </div>

      {/* Summary */}
      {lesson.summary_md ? (
        <section className="mb-10">
          <SummaryView markdown={lesson.summary_md} />
        </section>
      ) : (
        <section className="mb-10 rounded-lg border border-neutral-200 p-6 text-center dark:border-neutral-700">
          <p className="text-neutral-500 dark:text-neutral-400">
            Summary content is being generated...
          </p>
        </section>
      )}

      {/* Exercises */}
      {exercises.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-lg font-semibold">Exercises</h2>
          <div className="space-y-3">
            {exercises.map((ex) => (
              <ExerciseCard
                key={ex.id}
                id={ex.id}
                title={ex.title}
                promptMd={ex.prompt_md}
                difficulty={ex.difficulty}
                completed={completedSet.has(ex.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Further reading */}
      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold">Further reading</h2>
        <a
          href={lesson.learncpp_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-blue-600 hover:underline dark:text-blue-400"
        >
          Read the full lesson on learncpp.com
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4"
          >
            <path
              fillRule="evenodd"
              d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5zm7.25-.75a.75.75 0 01.75-.75h3.5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0V6.31l-5.47 5.47a.75.75 0 01-1.06-1.06l5.47-5.47H12.25a.75.75 0 01-.75-.75z"
              clipRule="evenodd"
            />
          </svg>
        </a>
      </section>

      {/* Regenerate button */}
      <section className="border-t border-neutral-200 pt-6 dark:border-neutral-700">
        <RegenerateButton slug={slug} />
      </section>
    </div>
  );
}

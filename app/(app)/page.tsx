import { createServiceClient } from "@/lib/supabase/server";
import { RoadmapTree } from "@/components/roadmap/RoadmapTree";
import type { Chapter, Lesson, Progress } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

interface RoadmapLesson {
  id: string;
  number: string;
  slug: string;
  title: string;
  state: "not_started" | "in_progress" | "completed" | "skipped";
}

interface RoadmapChapter {
  id: number;
  number: string;
  title: string;
  completionPercent: number;
  lessons: RoadmapLesson[];
}

/**
 * Roadmap home page. Fetches chapter/lesson/progress data directly as a
 * server component (no round-trip through the API route).
 */
export default async function RoadmapPage() {
  // Use service client to bypass RLS (auth enforced by middleware)
  const supabase = createServiceClient();

  // Three parallel queries: chapters, lessons, and progress.
  // Explicit type annotations work around the auth-helpers/postgrest-js
  // generic mismatch that causes .select() return types to collapse to never.
  const [chaptersResult, lessonsResult, progressResult] = await Promise.all([
    supabase
      .from("chapters")
      .select("id, number, learncpp_title, my_title, sort_order")
      .order("sort_order", { ascending: true }) as unknown as {
      data: Pick<Chapter, "id" | "number" | "learncpp_title" | "my_title" | "sort_order">[] | null;
      error: unknown;
    },
    supabase
      .from("lessons")
      .select(
        "id, chapter_id, number, slug, learncpp_title, my_title, sort_order",
      )
      .order("sort_order", { ascending: true }) as unknown as {
      data: Pick<Lesson, "id" | "chapter_id" | "number" | "slug" | "learncpp_title" | "my_title" | "sort_order">[] | null;
      error: unknown;
    },
    supabase.from("progress").select("lesson_id, state") as unknown as {
      data: Pick<Progress, "lesson_id" | "state">[] | null;
      error: unknown;
    },
  ]);

  // Build a progress lookup: lesson_id -> state
  const progressMap = new Map<string, RoadmapLesson["state"]>();
  if (progressResult.data) {
    for (const row of progressResult.data) {
      progressMap.set(row.lesson_id, row.state as RoadmapLesson["state"]);
    }
  }

  // Group lessons by chapter_id
  const lessonsByChapter = new Map<number, RoadmapLesson[]>();

  for (const lesson of lessonsResult.data ?? []) {
    const chapterId = lesson.chapter_id;
    if (!lessonsByChapter.has(chapterId)) {
      lessonsByChapter.set(chapterId, []);
    }

    lessonsByChapter.get(chapterId)!.push({
      id: lesson.id,
      number: lesson.number,
      slug: lesson.slug,
      title: lesson.my_title ?? lesson.learncpp_title,
      state: progressMap.get(lesson.id) ?? "not_started",
    });
  }

  // Build chapter data
  const roadmapChapters: RoadmapChapter[] = (chaptersResult.data ?? []).map(
    (ch) => {
      const chapterLessons = lessonsByChapter.get(ch.id) ?? [];
      const total = chapterLessons.length;
      const done = chapterLessons.filter(
        (l) => l.state === "completed" || l.state === "skipped",
      ).length;
      const completionPercent =
        total > 0 ? Math.round((done / total) * 100) : 0;

      return {
        id: ch.id,
        number: ch.number,
        title: ch.my_title ?? ch.learncpp_title,
        completionPercent,
        lessons: chapterLessons,
      };
    },
  );

  // Find the "continue" lesson -- first in_progress lesson
  const continueSlug =
    (lessonsResult.data ?? []).find(
      (l) => progressMap.get(l.id) === "in_progress",
    )?.slug ?? null;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Roadmap</h1>
        {continueSlug && (
          <a
            href={`/lessons/${continueSlug}`}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            Continue learning
          </a>
        )}
      </div>

      <RoadmapTree chapters={roadmapChapters} />
    </div>
  );
}

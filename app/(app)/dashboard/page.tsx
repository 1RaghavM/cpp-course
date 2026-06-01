import { createServiceClient } from "@/lib/supabase/server";
import { requireServerSession } from "@/lib/auth/require-auth";
import { HomeLayout, type HomeChapter } from "@/components/home/HomeLayout";
import type { ContinueLesson } from "@/components/home/ContinueLearning";
import type { Chapter, Lesson, Progress } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

type LessonState = "not_started" | "in_progress" | "completed" | "skipped";

interface RawLesson {
  id: string;
  chapter_id: number;
  number: string;
  slug: string;
  learncpp_title: string;
  my_title: string | null;
  sort_order: number;
}

interface RawChapter {
  id: number;
  number: string;
  learncpp_title: string;
  my_title: string | null;
  sort_order: number;
}

interface RawProgress {
  lesson_id: string;
  state: LessonState;
  last_visit_at: string | null;
}

function findContinueLesson(
  lessons: RawLesson[],
  chapters: RawChapter[],
  progressMap: Map<string, LessonState>,
): ContinueLesson | null {
  const chapterById = new Map(chapters.map((ch) => [ch.id, ch]));

  const inProgress = lessons.find((l) => progressMap.get(l.id) === "in_progress");
  if (inProgress) {
    const ch = chapterById.get(inProgress.chapter_id);
    if (!ch) return null;
    return {
      slug: inProgress.slug,
      title: inProgress.my_title ?? inProgress.learncpp_title,
      number: inProgress.number,
      chapterNumber: ch.number,
      chapterTitle: ch.my_title ?? ch.learncpp_title,
      state: "in_progress",
    };
  }

  const nextNotStarted = lessons.find(
    (l) => (progressMap.get(l.id) ?? "not_started") === "not_started",
  );
  if (nextNotStarted) {
    const ch = chapterById.get(nextNotStarted.chapter_id);
    if (!ch) return null;
    return {
      slug: nextNotStarted.slug,
      title: nextNotStarted.my_title ?? nextNotStarted.learncpp_title,
      number: nextNotStarted.number,
      chapterNumber: ch.number,
      chapterTitle: ch.my_title ?? ch.learncpp_title,
      state: "not_started",
    };
  }

  return null;
}

function findActiveChapterIndex(chapters: HomeChapter[]): number {
  const inProgressIdx = chapters.findIndex((ch) =>
    ch.lessons.some((l) => l.state === "in_progress"),
  );
  if (inProgressIdx >= 0) return inProgressIdx;

  const notStartedIdx = chapters.findIndex((ch) =>
    ch.lessons.some((l) => l.state === "not_started"),
  );
  if (notStartedIdx >= 0) return notStartedIdx;

  return 0;
}

export default async function HomePage() {
  const { supabase } = await requireServerSession();
  const serviceClient = createServiceClient();

  const [chaptersResult, lessonsResult, progressResult] = await Promise.all([
    serviceClient
      .from("chapters")
      .select("id, number, learncpp_title, my_title, sort_order")
      .order("sort_order", { ascending: true }) as unknown as {
      data: Pick<Chapter, "id" | "number" | "learncpp_title" | "my_title" | "sort_order">[] | null;
      error: unknown;
    },
    serviceClient
      .from("lessons")
      .select("id, chapter_id, number, slug, learncpp_title, my_title, sort_order")
      .order("sort_order", { ascending: true }) as unknown as {
      data:
        | Pick<
            Lesson,
            "id" | "chapter_id" | "number" | "slug" | "learncpp_title" | "my_title" | "sort_order"
          >[]
        | null;
      error: unknown;
    },
    supabase.from("progress").select("lesson_id, state, last_visit_at") as unknown as {
      data: Pick<Progress, "lesson_id" | "state" | "last_visit_at">[] | null;
      error: unknown;
    },
  ]);

  const rawChapters: RawChapter[] = chaptersResult.data ?? [];
  const rawLessons: RawLesson[] = lessonsResult.data ?? [];
  const rawProgress: RawProgress[] = (progressResult.data ?? []).map((row) => ({
    lesson_id: row.lesson_id,
    state: row.state as LessonState,
    last_visit_at: row.last_visit_at,
  }));

  const progressMap = new Map<string, LessonState>();
  for (const row of rawProgress) {
    progressMap.set(row.lesson_id, row.state);
  }

  const lessonsByChapter = new Map<number, HomeChapter["lessons"]>();
  for (const lesson of rawLessons) {
    if (!lessonsByChapter.has(lesson.chapter_id)) {
      lessonsByChapter.set(lesson.chapter_id, []);
    }
    lessonsByChapter.get(lesson.chapter_id)!.push({
      id: lesson.id,
      number: lesson.number,
      slug: lesson.slug,
      title: lesson.my_title ?? lesson.learncpp_title,
      state: progressMap.get(lesson.id) ?? "not_started",
    });
  }

  const chapters: HomeChapter[] = rawChapters.map((ch) => {
    const chapterLessons = lessonsByChapter.get(ch.id) ?? [];
    const total = chapterLessons.length;
    const done = chapterLessons.filter(
      (l) => l.state === "completed" || l.state === "skipped",
    ).length;

    return {
      id: ch.id,
      number: ch.number,
      title: ch.my_title ?? ch.learncpp_title,
      completionPercent: total > 0 ? Math.round((done / total) * 100) : 0,
      lessons: chapterLessons,
    };
  });

  const continueLesson = findContinueLesson(rawLessons, rawChapters, progressMap);
  const hasAnyProgress = rawProgress.length > 0;
  const activeChapterIndex = findActiveChapterIndex(chapters);

  return (
    <HomeLayout
      chapters={chapters}
      continueLesson={continueLesson}
      hasAnyProgress={hasAnyProgress}
      activeChapterIndex={activeChapterIndex}
    />
  );
}

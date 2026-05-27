import { createServiceClient } from "@/lib/supabase/server";
import { HeroSection } from "@/components/home/HeroSection";
import { ContinueLearning, type ContinueLesson } from "@/components/home/ContinueLearning";
import { FeatureStrip } from "@/components/home/FeatureStrip";
import { PathSection } from "@/components/home/PathSection";
import { RecentActivity, type RecentLesson } from "@/components/home/RecentActivity";
import type { Chapter, Lesson, Progress } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

type LessonState = "not_started" | "in_progress" | "completed" | "skipped";

interface RoadmapLesson {
  id: string;
  number: string;
  slug: string;
  title: string;
  state: LessonState;
}

interface RoadmapChapter {
  id: number;
  number: string;
  title: string;
  completionPercent: number;
  lessons: RoadmapLesson[];
}

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

function buildRecentActivity(
  lessons: RawLesson[],
  progressRows: RawProgress[],
): RecentLesson[] {
  const lessonById = new Map(lessons.map((l) => [l.id, l]));

  return progressRows
    .filter(
      (p) =>
        p.last_visit_at &&
        (p.state === "in_progress" || p.state === "completed" || p.state === "skipped"),
    )
    .sort(
      (a, b) =>
        new Date(b.last_visit_at!).getTime() - new Date(a.last_visit_at!).getTime(),
    )
    .slice(0, 5)
    .flatMap((p) => {
      const lesson = lessonById.get(p.lesson_id);
      if (!lesson) return [];
      return [
        {
          slug: lesson.slug,
          title: lesson.my_title ?? lesson.learncpp_title,
          number: lesson.number,
          state: p.state as RecentLesson["state"],
          lastVisitAt: p.last_visit_at!,
        },
      ];
    });
}

/**
 * Roadmap home page. Fetches chapter/lesson/progress data directly as a
 * server component (no round-trip through the API route).
 */
export default async function HomePage() {
  const supabase = createServiceClient();

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
      data: Pick<
        Lesson,
        "id" | "chapter_id" | "number" | "slug" | "learncpp_title" | "my_title" | "sort_order"
      >[] | null;
      error: unknown;
    },
    supabase
      .from("progress")
      .select("lesson_id, state, last_visit_at") as unknown as {
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

  const lessonsByChapter = new Map<number, RoadmapLesson[]>();
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

  const roadmapChapters: RoadmapChapter[] = rawChapters.map((ch) => {
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

  const totalLessons = rawLessons.length;
  let completed = 0;
  let inProgress = 0;
  for (const lesson of rawLessons) {
    const state = progressMap.get(lesson.id) ?? "not_started";
    if (state === "completed" || state === "skipped") completed += 1;
    if (state === "in_progress") inProgress += 1;
  }

  const chaptersStarted = roadmapChapters.filter((ch) =>
    ch.lessons.some((l) => l.state !== "not_started"),
  ).length;

  const continueLesson = findContinueLesson(rawLessons, rawChapters, progressMap);
  const hasAnyProgress = rawProgress.length > 0;
  const recentLessons = buildRecentActivity(rawLessons, rawProgress);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8 sm:px-6">
      <HeroSection
        stats={{
          totalLessons,
          completed,
          inProgress,
          chaptersTotal: rawChapters.length,
          chaptersStarted,
          overallPercent:
            totalLessons > 0 ? Math.round((completed / totalLessons) * 100) : 0,
        }}
      />

      <ContinueLearning lesson={continueLesson} hasAnyProgress={hasAnyProgress} />

      <RecentActivity lessons={recentLessons} />

      <FeatureStrip />

      <PathSection chapters={roadmapChapters} />

      <footer className="home-fade-in home-fade-in-delay-3 border-t border-border pt-6 pb-4 text-center text-xs text-muted">
        Curriculum based on{" "}
        <a
          href="https://www.learncpp.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-secondary underline-offset-2 transition-colors hover:text-accent hover:underline"
        >
          learncpp.com
        </a>
        . Summaries and exercises are generated once and cached in Postgres.
      </footer>
    </div>
  );
}

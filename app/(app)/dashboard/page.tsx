import { createServiceClient } from "@/lib/supabase/server";
import { requireServerSession } from "@/lib/auth/require-auth";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { buildCurriculum, flattenLessons, STAGES } from "@/lib/dashboard/curriculum";
import {
  computeResumeTarget,
  computeResumeVariant,
  computePathPercent,
  computeStreakDays,
  computeWeeklyCompleted,
} from "@/lib/dashboard/resume";
import type { DashboardProgress, LessonStatus, Stage } from "@/lib/dashboard/types";

export const dynamic = "force-dynamic";

function findLastActiveLessonId(
  progressRows: { lesson_id: string; state: string; last_visit_at: string | null }[],
): string | null {
  let latestId: string | null = null;
  let latestTime = "";

  for (const row of progressRows) {
    if (row.state === "in_progress" && row.last_visit_at && row.last_visit_at > latestTime) {
      latestTime = row.last_visit_at;
      latestId = row.lesson_id;
    }
  }

  return latestId;
}

export default async function DashboardPage() {
  const { supabase } = await requireServerSession();
  const serviceClient = createServiceClient();

  const today = new Date().toISOString().slice(0, 10);

  let fetchError = false;
  let statsError = false;

  const [lessonsResult, progressResult, statsResult] = await Promise.all([
    serviceClient
      .from("lessons")
      .select("id, chapter_id, slug, learncpp_title, my_title, sort_order")
      .order("sort_order", { ascending: true }),
    supabase
      .from("progress")
      .select("lesson_id, state, last_visit_at, completed_at, last_code_snippet"),
    supabase
      .from("user_stats")
      .select("streak_days, last_active_date, weekly_goal, display_name")
      .single(),
  ]);

  if (lessonsResult.error || progressResult.error) {
    fetchError = true;
  }

  const isMissingStats =
    statsResult.error?.code === "PGRST116" || (!statsResult.error && !statsResult.data);

  if (statsResult.error && !isMissingStats) {
    statsError = true;
  }

  if (fetchError) {
    return (
      <div className="mx-auto max-w-[720px] px-6 py-8">
        <div className="rounded-lg border border-border bg-surface p-6 text-center">
          <p className="text-sm text-secondary">Couldn&apos;t load your progress.</p>
          <a
            href="/dashboard"
            className="mt-3 inline-block rounded-md bg-elevated px-4 py-2 text-xs font-medium text-primary transition-colors hover:bg-hover"
          >
            Retry
          </a>
        </div>
      </div>
    );
  }

  const dbLessons = (lessonsResult.data ?? []) as {
    id: string;
    chapter_id: number;
    slug: string;
    learncpp_title: string;
    my_title: string | null;
    sort_order: number;
  }[];

  const progressRows = (progressResult.data ?? []) as {
    lesson_id: string;
    state: string;
    last_visit_at: string | null;
    completed_at: string | null;
    last_code_snippet: string | null;
  }[];

  const userStats = (isMissingStats ? null : statsResult.data) as {
    streak_days: number;
    last_active_date: string | null;
    weekly_goal: number | null;
    display_name: string | null;
  } | null;

  const curriculum = buildCurriculum(dbLessons);

  const lessonProgress: Record<
    string,
    { status: LessonStatus; lastCodeSnippet?: string; lastVisitAt: string }
  > = {};
  for (const row of progressRows) {
    lessonProgress[row.lesson_id] = {
      status: row.state as LessonStatus,
      lastCodeSnippet: row.last_code_snippet ?? undefined,
      lastVisitAt: row.last_visit_at ?? "",
    };
  }

  const totalLessonsCompleted = progressRows.filter(
    (r) => r.state === "completed" || r.state === "skipped",
  ).length;

  const weeklyRecords = progressRows
    .filter((r) => r.completed_at)
    .map((r) => ({ completedAt: r.completed_at! }));

  const streakDays = statsError
    ? 0
    : computeStreakDays(userStats?.last_active_date ?? null, userStats?.streak_days ?? 0, today);

  const dashboardProgress: DashboardProgress = {
    lessonProgress,
    streakDays,
    lastActiveDate: userStats?.last_active_date ?? null,
    weeklyGoal: statsError ? null : (userStats?.weekly_goal ?? null),
    totalLessonsCompleted,
    lessonsCompletedThisWeek: computeWeeklyCompleted(weeklyRecords, today),
  };

  const lastActiveLessonId = findLastActiveLessonId(progressRows);
  const resumeTarget = computeResumeTarget(curriculum, dashboardProgress, lastActiveLessonId);
  const resumeVariant = computeResumeVariant(curriculum, dashboardProgress);
  const pathPercent = computePathPercent(curriculum, dashboardProgress);

  const currentHour = new Date().getUTCHours();
  const displayName = statsError ? null : (userStats?.display_name ?? null);

  const sixteenWeeksAgo = new Date();
  sixteenWeeksAgo.setDate(sixteenWeeksAgo.getDate() - 16 * 7);
  const cutoffDate = sixteenWeeksAgo.toISOString().slice(0, 10);

  const activityResult = await supabase
    .from("progress")
    .select("last_visit_at, completed_at")
    .or(`last_visit_at.gte.${cutoffDate}T00:00:00Z,completed_at.gte.${cutoffDate}T00:00:00Z`);

  const activityData: Record<string, number> = {};
  for (const row of activityResult.data ?? []) {
    const visitDate = (row as { last_visit_at: string | null }).last_visit_at?.slice(0, 10);
    const completeDate = (row as { completed_at: string | null }).completed_at?.slice(0, 10);
    if (visitDate && visitDate >= cutoffDate) {
      activityData[visitDate] = (activityData[visitDate] ?? 0) + 1;
    }
    if (completeDate && completeDate >= cutoffDate && completeDate !== visitDate) {
      activityData[completeDate] = (activityData[completeDate] ?? 0) + 1;
    }
  }

  const allLessons = flattenLessons(curriculum);
  const stageTargetSlugs = {} as Record<Stage, string>;
  for (const stage of STAGES) {
    const stageLessons = allLessons.filter((l) => {
      const mod = curriculum.find((m) => m.id === l.moduleId);
      return mod?.stage === stage.id;
    });
    const firstIncomplete = stageLessons.find((l) => {
      const status = lessonProgress[l.id]?.status;
      return status !== "completed" && status !== "skipped";
    });
    stageTargetSlugs[stage.id] = firstIncomplete?.slug ?? stageLessons[0]?.slug ?? "";
  }

  return (
    <Dashboard
      curriculum={curriculum}
      progress={dashboardProgress}
      resumeTarget={resumeTarget}
      resumeVariant={resumeVariant}
      pathPercent={pathPercent}
      stageTargetSlugs={stageTargetSlugs}
      lastVisitedLessonId={lastActiveLessonId}
      displayName={displayName}
      currentHour={currentHour}
      activityData={activityData}
    />
  );
}

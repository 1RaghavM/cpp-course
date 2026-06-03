import { cache } from "react";
import { requireServerSession } from "@/lib/auth/require-auth";
import { createServiceClient } from "@/lib/supabase/server";
import { buildCurriculum } from "@/lib/dashboard/curriculum";
import { computeResumeTarget, computeStreakDays, computeWeeklyCompleted } from "@/lib/dashboard/resume";
import type { LessonStatus, DashboardProgress, Module } from "@/lib/dashboard/types";

export interface NavData {
  resumeSlug: string | null;
  streakDays: number;
  curriculum: Module[];
  progress: DashboardProgress;
  lastActiveLessonId: string | null;
}

/**
 * Cached per-request fetch of all navigation data (resume target, streak, etc.).
 *
 * React `cache()` deduplicates calls within a single server render, so the
 * dashboard sidebar and header (or any other component in the same request)
 * share a single set of Supabase queries even when wrapped in separate
 * Suspense boundaries.
 */
export const fetchNavData = cache(async (): Promise<NavData> => {
  const { supabase } = await requireServerSession();
  const serviceClient = createServiceClient();
  const today = new Date().toISOString().slice(0, 10);

  const [lessonsResult, progressResult, statsResult] = await Promise.all([
    serviceClient
      .from("lessons")
      .select("id, chapter_id, slug, learncpp_title, my_title, sort_order")
      .order("sort_order", { ascending: true }),
    supabase
      .from("progress")
      .select("lesson_id, state, last_visit_at, completed_at"),
    supabase
      .from("user_stats")
      .select("streak_days, last_active_date, weekly_goal")
      .single(),
  ]);

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
  }[];

  const isMissingStats =
    statsResult.error?.code === "PGRST116" || (!statsResult.error && !statsResult.data);
  const statsError = !!statsResult.error && !isMissingStats;
  const userStats = (isMissingStats ? null : statsResult.data) as {
    streak_days: number;
    last_active_date: string | null;
    weekly_goal: number | null;
  } | null;

  const curriculum = buildCurriculum(dbLessons);

  const totalCompleted = progressRows.filter(
    (r) => r.state === "completed" || r.state === "skipped",
  ).length;

  const weeklyRecords = progressRows
    .filter((r) => r.completed_at)
    .map((r) => ({ completedAt: r.completed_at! }));

  const streakDays = statsError
    ? 0
    : computeStreakDays(
        userStats?.last_active_date ?? null,
        userStats?.streak_days ?? 0,
        today,
      );

  const lessonsCompletedThisWeek = computeWeeklyCompleted(weeklyRecords, today);
  const weeklyGoal = statsError ? null : (userStats?.weekly_goal ?? null);

  let lastActiveLessonId: string | null = null;
  let latestTime = "";
  for (const row of progressRows) {
    if (row.state === "in_progress" && row.last_visit_at && row.last_visit_at > latestTime) {
      latestTime = row.last_visit_at;
      lastActiveLessonId = row.lesson_id;
    }
  }

  const lessonProgress: Record<string, { status: LessonStatus; lastVisitAt: string }> = {};
  for (const row of progressRows) {
    lessonProgress[row.lesson_id] = {
      status: row.state as LessonStatus,
      lastVisitAt: row.last_visit_at ?? "",
    };
  }

  const progress: DashboardProgress = {
    lessonProgress,
    streakDays,
    lastActiveDate: userStats?.last_active_date ?? null,
    weeklyGoal,
    totalLessonsCompleted: totalCompleted,
    lessonsCompletedThisWeek,
  };

  const resumeTarget = computeResumeTarget(curriculum, progress, lastActiveLessonId);

  return {
    resumeSlug: resumeTarget.slug,
    streakDays,
    curriculum,
    progress,
    lastActiveLessonId,
  };
});

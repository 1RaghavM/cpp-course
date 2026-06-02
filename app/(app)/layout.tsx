import { createServiceClient } from "@/lib/supabase/server";
import { requireServerSession } from "@/lib/auth/require-auth";
import { AppShell } from "@/components/layout/AppShell";
import { Background } from "@/components/Background";
import { buildCurriculum } from "@/lib/dashboard/curriculum";
import { computeResumeTarget, computeStreakDays } from "@/lib/dashboard/resume";
import type { LessonStatus, DashboardProgress } from "@/lib/dashboard/types";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { supabase, session } = await requireServerSession();
  const serviceClient = createServiceClient();

  const [lessonsResult, progressResult, statsResult] = await Promise.all([
    serviceClient
      .from("lessons")
      .select("id, chapter_id, slug, learncpp_title, my_title, sort_order")
      .order("sort_order", { ascending: true }),
    supabase.from("progress").select("lesson_id, state, last_visit_at"),
    supabase.from("user_stats").select("streak_days, last_active_date").single(),
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
  }[];
  const userStats = statsResult.data as {
    streak_days: number;
    last_active_date: string | null;
  } | null;

  const curriculum = buildCurriculum(dbLessons);
  const lessonProgress: Record<string, { status: LessonStatus; lastVisitAt: string }> = {};
  for (const row of progressRows) {
    lessonProgress[row.lesson_id] = {
      status: row.state as LessonStatus,
      lastVisitAt: row.last_visit_at ?? "",
    };
  }

  let lastActiveLessonId: string | null = null;
  let latestTime = "";
  for (const row of progressRows) {
    if (row.state === "in_progress" && row.last_visit_at && row.last_visit_at > latestTime) {
      latestTime = row.last_visit_at;
      lastActiveLessonId = row.lesson_id;
    }
  }

  const totalCompleted = progressRows.filter(
    (r) => r.state === "completed" || r.state === "skipped",
  ).length;

  const minimalProgress: DashboardProgress = {
    lessonProgress,
    streakDays: userStats?.streak_days ?? 0,
    lastActiveDate: userStats?.last_active_date ?? null,
    weeklyGoal: null,
    totalLessonsCompleted: totalCompleted,
    lessonsCompletedThisWeek: 0,
  };

  const today = new Date().toISOString().slice(0, 10);
  const streakDays = computeStreakDays(
    userStats?.last_active_date ?? null,
    userStats?.streak_days ?? 0,
    today,
  );

  const resumeTarget = computeResumeTarget(curriculum, minimalProgress, lastActiveLessonId);

  const userEmail = session.user.email ?? "";
  const userInitial = (userEmail[0] ?? "?").toUpperCase();

  return (
    <>
      <Background />
      <AppShell
        streakDays={streakDays}
        resumeLessonSlug={resumeTarget.slug}
        userEmail={userEmail}
        userInitial={userInitial}
      >
        {children}
      </AppShell>
    </>
  );
}

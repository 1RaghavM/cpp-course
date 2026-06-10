import { SectionCards } from "@/components/section-cards"
import { StatsHeatmap } from "@/components/stats/StatsHeatmap"
import { ResumeHeroCard } from "@/components/dashboard/ResumeHeroCard"
import { CurriculumProgressCard } from "@/components/dashboard/CurriculumProgressCard"
import { ReviewDueCard } from "@/components/dashboard/ReviewDueCard"
import { requireServerSession } from "@/lib/auth/require-auth"
import { createServiceClient } from "@/lib/supabase/server"
import { buildCurriculum, flattenLessons } from "@/lib/dashboard/curriculum"
import {
  computeStreakDays,
  computeWeeklyCompleted,
  computeResumeTarget,
  computeResumeVariant,
} from "@/lib/dashboard/resume"
import type { LessonStatus, DashboardProgress } from "@/lib/dashboard/types"

export const dynamic = "force-dynamic"

export default async function Page() {
  const { supabase, userId } = await requireServerSession()
  const serviceClient = createServiceClient()
  const today = new Date().toISOString().slice(0, 10)

  const [lessonsResult, progressResult, statsResult] = await Promise.all([
    serviceClient
      .from("lessons")
      .select("id, chapter_id, number, slug, learncpp_title, my_title, sort_order")
      .order("sort_order", { ascending: true }),
    supabase
      .from("progress")
      .select("lesson_id, state, last_visit_at, completed_at"),
    supabase
      .from("user_stats")
      .select("streak_days, last_active_date, weekly_goal")
      .single(),
  ])

  const dbLessons = (lessonsResult.data ?? []) as {
    id: string
    chapter_id: number
    number: string
    slug: string
    learncpp_title: string
    my_title: string | null
    sort_order: number
  }[]

  const progressRows = (progressResult.data ?? []) as {
    lesson_id: string
    state: string
    last_visit_at: string | null
    completed_at: string | null
  }[]

  const isMissingStats =
    statsResult.error?.code === "PGRST116" || (!statsResult.error && !statsResult.data)
  const statsError = !!statsResult.error && !isMissingStats
  const userStats = (isMissingStats ? null : statsResult.data) as {
    streak_days: number
    last_active_date: string | null
    weekly_goal: number | null
  } | null

  const curriculum = buildCurriculum(dbLessons)
  const allLessons = flattenLessons(curriculum)

  const totalCompleted = progressRows.filter(
    (r) => r.state === "completed" || r.state === "skipped"
  ).length
  const inProgressCount = progressRows.filter(
    (r) => r.state === "in_progress"
  ).length

  const weeklyRecords = progressRows
    .filter((r) => r.completed_at)
    .map((r) => ({ completedAt: r.completed_at! }))

  const streakDays = statsError
    ? 0
    : computeStreakDays(
        userStats?.last_active_date ?? null,
        userStats?.streak_days ?? 0,
        today
      )

  const lessonsCompletedThisWeek = computeWeeklyCompleted(weeklyRecords, today)
  const weeklyGoal = statsError ? null : (userStats?.weekly_goal ?? null)

  const activityData: Record<string, number> = {}
  for (const row of progressRows) {
    if (row.last_visit_at) {
      const dateStr = row.last_visit_at.slice(0, 10)
      activityData[dateStr] = (activityData[dateStr] ?? 0) + 1
    }
    if (row.completed_at) {
      const dateStr = row.completed_at.slice(0, 10)
      activityData[dateStr] = (activityData[dateStr] ?? 0) + 1
    }
  }

  const progressMap: Record<string, string> = {}
  for (const row of progressRows) {
    progressMap[row.lesson_id] = row.state
  }

  let lastActiveLessonId: string | null = null
  let latestTime = ""
  for (const row of progressRows) {
    if (row.state === "in_progress" && row.last_visit_at && row.last_visit_at > latestTime) {
      latestTime = row.last_visit_at
      lastActiveLessonId = row.lesson_id
    }
  }

  const resumeProgress: DashboardProgress = {
    lessonProgress: Object.fromEntries(
      progressRows.map((r) => [
        r.lesson_id,
        { status: r.state as LessonStatus, lastVisitAt: r.last_visit_at ?? "" },
      ])
    ),
    streakDays,
    lastActiveDate: null,
    weeklyGoal,
    totalLessonsCompleted: totalCompleted,
    lessonsCompletedThisWeek,
  }
  const resumeTarget = computeResumeTarget(curriculum, resumeProgress, lastActiveLessonId)
  const resumeVariant = computeResumeVariant(curriculum, resumeProgress, resumeTarget)

  const resumeModule = curriculum.find((m) => m.id === resumeTarget.moduleId)!
  const moduleName = resumeModule.title
  const sortedModuleLessons = [...resumeModule.lessons].sort((a, b) => a.order - b.order)
  const lessonPosition = sortedModuleLessons.findIndex((l) => l.id === resumeTarget.id) + 1
  const moduleLessonCount = resumeModule.lessons.length
  const moduleCompletedCount = resumeModule.lessons.filter((l) => {
    const s = progressMap[l.id]
    return s === "completed" || s === "skipped"
  }).length

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <ResumeHeroCard
          resumeLesson={{ title: resumeTarget.title, slug: resumeTarget.slug }}
          moduleName={moduleName}
          lessonPosition={lessonPosition}
          moduleLessonCount={moduleLessonCount}
          moduleCompletedCount={moduleCompletedCount}
          variant={resumeVariant}
        />
      </div>
      <SectionCards
        totalLessons={allLessons.length}
        totalCompleted={totalCompleted}
        inProgressCount={inProgressCount}
        streakDays={streakDays}
        lessonsCompletedThisWeek={lessonsCompletedThisWeek}
        weeklyGoal={weeklyGoal}
      />
      <div className="px-4 lg:px-6">
        <ReviewDueCard supabase={supabase} userId={userId} />
      </div>
      <div className="px-4 lg:px-6">
        <CurriculumProgressCard
          curriculum={curriculum}
          progressMap={progressMap}
          totalCompleted={totalCompleted}
          totalLessons={allLessons.length}
        />
      </div>
      <div className="px-4 lg:px-6">
        <StatsHeatmap activityData={activityData} />
      </div>
    </div>
  )
}

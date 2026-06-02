import { AppSidebar } from "@/components/app-sidebar"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { requireServerSession } from "@/lib/auth/require-auth"
import { createServiceClient } from "@/lib/supabase/server"
import { buildCurriculum, flattenLessons } from "@/lib/dashboard/curriculum"
import { computeStreakDays, computeWeeklyCompleted } from "@/lib/dashboard/resume"

export const dynamic = "force-dynamic"

export default async function Page() {
  const { supabase } = await requireServerSession()
  const serviceClient = createServiceClient()
  const today = new Date().toISOString().slice(0, 10)

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
  ])

  const dbLessons = (lessonsResult.data ?? []) as {
    id: string
    chapter_id: number
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

  const lessonProgress: Record<string, string> = {}
  for (const row of progressRows) {
    lessonProgress[row.lesson_id] = row.state
  }

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

  const tableData = allLessons.map((lesson, idx) => {
    const state = lessonProgress[lesson.id]
    const mod = curriculum.find((m) => m.id === lesson.moduleId)
    const status =
      state === "completed" || state === "skipped"
        ? "Done"
        : state === "in_progress"
          ? "In Progress"
          : "Not Started"

    return {
      id: idx + 1,
      header: lesson.title,
      type: mod?.title ?? "",
      status,
      slug: lesson.slug,
      lessonId: lesson.id,
    }
  })

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <SectionCards
                totalLessons={allLessons.length}
                totalCompleted={totalCompleted}
                inProgressCount={inProgressCount}
                streakDays={streakDays}
                lessonsCompletedThisWeek={lessonsCompletedThisWeek}
                weeklyGoal={weeklyGoal}
              />
              <DataTable data={tableData} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

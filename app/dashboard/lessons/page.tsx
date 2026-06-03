import { LessonsBrowser, type ChapterGroup, type LessonStatus } from "@/components/dashboard/LessonsBrowser"
import { requireServerSession } from "@/lib/auth/require-auth"
import { createServiceClient } from "@/lib/supabase/server"
import { buildCurriculum } from "@/lib/dashboard/curriculum"
import { computeResumeTarget } from "@/lib/dashboard/resume"
import type { DashboardProgress, LessonStatus as DbLessonStatus } from "@/lib/dashboard/types"

export const dynamic = "force-dynamic"

export default async function LessonsPage() {
  const { supabase } = await requireServerSession()
  const serviceClient = createServiceClient()

  const [lessonsResult, progressResult] = await Promise.all([
    serviceClient
      .from("lessons")
      .select("id, chapter_id, slug, learncpp_title, my_title, sort_order")
      .order("sort_order", { ascending: true }),
    supabase
      .from("progress")
      .select("lesson_id, state, last_visit_at, completed_at"),
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

  const curriculum = buildCurriculum(dbLessons)

  // Build the same DashboardProgress shape the layout uses so we can reuse computeResumeTarget.
  const dashboardProgress: DashboardProgress = {
    lessonProgress: Object.fromEntries(
      progressRows.map((r) => [
        r.lesson_id,
        { status: r.state as DbLessonStatus, lastVisitAt: r.last_visit_at ?? "" },
      ]),
    ),
    streakDays: 0,
    lastActiveDate: null,
    weeklyGoal: null,
    totalLessonsCompleted: progressRows.filter(
      (r) => r.state === "completed" || r.state === "skipped",
    ).length,
    lessonsCompletedThisWeek: 0,
  }

  // Most recently visited in-progress lesson — this is the one we surface as the
  // user's actual "In Progress" state. Visiting a lesson also writes in_progress,
  // so the raw DB column over-reports; we collapse it to a single resume target.
  let lastActiveLessonId: string | null = null
  let latestTime = ""
  for (const row of progressRows) {
    if (row.state === "in_progress" && row.last_visit_at && row.last_visit_at > latestTime) {
      latestTime = row.last_visit_at
      lastActiveLessonId = row.lesson_id
    }
  }
  const resumeTarget = computeResumeTarget(curriculum, dashboardProgress, lastActiveLessonId)

  // A lesson is "In Progress" only if it IS the resume target and isn't already done.
  // Everything else with a row but not completed → "Not Started" (the user moved on).
  function statusFor(lessonId: string): LessonStatus {
    const state = dashboardProgress.lessonProgress[lessonId]?.status
    if (state === "completed" || state === "skipped") return "Done"
    if (lessonId === resumeTarget.id && state !== undefined) return "In Progress"
    return "Not Started"
  }

  const chapters: ChapterGroup[] = curriculum.map((module) => ({
    id: module.id,
    title: module.title,
    lessons: module.lessons.map((lesson) => ({
      id: lesson.id,
      slug: lesson.slug,
      title: lesson.title,
      status: statusFor(lesson.id),
    })),
  }))

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <LessonsBrowser chapters={chapters} resumeLessonSlug={resumeTarget.slug} />
    </div>
  )
}

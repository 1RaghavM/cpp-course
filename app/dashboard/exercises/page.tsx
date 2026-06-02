import { ExercisesDataTable } from "@/components/exercises-data-table"
import { requireServerSession } from "@/lib/auth/require-auth"
import { createServiceClient } from "@/lib/supabase/server"
import { CURRICULUM } from "@/lib/dashboard/curriculum"

export const dynamic = "force-dynamic"

export default async function ExercisesPage() {
  const { supabase, userId } = await requireServerSession()
  const serviceClient = createServiceClient()

  const [exercisesResult, submissionsResult] = await Promise.all([
    serviceClient
      .from("exercises")
      .select("id, title, difficulty, sort_order, lesson_id, lessons(chapter_id)")
      .order("sort_order", { ascending: true }),
    supabase
      .from("submissions")
      .select("exercise_id")
      .eq("user_id", userId)
      .eq("mode", "submit")
      .eq("status", "passed"),
  ])

  const exercises = (exercisesResult.data ?? []) as unknown as {
    id: string
    title: string
    difficulty: string
    sort_order: number
    lesson_id: string
    lessons: { chapter_id: number } | null
  }[]

  const submissions = (submissionsResult.data ?? []) as { exercise_id: string }[]

  const completedIds = new Set<string>(submissions.map((s) => s.exercise_id))

  const chapterToModule = new Map<number, string>()
  for (const mod of CURRICULUM) {
    for (const chId of mod.chapterIds) {
      chapterToModule.set(chId, mod.title)
    }
  }

  const tableData = exercises.map((ex, idx) => {
    const chapterId = ex.lessons?.chapter_id
    const moduleName = chapterId != null ? (chapterToModule.get(chapterId) ?? "") : ""
    const status = completedIds.has(ex.id) ? "Done" : "Not Completed"

    return {
      id: idx + 1,
      exerciseId: ex.id,
      header: ex.title,
      module: moduleName,
      difficulty: ex.difficulty,
      status,
    }
  })

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <ExercisesDataTable data={tableData} />
    </div>
  )
}

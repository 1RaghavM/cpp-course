import { requireServerSession } from "@/lib/auth/require-auth";
import { createServiceClient } from "@/lib/supabase/server";
import { buildCurriculum } from "@/lib/dashboard/curriculum";
import { CurriculumMap } from "@/components/curriculum/CurriculumMap";

export const dynamic = "force-dynamic";

export default async function CurriculumPage() {
  const { supabase } = await requireServerSession();
  const serviceClient = createServiceClient();

  const [lessonsResult, progressResult] = await Promise.all([
    serviceClient
      .from("lessons")
      .select("id, chapter_id, slug, learncpp_title, my_title, sort_order")
      .order("sort_order", { ascending: true }),
    supabase.from("progress").select("lesson_id, state"),
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
  }[];

  const curriculum = buildCurriculum(dbLessons);

  const lessonProgress: Record<string, string> = {};
  for (const row of progressRows) {
    lessonProgress[row.lesson_id] = row.state;
  }

  return (
    <div className="flex h-[calc(100vh-var(--header-height))] flex-col">
      <div className="flex items-center justify-between border-b px-4 py-3 lg:px-6">
        <h1 className="text-lg font-semibold">Curriculum Map</h1>
      </div>
      <div className="flex-1">
        <CurriculumMap curriculum={curriculum} lessonProgress={lessonProgress} />
      </div>
    </div>
  );
}

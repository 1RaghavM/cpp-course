import { NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/require-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createRouteClient();

  const authResult = await requireAuth(supabase);
  if (authResult instanceof NextResponse) return authResult;

  const { data, error } = await supabase
    .from("notes")
    .select(
      "lesson_id, content, updated_at, lessons!inner(slug, learncpp_title, my_title, number, sort_order, chapter_id, chapters!inner(learncpp_title, sort_order))",
    )
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 });
  }

  const notes = (data ?? []).map((row: Record<string, unknown>) => {
    const lesson = row.lessons as Record<string, unknown>;
    const chapter = lesson.chapters as Record<string, unknown>;
    return {
      lessonId: row.lesson_id,
      lessonSlug: lesson.slug,
      lessonTitle: (lesson.my_title as string) ?? (lesson.learncpp_title as string),
      lessonNumber: lesson.number,
      chapterTitle: chapter.learncpp_title,
      chapterSortOrder: chapter.sort_order,
      lessonSortOrder: lesson.sort_order,
      content: row.content,
      updatedAt: row.updated_at,
    };
  });

  return NextResponse.json({ notes });
}

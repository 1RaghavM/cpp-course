import { NextRequest, NextResponse } from "next/server";
import { createRouteClient, createServiceClient } from "@/lib/supabase/server";
import { requireOwner } from "@/lib/auth/owner-only";
import { regenerateLesson } from "@/lib/content/lesson-generation";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// POST /api/lessons/[slug]/regenerate
// ---------------------------------------------------------------------------

export async function POST(
  _request: NextRequest,
  { params }: { params: { slug: string } },
) {
  const supabase = createRouteClient();

  // Auth guard (uses user JWT)
  const authResult = await requireOwner(supabase);
  if (authResult instanceof NextResponse) return authResult;

  const { slug } = params;

  try {
    // Use service client for content operations (bypasses RLS for system operations)
    const serviceClient = createServiceClient();

    // regenerateLesson clears cache and regenerates from scratch.
    const { lesson, exercises } = await regenerateLesson(serviceClient, slug);

    // Query existing conversations for this lesson
    const { data: conversations } = (await serviceClient
      .from("conversations")
      .select("id, title, created_at")
      .eq("lesson_id", lesson.id)
      .order("created_at", { ascending: false })) as unknown as {
      data: Array<{ id: string; title: string | null; created_at: string }> | null;
    };

    return NextResponse.json({
      id: lesson.id,
      number: lesson.number,
      title: lesson.my_title ?? lesson.learncpp_title,
      slug: lesson.slug,
      learncppUrl: lesson.learncpp_url,
      summaryMd: lesson.summary_md,
      summaryGeneratedAt: lesson.summary_generated_at,
      exercises: exercises.map((ex) => ({
        id: ex.id,
        title: ex.title,
        promptMd: ex.prompt_md,
        difficulty: ex.difficulty,
        sortOrder: ex.sort_order,
      })),
      conversations: (conversations ?? []).map((c) => ({
        id: c.id,
        title: c.title,
        createdAt: c.created_at,
      })),
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to regenerate lesson";

    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

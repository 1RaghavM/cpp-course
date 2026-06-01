import { NextRequest, NextResponse } from "next/server";
import { createRouteClient, createServiceClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { getOrGenerateLesson } from "@/lib/content/lesson-generation";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// GET /api/lessons/[slug]
// ---------------------------------------------------------------------------

export async function GET(_request: NextRequest, { params }: { params: { slug: string } }) {
  const supabase = createRouteClient();

  // Auth guard (uses user JWT)
  const authResult = await requireAuth(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const userId = authResult.session.user.id;

  const { slug } = params;

  try {
    const serviceClient = createServiceClient();

    const { data: onboardingData } = await supabase
      .from("onboarding")
      .select("fast_track")
      .eq("user_id", userId)
      .single();
    const fastTrack = onboardingData?.fast_track ?? false;

    const { lesson, exercises } = await getOrGenerateLesson(serviceClient, slug, userId, fastTrack);

    const { data: conversations } = (await supabase
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
    const message = err instanceof Error ? err.message : "Failed to load lesson";

    // Distinguish between "lesson not found" and internal errors
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

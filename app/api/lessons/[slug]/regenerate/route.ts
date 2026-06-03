import { NextRequest, NextResponse } from "next/server";
import { createRouteClient, createServiceClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { regenerateLesson } from "@/lib/content/lesson-generation";
import { getGuardCounts } from "@/lib/ai/context";
import { checkRateAndBudget } from "@/lib/rate/guard";

export const dynamic = "force-dynamic";

const DAILY_REGENERATE_LIMIT = 3;

// ---------------------------------------------------------------------------
// POST /api/lessons/[slug]/regenerate
// ---------------------------------------------------------------------------

export async function POST(_request: NextRequest, { params }: { params: { slug: string } }) {
  const supabase = createRouteClient();

  // Auth guard (uses user JWT)
  const authResult = await requireAuth(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const userId = authResult.user.id;

  const { slug } = params;

  // ---- Monthly hard-cap check (shared with tutor budget) -------------------
  const guardCounts = await getGuardCounts(supabase, userId, null);
  const guardResult = checkRateAndBudget(guardCounts);
  if (!guardResult.allowed && guardResult.code === "BUDGET_EXCEEDED") {
    return NextResponse.json(
      { error: guardResult.message ?? "Monthly budget exceeded" },
      { status: 429 },
    );
  }

  // ---- Per-user daily regenerate cap ---------------------------------------
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count: dailyRegenCount } = await supabase
    .from("token_usage")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("call_type", ["lesson_summary", "exercise_gen"])
    .gte("created_at", since);

  if ((dailyRegenCount ?? 0) >= DAILY_REGENERATE_LIMIT) {
    return NextResponse.json(
      { error: `Daily regenerate limit reached (${DAILY_REGENERATE_LIMIT}/day)` },
      { status: 429 },
    );
  }

  try {
    const serviceClient = createServiceClient();
    const { lesson, exercises } = await regenerateLesson(serviceClient, slug, userId);

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
    const message = err instanceof Error ? err.message : "Failed to regenerate lesson";

    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

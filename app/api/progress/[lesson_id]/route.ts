import { NextRequest, NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/require-auth";

export const dynamic = "force-dynamic";

async function updateStreak(supabase: ReturnType<typeof createRouteClient>, userId: string): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);

  const { data: stats } = await supabase
    .from("user_stats")
    .select("streak_days, last_active_date")
    .eq("user_id", userId)
    .single();

  if (!stats) {
    await supabase.from("user_stats").insert({
      user_id: userId,
      streak_days: 1,
      last_active_date: today,
      updated_at: new Date().toISOString(),
    });
    return;
  }

  if (stats.last_active_date === today) return;

  const lastDate = stats.last_active_date ? new Date(stats.last_active_date + "T00:00:00Z") : null;
  const todayDate = new Date(today + "T00:00:00Z");
  const isYesterday = lastDate && Math.round((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)) === 1;

  await supabase
    .from("user_stats")
    .update({
      streak_days: isYesterday ? stats.streak_days + 1 : 1,
      last_active_date: today,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);
}

const VALID_STATES = ["in_progress", "completed", "skipped"] as const;
type InputState = (typeof VALID_STATES)[number];

function isValidState(value: unknown): value is InputState {
  return typeof value === "string" && VALID_STATES.includes(value as InputState);
}

// ---------------------------------------------------------------------------
// POST /api/progress/[lesson_id]
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest, { params }: { params: { lesson_id: string } }) {
  const supabase = createRouteClient();

  const authResult = await requireAuth(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const userId = authResult.session.user.id;

  const { lesson_id } = params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const state = (body as Record<string, unknown>)?.state;
  if (!isValidState(state)) {
    return NextResponse.json(
      { error: `Invalid state. Must be one of: ${VALID_STATES.join(", ")}` },
      { status: 400 },
    );
  }

  const { data: lesson, error: lessonError } = await supabase
    .from("lessons")
    .select("id")
    .eq("id", lesson_id)
    .single();

  if (lessonError || !lesson) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("progress")
    .select("state, first_visit_at, completed_at")
    .eq("user_id", userId)
    .eq("lesson_id", lesson_id)
    .single();

  if (existing?.state === "completed" && state === "in_progress") {
    return new NextResponse(null, { status: 204 });
  }

  const now = new Date().toISOString();

  if (!existing) {
    const insertPayload: {
      user_id: string;
      lesson_id: string;
      state: string;
      first_visit_at: string;
      last_visit_at: string;
      completed_at?: string;
    } = {
      user_id: userId,
      lesson_id,
      state,
      first_visit_at: now,
      last_visit_at: now,
    };

    if (state === "completed") {
      insertPayload.completed_at = now;
    }

    const { error: insertError } = await supabase.from("progress").insert(insertPayload);

    if (insertError) {
      return NextResponse.json({ error: "Failed to insert progress" }, { status: 500 });
    }
  } else {
    const updatePayload: {
      state: string;
      last_visit_at: string;
      first_visit_at?: string;
      completed_at?: string;
    } = {
      state,
      last_visit_at: now,
    };

    if (state === "in_progress" && !existing.first_visit_at) {
      updatePayload.first_visit_at = now;
    }

    if (state === "completed") {
      updatePayload.completed_at = now;
    }

    const { error: updateError } = await supabase
      .from("progress")
      .update(updatePayload)
      .eq("user_id", userId)
      .eq("lesson_id", lesson_id);

    if (updateError) {
      return NextResponse.json({ error: "Failed to update progress" }, { status: 500 });
    }
  }

  await updateStreak(supabase, userId).catch((err: unknown) => {
    console.error("Failed to update streak:", err);
  });

  return new NextResponse(null, { status: 204 });
}

// ---------------------------------------------------------------------------
// GET /api/progress/[lesson_id]
// ---------------------------------------------------------------------------

export async function GET(_request: NextRequest, { params }: { params: { lesson_id: string } }) {
  const supabase = createRouteClient();

  const authResult = await requireAuth(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const userId = authResult.session.user.id;

  const { lesson_id } = params;

  const { data: row } = await supabase
    .from("progress")
    .select("lesson_id, state, first_visit_at, completed_at, last_visit_at")
    .eq("user_id", userId)
    .eq("lesson_id", lesson_id)
    .single();

  if (!row) {
    return NextResponse.json({
      lessonId: lesson_id,
      state: "not_started",
      firstVisitAt: null,
      completedAt: null,
      lastVisitAt: null,
    });
  }

  return NextResponse.json({
    lessonId: row.lesson_id,
    state: row.state,
    firstVisitAt: row.first_visit_at,
    completedAt: row.completed_at,
    lastVisitAt: row.last_visit_at,
  });
}

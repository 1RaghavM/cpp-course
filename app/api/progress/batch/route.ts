import { NextRequest, NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/require-auth";

export const dynamic = "force-dynamic";

const VALID_STATES = ["in_progress", "completed", "skipped"] as const;
type InputState = (typeof VALID_STATES)[number];

function isValidState(value: unknown): value is InputState {
  return typeof value === "string" && VALID_STATES.includes(value as InputState);
}

async function updateStreak(
  supabase: ReturnType<typeof createRouteClient>,
  userId: string,
): Promise<void> {
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

  const lastDate = stats.last_active_date
    ? new Date(stats.last_active_date + "T00:00:00Z")
    : null;
  const todayDate = new Date(today + "T00:00:00Z");
  const isYesterday =
    lastDate &&
    Math.round((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)) === 1;

  await supabase
    .from("user_stats")
    .update({
      streak_days: isYesterday ? stats.streak_days + 1 : 1,
      last_active_date: today,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);
}

// ---------------------------------------------------------------------------
// POST /api/progress/batch
// body: { lesson_ids: string[], state: "in_progress" | "completed" | "skipped" }
// Applies the same state to every listed lesson in a single round-trip.
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const supabase = createRouteClient();

  const authResult = await requireAuth(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const userId = authResult.user.id;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const payload = (body as Record<string, unknown>) ?? {};
  const state = payload.state;
  const lessonIds = payload.lesson_ids;

  if (!isValidState(state)) {
    return NextResponse.json(
      { error: `Invalid state. Must be one of: ${VALID_STATES.join(", ")}` },
      { status: 400 },
    );
  }

  if (
    !Array.isArray(lessonIds) ||
    lessonIds.length === 0 ||
    !lessonIds.every((id) => typeof id === "string")
  ) {
    return NextResponse.json(
      { error: "lesson_ids must be a non-empty array of strings" },
      { status: 400 },
    );
  }

  const uniqueIds = Array.from(new Set(lessonIds as string[]));

  const { data: existingRows, error: existingErr } = await supabase
    .from("progress")
    .select("lesson_id")
    .eq("user_id", userId)
    .in("lesson_id", uniqueIds);

  if (existingErr) {
    return NextResponse.json({ error: "Failed to read progress" }, { status: 500 });
  }

  const now = new Date().toISOString();
  const existingSet = new Set((existingRows ?? []).map((r) => r.lesson_id as string));
  const newIds = uniqueIds.filter((id) => !existingSet.has(id));
  const existingIds = uniqueIds.filter((id) => existingSet.has(id));

  if (newIds.length > 0) {
    const inserts = newIds.map((id) => {
      const row: {
        user_id: string;
        lesson_id: string;
        state: string;
        first_visit_at: string;
        last_visit_at: string;
        completed_at?: string;
      } = {
        user_id: userId,
        lesson_id: id,
        state,
        first_visit_at: now,
        last_visit_at: now,
      };
      if (state === "completed") row.completed_at = now;
      return row;
    });

    const { error: insertErr } = await supabase.from("progress").insert(inserts);
    if (insertErr) {
      return NextResponse.json({ error: "Failed to insert progress" }, { status: 500 });
    }
  }

  if (existingIds.length > 0) {
    const updatePayload: {
      state: string;
      last_visit_at: string;
      completed_at?: string | null;
    } = {
      state,
      last_visit_at: now,
    };
    if (state === "completed") {
      updatePayload.completed_at = now;
    } else if (state === "in_progress") {
      updatePayload.completed_at = null;
    }

    const { error: updateErr } = await supabase
      .from("progress")
      .update(updatePayload)
      .eq("user_id", userId)
      .in("lesson_id", existingIds);

    if (updateErr) {
      return NextResponse.json({ error: "Failed to update progress" }, { status: 500 });
    }
  }

  await updateStreak(supabase, userId).catch((err: unknown) => {
    console.error("Failed to update streak:", err);
  });

  return new NextResponse(null, { status: 204 });
}

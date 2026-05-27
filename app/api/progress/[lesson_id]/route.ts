import { NextRequest, NextResponse } from "next/server";
import { createRouteClient, createServiceClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/require-auth";

export const dynamic = "force-dynamic";

const VALID_STATES = ["in_progress", "completed", "skipped"] as const;
type InputState = (typeof VALID_STATES)[number];

function isValidState(value: unknown): value is InputState {
  return (
    typeof value === "string" &&
    VALID_STATES.includes(value as InputState)
  );
}

// ---------------------------------------------------------------------------
// POST /api/progress/[lesson_id]
// ---------------------------------------------------------------------------

export async function POST(
  request: NextRequest,
  { params }: { params: { lesson_id: string } },
) {
  const authClient = createRouteClient();

  // Auth guard
  const authResult = await requireAuth(authClient);
  if (authResult instanceof NextResponse) return authResult;

  const supabase = createServiceClient();

  const { lesson_id } = params;

  // Parse and validate body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const state = (body as Record<string, unknown>)?.state;
  if (!isValidState(state)) {
    return NextResponse.json(
      { error: `Invalid state. Must be one of: ${VALID_STATES.join(", ")}` },
      { status: 400 },
    );
  }

  // Validate lesson_id exists
  const { data: lesson, error: lessonError } = await supabase
    .from("lessons")
    .select("id")
    .eq("id", lesson_id)
    .single();

  if (lessonError || !lesson) {
    return NextResponse.json(
      { error: "Lesson not found" },
      { status: 400 },
    );
  }

  // Fetch existing progress row (if any)
  const { data: existing } = await supabase
    .from("progress")
    .select("state, first_visit_at, completed_at")
    .eq("lesson_id", lesson_id)
    .single();

  // Do NOT downgrade from completed to in_progress
  if (existing?.state === "completed" && state === "in_progress") {
    return new NextResponse(null, { status: 204 });
  }

  const now = new Date().toISOString();

  if (!existing) {
    // ------ Insert new row ------
    const insertPayload: {
      lesson_id: string;
      state: string;
      first_visit_at: string;
      last_visit_at: string;
      completed_at?: string;
    } = {
      lesson_id,
      state,
      first_visit_at: now,
      last_visit_at: now,
    };

    if (state === "completed") {
      insertPayload.completed_at = now;
    }

    const { error: insertError } = await supabase
      .from("progress")
      .insert(insertPayload);

    if (insertError) {
      return NextResponse.json(
        { error: "Failed to insert progress" },
        { status: 500 },
      );
    }
  } else {
    // ------ Update existing row ------
    const updatePayload: {
      state: string;
      last_visit_at: string;
      first_visit_at?: string;
      completed_at?: string;
    } = {
      state,
      last_visit_at: now,
    };

    // If transitioning to in_progress and first_visit_at was never set
    if (state === "in_progress" && !existing.first_visit_at) {
      updatePayload.first_visit_at = now;
    }

    // If transitioning to completed, stamp completed_at
    if (state === "completed") {
      updatePayload.completed_at = now;
    }

    const { error: updateError } = await supabase
      .from("progress")
      .update(updatePayload)
      .eq("lesson_id", lesson_id);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update progress" },
        { status: 500 },
      );
    }
  }

  return new NextResponse(null, { status: 204 });
}

// ---------------------------------------------------------------------------
// GET /api/progress/[lesson_id]
// ---------------------------------------------------------------------------

export async function GET(
  _request: NextRequest,
  { params }: { params: { lesson_id: string } },
) {
  const authClient = createRouteClient();

  // Auth guard
  const authResult = await requireAuth(authClient);
  if (authResult instanceof NextResponse) return authResult;

  const supabase = createServiceClient();

  const { lesson_id } = params;

  const { data: row } = await supabase
    .from("progress")
    .select("lesson_id, state, first_visit_at, completed_at, last_visit_at")
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

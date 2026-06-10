import { NextRequest, NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/require-auth";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// POST /api/concept-checks — record a concept-check attempt
// body: { checkId: string, correct: boolean } → 204
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const supabase = createRouteClient();

  const authResult = await requireAuth(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { checkId, correct } = (body ?? {}) as { checkId?: unknown; correct?: unknown };
  if (typeof checkId !== "string" || checkId.length === 0 || typeof correct !== "boolean") {
    return NextResponse.json(
      { error: "checkId (string) and correct (boolean) are required" },
      { status: 400 },
    );
  }

  const { error } = await supabase.from("concept_check_attempts").insert({
    user_id: user.id,
    check_id: checkId,
    correct,
  });
  if (error) {
    // Postgres FK violation — the checkId doesn't reference a known concept check
    if (error.code === "23503") {
      return NextResponse.json({ error: "Unknown checkId" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to record attempt" }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}

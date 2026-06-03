import { NextRequest, NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/require-auth";

export const dynamic = "force-dynamic";

const VALID_WEEKLY_GOALS = [2, 3, 5, 7] as const;

interface ProfileUpdate {
  displayName?: string | null;
  weeklyGoal?: number | null;
}

function isValidUpdate(body: unknown): body is ProfileUpdate {
  if (typeof body !== "object" || body === null) return false;
  const b = body as Record<string, unknown>;

  if ("displayName" in b && b.displayName !== null && typeof b.displayName !== "string") {
    return false;
  }
  if (typeof b.displayName === "string" && b.displayName.length > 50) {
    return false;
  }

  if ("weeklyGoal" in b && b.weeklyGoal !== null) {
    if (!VALID_WEEKLY_GOALS.includes(b.weeklyGoal as (typeof VALID_WEEKLY_GOALS)[number])) {
      return false;
    }
  }

  return "displayName" in b || "weeklyGoal" in b;
}

export async function PATCH(request: NextRequest) {
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

  if (!isValidUpdate(body)) {
    return NextResponse.json({ error: "Invalid profile update" }, { status: 400 });
  }

  const updates: {
    updated_at: string;
    display_name?: string | null;
    weekly_goal?: number | null;
  } = { updated_at: new Date().toISOString() };
  if ("displayName" in body) updates.display_name = body.displayName?.trim() || null;
  if ("weeklyGoal" in body) updates.weekly_goal = body.weeklyGoal;

  const { error } = await supabase.from("user_stats").update(updates).eq("user_id", userId);

  if (error) {
    console.error("Failed to update profile:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

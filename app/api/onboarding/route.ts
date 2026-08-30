import { NextRequest, NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { isOnboardingPayload } from "@/lib/onboarding/validate";

export const dynamic = "force-dynamic";

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

  if (!isOnboardingPayload(body)) {
    return NextResponse.json({ error: "Invalid onboarding payload" }, { status: 400 });
  }

  const { error } = await supabase.from("onboarding").upsert(
    {
      user_id: userId,
      background: body.background,
      motivation: body.motivation,
      start_module: body.startModule,
      fast_track: body.fastTrack,
      placement_taken: body.placementTaken,
      placement_score: body.placementScore,
      weekly_goal: body.weeklyGoal,
    },
    { onConflict: "user_id" },
  );

  if (error) {
    console.error("Failed to save onboarding data:", error);
    return NextResponse.json({ error: "Failed to save onboarding data" }, { status: 500 });
  }

  const statsRow: {
    user_id: string;
    weekly_goal: number | null;
    updated_at: string;
    display_name?: string;
  } = {
    user_id: userId,
    weekly_goal: body.weeklyGoal,
    updated_at: new Date().toISOString(),
  };
  if (body.displayName) {
    statsRow.display_name = body.displayName;
  }

  await supabase.from("user_stats").upsert(statsRow, { onConflict: "user_id" });

  return NextResponse.json({ ok: true, startModule: body.startModule });
}

export async function GET() {
  const supabase = createRouteClient();
  const authResult = await requireAuth(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const userId = authResult.user.id;

  const { data, error } = await supabase
    .from("onboarding")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Failed to load onboarding data:", error);
    return NextResponse.json({ error: "Failed to load onboarding data" }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "No onboarding data found" }, { status: 404 });
  }

  const fullName = (authResult.user.user_metadata?.full_name as string | undefined) ?? null;
  const firstName = fullName?.trim().split(/\s+/)[0] || null;

  return NextResponse.json({
    background: data.background,
    motivation: data.motivation,
    startModule: data.start_module,
    fastTrack: data.fast_track,
    placementTaken: data.placement_taken,
    placementScore: data.placement_score,
    weeklyGoal: data.weekly_goal,
    firstName,
  });
}

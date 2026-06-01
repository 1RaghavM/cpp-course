import { NextRequest, NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/require-auth";
import type { OnboardingPayload } from "@/lib/onboarding/types";

export const dynamic = "force-dynamic";

const VALID_BACKGROUNDS = ["new", "other_lang", "some_cpp"] as const;
const VALID_MOTIVATIONS = [
  "interviews",
  "school",
  "gamedev",
  "systems",
  "competitive",
  "curious",
] as const;

function isValidPayload(body: unknown): body is OnboardingPayload {
  if (typeof body !== "object" || body === null) return false;
  const b = body as Record<string, unknown>;
  if (!VALID_BACKGROUNDS.includes(b.background as (typeof VALID_BACKGROUNDS)[number])) return false;
  if (!VALID_MOTIVATIONS.includes(b.motivation as (typeof VALID_MOTIVATIONS)[number])) return false;
  if (typeof b.startModule !== "string" || b.startModule.length === 0) return false;
  if (typeof b.fastTrack !== "boolean") return false;
  if (typeof b.placementTaken !== "boolean") return false;
  if (b.placementScore !== null && typeof b.placementScore !== "number") return false;
  if (b.weeklyGoal !== null && typeof b.weeklyGoal !== "number") return false;
  return true;
}

export async function POST(request: NextRequest) {
  const supabase = createRouteClient();
  const authResult = await requireAuth(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const userId = authResult.session.user.id;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!isValidPayload(body)) {
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

  return NextResponse.json({ ok: true, startModule: body.startModule });
}

export async function GET() {
  const supabase = createRouteClient();
  const authResult = await requireAuth(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const userId = authResult.session.user.id;

  const { data, error } = await supabase
    .from("onboarding")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "No onboarding data found" }, { status: 404 });
  }

  const fullName = (authResult.session.user.user_metadata?.full_name as string | undefined) ?? null;

  return NextResponse.json({
    background: data.background,
    motivation: data.motivation,
    startModule: data.start_module,
    fastTrack: data.fast_track,
    placementTaken: data.placement_taken,
    placementScore: data.placement_score,
    weeklyGoal: data.weekly_goal,
    firstName: fullName,
  });
}

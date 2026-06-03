import { NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/require-auth";

export const dynamic = "force-dynamic";

export async function POST() {
  const supabase = createRouteClient();
  const authResult = await requireAuth(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const userId = authResult.user.id;

  const { error: progressError } = await supabase
    .from("progress")
    .delete()
    .eq("user_id", userId);

  if (progressError) {
    console.error("Failed to delete progress:", progressError);
    return NextResponse.json({ error: "Failed to reset progress" }, { status: 500 });
  }

  const { error: statsError } = await supabase
    .from("user_stats")
    .update({
      streak_days: 0,
      last_active_date: null,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (statsError) {
    console.error("Failed to reset stats:", statsError);
    return NextResponse.json({ error: "Failed to reset stats" }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}

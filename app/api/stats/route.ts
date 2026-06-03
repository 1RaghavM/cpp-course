import { NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { fetchStats } from "@/lib/stats/fetch-stats";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createRouteClient();
  const authResult = await requireAuth(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const userId = authResult.user.id;
  const stats = await fetchStats(supabase, userId);
  return NextResponse.json(stats);
}

import { NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { TUTOR_CONFIG } from "@/lib/ai/config";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createRouteClient();
  const authResult = await requireAuth(supabase);
  if (authResult instanceof NextResponse) return authResult;

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [dailyRes, monthRes] = await Promise.all([
    supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("role", "user")
      .gte("created_at", startOfDay.toISOString()),
    supabase
      .from("token_usage")
      .select("cost_usd_micro")
      .eq("call_type", "tutor")
      .gte("created_at", startOfMonth.toISOString()),
  ]);

  const monthSpendMicro = (monthRes.data ?? []).reduce(
    (sum, row) => sum + (row.cost_usd_micro ?? 0),
    0,
  );

  return NextResponse.json({
    usedToday: dailyRes.count ?? 0,
    dailyCap: TUTOR_CONFIG.dailyMsgCap,
    monthSpendUsd: monthSpendMicro / 1_000_000,
    monthCapUsd: TUTOR_CONFIG.monthlyHardCapMicro / 1_000_000,
  });
}

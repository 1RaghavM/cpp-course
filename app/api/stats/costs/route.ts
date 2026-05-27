import { NextResponse } from "next/server";
import { createRouteClient, createServiceClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/require-auth";

export const dynamic = "force-dynamic";

interface ByCallType {
  callType: string;
  totalCalls: number;
  totalTokensIn: number;
  totalTokensOut: number;
  totalCachedIn: number;
  totalCostUsd: number;
}

interface DailySpend {
  date: string;
  costUsd: number;
}

interface CostStatsResponse {
  thisMonthUsd: number;
  byCallType: ByCallType[];
  cacheHitRate: number;
  dailySpend: DailySpend[];
}

export async function GET() {
  const authClient = createRouteClient();

  // Auth guard
  const authResult = await requireAuth(authClient);
  if (authResult instanceof NextResponse) return authResult;

  const supabase = createServiceClient();

  // Current calendar month boundaries (UTC)
  const now = new Date();
  const monthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  ).toISOString();

  // 30 days ago for daily spend
  const thirtyDaysAgo = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 30),
  ).toISOString();

  // Two parallel queries:
  // 1. Current month rows (for byCallType + monthly total + cache rate)
  // 2. Last 30 days rows (for dailySpend)
  const [monthResult, dailyResult] = await Promise.all([
    supabase
      .from("token_usage")
      .select("call_type, tokens_in, tokens_out, cached_in, cost_usd_micro")
      .gte("created_at", monthStart),
    supabase
      .from("token_usage")
      .select("created_at, cost_usd_micro")
      .gte("created_at", thirtyDaysAgo),
  ]);

  if (monthResult.error) {
    return NextResponse.json(
      { error: "Failed to fetch monthly usage" },
      { status: 500 },
    );
  }
  if (dailyResult.error) {
    return NextResponse.json(
      { error: "Failed to fetch daily usage" },
      { status: 500 },
    );
  }

  const monthRows = monthResult.data ?? [];
  const dailyRows = dailyResult.data ?? [];

  // ---------- Aggregate by call_type ----------
  const callTypeMap = new Map<
    string,
    {
      totalCalls: number;
      totalTokensIn: number;
      totalTokensOut: number;
      totalCachedIn: number;
      totalCostMicro: number;
    }
  >();

  let totalCostMicro = 0;
  let totalTokensInAll = 0;
  let totalCachedInAll = 0;

  for (const row of monthRows) {
    const ct = row.call_type;
    const existing = callTypeMap.get(ct);

    const tokensIn = row.tokens_in ?? 0;
    const tokensOut = row.tokens_out ?? 0;
    const cachedIn = row.cached_in ?? 0;
    const costMicro = row.cost_usd_micro ?? 0;

    totalCostMicro += costMicro;
    totalTokensInAll += tokensIn;
    totalCachedInAll += cachedIn;

    if (existing) {
      existing.totalCalls += 1;
      existing.totalTokensIn += tokensIn;
      existing.totalTokensOut += tokensOut;
      existing.totalCachedIn += cachedIn;
      existing.totalCostMicro += costMicro;
    } else {
      callTypeMap.set(ct, {
        totalCalls: 1,
        totalTokensIn: tokensIn,
        totalTokensOut: tokensOut,
        totalCachedIn: cachedIn,
        totalCostMicro: costMicro,
      });
    }
  }

  const byCallType: ByCallType[] = Array.from(callTypeMap.entries()).map(
    ([callType, agg]) => ({
      callType,
      totalCalls: agg.totalCalls,
      totalTokensIn: agg.totalTokensIn,
      totalTokensOut: agg.totalTokensOut,
      totalCachedIn: agg.totalCachedIn,
      totalCostUsd: agg.totalCostMicro / 1_000_000,
    }),
  );

  // Sort by cost descending
  byCallType.sort((a, b) => b.totalCostUsd - a.totalCostUsd);

  // ---------- Cache hit rate ----------
  const totalInputTokens = totalTokensInAll + totalCachedInAll;
  const cacheHitRate =
    totalInputTokens > 0 ? totalCachedInAll / totalInputTokens : 0;

  // ---------- Daily spend (last 30 days) ----------
  const dailyMap = new Map<string, number>();

  for (const row of dailyRows) {
    // Extract date portion (YYYY-MM-DD) from the ISO timestamp
    const date = row.created_at.slice(0, 10);
    dailyMap.set(date, (dailyMap.get(date) ?? 0) + (row.cost_usd_micro ?? 0));
  }

  // Fill in missing days with zero
  const dailySpend: DailySpend[] = [];
  for (let i = 30; i >= 0; i--) {
    const d = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i),
    );
    const dateStr = d.toISOString().slice(0, 10);
    dailySpend.push({
      date: dateStr,
      costUsd: (dailyMap.get(dateStr) ?? 0) / 1_000_000,
    });
  }

  const response: CostStatsResponse = {
    thisMonthUsd: totalCostMicro / 1_000_000,
    byCallType,
    cacheHitRate,
    dailySpend,
  };

  return NextResponse.json(response);
}

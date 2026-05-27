import { createServiceClient } from "@/lib/supabase/server";

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

function formatUsd(value: number): string {
  return `$${value.toFixed(2)}`;
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
}

export default async function StatsPage() {
  // Use service client to bypass RLS (auth enforced by middleware)
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
  byCallType.sort((a, b) => b.totalCostUsd - a.totalCostUsd);

  const thisMonthUsd = totalCostMicro / 1_000_000;

  // ---------- Cache hit rate ----------
  const totalInputTokens = totalTokensInAll + totalCachedInAll;
  const cacheHitRate =
    totalInputTokens > 0 ? totalCachedInAll / totalInputTokens : 0;

  // ---------- Daily spend (last 30 days) ----------
  const dailyMap = new Map<string, number>();
  for (const row of dailyRows) {
    const date = row.created_at.slice(0, 10);
    dailyMap.set(date, (dailyMap.get(date) ?? 0) + (row.cost_usd_micro ?? 0));
  }

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

  const maxDailySpend = Math.max(...dailySpend.map((d) => d.costUsd), 0.01);

  // ---------- Thresholds ----------
  const isWarning = thisMonthUsd >= 25;
  const isDanger = thisMonthUsd >= 30;

  const hasData = monthRows.length > 0;

  // ---------- Month label ----------
  const monthLabel = now.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Cost Stats</h1>

      {/* Monthly total */}
      <div
        className={`rounded-lg border p-6 ${
          isDanger
            ? "border-red-500 bg-red-50 dark:bg-red-950/30"
            : isWarning
              ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30"
              : "border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900"
        }`}
      >
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {monthLabel}
        </p>
        <p
          className={`mt-1 text-4xl font-bold tabular-nums ${
            isDanger
              ? "text-red-600 dark:text-red-400"
              : isWarning
                ? "text-yellow-600 dark:text-yellow-400"
                : "text-neutral-900 dark:text-neutral-100"
          }`}
        >
          {formatUsd(thisMonthUsd)}
        </p>
        {isDanger && (
          <p className="mt-2 text-sm font-medium text-red-600 dark:text-red-400">
            Over $30 ceiling — new API calls should be blocked.
          </p>
        )}
        {isWarning && !isDanger && (
          <p className="mt-2 text-sm font-medium text-yellow-600 dark:text-yellow-400">
            Approaching $30 monthly ceiling.
          </p>
        )}
        {!hasData && (
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            No usage data yet. Costs will appear here once LLM calls are made.
          </p>
        )}
      </div>

      {/* Cache hit rate */}
      <div className="rounded-lg border border-neutral-200 p-6 dark:border-neutral-800">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Cache hit rate
        </p>
        <p className="mt-1 text-3xl font-bold tabular-nums text-neutral-900 dark:text-neutral-100">
          {hasData ? `${(cacheHitRate * 100).toFixed(1)}%` : "--"}
        </p>
        <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
          {hasData
            ? `${formatTokens(totalCachedInAll)} cached of ${formatTokens(totalInputTokens)} total input tokens`
            : "Cached input tokens vs total input tokens"}
        </p>
      </div>

      {/* Call type breakdown table */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">By call type</h2>
        {byCallType.length === 0 ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            No calls recorded this month.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50 text-left dark:border-neutral-800 dark:bg-neutral-900">
                  <th className="px-4 py-2 font-medium">Type</th>
                  <th className="px-4 py-2 text-right font-medium">Calls</th>
                  <th className="px-4 py-2 text-right font-medium">
                    Tokens in
                  </th>
                  <th className="px-4 py-2 text-right font-medium">
                    Tokens out
                  </th>
                  <th className="px-4 py-2 text-right font-medium">Cached</th>
                  <th className="px-4 py-2 text-right font-medium">Cost</th>
                </tr>
              </thead>
              <tbody>
                {byCallType.map((ct) => (
                  <tr
                    key={ct.callType}
                    className="border-b border-neutral-100 dark:border-neutral-800"
                  >
                    <td className="px-4 py-2 font-mono text-xs">
                      {ct.callType}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {ct.totalCalls}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {formatTokens(ct.totalTokensIn)}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {formatTokens(ct.totalTokensOut)}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {formatTokens(ct.totalCachedIn)}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums font-medium">
                      {formatUsd(ct.totalCostUsd)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-neutral-50 font-medium dark:bg-neutral-900">
                  <td className="px-4 py-2">Total</td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {byCallType.reduce((s, c) => s + c.totalCalls, 0)}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {formatTokens(
                      byCallType.reduce((s, c) => s + c.totalTokensIn, 0),
                    )}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {formatTokens(
                      byCallType.reduce((s, c) => s + c.totalTokensOut, 0),
                    )}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {formatTokens(
                      byCallType.reduce((s, c) => s + c.totalCachedIn, 0),
                    )}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {formatUsd(thisMonthUsd)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Daily spend bar chart */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Daily spend (last 30 days)</h2>
        {!hasData && dailySpend.every((d) => d.costUsd === 0) ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            No spend data to display yet.
          </p>
        ) : (
          <div className="space-y-0.5">
            {dailySpend.map((day) => {
              const barWidth =
                maxDailySpend > 0
                  ? Math.max((day.costUsd / maxDailySpend) * 100, 0)
                  : 0;
              // Show label only for the 1st, 8th, 15th, 22nd, 29th
              const dayNum = parseInt(day.date.slice(8, 10), 10);
              const showLabel = [1, 8, 15, 22, 29].includes(dayNum);

              return (
                <div key={day.date} className="flex items-center gap-2">
                  <span
                    className={`w-16 text-right text-xs tabular-nums ${
                      showLabel
                        ? "text-neutral-500 dark:text-neutral-400"
                        : "text-transparent"
                    }`}
                  >
                    {day.date.slice(5)}
                  </span>
                  <div className="flex-1">
                    <div
                      className="h-4 rounded-sm bg-blue-500 dark:bg-blue-400"
                      style={{
                        width: `${barWidth}%`,
                        minWidth: day.costUsd > 0 ? "2px" : "0px",
                      }}
                      title={`${day.date}: ${formatUsd(day.costUsd)}`}
                    />
                  </div>
                  {day.costUsd > 0 && (
                    <span className="w-14 text-right text-xs tabular-nums text-neutral-500 dark:text-neutral-400">
                      {formatUsd(day.costUsd)}
                    </span>
                  )}
                  {day.costUsd === 0 && <span className="w-14" />}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

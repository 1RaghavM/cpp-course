# T13: Cost Stats Feature

## Wave: 3 (depends on T04, T05, T06)

## Dependencies

- **T04** — Supabase client library (for DB queries)
- **T05** — Auth system (middleware protects the route)
- **T06** — Anthropic client library (cost logging populates the `token_usage` table)

## Objective

Build the cost monitoring page that shows monthly LLM spend, cache hit rates, and per-call-type breakdowns. This is how the user keeps the $30/month ceiling in check.

## Files to create

```
app/api/stats/costs/route.ts          # GET /api/stats/costs
app/(app)/stats/page.tsx              # stats page
```

## Implementation

### app/api/stats/costs/route.ts

**GET /api/stats/costs**

Response shape:
```typescript
{
  thisMonthUsd: number;                     // total spend this calendar month
  byCallType: Array<{
    callType: string;                       // lesson_summary | exercise_gen | tutor | other
    totalCalls: number;
    totalTokensIn: number;
    totalTokensOut: number;
    totalCachedIn: number;
    totalCostUsd: number;
  }>;
  cacheHitRate: number;                     // 0-1, ratio of cached input tokens to total input tokens
  dailySpend: Array<{                      // last 30 days
    date: string;
    costUsd: number;
  }>;
}
```

Logic:
1. Query `token_usage` table for the current calendar month
2. Aggregate by `call_type`: sum tokens_in, tokens_out, cached_in, cost_usd_micro
3. Compute cache hit rate: `sum(cached_in) / sum(tokens_in + cached_in)` across all calls
4. Compute daily spend for the last 30 days (group by date_trunc)
5. Convert microdollars to USD for display (divide by 1_000_000)

### app/(app)/stats/page.tsx

Server component that renders cost data.

Display:
- **Monthly total** — big number at the top: "$X.XX this month" with a visual indicator if approaching $25 (yellow) or $30 (red)
- **By call type** — table or cards showing spend per call type (lesson_summary, exercise_gen, tutor, other) with call count and average cost per call
- **Cache hit rate** — percentage display, should be close to 100% after the first pass through lessons
- **Daily spend chart** — simple bar chart or list of the last 30 days' spend (no charting library — use Tailwind-styled divs as bars, or a simple table)

Keep it simple. This is an admin cost dashboard, not a BI tool.

## Skills to reference

- `/project:llm-integration` — cost thresholds: warn at $25/month projected, hard ceiling $30
- `/project:new-route` — follow the route handler pattern
- `/project:scope-check` — no Grafana, no Datadog, no dashboarding library. Simple HTML/Tailwind.

## Acceptance criteria

- [ ] `GET /api/stats/costs` returns aggregated cost data
- [ ] Monthly total is computed correctly in USD
- [ ] Call type breakdown sums to the monthly total
- [ ] Cache hit rate is computed correctly
- [ ] Daily spend covers the last 30 days
- [ ] Stats page renders all data clearly
- [ ] Visual warning when approaching $25/month
- [ ] Page works with zero data (new install, no calls yet)

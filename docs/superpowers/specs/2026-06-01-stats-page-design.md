# Stats Page Design

## Overview

A comprehensive, learner-facing stats page at `/stats` with a bento grid layout. All data comes from a single `GET /api/stats` endpoint that runs parallel Supabase queries. No new database migrations required — all data already exists in the schema.

## API: `GET /api/stats`

### Auth

Uses `requireAuth()` — returns 401 if unauthenticated. All queries are scoped to `auth.uid()` via RLS.

### Parallel Queries

Six Supabase queries run via `Promise.all`:

1. **progress** — all rows for this user → lessons completed/in_progress/skipped, visit timestamps, activity data
2. **lessons + chapters** — total counts per chapter (public tables, no user filter)
3. **submissions** — all rows → status aggregation (passed/failed/compile_error), weekly grouping (last 8 weeks), total runs vs submits
4. **conversations** — count of tutor conversations for this user
5. **messages** — count of messages in user's conversations
6. **notes** — count of non-empty notes for this user
7. **user_stats** — streak_days, weekly_goal

### Response Shape

```typescript
interface StatsResponse {
  // Core learning
  totalLessons: number;
  lessonsCompleted: number;
  lessonsInProgress: number;
  lessonsSkipped: number;
  streakDays: number;
  weeklyGoal: number | null;
  lessonsCompletedThisWeek: number;
  chapterProgress: Array<{
    chapterId: number;
    chapterTitle: string;
    completed: number;
    total: number;
  }>;
  activityData: Record<string, number>;

  // Code performance
  totalSubmissions: number;
  totalRuns: number;
  passedSubmissions: number;
  failedSubmissions: number;
  compileErrors: number;
  successRate: number;
  weeklySubmissions: Array<{
    week: string;
    passed: number;
    failed: number;
  }>;

  // Engagement
  tutorConversations: number;
  tutorMessages: number;
  notesWritten: number;
  totalTimeMinutes: number;
}
```

### Aggregation Details

- **successRate**: `passedSubmissions / totalSubmissions` (0 if no submissions)
- **totalTimeMinutes**: sum of `(last_visit_at - first_visit_at)` across all progress rows, capped at 120 min per lesson to avoid overnight-tab inflation
- **weeklySubmissions**: group `submissions` by ISO week (`YYYY-Www`) for the last 8 weeks, count passed vs failed (mode = 'submit' only)
- **activityData**: same 16-week window as the dashboard heatmap, counting progress row updates per day
- **lessonsCompletedThisWeek**: count of progress rows where `completed_at` falls within the current ISO week

## Frontend

### Page Structure

- `app/(app)/stats/page.tsx` — server component, fetches `/api/stats`, passes data to client component
- `app/(app)/stats/loading.tsx` — skeleton grid matching the bento layout
- `components/stats/StatsPage.tsx` — client component, renders the bento grid

### Bento Grid Layout

Responsive CSS grid: 4 columns on desktop (≥1024px), 2 columns on tablet (≥640px), 1 column on mobile.

```
Desktop (4-col):
┌──────────┬──────────┬──────────┬──────────┐
│ Lessons  │ Success  │  Streak  │  Time    │
│ Done     │ Rate     │  Days    │  Spent   │
│ (1×1)    │ (1×1)    │  (1×1)   │  (1×1)   │
├──────────┴──────────┼──────────┴──────────┤
│ Weekly Submissions  │ Chapter Progress    │
│ Bar Chart (2×1)     │ Horizontal Bars     │
│                     │ (2×1)               │
├──────────┬──────────┼─────────────────────┤
│ Radial   │ Compile  │ Activity Heatmap    │
│ Success  │ vs Pass  │ (reuse existing     │
│ (1×1)    │ Pie(1×1) │  component) (2×1)   │
├──────────┴──────────┼──────────┬──────────┤
│ Weekly Goal Trend   │ Tutor    │ Notes    │
│ Area Chart (2×1)    │ Convos   │ Written  │
│                     │ (1×1)    │ (1×1)    │
└─────────────────────┴──────────┴──────────┘
```

### Cards (10 total)

| # | Card | Grid Span | Visualization | Data Source |
|---|---|---|---|---|
| 1 | Lessons Completed | 1×1 | Big number + `<Progress>` bar | `lessonsCompleted / totalLessons` |
| 2 | Success Rate | 1×1 | Radial chart (shadcn radial-text style) | `successRate` as percentage |
| 3 | Streak | 1×1 | Big number + flame icon | `streakDays` |
| 4 | Time Spent | 1×1 | Big number + formatted subtitle | `totalTimeMinutes` → hours/mins |
| 5 | Weekly Submissions | 2×1 | Stacked bar chart | `weeklySubmissions` passed vs failed |
| 6 | Chapter Progress | 2×1 | Horizontal bar chart (scrollable) | `chapterProgress` completed/total |
| 7 | Submission Breakdown | 1×1 | Donut/pie chart | passed / failed / compile_error |
| 8 | Activity Heatmap | 2×1 | Existing `ActivityHeatmap` | `activityData` |
| 9 | Weekly Goal Trend | 2×1 | Area chart | Derived from activity data |
| 10 | Engagement Stats | 2×1 | Three mini stat cards in a row | tutorConversations, tutorMessages, notesWritten |

### Component Files

```
components/stats/
  StatsPage.tsx              — bento grid container (client component)
  StatNumberCard.tsx         — reusable big-number card (label, value, subtitle, optional Progress bar)
  SuccessRadial.tsx          — radial chart for success rate
  WeeklySubmissionsChart.tsx — stacked bar chart (Recharts Bar via shadcn ChartContainer)
  ChapterProgressChart.tsx   — horizontal bar chart
  SubmissionBreakdown.tsx    — donut/pie chart
  WeeklyGoalChart.tsx        — area chart
  EngagementStrip.tsx        — three mini stat cards in a row
```

### Chart Library

All charts use shadcn's `ChartContainer`, `ChartTooltip`, and `ChartTooltipContent` wrapping Recharts primitives (`BarChart`, `Bar`, `AreaChart`, `Area`, `PieChart`, `Pie`, `RadialBarChart`, `RadialBar`). Existing `ActivityHeatmap` component reused as-is.

### Loading State

`loading.tsx` renders the same grid with `<Skeleton>` elements matching each card's span and approximate height.

### Styling

- Cards use shadcn `<Card>` with `size="sm"`
- Colors use CSS variables: `--chart-1` through `--chart-5` (already defined by shadcn theme)
- Consistent with existing dashboard aesthetic (same max-width, padding, spacing)
- Page title: "Stats" in the same style as other app pages

## What's NOT Included

- LLM cost stats (kept internal/admin-only)
- No new database migrations
- No new database views or materialized views
- No caching layer on the API (queries are fast enough for single-user data)
- No export/download functionality

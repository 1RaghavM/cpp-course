# Stats Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a comprehensive learner-facing stats page at `/stats` with a bento grid of 10 cards (charts + stat numbers) backed by a single API endpoint.

**Architecture:** Server component page fetches from `GET /api/stats` which runs 7 parallel Supabase queries. Data flows to a client `StatsPage` component rendering a responsive bento grid. All charts use shadcn `ChartContainer` wrapping Recharts.

**Tech Stack:** Next.js 14 App Router, Supabase (Postgres + RLS), shadcn/ui (Card, Chart, Progress, Skeleton, Badge), Recharts (Bar, Area, Pie, RadialBar)

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `app/api/stats/route.ts` | Create | API route: 7 parallel queries, aggregation, JSON response |
| `lib/stats/types.ts` | Create | `StatsResponse` interface shared between API and frontend |
| `components/stats/StatsPage.tsx` | Create | Client component: bento grid container |
| `components/stats/StatNumberCard.tsx` | Create | Reusable big-number card with optional Progress bar |
| `components/stats/SuccessRadial.tsx` | Create | Radial chart for success rate |
| `components/stats/WeeklySubmissionsChart.tsx` | Create | Stacked bar chart: passed vs failed per week |
| `components/stats/ChapterProgressChart.tsx` | Create | Horizontal bar chart: chapter completion |
| `components/stats/SubmissionBreakdown.tsx` | Create | Donut/pie chart: passed/failed/compile_error |
| `components/stats/WeeklyGoalChart.tsx` | Create | Area chart: weekly completion trend |
| `components/stats/EngagementStrip.tsx` | Create | Three mini stat cards for engagement metrics |
| `app/(app)/stats/page.tsx` | Modify | Replace redirect with server component |
| `app/(app)/stats/loading.tsx` | Create | Skeleton bento grid |

---

### Task 1: StatsResponse Type

**Files:**
- Create: `lib/stats/types.ts`

- [ ] **Step 1: Create the shared types file**

```typescript
// lib/stats/types.ts
export interface ChapterProgressEntry {
  chapterId: number;
  chapterTitle: string;
  completed: number;
  total: number;
}

export interface WeeklySubmissionEntry {
  week: string;
  passed: number;
  failed: number;
}

export interface StatsResponse {
  totalLessons: number;
  lessonsCompleted: number;
  lessonsInProgress: number;
  lessonsSkipped: number;
  streakDays: number;
  weeklyGoal: number | null;
  lessonsCompletedThisWeek: number;
  chapterProgress: ChapterProgressEntry[];
  activityData: Record<string, number>;

  totalSubmissions: number;
  totalRuns: number;
  passedSubmissions: number;
  failedSubmissions: number;
  compileErrors: number;
  successRate: number;
  weeklySubmissions: WeeklySubmissionEntry[];

  tutorConversations: number;
  tutorMessages: number;
  notesWritten: number;
  totalTimeMinutes: number;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit lib/stats/types.ts`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add lib/stats/types.ts
git commit -m "feat(stats): add StatsResponse shared types"
```

---

### Task 2: GET /api/stats Route Handler

**Files:**
- Create: `app/api/stats/route.ts`
- Read: `lib/stats/types.ts`

- [ ] **Step 1: Create the route handler**

```typescript
// app/api/stats/route.ts
import { NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/require-auth";
import type {
  StatsResponse,
  ChapterProgressEntry,
  WeeklySubmissionEntry,
} from "@/lib/stats/types";

export const dynamic = "force-dynamic";

function getISOWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function getWeekMondayUTC(today: Date): Date {
  const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const dayOfWeek = d.getUTCDay();
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  d.setUTCDate(d.getUTCDate() - daysSinceMonday);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export async function GET() {
  const supabase = createRouteClient();

  const authResult = await requireAuth(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const userId = authResult.session.user.id;

  const now = new Date();
  const eightWeeksAgo = new Date(now);
  eightWeeksAgo.setUTCDate(eightWeeksAgo.getUTCDate() - 56);

  const sixteenWeeksAgo = new Date(now);
  sixteenWeeksAgo.setUTCDate(sixteenWeeksAgo.getUTCDate() - 112);

  const [
    progressResult,
    lessonsResult,
    submissionsResult,
    conversationsResult,
    messagesResult,
    notesResult,
    userStatsResult,
  ] = await Promise.all([
    supabase
      .from("progress")
      .select("lesson_id, state, first_visit_at, completed_at, last_visit_at")
      .eq("user_id", userId),
    supabase
      .from("lessons")
      .select("id, chapter_id, chapters!inner(id, learncpp_title)")
      .order("sort_order", { ascending: true }),
    supabase
      .from("submissions")
      .select("mode, status, created_at")
      .eq("user_id", userId),
    supabase
      .from("conversations")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("role", "user")
      .in(
        "conversation_id",
        (
          await supabase.from("conversations").select("id").eq("user_id", userId)
        ).data?.map((c) => c.id) ?? [],
      ),
    supabase
      .from("notes")
      .select("lesson_id", { count: "exact", head: true })
      .eq("user_id", userId)
      .neq("content", ""),
    supabase
      .from("user_stats")
      .select("streak_days, weekly_goal")
      .eq("user_id", userId)
      .single(),
  ]);

  const progressRows = (progressResult.data ?? []) as {
    lesson_id: string;
    state: string;
    first_visit_at: string | null;
    completed_at: string | null;
    last_visit_at: string | null;
  }[];

  const lessonRows = (lessonsResult.data ?? []) as {
    id: string;
    chapter_id: number;
    chapters: { id: number; learncpp_title: string };
  }[];

  const submissionRows = (submissionsResult.data ?? []) as {
    mode: string;
    status: string;
    created_at: string;
  }[];

  // --- Core learning ---
  const totalLessons = lessonRows.length;
  let lessonsCompleted = 0;
  let lessonsInProgress = 0;
  let lessonsSkipped = 0;

  const progressMap = new Map<string, (typeof progressRows)[0]>();
  for (const row of progressRows) {
    progressMap.set(row.lesson_id, row);
    if (row.state === "completed") lessonsCompleted++;
    else if (row.state === "in_progress") lessonsInProgress++;
    else if (row.state === "skipped") lessonsSkipped++;
  }

  // Weekly completed
  const weekMonday = getWeekMondayUTC(now);
  const weekSunday = new Date(weekMonday.getTime() + 7 * 24 * 60 * 60 * 1000);
  let lessonsCompletedThisWeek = 0;
  for (const row of progressRows) {
    if (row.completed_at) {
      const d = new Date(row.completed_at);
      if (d >= weekMonday && d < weekSunday) lessonsCompletedThisWeek++;
    }
  }

  // Chapter progress
  const chapterMap = new Map<number, { title: string; total: number; completed: number }>();
  for (const lesson of lessonRows) {
    const chId = lesson.chapter_id;
    const existing = chapterMap.get(chId);
    const isCompleted = progressMap.get(lesson.id)?.state === "completed";
    if (existing) {
      existing.total++;
      if (isCompleted) existing.completed++;
    } else {
      chapterMap.set(chId, {
        title: lesson.chapters.learncpp_title,
        total: 1,
        completed: isCompleted ? 1 : 0,
      });
    }
  }
  const chapterProgress: ChapterProgressEntry[] = Array.from(chapterMap.entries())
    .map(([chapterId, v]) => ({
      chapterId,
      chapterTitle: v.title,
      completed: v.completed,
      total: v.total,
    }));

  // Activity data (16 weeks)
  const activityData: Record<string, number> = {};
  for (const row of progressRows) {
    if (row.last_visit_at) {
      const dateStr = row.last_visit_at.slice(0, 10);
      if (new Date(dateStr) >= sixteenWeeksAgo) {
        activityData[dateStr] = (activityData[dateStr] ?? 0) + 1;
      }
    }
  }

  // --- Code performance ---
  const submitRows = submissionRows.filter((r) => r.mode === "submit");
  const totalSubmissions = submitRows.length;
  const totalRuns = submissionRows.filter((r) => r.mode === "run").length;
  let passedSubmissions = 0;
  let failedSubmissions = 0;
  let compileErrors = 0;

  for (const row of submitRows) {
    if (row.status === "passed") passedSubmissions++;
    else if (row.status === "compile_error") compileErrors++;
    else failedSubmissions++;
  }

  const successRate = totalSubmissions > 0 ? passedSubmissions / totalSubmissions : 0;

  // Weekly submissions (last 8 weeks)
  const weeklyMap = new Map<string, { passed: number; failed: number }>();
  for (const row of submitRows) {
    const d = new Date(row.created_at);
    if (d < eightWeeksAgo) continue;
    const week = getISOWeek(d);
    const entry = weeklyMap.get(week) ?? { passed: 0, failed: 0 };
    if (row.status === "passed") entry.passed++;
    else entry.failed++;
    weeklyMap.set(week, entry);
  }

  const weeklySubmissions: WeeklySubmissionEntry[] = [];
  for (let i = 7; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i * 7);
    const week = getISOWeek(d);
    if (!weeklySubmissions.some((w) => w.week === week)) {
      const entry = weeklyMap.get(week) ?? { passed: 0, failed: 0 };
      weeklySubmissions.push({ week, ...entry });
    }
  }

  // --- Engagement ---
  const tutorConversations = conversationsResult.count ?? 0;
  const tutorMessages = messagesResult.count ?? 0;
  const notesWritten = notesResult.count ?? 0;

  // Time spent (sum of visit durations, capped at 120 min per lesson)
  let totalTimeMinutes = 0;
  for (const row of progressRows) {
    if (row.first_visit_at && row.last_visit_at) {
      const start = new Date(row.first_visit_at).getTime();
      const end = new Date(row.last_visit_at).getTime();
      const diffMin = (end - start) / 60000;
      totalTimeMinutes += Math.min(diffMin, 120);
    }
  }
  totalTimeMinutes = Math.round(totalTimeMinutes);

  const stats = userStatsResult.data as {
    streak_days: number;
    weekly_goal: number | null;
  } | null;

  const response: StatsResponse = {
    totalLessons,
    lessonsCompleted,
    lessonsInProgress,
    lessonsSkipped,
    streakDays: stats?.streak_days ?? 0,
    weeklyGoal: stats?.weekly_goal ?? null,
    lessonsCompletedThisWeek,
    chapterProgress,
    activityData,
    totalSubmissions,
    totalRuns,
    passedSubmissions,
    failedSubmissions,
    compileErrors,
    successRate,
    weeklySubmissions,
    tutorConversations,
    tutorMessages,
    notesWritten,
    totalTimeMinutes,
  };

  return NextResponse.json(response);
}
```

- [ ] **Step 2: Verify the file compiles**

Run: `npx tsc --noEmit`
Expected: No type errors in `app/api/stats/route.ts`

- [ ] **Step 3: Commit**

```bash
git add app/api/stats/route.ts
git commit -m "feat(stats): add GET /api/stats aggregation endpoint"
```

---

### Task 3: StatNumberCard Component

**Files:**
- Create: `components/stats/StatNumberCard.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/stats/StatNumberCard.tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface StatNumberCardProps {
  label: string;
  value: number | string;
  subtitle?: string;
  progress?: { value: number; max: number };
  icon?: React.ReactNode;
}

export function StatNumberCard({ label, value, subtitle, progress: prog, icon }: StatNumberCardProps) {
  const percent = prog ? Math.round((prog.value / prog.max) * 100) : null;

  return (
    <Card size="sm">
      <CardContent>
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{label}</p>
          {icon}
        </div>
        <p className="mt-1 font-mono text-2xl font-semibold tabular-nums">{value}</p>
        {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
        {percent !== null && (
          <Progress value={percent} className="mt-2 h-1.5" />
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/stats/StatNumberCard.tsx
git commit -m "feat(stats): add StatNumberCard component"
```

---

### Task 4: SuccessRadial Chart

**Files:**
- Create: `components/stats/SuccessRadial.tsx`

- [ ] **Step 1: Create the radial chart component**

```tsx
// components/stats/SuccessRadial.tsx
"use client";

import { Label, PolarGrid, RadialBar, RadialBarChart } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";

const chartConfig = {
  rate: {
    label: "Success Rate",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

interface SuccessRadialProps {
  rate: number;
}

export function SuccessRadial({ rate }: SuccessRadialProps) {
  const percent = Math.round(rate * 100);
  const data = [{ name: "rate", value: percent, fill: "var(--color-rate)" }];

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="text-sm">Success Rate</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[140px]">
          <RadialBarChart
            data={data}
            startAngle={90}
            endAngle={90 + 360 * (percent / 100)}
            innerRadius={50}
            outerRadius={70}
          >
            <PolarGrid
              gridType="circle"
              radialLines={false}
              stroke="none"
              polarRadius={[54, 46]}
              className="first:fill-muted last:fill-background"
            />
            <RadialBar dataKey="value" background cornerRadius={10} />
            <Label
              content={() => (
                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
                  <tspan className="fill-foreground text-2xl font-bold">{percent}%</tspan>
                </text>
              )}
            />
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/stats/SuccessRadial.tsx
git commit -m "feat(stats): add SuccessRadial chart component"
```

---

### Task 5: WeeklySubmissionsChart

**Files:**
- Create: `components/stats/WeeklySubmissionsChart.tsx`

- [ ] **Step 1: Create the stacked bar chart component**

```tsx
// components/stats/WeeklySubmissionsChart.tsx
"use client";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { WeeklySubmissionEntry } from "@/lib/stats/types";

const chartConfig = {
  passed: {
    label: "Passed",
    color: "var(--chart-1)",
  },
  failed: {
    label: "Failed",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

interface WeeklySubmissionsChartProps {
  data: WeeklySubmissionEntry[];
}

export function WeeklySubmissionsChart({ data }: WeeklySubmissionsChartProps) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="text-sm">Weekly Submissions</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <BarChart accessibilityLayer data={data}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="week"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(v: string) => v.split("-")[1] ?? v}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="passed" stackId="a" fill="var(--color-passed)" radius={[0, 0, 0, 0]} />
            <Bar dataKey="failed" stackId="a" fill="var(--color-failed)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/stats/WeeklySubmissionsChart.tsx
git commit -m "feat(stats): add WeeklySubmissionsChart component"
```

---

### Task 6: ChapterProgressChart

**Files:**
- Create: `components/stats/ChapterProgressChart.tsx`

- [ ] **Step 1: Create the horizontal bar chart component**

```tsx
// components/stats/ChapterProgressChart.tsx
"use client";

import { Bar, BarChart, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ChapterProgressEntry } from "@/lib/stats/types";

const chartConfig = {
  completed: {
    label: "Completed",
    color: "var(--chart-1)",
  },
  remaining: {
    label: "Remaining",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

interface ChapterProgressChartProps {
  data: ChapterProgressEntry[];
}

export function ChapterProgressChart({ data }: ChapterProgressChartProps) {
  const chartData = data.map((ch) => ({
    name: ch.chapterTitle.length > 20 ? ch.chapterTitle.slice(0, 20) + "..." : ch.chapterTitle,
    completed: ch.completed,
    remaining: ch.total - ch.completed,
  }));

  const chartHeight = Math.max(200, chartData.length * 28);

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="text-sm">Chapter Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[200px]">
          <ChartContainer config={chartConfig} className="w-full" style={{ height: chartHeight }}>
            <BarChart accessibilityLayer data={chartData} layout="vertical" margin={{ left: 0 }}>
              <YAxis
                dataKey="name"
                type="category"
                tickLine={false}
                axisLine={false}
                width={100}
                tick={{ fontSize: 11 }}
              />
              <XAxis type="number" hide />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="completed" stackId="a" fill="var(--color-completed)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="remaining" stackId="a" fill="var(--color-remaining)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ChartContainer>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/stats/ChapterProgressChart.tsx
git commit -m "feat(stats): add ChapterProgressChart component"
```

---

### Task 7: SubmissionBreakdown Donut Chart

**Files:**
- Create: `components/stats/SubmissionBreakdown.tsx`

- [ ] **Step 1: Create the donut chart component**

```tsx
// components/stats/SubmissionBreakdown.tsx
"use client";

import { Pie, PieChart, Label } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const chartConfig = {
  count: { label: "Count" },
  passed: { label: "Passed", color: "var(--chart-1)" },
  failed: { label: "Failed", color: "var(--chart-2)" },
  compileError: { label: "Compile Error", color: "var(--chart-4)" },
} satisfies ChartConfig;

interface SubmissionBreakdownProps {
  passed: number;
  failed: number;
  compileErrors: number;
}

export function SubmissionBreakdown({ passed, failed, compileErrors }: SubmissionBreakdownProps) {
  const total = passed + failed + compileErrors;
  const data = [
    { name: "passed", count: passed, fill: "var(--color-passed)" },
    { name: "failed", count: failed, fill: "var(--color-failed)" },
    { name: "compileError", count: compileErrors, fill: "var(--color-compileError)" },
  ];

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="text-sm">Submissions</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[140px]">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
            <Pie data={data} dataKey="count" nameKey="name" innerRadius={40} outerRadius={60} strokeWidth={2}>
              <Label
                content={() => (
                  <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
                    <tspan className="fill-foreground text-xl font-bold">{total}</tspan>
                    <tspan className="fill-muted-foreground text-xs" x="50%" dy="16">
                      total
                    </tspan>
                  </text>
                )}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/stats/SubmissionBreakdown.tsx
git commit -m "feat(stats): add SubmissionBreakdown donut chart"
```

---

### Task 8: WeeklyGoalChart

**Files:**
- Create: `components/stats/WeeklyGoalChart.tsx`

- [ ] **Step 1: Create the area chart component**

```tsx
// components/stats/WeeklyGoalChart.tsx
"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ReferenceLine } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const chartConfig = {
  completed: {
    label: "Completed",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

interface WeeklyGoalChartProps {
  activityData: Record<string, number>;
  weeklyGoal: number | null;
}

function groupByWeek(activityData: Record<string, number>): { week: string; completed: number }[] {
  const weekMap = new Map<string, number>();

  for (const [dateStr, count] of Object.entries(activityData)) {
    const d = new Date(dateStr + "T00:00:00Z");
    const dayOfWeek = d.getUTCDay();
    const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(d);
    monday.setUTCDate(monday.getUTCDate() - daysSinceMonday);
    const weekKey = monday.toISOString().slice(0, 10);
    weekMap.set(weekKey, (weekMap.get(weekKey) ?? 0) + count);
  }

  return Array.from(weekMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, completed]) => ({ week, completed }));
}

export function WeeklyGoalChart({ activityData, weeklyGoal }: WeeklyGoalChartProps) {
  const data = groupByWeek(activityData);

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="text-sm">Weekly Activity Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <AreaChart accessibilityLayer data={data}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="week"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(v: string) => {
                const d = new Date(v + "T00:00:00Z");
                return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
              }}
            />
            <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            {weeklyGoal != null && (
              <ReferenceLine
                y={weeklyGoal}
                stroke="var(--muted-foreground)"
                strokeDasharray="4 4"
                label={{ value: "Goal", position: "insideTopRight", fontSize: 11 }}
              />
            )}
            <Area
              dataKey="completed"
              type="monotone"
              fill="var(--color-completed)"
              fillOpacity={0.3}
              stroke="var(--color-completed)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/stats/WeeklyGoalChart.tsx
git commit -m "feat(stats): add WeeklyGoalChart area chart"
```

---

### Task 9: EngagementStrip

**Files:**
- Create: `components/stats/EngagementStrip.tsx`

- [ ] **Step 1: Create the engagement strip component**

```tsx
// components/stats/EngagementStrip.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, BookOpen, StickyNote } from "lucide-react";

interface EngagementStripProps {
  tutorConversations: number;
  tutorMessages: number;
  notesWritten: number;
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <div className="text-muted-foreground">{icon}</div>
      <p className="font-mono text-lg font-semibold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export function EngagementStrip({ tutorConversations, tutorMessages, notesWritten }: EngagementStripProps) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="text-sm">Engagement</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <MiniStat icon={<MessageSquare className="h-5 w-5" />} label="Conversations" value={tutorConversations} />
          <MiniStat icon={<BookOpen className="h-5 w-5" />} label="Messages Sent" value={tutorMessages} />
          <MiniStat icon={<StickyNote className="h-5 w-5" />} label="Notes Written" value={notesWritten} />
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/stats/EngagementStrip.tsx
git commit -m "feat(stats): add EngagementStrip component"
```

---

### Task 10: StatsPage Client Component (Bento Grid)

**Files:**
- Create: `components/stats/StatsPage.tsx`

- [ ] **Step 1: Create the bento grid page component**

```tsx
// components/stats/StatsPage.tsx
"use client";

import type { StatsResponse } from "@/lib/stats/types";
import { StatNumberCard } from "@/components/stats/StatNumberCard";
import { SuccessRadial } from "@/components/stats/SuccessRadial";
import { WeeklySubmissionsChart } from "@/components/stats/WeeklySubmissionsChart";
import { ChapterProgressChart } from "@/components/stats/ChapterProgressChart";
import { SubmissionBreakdown } from "@/components/stats/SubmissionBreakdown";
import { WeeklyGoalChart } from "@/components/stats/WeeklyGoalChart";
import { EngagementStrip } from "@/components/stats/EngagementStrip";
import { ActivityHeatmap } from "@/components/dashboard/ActivityHeatmap";
import { Flame, Clock } from "lucide-react";

function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

interface StatsPageProps {
  stats: StatsResponse;
}

export function StatsPage({ stats }: StatsPageProps) {
  const lessonPercent = stats.totalLessons > 0
    ? Math.round((stats.lessonsCompleted / stats.totalLessons) * 100)
    : 0;

  return (
    <div className="mx-auto w-full max-w-[800px] px-6 py-8">
      <h1 className="mb-6 text-lg font-semibold">Stats</h1>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Row 1: Four stat cards */}
        <StatNumberCard
          label="Lessons Completed"
          value={`${stats.lessonsCompleted} / ${stats.totalLessons}`}
          subtitle={`${lessonPercent}% complete · ${stats.lessonsCompletedThisWeek} this week`}
          progress={{ value: stats.lessonsCompleted, max: stats.totalLessons }}
        />
        <SuccessRadial rate={stats.successRate} />
        <StatNumberCard
          label="Streak"
          value={stats.streakDays}
          subtitle={stats.streakDays === 1 ? "day" : "days"}
          icon={<Flame className="h-4 w-4 text-orange-500" />}
        />
        <StatNumberCard
          label="Time Spent"
          value={formatTime(stats.totalTimeMinutes)}
          subtitle="estimated"
          icon={<Clock className="h-4 w-4 text-muted-foreground" />}
        />

        {/* Row 2: Two wide charts */}
        <div className="sm:col-span-2">
          <WeeklySubmissionsChart data={stats.weeklySubmissions} />
        </div>
        <div className="sm:col-span-2">
          <ChapterProgressChart data={stats.chapterProgress} />
        </div>

        {/* Row 3: Two small + one wide */}
        <SubmissionBreakdown
          passed={stats.passedSubmissions}
          failed={stats.failedSubmissions}
          compileErrors={stats.compileErrors}
        />
        <StatNumberCard
          label="Total Runs"
          value={stats.totalRuns}
          subtitle="code executions"
        />
        <div className="sm:col-span-2">
          <ActivityHeatmap activityData={stats.activityData} />
        </div>

        {/* Row 4: One wide + two small */}
        <div className="sm:col-span-2">
          <WeeklyGoalChart activityData={stats.activityData} weeklyGoal={stats.weeklyGoal} />
        </div>
        <div className="sm:col-span-2">
          <EngagementStrip
            tutorConversations={stats.tutorConversations}
            tutorMessages={stats.tutorMessages}
            notesWritten={stats.notesWritten}
          />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/stats/StatsPage.tsx
git commit -m "feat(stats): add StatsPage bento grid client component"
```

---

### Task 11: Stats Server Page + Loading Skeleton

**Files:**
- Modify: `app/(app)/stats/page.tsx`
- Create: `app/(app)/stats/loading.tsx`

- [ ] **Step 1: Replace the redirect page with the server component**

Replace the entire contents of `app/(app)/stats/page.tsx` with:

```tsx
// app/(app)/stats/page.tsx
import { requireServerSession } from "@/lib/auth/require-auth";
import { StatsPage } from "@/components/stats/StatsPage";
import type { StatsResponse } from "@/lib/stats/types";

export const dynamic = "force-dynamic";

export default async function StatsRoute() {
  const { supabase, userId } = await requireServerSession();

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { data: { session } } = await supabase.auth.getSession();

  const res = await fetch(`${baseUrl}/api/stats`, {
    headers: {
      Cookie: `sb-access-token=${session?.access_token}; sb-refresh-token=${session?.refresh_token}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch stats");
  }

  const stats: StatsResponse = await res.json();

  return <StatsPage stats={stats} />;
}
```

**Important note for the implementer:** The fetch-to-own-API pattern above is used because the aggregation logic lives in the route handler. However, if the server component can import `createServerClient` and run the same queries directly, that avoids the self-fetch. The preferred approach is to **extract the aggregation logic into a shared function** in `lib/stats/aggregate.ts` and call it from both the route handler and the server page. If you go that route:

- Create `lib/stats/aggregate.ts` with a `fetchStats(supabase, userId)` function containing the query + aggregation logic from Task 2
- The route handler calls `fetchStats` and returns the JSON
- The server page calls `fetchStats` directly, skipping the HTTP round-trip

Either approach works. The self-fetch is simpler to implement; the shared function is cleaner.

- [ ] **Step 2: Create the loading skeleton**

```tsx
// app/(app)/stats/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function StatsLoading() {
  return (
    <div className="mx-auto w-full max-w-[800px] px-6 py-8">
      <Skeleton className="mb-6 h-7 w-16" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Row 1: Four 1x1 cards */}
        <Skeleton className="h-[120px] rounded-xl" />
        <Skeleton className="h-[120px] rounded-xl" />
        <Skeleton className="h-[120px] rounded-xl" />
        <Skeleton className="h-[120px] rounded-xl" />

        {/* Row 2: Two 2x1 charts */}
        <Skeleton className="h-[280px] rounded-xl sm:col-span-2" />
        <Skeleton className="h-[280px] rounded-xl sm:col-span-2" />

        {/* Row 3: Two 1x1 + one 2x1 */}
        <Skeleton className="h-[200px] rounded-xl" />
        <Skeleton className="h-[200px] rounded-xl" />
        <Skeleton className="h-[200px] rounded-xl sm:col-span-2" />

        {/* Row 4: One 2x1 + one 2x1 */}
        <Skeleton className="h-[280px] rounded-xl sm:col-span-2" />
        <Skeleton className="h-[280px] rounded-xl sm:col-span-2" />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify the build compiles**

Run: `npm run build`
Expected: No build errors

- [ ] **Step 4: Commit**

```bash
git add app/(app)/stats/page.tsx app/(app)/stats/loading.tsx
git commit -m "feat(stats): wire up stats server page and loading skeleton"
```

---

### Task 12: Visual QA + Polish

**Files:**
- May modify any `components/stats/*.tsx` file

- [ ] **Step 1: Start the dev server and navigate to /stats**

Run: `npm run dev`
Navigate to: `http://localhost:3000/stats`

- [ ] **Step 2: Check each card renders with data (or zero-states)**

Verify:
- All 10 cards render without console errors
- Charts show proper axes, labels, tooltips on hover
- Radial chart shows correct percentage
- Donut chart shows center label
- Activity heatmap renders correctly
- Chapter progress scrolls if there are many chapters
- Responsive: resize to tablet (2-col) and mobile (1-col) widths

- [ ] **Step 3: Check loading state**

Hard-refresh `/stats` and verify the skeleton grid displays while data loads.

- [ ] **Step 4: Fix any visual issues found**

Adjust spacing, font sizes, chart dimensions, or colors as needed.

- [ ] **Step 5: Run lint and type check**

Run: `npm run lint && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "feat(stats): visual polish and QA fixes"
```

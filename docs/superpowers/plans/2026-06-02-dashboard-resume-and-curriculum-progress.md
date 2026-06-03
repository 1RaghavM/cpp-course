# Dashboard Resume Hero & Curriculum Progress Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Continue/Resume hero card and a curriculum-progress-by-chapter section to the dashboard, giving users a clear "what to do next" CTA and a "where am I in the whole course" overview.

**Architecture:** Both components are client components receiving pre-computed props from the existing server page (`app/dashboard/page.tsx`). The page already fetches all necessary data (lessons, progress, stats). We add derived computations in the page, then render `ResumeHeroCard` above the stat row and `CurriculumProgressCard` between the stat row and the heatmap. No new DB queries, API routes, or lib files.

**Tech Stack:** Next.js 14 App Router, TypeScript strict mode, shadcn/ui (Card, Button, Badge, Progress, Accordion, Chart), Recharts (RadialBarChart), Tailwind CSS.

**Spec:** `docs/superpowers/specs/2026-06-02-dashboard-resume-and-curriculum-progress-design.md`

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `components/dashboard/ResumeHeroCard.tsx` | Client component — resume/start/complete hero card |
| Create | `components/dashboard/CurriculumProgressCard.tsx` | Client component — stage accordion + radial donut |
| Modify | `app/dashboard/page.tsx` | Compute derived props, render both new components |

---

### Task 1: Create ResumeHeroCard component

**Files:**
- Create: `components/dashboard/ResumeHeroCard.tsx`

- [ ] **Step 1: Create ResumeHeroCard.tsx**

Create `components/dashboard/ResumeHeroCard.tsx` with the following content:

```tsx
"use client"

import Link from "next/link"
import { ArrowRightIcon, BookOpenIcon, CheckCircle2Icon, RocketIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress"

interface ResumeHeroCardProps {
  resumeLesson: { title: string; slug: string }
  moduleName: string
  lessonPosition: number
  moduleLessonCount: number
  moduleCompletedCount: number
  variant: "start" | "resume" | "complete"
}

const VARIANT_CONFIG = {
  start: {
    icon: RocketIcon,
    headline: "Start your C++ journey",
    buttonLabel: "Start Learning",
  },
  resume: {
    icon: BookOpenIcon,
    headline: "Pick up where you left off",
    buttonLabel: "Continue",
  },
  complete: {
    icon: CheckCircle2Icon,
    headline: "Curriculum complete!",
    buttonLabel: "Review",
  },
} as const

export function ResumeHeroCard({
  resumeLesson,
  moduleName,
  lessonPosition,
  moduleLessonCount,
  moduleCompletedCount,
  variant,
}: ResumeHeroCardProps) {
  const config = VARIANT_CONFIG[variant]
  const Icon = config.icon
  const modulePercent =
    moduleLessonCount > 0
      ? Math.round((moduleCompletedCount / moduleLessonCount) * 100)
      : 0

  return (
    <Card className="bg-linear-to-r from-primary/5 to-card shadow-xs">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Icon className="size-5 text-primary" />
          <CardTitle className="text-lg font-semibold">
            {config.headline}
          </CardTitle>
        </div>
        <CardDescription className="text-base">
          {variant === "start" && (
            <>
              Begin with <span className="font-medium text-foreground">{resumeLesson.title}</span> in {moduleName}
            </>
          )}
          {variant === "resume" && (
            <span className="font-medium text-foreground">{resumeLesson.title}</span>
          )}
          {variant === "complete" && (
            <>You've completed the entire C++ curriculum. Revisit any lesson to reinforce your knowledge.</>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {variant === "resume" && (
          <>
            <div className="flex items-center gap-2">
              <Badge variant="outline" noAnimate>
                {moduleName} &middot; Lesson {lessonPosition} of {moduleLessonCount}
              </Badge>
            </div>
            <Progress value={modulePercent}>
              <ProgressLabel>Module progress</ProgressLabel>
              <ProgressValue>{modulePercent}%</ProgressValue>
            </Progress>
          </>
        )}
        <div>
          <Button render={<Link href={`/dashboard/lessons/${resumeLesson.slug}`} />} size="lg">
            {config.buttonLabel}
            <ArrowRightIcon data-icon="inline-end" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Verify the file compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | grep -i "ResumeHeroCard" | head -10`
Expected: No errors referencing `ResumeHeroCard.tsx`

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/ResumeHeroCard.tsx
git commit -m "feat(dashboard): add ResumeHeroCard component"
```

---

### Task 2: Create CurriculumProgressCard component

**Files:**
- Create: `components/dashboard/CurriculumProgressCard.tsx`

- [ ] **Step 1: Create CurriculumProgressCard.tsx**

Create `components/dashboard/CurriculumProgressCard.tsx` with the following content:

```tsx
"use client"

import { useMemo } from "react"
import {
  Label,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
} from "recharts"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress"
import { ChartContainer, type ChartConfig } from "@/components/ui/chart"
import { STAGES } from "@/lib/dashboard/curriculum"
import type { Module, Stage } from "@/lib/dashboard/types"

interface CurriculumProgressCardProps {
  curriculum: Module[]
  progressMap: Record<string, string>
  totalCompleted: number
  totalLessons: number
}

interface ModuleStats {
  module: Module
  completed: number
  total: number
}

interface StageStats {
  id: Stage
  title: string
  completed: number
  total: number
  status: "active" | "completed" | "locked"
  modules: ModuleStats[]
}

const chartConfig = {
  completed: {
    label: "Completed",
    color: "var(--primary)",
  },
} satisfies ChartConfig

function computeStageStats(
  curriculum: Module[],
  progressMap: Record<string, string>,
): StageStats[] {
  let foundActive = false

  return STAGES.map((stage) => {
    const stageModules = curriculum.filter((m) => m.stage === stage.id)
    const modules: ModuleStats[] = stageModules.map((mod) => {
      const completed = mod.lessons.filter((l) => {
        const s = progressMap[l.id]
        return s === "completed" || s === "skipped"
      }).length
      return { module: mod, completed, total: mod.lessons.length }
    })

    const completed = modules.reduce((sum, m) => sum + m.completed, 0)
    const total = modules.reduce((sum, m) => sum + m.total, 0)

    let status: StageStats["status"]
    if (completed === total && total > 0) {
      status = "completed"
    } else if (!foundActive && completed < total) {
      status = "active"
      foundActive = true
    } else {
      status = "locked"
    }

    return { id: stage.id, title: stage.title, completed, total, status, modules }
  })
}

export function CurriculumProgressCard({
  curriculum,
  progressMap,
  totalCompleted,
  totalLessons,
}: CurriculumProgressCardProps) {
  const stageStats = useMemo(
    () => computeStageStats(curriculum, progressMap),
    [curriculum, progressMap],
  )

  const activeStageId = stageStats.find((s) => s.status === "active")?.id
  const completionPercent =
    totalLessons > 0 ? Math.round((totalCompleted / totalLessons) * 100) : 0
  const endAngle = totalLessons > 0 ? (totalCompleted / totalLessons) * 360 : 0

  const chartData = [
    { name: "completed", value: totalCompleted, fill: "var(--color-completed)" },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Curriculum Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-[1fr_auto]">
          {/* Left: Stage Accordion */}
          <Accordion
            multiple
            defaultValue={activeStageId ? [activeStageId] : []}
          >
            {stageStats.map((stage) => (
              <AccordionItem key={stage.id} value={stage.id}>
                <AccordionTrigger className="gap-3">
                  <div className="flex flex-1 items-center justify-between pr-2">
                    <span>{stage.title}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground tabular-nums">
                        {stage.completed} / {stage.total}
                      </span>
                      <Badge
                        variant={
                          stage.status === "completed"
                            ? "outline"
                            : stage.status === "active"
                              ? "default"
                              : "secondary"
                        }
                        noAnimate
                      >
                        {stage.status === "completed"
                          ? "Completed"
                          : stage.status === "active"
                            ? "Active"
                            : "Locked"}
                      </Badge>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-col gap-3 pb-2">
                    {stage.modules.map((ms) => {
                      const pct =
                        ms.total > 0
                          ? Math.round((ms.completed / ms.total) * 100)
                          : 0
                      return (
                        <Progress key={ms.module.id} value={pct}>
                          <ProgressLabel>{ms.module.title}</ProgressLabel>
                          <ProgressValue>
                            {ms.completed} / {ms.total}
                          </ProgressValue>
                        </Progress>
                      )
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {/* Right: Radial Donut */}
          <div className="flex flex-col items-center justify-center gap-2">
            <ChartContainer
              config={chartConfig}
              className="mx-auto aspect-square max-h-[200px]"
            >
              <RadialBarChart
                data={chartData}
                startAngle={0}
                endAngle={endAngle}
                innerRadius={70}
                outerRadius={85}
              >
                <PolarGrid
                  gridType="circle"
                  radialLines={false}
                  stroke="none"
                  className="first:fill-muted last:fill-background"
                  polarRadius={[85, 70]}
                />
                <RadialBar dataKey="value" background cornerRadius={10} />
                <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                        return (
                          <text
                            x={viewBox.cx}
                            y={viewBox.cy}
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            <tspan
                              x={viewBox.cx}
                              y={viewBox.cy}
                              className="fill-foreground text-4xl font-bold"
                            >
                              {completionPercent}%
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy || 0) + 24}
                              className="fill-muted-foreground"
                            >
                              completed
                            </tspan>
                          </text>
                        )
                      }
                    }}
                  />
                </PolarRadiusAxis>
              </RadialBarChart>
            </ChartContainer>
            <p className="text-sm text-muted-foreground tabular-nums">
              {totalCompleted} of {totalLessons} lessons
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Verify the file compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | grep -i "CurriculumProgressCard" | head -10`
Expected: No errors referencing `CurriculumProgressCard.tsx`

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/CurriculumProgressCard.tsx
git commit -m "feat(dashboard): add CurriculumProgressCard component"
```

---

### Task 3: Wire both components into the dashboard page

**Files:**
- Modify: `app/dashboard/page.tsx`

- [ ] **Step 1: Add imports at the top of `app/dashboard/page.tsx`**

Add these imports after the existing ones (after line 6):

```tsx
import { ResumeHeroCard } from "@/components/dashboard/ResumeHeroCard"
import { CurriculumProgressCard } from "@/components/dashboard/CurriculumProgressCard"
import { computeResumeTarget, computeResumeVariant } from "@/lib/dashboard/resume"
import type { LessonStatus, DashboardProgress } from "@/lib/dashboard/types"
```

Note: `computeStreakDays` and `computeWeeklyCompleted` are already imported. `computeResumeTarget` and `computeResumeVariant` are new imports from the same module.

- [ ] **Step 2: Build derived data after existing computations**

After the `activityData` loop (after line 89 in the current file), add the following code to compute resume props:

```tsx
  // Build progress structures for resume computation
  const progressMap: Record<string, string> = {}
  for (const row of progressRows) {
    progressMap[row.lesson_id] = row.state
  }

  let lastActiveLessonId: string | null = null
  let latestTime = ""
  for (const row of progressRows) {
    if (row.state === "in_progress" && row.last_visit_at && row.last_visit_at > latestTime) {
      latestTime = row.last_visit_at
      lastActiveLessonId = row.lesson_id
    }
  }

  const resumeProgress: DashboardProgress = {
    lessonProgress: Object.fromEntries(
      progressRows.map((r) => [
        r.lesson_id,
        { status: r.state as LessonStatus, lastVisitAt: r.last_visit_at ?? "" },
      ])
    ),
    streakDays,
    lastActiveDate: null,
    weeklyGoal,
    totalLessonsCompleted: totalCompleted,
    lessonsCompletedThisWeek,
  }
  const resumeTarget = computeResumeTarget(curriculum, resumeProgress, lastActiveLessonId)
  const resumeVariant = computeResumeVariant(curriculum, resumeProgress)

  const resumeModule = curriculum.find((m) => m.id === resumeTarget.moduleId)!
  const moduleName = resumeModule.title
  const sortedModuleLessons = [...resumeModule.lessons].sort((a, b) => a.order - b.order)
  const lessonPosition = sortedModuleLessons.findIndex((l) => l.id === resumeTarget.id) + 1
  const moduleLessonCount = resumeModule.lessons.length
  const moduleCompletedCount = resumeModule.lessons.filter((l) => {
    const s = progressMap[l.id]
    return s === "completed" || s === "skipped"
  }).length
```

- [ ] **Step 3: Update the JSX return**

Replace the current return block (lines 91-105) with:

```tsx
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <ResumeHeroCard
          resumeLesson={{ title: resumeTarget.title, slug: resumeTarget.slug }}
          moduleName={moduleName}
          lessonPosition={lessonPosition}
          moduleLessonCount={moduleLessonCount}
          moduleCompletedCount={moduleCompletedCount}
          variant={resumeVariant}
        />
      </div>
      <SectionCards
        totalLessons={allLessons.length}
        totalCompleted={totalCompleted}
        inProgressCount={inProgressCount}
        streakDays={streakDays}
        lessonsCompletedThisWeek={lessonsCompletedThisWeek}
        weeklyGoal={weeklyGoal}
      />
      <div className="px-4 lg:px-6">
        <CurriculumProgressCard
          curriculum={curriculum}
          progressMap={progressMap}
          totalCompleted={totalCompleted}
          totalLessons={allLessons.length}
        />
      </div>
      <div className="px-4 lg:px-6">
        <StatsHeatmap activityData={activityData} />
      </div>
    </div>
  )
```

- [ ] **Step 4: Verify the full page compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No type errors

- [ ] **Step 5: Run lint**

Run: `npm run lint 2>&1 | tail -20`
Expected: No new errors

- [ ] **Step 6: Commit**

```bash
git add app/dashboard/page.tsx
git commit -m "feat(dashboard): wire ResumeHeroCard and CurriculumProgressCard into dashboard"
```

---

### Task 4: Visual verification

- [ ] **Step 1: Start dev server**

Run: `npm run dev`

- [ ] **Step 2: Test the dashboard in a browser**

Open `http://localhost:3000/dashboard` and verify:

1. **Resume Hero Card** appears above the stat row
   - For a user with no progress: shows "Start your C++ journey" with "Start Learning" button
   - For a user with progress: shows "Pick up where you left off" with lesson title, module badge, progress bar, and "Continue" button
   - Button links to the correct lesson page (`/dashboard/lessons/{slug}`)
2. **Stat Cards** row unchanged — still shows 4 cards
3. **Curriculum Progress Card** appears between stats and heatmap
   - Shows 4 stage accordions; active stage is expanded by default
   - Each stage shows correct X/Y count and status badge
   - Expanding a stage reveals module rows with progress bars
   - Radial donut on the right shows correct completion percentage
4. **Activity Heatmap** still renders below the progress card
5. **Responsive**: on mobile viewport, the donut stacks below the accordion
6. **Dark mode**: both cards render correctly in dark theme

- [ ] **Step 3: Final commit if any adjustments needed**

```bash
git add -A
git commit -m "fix(dashboard): visual adjustments from manual testing"
```

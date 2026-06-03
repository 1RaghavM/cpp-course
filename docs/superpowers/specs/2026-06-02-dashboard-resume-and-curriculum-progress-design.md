# Dashboard: Resume Hero Card & Curriculum Progress

**Date:** 2026-06-02
**Status:** Approved

## Overview

Two new sections added to the dashboard page, above and below the existing stat card row:

```
[ Resume Hero Card — full width                                ]
[ Stat Card ][ Stat Card ][ Stat Card ][ Stat Card             ]
[ Curriculum Progress (accordion + radial donut) — full width  ]
[ Activity Heatmap — full width                                ]
```

No new DB queries or API routes. All data is already fetched in `app/dashboard/page.tsx`.

---

## 1. Resume Hero Card

**File:** `components/dashboard/ResumeHeroCard.tsx` (client component)

### Props

| Prop | Type | Source |
|---|---|---|
| `resumeLesson` | `{ title: string; slug: string; moduleId: string }` | `computeResumeTarget()` |
| `moduleName` | `string` | looked up from `curriculum` by `moduleId` |
| `lessonPosition` | `number` | 1-based index of lesson within its module |
| `moduleLessonCount` | `number` | total lessons in the module |
| `variant` | `"start" \| "resume" \| "complete"` | `computeResumeVariant()` |

### Variant rendering

| Variant | Headline | Subtext | Button | Link |
|---|---|---|---|---|
| `start` | "Start your C++ journey" | "Begin with {lesson title} in {module name}" | "Start Learning" | `/dashboard/lessons/{slug}` |
| `resume` | "Pick up where you left off" | "{lesson title}" | "Continue" | `/dashboard/lessons/{slug}` |
| `complete` | "Curriculum complete!" | Encouraging review message | "Review" | `/dashboard/lessons/{slug}` |

### UI details

- Full width, wrapped in `px-4 lg:px-6` like the stat row
- Uses: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `Button` (as `Link`), `Badge`, `Progress`
- `resume` variant shows a Badge: "{module name} -- Lesson {position} of {count}"
- `resume` variant shows a thin Progress bar for module completion (completed lessons in that module / total)
- Module completion count derived from `progressMap` (same map passed to `CurriculumProgressCard`) intersected with the module's lessons

---

## 2. Curriculum Progress Card

**File:** `components/dashboard/CurriculumProgressCard.tsx` (client component)

### Props

| Prop | Type | Source |
|---|---|---|
| `curriculum` | `Module[]` | `buildCurriculum()` result |
| `progressMap` | `Record<string, string>` | lesson_id to status (`"completed"`, `"skipped"`, `"in_progress"`, or absent) |
| `totalCompleted` | `number` | pre-computed in page |
| `totalLessons` | `number` | `allLessons.length` |

### Layout

Two-column Card on desktop (`md:grid-cols-[1fr_auto]`), stacks vertically on mobile.

### Left column: Stage Accordion

- `Accordion` with `type="multiple"`, active stage defaultOpen
- 4 `AccordionItem`s, one per stage (Basics, Memory & OOP, STL & Templates, Advanced)
- Each trigger row:
  - Stage title (left)
  - Aggregate "X / Y completed" count (right)
  - `Badge` for status: "Active" (default), "Completed" (outline), "Locked" (secondary)
- Stage status derived from: all lessons completed = "Completed"; contains the resume target module = "Active"; otherwise "Locked"
- Each accordion content: list of module rows for that stage
  - Module title
  - `Progress` bar with `ProgressLabel` (module title) and `ProgressValue` ("X / Y")
  - Bar fills proportionally: completed lessons in module / total lessons in module

### Right column: Radial Donut

- `RadialBarChart` using shadcn `chart-radial-text` pattern
- Single arc: `(totalCompleted / totalLessons) * 360` degrees
- Center label: percentage as large bold text, "completed" as subtext below
- Below chart: "{totalCompleted} of {totalLessons} lessons" in muted text
- Sized: `max-h-[200px]`, aspect-square, vertically centered

### Computation (all internal to the component)

- Per-module: filter `curriculum` module's lessons, count those whose `progressMap[id]` is `"completed"` or `"skipped"`
- Per-stage: sum module counts for modules with matching `stage`
- Active stage: the stage containing the first module with an incomplete lesson (mirrors `computeResumeTarget` logic)

---

## 3. Data flow changes in `app/dashboard/page.tsx`

The page already fetches `curriculum`, `progressRows`, `allLessons`, and computes `totalCompleted`. Additional work:

1. Build `progressMap: Record<string, string>` from `progressRows` (lesson_id -> state)
2. Compute `resumeTarget` using existing `computeResumeTarget()` (currently only in layout — reuse here)
3. Compute `resumeVariant` using existing `computeResumeVariant()`
4. Look up `moduleName`, `lessonPosition`, `moduleLessonCount` from `curriculum` + `resumeTarget.moduleId`
5. Pass props to both new components

No new DB queries, no new API routes, no new lib files needed.

---

## 4. Existing components used (all already installed)

- `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`
- `Button`
- `Badge`
- `Progress`, `ProgressLabel`, `ProgressValue`
- `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent`
- `ChartContainer` + Recharts `RadialBarChart`, `RadialBar`, `PolarGrid`, `PolarRadiusAxis`, `Label`

# Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the existing chapter-based roadmap with a resume-first dashboard that collapses "what do I do now?" into one click.

**Architecture:** Static curriculum mapping (chapters → modules → stages) in code, pure business-logic functions for resume/progress computation, server component data fetching, client component rendering. New `user_stats` DB table for streak tracking. TopBar replaces AppHeader globally.

**Tech Stack:** Next.js 14 App Router, TypeScript (strict), Supabase Postgres + RLS, Tailwind CSS, Vitest for unit tests.

**Design spec:** `docs/superpowers/specs/2026-05-31-dashboard-design.md`

---

## File Map

| File | Purpose |
|---|---|
| `infra/supabase/migrations/007_user_stats.sql` | New `user_stats` table + `last_code_snippet` column on `progress` |
| `lib/supabase/types.ts` | Add `user_stats` table type, `last_code_snippet` on progress |
| `lib/dashboard/types.ts` | `Stage`, `Module`, `Lesson`, `LessonStatus`, `DashboardProgress`, `StageStatus` |
| `lib/dashboard/curriculum.ts` | `CURRICULUM`, `buildCurriculum()`, `flattenLessons()` |
| `lib/dashboard/resume.ts` | Pure functions: `computeResumeTarget`, `computeResumeVariant`, `computePathPercent`, `computeStageProgress`, `isPathComplete`, `computeStreakDays`, `computeWeeklyCompleted` |
| `lib/dashboard/analytics.ts` | Typed analytics event functions |
| `__tests__/dashboard/curriculum.test.ts` | Unit tests for curriculum mapping |
| `__tests__/dashboard/resume.test.ts` | Unit tests for resume logic |
| `components/dashboard/StageCard.tsx` | Individual stage card (done/active/locked) |
| `components/dashboard/StatCard.tsx` | Individual stat display |
| `components/dashboard/ResumeCard.tsx` | Hero resume/start/complete card |
| `components/dashboard/PathMap.tsx` | 4-stage grid with StageCards |
| `components/dashboard/StatsStrip.tsx` | 3-stat row with StatCards |
| `components/dashboard/Dashboard.tsx` | Client layout orchestrator |
| `components/layout/TopBar.tsx` | Global header replacing AppHeader |
| `app/(app)/dashboard/loading.tsx` | Streaming skeleton |
| `app/(app)/dashboard/page.tsx` | Server component: fetch + assemble + render |
| `app/(app)/layout.tsx` | Extended query for TopBar data |
| `components/layout/AppShell.tsx` | Render TopBar instead of AppHeader |
| `app/api/progress/[lesson_id]/route.ts` | Add streak update logic |
| `app/api/submissions/route.ts` | Write `last_code_snippet` |
| `app/api/onboarding/route.ts` | Create `user_stats` row on onboarding sync |

---

## Task 1: Database migration + types

**Files:**
- Create: `infra/supabase/migrations/007_user_stats.sql`
- Modify: `lib/supabase/types.ts`

- [ ] **Step 1: Write the migration SQL**

Create `infra/supabase/migrations/007_user_stats.sql`:

```sql
-- 007_user_stats.sql — Dashboard stats + code snippet tracking

CREATE TABLE user_stats (
    user_id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    streak_days      INT NOT NULL DEFAULT 0,
    last_active_date DATE,
    weekly_goal      INT,
    updated_at       TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own stats" ON user_stats
    FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "users insert own stats" ON user_stats
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "users update own stats" ON user_stats
    FOR UPDATE TO authenticated USING (user_id = auth.uid());

ALTER TABLE progress ADD COLUMN IF NOT EXISTS last_code_snippet TEXT;
```

- [ ] **Step 2: Add TypeScript types for user_stats and last_code_snippet**

In `lib/supabase/types.ts`, add the `user_stats` table definition inside `Database.public.Tables` (after the `onboarding` table entry):

```ts
user_stats: {
  Row: {
    user_id: string;
    streak_days: number;
    last_active_date: string | null;
    weekly_goal: number | null;
    updated_at: string;
  };
  Insert: {
    user_id: string;
    streak_days?: number;
    last_active_date?: string | null;
    weekly_goal?: number | null;
    updated_at?: string;
  };
  Update: {
    user_id?: string;
    streak_days?: number;
    last_active_date?: string | null;
    weekly_goal?: number | null;
    updated_at?: string;
  };
  Relationships: [];
};
```

Add the convenience alias at the bottom with the other aliases:

```ts
export type UserStats = Database["public"]["Tables"]["user_stats"]["Row"];
```

Add `last_code_snippet: string | null;` to the `progress` table's `Row`, `Insert` (optional), and `Update` (optional) types.

- [ ] **Step 3: Apply migration locally**

Run: `npx supabase db push`

Expected: Migration applies cleanly, `user_stats` table exists, `progress.last_code_snippet` column exists.

- [ ] **Step 4: Commit**

```bash
git add infra/supabase/migrations/007_user_stats.sql lib/supabase/types.ts
git commit -m "feat(dashboard): add user_stats table and last_code_snippet column"
```

---

## Task 2: Dashboard types

**Files:**
- Create: `lib/dashboard/types.ts`

- [ ] **Step 1: Create the types file**

Create `lib/dashboard/types.ts`:

```ts
import type { ModuleId } from "@/lib/onboarding/types";

export type Stage = "basics" | "memory-oop" | "stl-templates" | "advanced";

export type LessonStatus = "not_started" | "in_progress" | "completed" | "skipped";

export type StageStatus = "done" | "active" | "locked";

export type ResumeVariant = "resume" | "start" | "complete";

export interface Lesson {
  id: string;
  moduleId: ModuleId;
  title: string;
  slug: string;
  order: number;
}

export interface Module {
  id: ModuleId;
  stage: Stage;
  title: string;
  order: number;
  lessons: Lesson[];
}

export interface LessonProgressEntry {
  status: LessonStatus;
  lastCodeSnippet?: string;
  lastVisitAt: string;
}

export interface DashboardProgress {
  lessonProgress: Map<string, LessonProgressEntry>;
  streakDays: number;
  lastActiveDate: string | null;
  weeklyGoal: number | null;
  totalLessonsCompleted: number;
  lessonsCompletedThisWeek: number;
}

export interface StageProgressResult {
  completed: number;
  total: number;
  status: StageStatus;
}

export interface ModuleDefinition {
  id: ModuleId;
  stage: Stage;
  title: string;
  order: number;
  chapterIds: number[];
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit lib/dashboard/types.ts 2>&1 || npx tsc --noEmit`

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add lib/dashboard/types.ts
git commit -m "feat(dashboard): add dashboard type definitions"
```

---

## Task 3: Static curriculum mapping

**Files:**
- Create: `lib/dashboard/curriculum.ts`
- Test: `__tests__/dashboard/curriculum.test.ts`

- [ ] **Step 1: Write curriculum tests**

Create `__tests__/dashboard/curriculum.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { CURRICULUM, buildCurriculum, flattenLessons } from "@/lib/dashboard/curriculum";
import type { ModuleDefinition } from "@/lib/dashboard/types";

const FAKE_LESSONS = CURRICULUM.flatMap((mod) =>
  mod.chapterIds.flatMap((chId, chIdx) =>
    Array.from({ length: 3 }, (_, i) => ({
      id: `${mod.id}-${chId}-${i}`,
      chapter_id: chId,
      slug: `${mod.id}-${chId}-${i}`,
      learncpp_title: `Lesson ${i}`,
      my_title: null,
      sort_order: mod.order * 1000 + chIdx * 100 + i,
    }))
  )
);

describe("CURRICULUM", () => {
  it("has 16 modules", () => {
    expect(CURRICULUM).toHaveLength(16);
  });

  it("covers all four stages", () => {
    const stages = new Set(CURRICULUM.map((m) => m.stage));
    expect(stages).toEqual(new Set(["basics", "memory-oop", "stl-templates", "advanced"]));
  });

  it("has unique module orders", () => {
    const orders = CURRICULUM.map((m) => m.order);
    expect(new Set(orders).size).toBe(orders.length);
  });

  it("has no duplicate chapter IDs across modules", () => {
    const allChapterIds = CURRICULUM.flatMap((m) => m.chapterIds);
    expect(new Set(allChapterIds).size).toBe(allChapterIds.length);
  });
});

describe("buildCurriculum", () => {
  const modules = buildCurriculum(FAKE_LESSONS);

  it("produces 16 modules", () => {
    expect(modules).toHaveLength(16);
  });

  it("assigns every lesson to exactly one module", () => {
    const allLessonIds = modules.flatMap((m) => m.lessons.map((l) => l.id));
    expect(new Set(allLessonIds).size).toBe(allLessonIds.length);
    expect(allLessonIds.length).toBe(FAKE_LESSONS.length);
  });

  it("preserves module order", () => {
    const orders = modules.map((m) => m.order);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });

  it("sets correct moduleId on each lesson", () => {
    for (const mod of modules) {
      for (const lesson of mod.lessons) {
        expect(lesson.moduleId).toBe(mod.id);
      }
    }
  });
});

describe("flattenLessons", () => {
  const modules = buildCurriculum(FAKE_LESSONS);
  const flat = flattenLessons(modules);

  it("returns all lessons", () => {
    const totalLessons = modules.reduce((sum, m) => sum + m.lessons.length, 0);
    expect(flat).toHaveLength(totalLessons);
  });

  it("is ordered by module order then lesson order", () => {
    for (let i = 1; i < flat.length; i++) {
      const prev = flat[i - 1]!;
      const curr = flat[i]!;
      const prevMod = modules.find((m) => m.id === prev.moduleId)!;
      const currMod = modules.find((m) => m.id === curr.moduleId)!;
      if (prevMod.order === currMod.order) {
        expect(prev.order).toBeLessThanOrEqual(curr.order);
      } else {
        expect(prevMod.order).toBeLessThan(currMod.order);
      }
    }
  });
});
```

- [ ] **Step 2: Install vitest (if not already installed)**

Run: `npm ls vitest 2>/dev/null || npm install -D vitest`

If vitest was not already installed, create `vitest.config.ts` at the project root:

```ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
```

Add to `package.json` scripts: `"test": "vitest run"`, `"test:watch": "vitest"`.

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run __tests__/dashboard/curriculum.test.ts`

Expected: FAIL — module `@/lib/dashboard/curriculum` not found.

- [ ] **Step 4: Write the curriculum mapping**

Create `lib/dashboard/curriculum.ts`:

```ts
import type { ModuleId } from "@/lib/onboarding/types";
import type { ModuleDefinition, Module, Lesson, Stage } from "@/lib/dashboard/types";

// Static mapping: each module maps to one or more chapter IDs (chapters.id = chapters.sort_order).
// Chapter IDs from curriculum_seed.json sort_order:
//   0: Intro/Getting Started          1: C++ Basics
//   2: Functions and Files            3: Debugging
//   4: Fundamental Data Types         5: Constants and Strings
//   6: Operators                      7: Bit Manipulation (optional)
//   8: Scope/Duration/Linkage         9: Control Flow
//  10: Error Detection/Handling      11: Type Conversion/Aliases/Deduction
//  12: Function Overloading/Templates 13: Constexpr functions
//  14: References and Pointers       15: Enums and Structs
//  16: Intro to Classes              17: More on Classes
//  18: std::vector                   19: std::array and C-style arrays
//  20: Iterators and Algorithms      21: Dynamic Allocation
//  22: Functions (advanced)          23: Operator Overloading
//  24: Move Semantics/Smart Pointers 25: Object Relationships
//  26: Inheritance                   27: Virtual Functions
//  28: Templates and Classes         29: Exceptions
//  30: I/O                           31: Appendix A
//  32: Appendix B                    33: Appendix C

export const CURRICULUM: ModuleDefinition[] = [
  // Stage: basics
  { id: "variables",      stage: "basics",        title: "Variables & Types",          order: 1,  chapterIds: [0, 1, 4, 5] },
  { id: "control-flow",   stage: "basics",        title: "Control Flow",              order: 2,  chapterIds: [9, 10] },
  { id: "functions",      stage: "basics",        title: "Functions & Files",         order: 3,  chapterIds: [2, 8] },
  { id: "arrays-strings", stage: "basics",        title: "Arrays & Strings",          order: 4,  chapterIds: [19] },
  { id: "io-streams",     stage: "basics",        title: "I/O Streams",               order: 5,  chapterIds: [30] },
  { id: "operators",      stage: "basics",        title: "Operators & Types",         order: 6,  chapterIds: [3, 6, 7, 11] },
  // Stage: memory-oop
  { id: "pointers",       stage: "memory-oop",    title: "Pointers & References",     order: 7,  chapterIds: [14] },
  { id: "references",     stage: "memory-oop",    title: "Enums & Structs",           order: 8,  chapterIds: [15] },
  { id: "classes",        stage: "memory-oop",    title: "Classes & OOP",             order: 9,  chapterIds: [16, 17] },
  { id: "raii",           stage: "memory-oop",    title: "Scope & Dynamic Allocation", order: 10, chapterIds: [21, 22] },
  // Stage: stl-templates
  { id: "vectors-maps",   stage: "stl-templates", title: "Vectors & Containers",      order: 11, chapterIds: [18, 20] },
  { id: "algorithms",     stage: "stl-templates", title: "Overloading & Functions",   order: 12, chapterIds: [12, 13, 23] },
  { id: "templates",      stage: "stl-templates", title: "Templates",                 order: 13, chapterIds: [28] },
  // Stage: advanced
  { id: "move-semantics", stage: "advanced",      title: "Move Semantics & Smart Ptrs", order: 14, chapterIds: [24] },
  { id: "smart-pointers", stage: "advanced",      title: "Inheritance & Polymorphism", order: 15, chapterIds: [25, 26, 27] },
  { id: "concurrency",    stage: "advanced",      title: "Exceptions & Advanced",     order: 16, chapterIds: [29, 31, 32, 33] },
];

const STAGE_ORDER: Record<Stage, number> = {
  basics: 0,
  "memory-oop": 1,
  "stl-templates": 2,
  advanced: 3,
};

export const STAGES: { id: Stage; title: string; order: number }[] = [
  { id: "basics", title: "Basics", order: 0 },
  { id: "memory-oop", title: "Memory & OOP", order: 1 },
  { id: "stl-templates", title: "STL & Templates", order: 2 },
  { id: "advanced", title: "Advanced", order: 3 },
];

interface DbLesson {
  id: string;
  chapter_id: number;
  slug: string;
  learncpp_title: string;
  my_title: string | null;
  sort_order: number;
}

export function buildCurriculum(dbLessons: DbLesson[]): Module[] {
  const lessonsByChapter = new Map<number, DbLesson[]>();
  for (const lesson of dbLessons) {
    const arr = lessonsByChapter.get(lesson.chapter_id) ?? [];
    arr.push(lesson);
    lessonsByChapter.set(lesson.chapter_id, arr);
  }

  return CURRICULUM.map((def) => {
    const lessons: Lesson[] = def.chapterIds
      .flatMap((chId) => lessonsByChapter.get(chId) ?? [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((db) => ({
        id: db.id,
        moduleId: def.id,
        title: db.my_title ?? db.learncpp_title,
        slug: db.slug,
        order: db.sort_order,
      }));

    return {
      id: def.id,
      stage: def.stage,
      title: def.title,
      order: def.order,
      lessons,
    };
  }).sort((a, b) => a.order - b.order);
}

export function flattenLessons(curriculum: Module[]): Lesson[] {
  return curriculum
    .sort((a, b) => a.order - b.order)
    .flatMap((m) => [...m.lessons].sort((a, b) => a.order - b.order));
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run __tests__/dashboard/curriculum.test.ts`

Expected: All tests PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/dashboard/curriculum.ts __tests__/dashboard/curriculum.test.ts vitest.config.ts
git commit -m "feat(dashboard): add static curriculum mapping with tests"
```

---

## Task 4: Pure resume logic

**Files:**
- Create: `lib/dashboard/resume.ts`
- Test: `__tests__/dashboard/resume.test.ts`

- [ ] **Step 1: Write resume logic tests**

Create `__tests__/dashboard/resume.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  computeResumeTarget,
  computeResumeVariant,
  computePathPercent,
  computeStageProgress,
  isPathComplete,
  computeStreakDays,
  computeWeeklyCompleted,
} from "@/lib/dashboard/resume";
import type { Module, Lesson, DashboardProgress, LessonProgressEntry } from "@/lib/dashboard/types";

// --- Test fixtures ---

function makeLessons(count: number, moduleId: string = "variables"): Lesson[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `lesson-${i}`,
    moduleId: moduleId as any,
    title: `Lesson ${i}`,
    slug: `lesson-${i}`,
    order: i,
  }));
}

function makeCurriculum(): Module[] {
  return [
    { id: "variables", stage: "basics", title: "Variables", order: 1, lessons: makeLessons(3, "variables") },
    { id: "control-flow", stage: "basics", title: "Control Flow", order: 2, lessons: makeLessons(2, "control-flow").map((l, i) => ({ ...l, id: `cf-${i}`, slug: `cf-${i}` })) },
    { id: "pointers", stage: "memory-oop", title: "Pointers", order: 3, lessons: makeLessons(2, "pointers").map((l, i) => ({ ...l, id: `ptr-${i}`, slug: `ptr-${i}` })) },
    { id: "templates", stage: "stl-templates", title: "Templates", order: 4, lessons: makeLessons(2, "templates").map((l, i) => ({ ...l, id: `tpl-${i}`, slug: `tpl-${i}` })) },
    { id: "concurrency", stage: "advanced", title: "Concurrency", order: 5, lessons: makeLessons(1, "concurrency").map((l, i) => ({ ...l, id: `conc-${i}`, slug: `conc-${i}` })) },
  ];
}

function emptyProgress(): DashboardProgress {
  return {
    lessonProgress: new Map(),
    streakDays: 0,
    lastActiveDate: null,
    weeklyGoal: null,
    totalLessonsCompleted: 0,
    lessonsCompletedThisWeek: 0,
  };
}

// --- computeResumeTarget ---

describe("computeResumeTarget", () => {
  const curriculum = makeCurriculum();

  it("returns first lesson when progress is empty", () => {
    const result = computeResumeTarget(curriculum, emptyProgress(), null);
    expect(result.id).toBe("lesson-0");
  });

  it("returns in-progress lesson matching lastActiveLessonId", () => {
    const progress = emptyProgress();
    progress.lessonProgress.set("cf-1", { status: "in_progress", lastVisitAt: "2026-01-02T00:00:00Z" });
    progress.lessonProgress.set("lesson-0", { status: "in_progress", lastVisitAt: "2026-01-01T00:00:00Z" });

    const result = computeResumeTarget(curriculum, progress, "cf-1");
    expect(result.id).toBe("cf-1");
  });

  it("returns first non-completed lesson when no in-progress", () => {
    const progress = emptyProgress();
    progress.lessonProgress.set("lesson-0", { status: "completed", lastVisitAt: "2026-01-01T00:00:00Z" });
    progress.lessonProgress.set("lesson-1", { status: "completed", lastVisitAt: "2026-01-01T00:00:00Z" });
    progress.totalLessonsCompleted = 2;

    const result = computeResumeTarget(curriculum, progress, null);
    expect(result.id).toBe("lesson-2");
  });

  it("returns last lesson when all completed", () => {
    const progress = emptyProgress();
    const allLessons = curriculum.flatMap((m) => m.lessons);
    for (const l of allLessons) {
      progress.lessonProgress.set(l.id, { status: "completed", lastVisitAt: "2026-01-01T00:00:00Z" });
    }
    progress.totalLessonsCompleted = allLessons.length;

    const result = computeResumeTarget(curriculum, progress, null);
    expect(result.id).toBe("conc-0");
  });

  it("skips lastActiveLessonId if that lesson is completed", () => {
    const progress = emptyProgress();
    progress.lessonProgress.set("lesson-0", { status: "completed", lastVisitAt: "2026-01-02T00:00:00Z" });

    const result = computeResumeTarget(curriculum, progress, "lesson-0");
    expect(result.id).toBe("lesson-1");
  });
});

// --- computeResumeVariant ---

describe("computeResumeVariant", () => {
  const curriculum = makeCurriculum();

  it("returns 'start' when no lessons completed", () => {
    expect(computeResumeVariant(curriculum, emptyProgress())).toBe("start");
  });

  it("returns 'resume' when partially completed", () => {
    const progress = emptyProgress();
    progress.lessonProgress.set("lesson-0", { status: "completed", lastVisitAt: "2026-01-01T00:00:00Z" });
    progress.totalLessonsCompleted = 1;
    expect(computeResumeVariant(curriculum, progress)).toBe("resume");
  });

  it("returns 'complete' when all done", () => {
    const progress = emptyProgress();
    const allLessons = curriculum.flatMap((m) => m.lessons);
    for (const l of allLessons) {
      progress.lessonProgress.set(l.id, { status: "completed", lastVisitAt: "2026-01-01T00:00:00Z" });
    }
    progress.totalLessonsCompleted = allLessons.length;
    expect(computeResumeVariant(curriculum, progress)).toBe("complete");
  });
});

// --- computePathPercent ---

describe("computePathPercent", () => {
  const curriculum = makeCurriculum();
  const totalLessons = curriculum.reduce((s, m) => s + m.lessons.length, 0);

  it("returns 0 for empty progress", () => {
    expect(computePathPercent(curriculum, emptyProgress())).toBe(0);
  });

  it("returns 100 when all complete", () => {
    const progress = emptyProgress();
    progress.totalLessonsCompleted = totalLessons;
    expect(computePathPercent(curriculum, progress)).toBe(100);
  });

  it("rounds correctly", () => {
    const progress = emptyProgress();
    progress.totalLessonsCompleted = 1;
    expect(computePathPercent(curriculum, progress)).toBe(Math.round((1 / totalLessons) * 100));
  });
});

// --- computeStageProgress ---

describe("computeStageProgress", () => {
  const curriculum = makeCurriculum();

  it("returns locked for a stage with no progress and no resume target", () => {
    const result = computeStageProgress(curriculum, emptyProgress(), "memory-oop", "lesson-0");
    expect(result.status).toBe("locked");
  });

  it("returns active for the stage containing the resume target", () => {
    const result = computeStageProgress(curriculum, emptyProgress(), "basics", "lesson-0");
    expect(result.status).toBe("active");
  });

  it("returns done when all lessons in stage are completed", () => {
    const progress = emptyProgress();
    progress.lessonProgress.set("lesson-0", { status: "completed", lastVisitAt: "" });
    progress.lessonProgress.set("lesson-1", { status: "completed", lastVisitAt: "" });
    progress.lessonProgress.set("lesson-2", { status: "completed", lastVisitAt: "" });
    progress.lessonProgress.set("cf-0", { status: "completed", lastVisitAt: "" });
    progress.lessonProgress.set("cf-1", { status: "completed", lastVisitAt: "" });

    const result = computeStageProgress(curriculum, progress, "basics", "ptr-0");
    expect(result.status).toBe("done");
    expect(result.completed).toBe(5);
    expect(result.total).toBe(5);
  });

  it("ensures exactly one stage is active", () => {
    const progress = emptyProgress();
    const resumeTargetId = "lesson-0";
    const stages = ["basics", "memory-oop", "stl-templates", "advanced"] as const;
    const results = stages.map((s) => computeStageProgress(curriculum, progress, s, resumeTargetId));
    const activeCount = results.filter((r) => r.status === "active").length;
    expect(activeCount).toBe(1);
  });
});

// --- isPathComplete ---

describe("isPathComplete", () => {
  const curriculum = makeCurriculum();

  it("returns false for empty progress", () => {
    expect(isPathComplete(curriculum, emptyProgress())).toBe(false);
  });

  it("returns true when all lessons completed", () => {
    const progress = emptyProgress();
    const allLessons = curriculum.flatMap((m) => m.lessons);
    for (const l of allLessons) {
      progress.lessonProgress.set(l.id, { status: "completed", lastVisitAt: "" });
    }
    progress.totalLessonsCompleted = allLessons.length;
    expect(isPathComplete(curriculum, progress)).toBe(true);
  });
});

// --- computeStreakDays ---

describe("computeStreakDays", () => {
  it("returns stored streak when lastActiveDate is today", () => {
    expect(computeStreakDays("2026-05-31", 5, "2026-05-31")).toBe(5);
  });

  it("returns stored streak when lastActiveDate is yesterday", () => {
    expect(computeStreakDays("2026-05-30", 5, "2026-05-31")).toBe(5);
  });

  it("returns 0 when gap is more than 1 day", () => {
    expect(computeStreakDays("2026-05-28", 5, "2026-05-31")).toBe(0);
  });

  it("returns 0 when lastActiveDate is null", () => {
    expect(computeStreakDays(null, 0, "2026-05-31")).toBe(0);
  });
});

// --- computeWeeklyCompleted ---

describe("computeWeeklyCompleted", () => {
  it("returns 0 when no completions", () => {
    expect(computeWeeklyCompleted([], "2026-05-31")).toBe(0);
  });

  it("counts completions in current week (Mon-Sun)", () => {
    // 2026-05-31 is a Sunday. Week starts Monday 2026-05-25.
    const records = [
      { completedAt: "2026-05-25T10:00:00Z" },  // Monday — in week
      { completedAt: "2026-05-31T23:59:59Z" },  // Sunday — in week
      { completedAt: "2026-05-24T23:59:59Z" },  // Previous Sunday — out of week
    ];
    expect(computeWeeklyCompleted(records, "2026-05-31")).toBe(2);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run __tests__/dashboard/resume.test.ts`

Expected: FAIL — module `@/lib/dashboard/resume` not found.

- [ ] **Step 3: Write the resume logic**

Create `lib/dashboard/resume.ts`:

```ts
import type {
  Module,
  Lesson,
  DashboardProgress,
  StageProgressResult,
  Stage,
  ResumeVariant,
} from "@/lib/dashboard/types";
import { flattenLessons } from "@/lib/dashboard/curriculum";

export function computeResumeTarget(
  curriculum: Module[],
  progress: DashboardProgress,
  lastActiveLessonId: string | null,
): Lesson {
  const ordered = flattenLessons(curriculum);

  if (lastActiveLessonId) {
    const last = ordered.find((l) => l.id === lastActiveLessonId);
    if (last && progress.lessonProgress.get(last.id)?.status === "in_progress") {
      return last;
    }
  }

  const next = ordered.find((l) => {
    const status = progress.lessonProgress.get(l.id)?.status;
    return status !== "completed" && status !== "skipped";
  });

  return next ?? ordered[ordered.length - 1]!;
}

export function computeResumeVariant(
  curriculum: Module[],
  progress: DashboardProgress,
): ResumeVariant {
  if (progress.totalLessonsCompleted === 0) return "start";
  if (isPathComplete(curriculum, progress)) return "complete";
  return "resume";
}

export function computePathPercent(curriculum: Module[], progress: DashboardProgress): number {
  const total = curriculum.reduce((sum, m) => sum + m.lessons.length, 0);
  if (total === 0) return 0;
  return Math.round((progress.totalLessonsCompleted / total) * 100);
}

export function computeStageProgress(
  curriculum: Module[],
  progress: DashboardProgress,
  stage: Stage,
  resumeTargetId: string,
): StageProgressResult {
  const stageModules = curriculum.filter((m) => m.stage === stage);
  const stageLessons = stageModules.flatMap((m) => m.lessons);
  const total = stageLessons.length;
  const completed = stageLessons.filter((l) => {
    const status = progress.lessonProgress.get(l.id)?.status;
    return status === "completed" || status === "skipped";
  }).length;

  if (completed === total && total > 0) return { completed, total, status: "done" };

  const containsResume = stageLessons.some((l) => l.id === resumeTargetId);
  if (containsResume) return { completed, total, status: "active" };

  return { completed, total, status: "locked" };
}

export function isPathComplete(curriculum: Module[], progress: DashboardProgress): boolean {
  const allLessons = curriculum.flatMap((m) => m.lessons);
  return allLessons.every((l) => {
    const status = progress.lessonProgress.get(l.id)?.status;
    return status === "completed" || status === "skipped";
  });
}

export function computeStreakDays(
  lastActiveDate: string | null,
  storedStreak: number,
  today: string,
): number {
  if (!lastActiveDate) return 0;
  if (lastActiveDate === today) return storedStreak;

  const lastDate = new Date(lastActiveDate + "T00:00:00Z");
  const todayDate = new Date(today + "T00:00:00Z");
  const diffMs = todayDate.getTime() - lastDate.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return storedStreak;
  return 0;
}

export function computeWeeklyCompleted(
  records: { completedAt: string }[],
  today: string,
): number {
  const todayDate = new Date(today + "T00:00:00Z");
  const dayOfWeek = todayDate.getUTCDay();
  // Monday = 1, Sunday = 0. We want Monday-based weeks.
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const mondayMs = todayDate.getTime() - daysSinceMonday * 24 * 60 * 60 * 1000;
  const monday = new Date(mondayMs);
  monday.setUTCHours(0, 0, 0, 0);

  const sundayEnd = new Date(monday.getTime() + 7 * 24 * 60 * 60 * 1000);

  return records.filter((r) => {
    const d = new Date(r.completedAt);
    return d >= monday && d < sundayEnd;
  }).length;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run __tests__/dashboard/resume.test.ts`

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/dashboard/resume.ts __tests__/dashboard/resume.test.ts
git commit -m "feat(dashboard): add pure resume and progress logic with tests"
```

---

## Task 5: Analytics

**Files:**
- Create: `lib/dashboard/analytics.ts`

- [ ] **Step 1: Create analytics file**

Create `lib/dashboard/analytics.ts` following the pattern from `lib/onboarding/analytics.ts`:

```ts
export type DashboardEvent =
  | "dashboard_viewed"
  | "resume_clicked"
  | "stage_clicked"
  | "tutor_opened"
  | "review_clicked";

export function trackDashboardEvent(name: DashboardEvent, props?: Record<string, unknown>): void {
  if (process.env.NODE_ENV === "development") {
    console.log(`[analytics] ${name}`, props ?? "");
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/dashboard/analytics.ts
git commit -m "feat(dashboard): add analytics event tracking"
```

---

## Task 6: StageCard component

**Files:**
- Create: `components/dashboard/StageCard.tsx`

- [ ] **Step 1: Create StageCard**

Create `components/dashboard/StageCard.tsx`:

```tsx
"use client";

import Link from "next/link";
import type { Stage, StageStatus } from "@/lib/dashboard/types";
import { trackDashboardEvent } from "@/lib/dashboard/analytics";

interface StageCardProps {
  stage: Stage;
  title: string;
  completed: number;
  total: number;
  status: StageStatus;
  targetLessonSlug: string;
}

function CheckIcon() {
  return (
    <svg className="h-4 w-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg className="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg className="h-4 w-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  );
}

const statusIcon: Record<StageStatus, () => JSX.Element> = {
  done: CheckIcon,
  active: PlayIcon,
  locked: LockIcon,
};

const barColor: Record<StageStatus, string> = {
  done: "bg-success",
  active: "bg-accent",
  locked: "bg-muted/30",
};

export function StageCard({ stage, title, completed, total, status, targetLessonSlug }: StageCardProps) {
  const Icon = statusIcon[status];
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  const statusLabel = status === "done" ? "complete" : status === "active" ? "in progress" : "locked";

  return (
    <Link
      href={`/lessons/${targetLessonSlug}`}
      onClick={() => trackDashboardEvent("stage_clicked", { stage, targetLessonId: targetLessonSlug })}
      className={`
        flex flex-col gap-2 rounded-lg border p-4 transition-colors
        hover:bg-hover/50
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-base
        ${status === "active" ? "border-accent border-2" : "border-border"}
        ${status === "locked" ? "opacity-60" : ""}
      `}
      aria-label={`${title}, ${completed} of ${total} lessons complete, ${statusLabel}`}
    >
      <div className="flex items-center gap-2">
        <Icon />
        <span className={`text-sm font-medium ${status === "locked" ? "text-muted" : "text-primary"}`}>
          {title}
        </span>
      </div>

      <div
        className="h-1 w-full overflow-hidden rounded-full bg-elevated"
        role="progressbar"
        aria-valuenow={completed}
        aria-valuemin={0}
        aria-valuemax={total}
      >
        <div
          className={`h-full rounded-full motion-safe:transition-all motion-safe:duration-500 ${barColor[status]}`}
          style={{ width: `${percent}%` }}
        />
      </div>

      <span className="text-xs text-muted">
        {completed} / {total}
        {status === "done" && " done"}
        {status === "active" && " · you're here"}
      </span>
    </Link>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/StageCard.tsx
git commit -m "feat(dashboard): add StageCard component"
```

---

## Task 7: StatCard component

**Files:**
- Create: `components/dashboard/StatCard.tsx`

- [ ] **Step 1: Create StatCard**

Create `components/dashboard/StatCard.tsx`:

```tsx
interface StatCardProps {
  label: string;
  value: number | string;
  suffix?: string;
}

export function StatCard({ label, value, suffix }: StatCardProps) {
  return (
    <div className="rounded-lg bg-elevated p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-mono text-lg tabular-nums text-primary">
        {value}
        {suffix && <span className="text-sm text-muted"> {suffix}</span>}
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/dashboard/StatCard.tsx
git commit -m "feat(dashboard): add StatCard component"
```

---

## Task 8: ResumeCard component

**Files:**
- Create: `components/dashboard/ResumeCard.tsx`

- [ ] **Step 1: Create ResumeCard**

Create `components/dashboard/ResumeCard.tsx`:

```tsx
"use client";

import Link from "next/link";
import type { Lesson, Module, ResumeVariant } from "@/lib/dashboard/types";
import { trackDashboardEvent } from "@/lib/dashboard/analytics";

interface ResumeCardProps {
  lesson: Lesson;
  module: Module;
  variant: ResumeVariant;
  snippet?: string;
}

const STOCK_SNIPPET = `#include <iostream>

int main() {
    std::cout << "Hello, C++!" << std::endl;
}`;

const variantConfig: Record<ResumeVariant, {
  label: string;
  buttonText: string;
  showTitle: boolean;
}> = {
  resume: { label: "Pick up where you left off", buttonText: "Resume coding", showTitle: true },
  start: { label: "Start here", buttonText: "Start lesson 1", showTitle: true },
  complete: { label: "You finished the path", buttonText: "Review a topic", showTitle: false },
};

export function ResumeCard({ lesson, module, variant, snippet }: ResumeCardProps) {
  const config = variantConfig[variant];
  const codePreview = variant === "resume" && snippet ? snippet : STOCK_SNIPPET;

  return (
    <div className="rounded-lg border border-border-subtle bg-surface p-6">
      <p className="text-xs tracking-wide text-muted">{config.label}</p>

      {config.showTitle && (
        <div className="mt-2">
          <p className="text-sm text-secondary">{module.title}</p>
          <h2 className="mt-0.5 text-xl font-medium text-primary">{lesson.title}</h2>
        </div>
      )}

      <pre className="mt-4 line-clamp-3 overflow-hidden rounded-md bg-elevated px-4 py-3 font-mono text-sm text-muted">
        {codePreview}
      </pre>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Link
          href={`/lessons/${lesson.slug}`}
          onClick={() =>
            trackDashboardEvent(
              variant === "complete" ? "review_clicked" : "resume_clicked",
              { lessonId: lesson.id, moduleId: module.id, variant },
            )
          }
          className="inline-flex items-center justify-center gap-2 rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-base"
          aria-label={`${config.buttonText}: ${lesson.title}`}
          prefetch
        >
          {config.buttonText}
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/ResumeCard.tsx
git commit -m "feat(dashboard): add ResumeCard hero component"
```

---

## Task 9: PathMap and StatsStrip components

**Files:**
- Create: `components/dashboard/PathMap.tsx`
- Create: `components/dashboard/StatsStrip.tsx`

- [ ] **Step 1: Create PathMap**

Create `components/dashboard/PathMap.tsx`:

```tsx
import { StageCard } from "@/components/dashboard/StageCard";
import type { Module, DashboardProgress, Stage } from "@/lib/dashboard/types";
import { computeStageProgress } from "@/lib/dashboard/resume";
import { STAGES } from "@/lib/dashboard/curriculum";

interface PathMapProps {
  curriculum: Module[];
  progress: DashboardProgress;
  pathPercent: number;
  resumeTargetId: string;
  stageTargetSlugs: Record<Stage, string>;
}

export function PathMap({ curriculum, progress, pathPercent, resumeTargetId, stageTargetSlugs }: PathMapProps) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-medium text-primary">Your path</h3>
        <span className="font-mono text-xs tabular-nums text-muted">{pathPercent}%</span>
      </div>
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
        {STAGES.map((stage) => {
          const sp = computeStageProgress(curriculum, progress, stage.id, resumeTargetId);
          return (
            <StageCard
              key={stage.id}
              stage={stage.id}
              title={stage.title}
              completed={sp.completed}
              total={sp.total}
              status={sp.status}
              targetLessonSlug={stageTargetSlugs[stage.id]}
            />
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create StatsStrip**

Create `components/dashboard/StatsStrip.tsx`:

```tsx
import { StatCard } from "@/components/dashboard/StatCard";

interface StatsStripProps {
  lessonsCompletedThisWeek: number;
  weeklyGoal: number | null;
  totalLessonsCompleted: number;
  streakDays: number;
}

export function StatsStrip({
  lessonsCompletedThisWeek,
  weeklyGoal,
  totalLessonsCompleted,
  streakDays,
}: StatsStripProps) {
  const weeklyValue = weeklyGoal != null
    ? `${lessonsCompletedThisWeek} / ${weeklyGoal}`
    : String(lessonsCompletedThisWeek);

  return (
    <div className="grid grid-cols-3 gap-3 max-[480px]:grid-cols-1">
      <StatCard label="This week" value={weeklyValue} />
      <StatCard label="Lessons done" value={totalLessonsCompleted} />
      <StatCard label="Day streak" value={streakDays} />
    </div>
  );
}
```

- [ ] **Step 3: Verify they compile**

Run: `npx tsc --noEmit`

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add components/dashboard/PathMap.tsx components/dashboard/StatsStrip.tsx
git commit -m "feat(dashboard): add PathMap and StatsStrip components"
```

---

## Task 10: Dashboard layout component

**Files:**
- Create: `components/dashboard/Dashboard.tsx`

- [ ] **Step 1: Create Dashboard**

Create `components/dashboard/Dashboard.tsx`:

```tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ResumeCard } from "@/components/dashboard/ResumeCard";
import { PathMap } from "@/components/dashboard/PathMap";
import { StatsStrip } from "@/components/dashboard/StatsStrip";
import { trackDashboardEvent } from "@/lib/dashboard/analytics";
import type { Module, Lesson, DashboardProgress, ResumeVariant, Stage } from "@/lib/dashboard/types";

interface DashboardProps {
  curriculum: Module[];
  progress: DashboardProgress;
  resumeTarget: Lesson;
  resumeVariant: ResumeVariant;
  pathPercent: number;
  stageTargetSlugs: Record<Stage, string>;
  statsError?: boolean;
}

export function Dashboard({
  curriculum,
  progress,
  resumeTarget,
  resumeVariant,
  pathPercent,
  stageTargetSlugs,
  statsError,
}: DashboardProps) {
  const router = useRouter();

  useEffect(() => {
    router.prefetch(`/lessons/${resumeTarget.slug}`);
    trackDashboardEvent("dashboard_viewed", { state: resumeVariant });
  }, [router, resumeTarget.slug, resumeVariant]);

  const resumeModule = curriculum.find((m) => m.id === resumeTarget.moduleId)!;
  const snippet = progress.lessonProgress.get(resumeTarget.id)?.lastCodeSnippet;

  return (
    <div className="mx-auto max-w-[720px] px-6 py-8">
      <div className="space-y-8">
        <div className="reveal">
          <ResumeCard
            lesson={resumeTarget}
            module={resumeModule}
            variant={resumeVariant}
            snippet={snippet}
          />
        </div>

        <div className="reveal reveal-d1">
          <PathMap
            curriculum={curriculum}
            progress={progress}
            pathPercent={pathPercent}
            resumeTargetId={resumeTarget.id}
            stageTargetSlugs={stageTargetSlugs}
          />
        </div>

        <div className="reveal reveal-d2">
          {statsError ? (
            <div className="grid grid-cols-3 gap-3 max-[480px]:grid-cols-1">
              {["This week", "Lessons done", "Day streak"].map((label) => (
                <div key={label} className="rounded-lg bg-elevated p-4">
                  <p className="text-xs text-muted">{label}</p>
                  <p className="mt-1 font-mono text-lg text-muted">&mdash;</p>
                </div>
              ))}
            </div>
          ) : (
            <StatsStrip
              lessonsCompletedThisWeek={progress.lessonsCompletedThisWeek}
              weeklyGoal={progress.weeklyGoal}
              totalLessonsCompleted={progress.totalLessonsCompleted}
              streakDays={progress.streakDays}
            />
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/Dashboard.tsx
git commit -m "feat(dashboard): add Dashboard layout component"
```

---

## Task 11: TopBar component

**Files:**
- Create: `components/layout/TopBar.tsx`

- [ ] **Step 1: Create TopBar**

Create `components/layout/TopBar.tsx`:

```tsx
"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/auth-helpers-nextjs";
import { trackDashboardEvent } from "@/lib/dashboard/analytics";

interface TopBarProps {
  streakDays: number;
  resumeLessonSlug: string | null;
  userEmail: string;
  userInitial: string;
}

export function TopBar({ streakDays, resumeLessonSlug, userEmail, userInitial }: TopBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSignOut() {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <header className="border-b border-border/50">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-6 px-6">
        <Link href="/dashboard" className="flex items-center gap-0">
          <span className="font-mono text-lg font-semibold tracking-tight text-primary">cpproad</span>
          <span className="ml-1.5 text-xs text-muted">&middot; C++ path</span>
        </Link>

        <div className="ml-auto flex items-center gap-3">
          {streakDays > 0 && (
            <div className="flex items-center gap-1.5 rounded-full bg-elevated px-2.5 py-1" aria-label={`${streakDays} day streak`}>
              <svg className="h-3.5 w-3.5 text-warning" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 23c-3.866 0-7-3.134-7-7 0-2.692 1.475-5.598 3.434-8.12a.75.75 0 011.232.028C11.01 9.817 12 11.7 12 11.7s2.25-3.6 3.75-5.4a.75.75 0 011.248.06C18.664 9.1 19 12.05 19 16c0 3.866-3.134 7-7 7z" />
              </svg>
              <span className="font-mono text-xs tabular-nums text-secondary">{streakDays}</span>
            </div>
          )}

          {resumeLessonSlug && (
            <Link
              href={`/lessons/${resumeLessonSlug}?tutor=open`}
              onClick={() => trackDashboardEvent("tutor_opened", { from: "dashboard" })}
              className="rounded-md px-2.5 py-1.5 text-xs font-medium text-secondary transition-colors hover:bg-hover hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              aria-label="Open AI tutor"
            >
              Tutor
            </Link>
          )}

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-elevated text-xs font-semibold text-secondary transition-colors hover:bg-hover hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              aria-label="Account menu"
            >
              {userInitial}
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 rounded-lg border border-border bg-surface py-2 shadow-lg">
                <p className="truncate px-3 py-1.5 text-xs text-muted">{userEmail}</p>
                <hr className="my-1 border-border" />
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full px-3 py-1.5 text-left text-xs text-secondary transition-colors hover:bg-hover hover:text-primary"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add components/layout/TopBar.tsx
git commit -m "feat(dashboard): add TopBar global header component"
```

---

## Task 12: Loading skeleton

**Files:**
- Create: `app/(app)/dashboard/loading.tsx`

- [ ] **Step 1: Create loading skeleton**

Create `app/(app)/dashboard/loading.tsx`:

```tsx
export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-[720px] px-6 py-8">
      <div className="space-y-8 animate-pulse">
        {/* Hero skeleton */}
        <div className="rounded-lg border border-border bg-surface p-6">
          <div className="h-3 w-32 rounded bg-elevated" />
          <div className="mt-3 h-4 w-48 rounded bg-elevated" />
          <div className="mt-2 h-6 w-64 rounded bg-elevated" />
          <div className="mt-4 h-20 rounded-md bg-elevated" />
          <div className="mt-4 h-10 w-40 rounded-md bg-elevated" />
        </div>

        {/* PathMap skeleton: 4 stage cards */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div className="h-4 w-20 rounded bg-elevated" />
            <div className="h-3 w-8 rounded bg-elevated" />
          </div>
          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="rounded-lg border border-border p-4">
                <div className="h-4 w-24 rounded bg-elevated" />
                <div className="mt-3 h-1 rounded-full bg-elevated" />
                <div className="mt-2 h-3 w-16 rounded bg-elevated" />
              </div>
            ))}
          </div>
        </div>

        {/* StatsStrip skeleton: 3 stat cards */}
        <div className="grid grid-cols-3 gap-3 max-[480px]:grid-cols-1">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="rounded-lg bg-elevated p-4">
              <div className="h-3 w-16 rounded bg-hover" />
              <div className="mt-2 h-5 w-10 rounded bg-hover" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/\(app\)/dashboard/loading.tsx
git commit -m "feat(dashboard): add loading skeleton"
```

---

## Task 13: Rewrite dashboard server component

**Files:**
- Modify: `app/(app)/dashboard/page.tsx`

- [ ] **Step 1: Rewrite the page**

Replace the contents of `app/(app)/dashboard/page.tsx` with:

```tsx
import { createServiceClient } from "@/lib/supabase/server";
import { requireServerSession } from "@/lib/auth/require-auth";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { buildCurriculum, flattenLessons, STAGES } from "@/lib/dashboard/curriculum";
import {
  computeResumeTarget,
  computeResumeVariant,
  computePathPercent,
  computeStreakDays,
  computeWeeklyCompleted,
} from "@/lib/dashboard/resume";
import type { DashboardProgress, LessonStatus, Stage } from "@/lib/dashboard/types";

export const dynamic = "force-dynamic";

function findLastActiveLessonId(
  progressRows: { lesson_id: string; state: string; last_visit_at: string | null }[],
): string | null {
  let latestId: string | null = null;
  let latestTime = "";

  for (const row of progressRows) {
    if (row.state === "in_progress" && row.last_visit_at && row.last_visit_at > latestTime) {
      latestTime = row.last_visit_at;
      latestId = row.lesson_id;
    }
  }

  return latestId;
}

export default async function DashboardPage() {
  const { supabase } = await requireServerSession();
  const serviceClient = createServiceClient();

  const today = new Date().toISOString().slice(0, 10);

  let fetchError = false;
  let statsError = false;

  const [lessonsResult, progressResult, statsResult, onboardingResult] = await Promise.all([
    serviceClient
      .from("lessons")
      .select("id, chapter_id, slug, learncpp_title, my_title, sort_order")
      .order("sort_order", { ascending: true }),
    supabase
      .from("progress")
      .select("lesson_id, state, last_visit_at, completed_at, last_code_snippet"),
    supabase
      .from("user_stats")
      .select("streak_days, last_active_date, weekly_goal")
      .single(),
    supabase
      .from("onboarding")
      .select("start_module")
      .single(),
  ]);

  if (lessonsResult.error || progressResult.error) {
    fetchError = true;
  }

  if (statsResult.error) {
    statsError = true;
  }

  if (fetchError) {
    return (
      <div className="mx-auto max-w-[720px] px-6 py-8">
        <div className="rounded-lg border border-border bg-surface p-6 text-center">
          <p className="text-sm text-secondary">Couldn&apos;t load your progress.</p>
          <a
            href="/dashboard"
            className="mt-3 inline-block rounded-md bg-elevated px-4 py-2 text-xs font-medium text-primary transition-colors hover:bg-hover"
          >
            Retry
          </a>
        </div>
      </div>
    );
  }

  const dbLessons = (lessonsResult.data ?? []) as {
    id: string;
    chapter_id: number;
    slug: string;
    learncpp_title: string;
    my_title: string | null;
    sort_order: number;
  }[];

  const progressRows = (progressResult.data ?? []) as {
    lesson_id: string;
    state: string;
    last_visit_at: string | null;
    completed_at: string | null;
    last_code_snippet: string | null;
  }[];

  const userStats = statsResult.data as {
    streak_days: number;
    last_active_date: string | null;
    weekly_goal: number | null;
  } | null;

  const curriculum = buildCurriculum(dbLessons);

  const lessonProgress = new Map<string, { status: LessonStatus; lastCodeSnippet?: string; lastVisitAt: string }>();
  for (const row of progressRows) {
    lessonProgress.set(row.lesson_id, {
      status: row.state as LessonStatus,
      lastCodeSnippet: row.last_code_snippet ?? undefined,
      lastVisitAt: row.last_visit_at ?? "",
    });
  }

  const totalLessonsCompleted = progressRows.filter(
    (r) => r.state === "completed" || r.state === "skipped",
  ).length;

  const weeklyRecords = progressRows
    .filter((r) => r.completed_at)
    .map((r) => ({ completedAt: r.completed_at! }));

  const streakDays = statsError
    ? 0
    : computeStreakDays(userStats?.last_active_date ?? null, userStats?.streak_days ?? 0, today);

  const dashboardProgress: DashboardProgress = {
    lessonProgress,
    streakDays,
    lastActiveDate: userStats?.last_active_date ?? null,
    weeklyGoal: statsError ? null : (userStats?.weekly_goal ?? null),
    totalLessonsCompleted,
    lessonsCompletedThisWeek: computeWeeklyCompleted(weeklyRecords, today),
  };

  const lastActiveLessonId = findLastActiveLessonId(progressRows);
  const resumeTarget = computeResumeTarget(curriculum, dashboardProgress, lastActiveLessonId);
  const resumeVariant = computeResumeVariant(curriculum, dashboardProgress);
  const pathPercent = computePathPercent(curriculum, dashboardProgress);

  // Compute target slugs for each stage
  const allLessons = flattenLessons(curriculum);
  const stageTargetSlugs = {} as Record<Stage, string>;
  for (const stage of STAGES) {
    const stageLessons = allLessons.filter((l) => {
      const mod = curriculum.find((m) => m.id === l.moduleId);
      return mod?.stage === stage.id;
    });
    const firstIncomplete = stageLessons.find((l) => {
      const status = lessonProgress.get(l.id)?.status;
      return status !== "completed" && status !== "skipped";
    });
    stageTargetSlugs[stage.id] = firstIncomplete?.slug ?? stageLessons[0]?.slug ?? "";
  }

  return (
    <Dashboard
      curriculum={curriculum}
      progress={dashboardProgress}
      resumeTarget={resumeTarget}
      resumeVariant={resumeVariant}
      pathPercent={pathPercent}
      stageTargetSlugs={stageTargetSlugs}
      statsError={statsError}
    />
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add app/\(app\)/dashboard/page.tsx
git commit -m "feat(dashboard): rewrite server component with new data model"
```

---

## Task 14: Replace AppHeader with TopBar globally

**Files:**
- Modify: `app/(app)/layout.tsx`
- Modify: `components/layout/AppShell.tsx`
- Delete: `components/layout/AppHeader.tsx`

- [ ] **Step 1: Update the (app) layout to fetch TopBar data**

Replace `app/(app)/layout.tsx` with:

```tsx
import { createServiceClient } from "@/lib/supabase/server";
import { requireServerSession } from "@/lib/auth/require-auth";
import { AppShell } from "@/components/layout/AppShell";
import { buildCurriculum, flattenLessons } from "@/lib/dashboard/curriculum";
import { computeResumeTarget, computeStreakDays } from "@/lib/dashboard/resume";
import type { LessonStatus, DashboardProgress } from "@/lib/dashboard/types";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { supabase, session } = await requireServerSession();
  const serviceClient = createServiceClient();

  const [lessonsResult, progressResult, statsResult] = await Promise.all([
    serviceClient
      .from("lessons")
      .select("id, chapter_id, slug, learncpp_title, my_title, sort_order")
      .order("sort_order", { ascending: true }),
    supabase.from("progress").select("lesson_id, state, last_visit_at"),
    supabase.from("user_stats").select("streak_days, last_active_date").single(),
  ]);

  const dbLessons = (lessonsResult.data ?? []) as {
    id: string;
    chapter_id: number;
    slug: string;
    learncpp_title: string;
    my_title: string | null;
    sort_order: number;
  }[];
  const progressRows = (progressResult.data ?? []) as {
    lesson_id: string;
    state: string;
    last_visit_at: string | null;
  }[];
  const userStats = statsResult.data as {
    streak_days: number;
    last_active_date: string | null;
  } | null;

  const curriculum = buildCurriculum(dbLessons);
  const lessonProgress = new Map<string, { status: LessonStatus; lastVisitAt: string }>();
  for (const row of progressRows) {
    lessonProgress.set(row.lesson_id, {
      status: row.state as LessonStatus,
      lastVisitAt: row.last_visit_at ?? "",
    });
  }

  let lastActiveLessonId: string | null = null;
  let latestTime = "";
  for (const row of progressRows) {
    if (row.state === "in_progress" && row.last_visit_at && row.last_visit_at > latestTime) {
      latestTime = row.last_visit_at;
      lastActiveLessonId = row.lesson_id;
    }
  }

  const totalCompleted = progressRows.filter(
    (r) => r.state === "completed" || r.state === "skipped",
  ).length;

  const minimalProgress: DashboardProgress = {
    lessonProgress: lessonProgress as any,
    streakDays: userStats?.streak_days ?? 0,
    lastActiveDate: userStats?.last_active_date ?? null,
    weeklyGoal: null,
    totalLessonsCompleted: totalCompleted,
    lessonsCompletedThisWeek: 0,
  };

  const today = new Date().toISOString().slice(0, 10);
  const streakDays = computeStreakDays(
    userStats?.last_active_date ?? null,
    userStats?.streak_days ?? 0,
    today,
  );

  const resumeTarget = computeResumeTarget(curriculum, minimalProgress, lastActiveLessonId);

  const userEmail = session.user.email ?? "";
  const userInitial = (userEmail[0] ?? "?").toUpperCase();

  return (
    <AppShell
      streakDays={streakDays}
      resumeLessonSlug={resumeTarget.slug}
      userEmail={userEmail}
      userInitial={userInitial}
    >
      {children}
    </AppShell>
  );
}
```

- [ ] **Step 2: Update AppShell to render TopBar**

Replace `components/layout/AppShell.tsx` with:

```tsx
"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { TopBar } from "@/components/layout/TopBar";

interface AppShellProps {
  streakDays: number;
  resumeLessonSlug: string | null;
  userEmail: string;
  userInitial: string;
  children: React.ReactNode;
}

export function AppShell({ streakDays, resumeLessonSlug, userEmail, userInitial, children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const hideHeader = pathname.startsWith("/lessons/");

  useEffect(() => {
    async function syncOnboarding() {
      let raw: string | null = null;
      try {
        raw = localStorage.getItem("cpproad_onboarding");
      } catch {
        return;
      }
      if (!raw) return;

      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(raw);
      } catch {
        return;
      }

      if (!parsed.background || !parsed.motivation || !parsed.startModule) return;

      try {
        const res = await fetch("/api/onboarding", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            background: parsed.background,
            motivation: parsed.motivation,
            startModule: parsed.startModule,
            fastTrack: parsed.fastTrack ?? false,
            placementTaken: parsed.placementTaken ?? false,
            placementScore: parsed.placementScore ?? null,
            weeklyGoal: parsed.weeklyGoal ?? null,
          }),
        });

        if (res.ok) {
          localStorage.removeItem("cpproad_onboarding");
          router.push("/onboarding?step=payoff");
        }
      } catch {
        // Network error — will retry on next app load
      }
    }

    syncOnboarding();
  }, [router]);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {hideHeader ? null : (
        <TopBar
          streakDays={streakDays}
          resumeLessonSlug={resumeLessonSlug}
          userEmail={userEmail}
          userInitial={userInitial}
        />
      )}
      <main
        className={
          hideHeader
            ? "flex min-h-0 flex-1 flex-col overflow-hidden"
            : "min-h-0 flex-1 overflow-auto"
        }
      >
        {children}
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Delete AppHeader**

```bash
rm components/layout/AppHeader.tsx
```

- [ ] **Step 4: Delete old home components**

```bash
rm components/home/HomeLayout.tsx components/home/ChapterSidebar.tsx components/home/ChapterDetail.tsx components/home/ContinueLearning.tsx
```

- [ ] **Step 5: Verify it compiles**

Run: `npx tsc --noEmit`

Expected: No errors. If there are remaining imports of deleted files, fix them.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(dashboard): replace AppHeader with TopBar, retire old home components"
```

---

## Task 15: Streak update in progress API

**Files:**
- Modify: `app/api/progress/[lesson_id]/route.ts`

- [ ] **Step 1: Add streak update logic to the POST handler**

In `app/api/progress/[lesson_id]/route.ts`, add a helper function at the top of the file (below imports):

```ts
async function updateStreak(supabase: ReturnType<typeof createRouteClient>, userId: string): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);

  const { data: stats } = await supabase
    .from("user_stats")
    .select("streak_days, last_active_date")
    .eq("user_id", userId)
    .single();

  if (!stats) {
    await supabase.from("user_stats").insert({
      user_id: userId,
      streak_days: 1,
      last_active_date: today,
      updated_at: new Date().toISOString(),
    });
    return;
  }

  if (stats.last_active_date === today) return;

  const lastDate = stats.last_active_date ? new Date(stats.last_active_date + "T00:00:00Z") : null;
  const todayDate = new Date(today + "T00:00:00Z");
  const isYesterday = lastDate && Math.round((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)) === 1;

  await supabase
    .from("user_stats")
    .update({
      streak_days: isYesterday ? stats.streak_days + 1 : 1,
      last_active_date: today,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);
}
```

Then at the end of the POST handler, after the successful insert or update of progress, add:

```ts
await updateStreak(supabase, userId).catch((err: unknown) => {
  console.error("Failed to update streak:", err);
});
```

Add this line just before the `return new NextResponse(null, { status: 204 });` at the end of the handler.

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/progress/\[lesson_id\]/route.ts
git commit -m "feat(dashboard): add streak update logic to progress API"
```

---

## Task 16: Write last_code_snippet on submission

**Files:**
- Modify: `app/api/submissions/route.ts`

- [ ] **Step 1: Add snippet write after submission**

In `app/api/submissions/route.ts`, find both places where submissions are inserted (the `mode === "run"` block and the `mode === "submit"` block). After each `supabase.from("submissions").insert(...)` call, add:

```ts
await supabase
  .from("progress")
  .update({ last_code_snippet: source_code, last_visit_at: new Date().toISOString() })
  .eq("user_id", userId)
  .eq("lesson_id", exercise.lesson_id)
  .then(() => {});
```

This is a fire-and-forget update — if no progress row exists yet, the update returns 0 rows affected, which is fine.

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/submissions/route.ts
git commit -m "feat(dashboard): write last_code_snippet on submission"
```

---

## Task 17: Create user_stats row on onboarding sync

**Files:**
- Modify: `app/api/onboarding/route.ts`

- [ ] **Step 1: Add user_stats creation after onboarding upsert**

In `app/api/onboarding/route.ts`, after the successful `supabase.from("onboarding").upsert(...)` call (and before the success response), add:

```ts
await supabase.from("user_stats").upsert(
  {
    user_id: userId,
    weekly_goal: body.weeklyGoal,
    streak_days: 0,
    updated_at: new Date().toISOString(),
  },
  { onConflict: "user_id" },
);
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/onboarding/route.ts
git commit -m "feat(dashboard): create user_stats row on onboarding sync"
```

---

## Task 18: Run full build and lint

- [ ] **Step 1: Run linter**

Run: `npm run lint`

Expected: No errors. Fix any that appear.

- [ ] **Step 2: Run type check**

Run: `npx tsc --noEmit`

Expected: No errors.

- [ ] **Step 3: Run tests**

Run: `npx vitest run`

Expected: All tests pass.

- [ ] **Step 4: Run build**

Run: `npm run build`

Expected: Build succeeds with no errors.

- [ ] **Step 5: Fix any issues and commit**

If any fixes were needed:

```bash
git add -A
git commit -m "fix(dashboard): resolve build/lint issues"
```

---

## Task 19: Visual verification

- [ ] **Step 1: Start dev server**

Run: `npm run dev`

- [ ] **Step 2: Open dashboard in browser**

Navigate to `http://localhost:3000/dashboard` (log in first if needed).

Verify:
- TopBar renders with wordmark, streak chip (if > 0), tutor button, avatar
- ResumeCard shows correct variant (start/resume/complete)
- PathMap shows 4 stages with correct status (active/locked/done)
- StatsStrip shows 3 stats
- Responsive: resize to < 640px (stages stack to 2 cols), < 480px (stats stack to 1 col)
- Loading skeleton appears briefly on first load
- Click resume button → navigates to correct lesson
- Click stage card → navigates to first incomplete lesson in that stage
- Avatar dropdown → sign out works

- [ ] **Step 3: Commit any visual fixes**

```bash
git add -A
git commit -m "fix(dashboard): visual adjustments from browser testing"
```

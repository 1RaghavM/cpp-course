# Dashboard Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the cpproad dashboard from flat cards into an atmospheric, glass-morphic road experience with connected milestone nodes, activity heatmap, greeting, and polished motion.

**Architecture:** Token overlay approach — extend existing CSS variables and Tailwind config with new design tokens (glass, glow, brand, node states, motion). Build new components (`Background`, `GlassCard`, `Road`, `RoadNode`, `Greeting`, `ActivityHeatmap`) and refit existing ones (`ResumeCard` → `Hero`, `StatCard`) onto the glass primitive. All changes scoped to the dashboard and its dependencies. One schema addition (`display_name` on `user_stats`).

**Tech Stack:** Next.js 14 App Router, React 18, TypeScript (strict), Tailwind CSS 3, `motion` v12 (already installed), `react-syntax-highlighter` (already installed), Supabase Postgres + RLS, Vitest.

**Spec:** `docs/superpowers/specs/2026-06-01-dashboard-redesign-design.md`
**Requirements:** `dashboard-specs/requirements.md`
**Quality gate:** `dashboard-specs/quality.md`

---

## File Map

| Action | File | Responsibility |
|--------|------|---------------|
| Create | `styles/tokens.css` | New design token block (glass, glow, brand, node, motion) |
| Modify | `app/globals.css` | Import tokens.css, update `--bg-base`, add `--grid-line`, background keyframes, node pulse keyframe, streak flicker keyframe |
| Modify | `tailwind.config.ts` | Add new token mappings to theme |
| Create | `components/Background.tsx` | Blueprint grid + ambient orbs (pure CSS, app-wide) |
| Modify | `app/(app)/layout.tsx` | Render `Background` component |
| Create | `components/ui/GlassCard.tsx` | Glass card primitive with polymorphic `as` prop |
| Create | `components/dashboard/Hero.tsx` | Replaces `ResumeCard` — composes GlassCard, code preview with mask, branded CTA |
| Modify | `components/dashboard/StatCard.tsx` | Refit onto GlassCard, add zero-state copy |
| Create | `components/dashboard/StreakCard.tsx` | StatCard variant with flame SVG + flicker animation |
| Modify | `components/dashboard/StatsStrip.tsx` | Use StreakCard for streak slot, pass zero-state props |
| Create | `lib/path.ts` | `deriveStageStates`, `getPrereqHint` — pure functions |
| Create | `__tests__/dashboard/path.test.ts` | Unit tests for `lib/path.ts` |
| Create | `components/dashboard/RoadNode.tsx` | Single road milestone node with state styling + prereq popover |
| Create | `components/dashboard/Road.tsx` | SVG track + RoadNode list, responsive vertical/horizontal |
| Modify | `components/dashboard/Dashboard.tsx` | Compose new sections: Greeting → Hero → Road → Stats → Heatmap, motion stagger |
| Create | `components/dashboard/Greeting.tsx` | Time-of-day + display_name |
| Create | `components/dashboard/ActivityHeatmap.tsx` | CSS grid heatmap, tooltips, zero state |
| Modify | `components/layout/TopBar.tsx` | Add Tutor tooltip |
| Modify | `app/(app)/dashboard/page.tsx` | Fetch display_name, activity data, use deriveStageStates, pass new props |
| Create | `supabase/migrations/008_display_name.sql` | Add `display_name TEXT` to `user_stats` |
| Modify | `app/api/onboarding/route.ts` | Write `display_name` to `user_stats` on POST |
| Modify | `lib/onboarding/types.ts` | Add `displayName` to `OnboardingPayload` |
| Delete | `components/dashboard/ResumeCard.tsx` | Replaced by Hero.tsx |
| Delete | `components/dashboard/PathMap.tsx` | Replaced by Road.tsx |
| Delete | `components/dashboard/StageCard.tsx` | Replaced by RoadNode.tsx |

---

## Task 1: Design tokens + Tailwind config

**Files:**
- Create: `styles/tokens.css`
- Modify: `app/globals.css:7` (update `--bg-base`, add import, add `--grid-line`)
- Modify: `tailwind.config.ts:7-41` (extend theme)

- [ ] **Step 1: Create `styles/tokens.css`**

```css
:root {
  /* glass */
  --glass-fill: rgba(255, 255, 255, 0.04);
  --glass-fill-hi: rgba(255, 255, 255, 0.06);
  --glass-border: rgba(255, 255, 255, 0.08);
  --glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.45);
  --glass-blur: 16px;

  /* brand */
  --brand: #00599c;
  --brand-bright: #2b8fe6;
  --accent-cyan: #38bdf8;
  --glow-blue: rgba(43, 143, 230, 0.45);
  --glow-cyan: rgba(56, 189, 248, 0.3);

  /* node states */
  --node-locked: #1a2029;
  --node-active: var(--brand-bright);
  --node-complete: var(--brand);

  /* streak */
  --streak: #ff8a3d;

  /* shape + motion */
  --radius-card: 18px;
  --radius-node: 50%;
  --ease: cubic-bezier(0.22, 1, 0.36, 1);
  --dur-fast: 180ms;
  --dur-med: 320ms;
  --dur-slow: 560ms;
  --stagger: 70ms;
}
```

- [ ] **Step 2: Update `app/globals.css`**

Add the import at line 1 (before `@tailwind base`):
```css
@import "../styles/tokens.css";
```

Inside the `:root` block, change:
```css
--bg-base: #07090D;
```

Add a new variable inside `:root`:
```css
--grid-line: rgba(255, 255, 255, 0.035);
```

Add keyframes after the existing `@keyframes reveal` block:

```css
@keyframes orb-drift {
  0%, 100% { transform: translate(0, 0); opacity: 0.6; }
  50% { transform: translate(30px, -20px); opacity: 1; }
}

@keyframes node-pulse {
  0%, 100% { transform: scale(1); opacity: 0.6; }
  50% { transform: scale(1.08); opacity: 1; }
}

@keyframes flame-flicker {
  0%, 100% { transform: scale(1); opacity: 0.9; }
  50% { transform: scale(1.1) translateY(-1px); opacity: 1; }
}
```

Add reduced-motion media query:

```css
@media (prefers-reduced-motion: reduce) {
  .orb-animate { animation: none !important; }
  .node-pulse { animation: none !important; }
  .flame-flicker { animation: none !important; }
}
```

- [ ] **Step 3: Extend `tailwind.config.ts`**

Add these to the `extend.colors` object:

```ts
"glass-fill": "var(--glass-fill)",
"glass-fill-hi": "var(--glass-fill-hi)",
"glass-border": "var(--glass-border)",
brand: "var(--brand)",
"brand-bright": "var(--brand-bright)",
"accent-cyan": "var(--accent-cyan)",
"node-locked": "var(--node-locked)",
"node-active": "var(--node-active)",
"node-complete": "var(--node-complete)",
streak: "var(--streak)",
```

Add to `extend.borderRadius`:
```ts
card: "var(--radius-card)",
```

Add to `extend.transitionDuration`:
```ts
fast: "var(--dur-fast)",
med: "var(--dur-med)",
slow: "var(--dur-slow)",
```

Add to `extend.transitionTimingFunction`:
```ts
smooth: "var(--ease)",
```

- [ ] **Step 4: Verify build compiles**

Run: `cd /Users/raghavmehta/Downloads/cpp-course && npm run build 2>&1 | tail -5`
Expected: Build succeeds (no CSS parse errors, no missing references)

- [ ] **Step 5: Commit**

```bash
git add styles/tokens.css app/globals.css tailwind.config.ts
git commit -m "feat(dashboard): add design tokens, keyframes, and Tailwind theme extensions"
```

---

## Task 2: Background component

**Files:**
- Create: `components/Background.tsx`
- Modify: `app/(app)/layout.tsx:82-91`

- [ ] **Step 1: Create `components/Background.tsx`**

```tsx
export function Background() {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden="true"
    >
      {/* Layer A: Blueprint grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: [
            "linear-gradient(var(--grid-line) 1px, transparent 1px)",
            "linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)",
          ].join(", "),
          backgroundSize: "28px 28px",
          maskImage: "radial-gradient(ellipse at center, black 40%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 40%, transparent 80%)",
        }}
      />

      {/* Layer B: Ambient orbs */}
      <div
        className="orb-animate absolute -right-32 -top-32 h-[600px] w-[600px] rounded-full blur-[120px]"
        style={{
          background: "var(--glow-blue)",
          animation: "orb-drift 30s ease-in-out infinite",
        }}
      />
      <div
        className="orb-animate absolute -bottom-32 -left-32 h-[500px] w-[500px] rounded-full blur-[100px]"
        style={{
          background: "var(--glow-cyan)",
          animation: "orb-drift 25s ease-in-out infinite reverse",
        }}
      />
    </div>
  );
}
```

- [ ] **Step 2: Add `Background` to `app/(app)/layout.tsx`**

Add import at top of file:
```ts
import { Background } from "@/components/Background";
```

In the return statement, wrap the existing `<AppShell>` — add `<Background />` as a sibling before `<AppShell>`:

Change the return from:
```tsx
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
```

To:
```tsx
return (
  <>
    <Background />
    <AppShell
      streakDays={streakDays}
      resumeLessonSlug={resumeTarget.slug}
      userEmail={userEmail}
      userInitial={userInitial}
    >
      {children}
    </AppShell>
  </>
);
```

- [ ] **Step 3: Verify visually**

Run: `npm run dev`
Open dashboard in browser. Confirm:
- Faint grid visible, fading toward edges
- Two blue/cyan orbs visible, slowly drifting
- Content renders on top, fully readable
- In devtools, toggle "prefers-reduced-motion: reduce" — orbs freeze

- [ ] **Step 4: Commit**

```bash
git add components/Background.tsx "app/(app)/layout.tsx"
git commit -m "feat(dashboard): add atmospheric background with blueprint grid and ambient orbs"
```

---

## Task 3: GlassCard primitive

**Files:**
- Create: `components/ui/GlassCard.tsx`

- [ ] **Step 1: Create `components/ui/GlassCard.tsx`**

```tsx
import { type ElementType, type ComponentPropsWithoutRef } from "react";

type GlassCardProps<T extends ElementType = "div"> = {
  as?: T;
  hover?: boolean;
} & ComponentPropsWithoutRef<T>;

export function GlassCard<T extends ElementType = "div">({
  as,
  hover = true,
  className = "",
  children,
  ...rest
}: GlassCardProps<T>) {
  const Tag = as ?? "div";

  return (
    <Tag
      className={[
        "rounded-card border border-glass-border shadow-[var(--glass-shadow)]",
        "bg-[var(--glass-fill)] backdrop-blur-[var(--glass-blur)]",
        hover &&
          "transition-all duration-fast ease-smooth hover:bg-[var(--glass-fill-hi)] hover:-translate-y-0.5",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children}
    </Tag>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /Users/raghavmehta/Downloads/cpp-course && npx tsc --noEmit 2>&1 | head -20`
Expected: No new type errors

- [ ] **Step 3: Commit**

```bash
git add components/ui/GlassCard.tsx
git commit -m "feat(dashboard): add GlassCard primitive component"
```

---

## Task 4: Hero component (replaces ResumeCard)

**Files:**
- Create: `components/dashboard/Hero.tsx`
- Modify: `components/dashboard/Dashboard.tsx:3,44-50` (swap import + usage)

- [ ] **Step 1: Create `components/dashboard/Hero.tsx`**

```tsx
"use client";

import Link from "next/link";
import { SyntaxHighlighterProps } from "react-syntax-highlighter";
import { atomOneDark } from "react-syntax-highlighter/dist/esm/styles/hljs";
import SyntaxHighlighter from "react-syntax-highlighter";
import { GlassCard } from "@/components/ui/GlassCard";
import { trackDashboardEvent } from "@/lib/dashboard/analytics";
import type { Lesson, Module, ResumeVariant } from "@/lib/dashboard/types";

interface HeroProps {
  lesson: Lesson;
  module: Module;
  variant: ResumeVariant;
  snippet?: string;
}

const STOCK_SNIPPET = `#include <iostream>

int main() {
    std::cout << "Hello, C++!" << std::endl;
    return 0;
}`;

const variantConfig: Record<
  ResumeVariant,
  { label: string; buttonText: string; showTitle: boolean }
> = {
  resume: { label: "PICK UP WHERE YOU LEFT OFF", buttonText: "Resume coding", showTitle: true },
  start: { label: "START HERE", buttonText: "Start lesson 1", showTitle: true },
  complete: { label: "PATH COMPLETE", buttonText: "Review a topic", showTitle: false },
};

const highlighterTheme: Record<string, React.CSSProperties> = {
  ...atomOneDark,
  hljs: {
    ...atomOneDark["hljs"],
    background: "transparent",
    padding: "0",
  },
};

export function Hero({ lesson, module, variant, snippet }: HeroProps) {
  const config = variantConfig[variant];
  const codePreview = variant === "resume" && snippet ? snippet : STOCK_SNIPPET;

  return (
    <GlassCard as="section" className="p-6 sm:p-8">
      <p className="text-xs font-medium uppercase tracking-widest text-muted">
        {config.label}
      </p>

      {config.showTitle && (
        <div className="mt-3">
          <p className="text-sm text-secondary">{module.title}</p>
          <h2 className="mt-0.5 text-xl font-semibold text-primary sm:text-2xl">
            {lesson.title}
          </h2>
        </div>
      )}

      <div
        className="relative mt-5 overflow-hidden rounded-lg bg-[var(--bg-elevated)] px-4 py-3"
        style={{
          maskImage: "linear-gradient(to bottom, black 60%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 60%, transparent 100%)",
        }}
      >
        <SyntaxHighlighter
          language="cpp"
          style={highlighterTheme}
          customStyle={{ background: "transparent", fontSize: "0.875rem" }}
          codeTagProps={{ className: "font-mono" }}
        >
          {codePreview}
        </SyntaxHighlighter>
      </div>

      <div className="mt-5">
        <Link
          href={`/lessons/${lesson.slug}`}
          onClick={() =>
            trackDashboardEvent(
              variant === "complete" ? "review_clicked" : "resume_clicked",
              { lessonId: lesson.id, moduleId: module.id, variant },
            )
          }
          className="group inline-flex items-center gap-2 rounded-lg bg-brand-bright px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-cyan)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]"
          aria-label={`${config.buttonText}: ${lesson.title}`}
          prefetch
        >
          {config.buttonText}
          <svg
            className="h-4 w-4 transition-transform duration-fast ease-smooth group-hover:translate-x-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      </div>
    </GlassCard>
  );
}
```

- [ ] **Step 2: Update `Dashboard.tsx` to use Hero**

Replace the import of `ResumeCard`:
```ts
// Old:
import { ResumeCard } from "@/components/dashboard/ResumeCard";
// New:
import { Hero } from "@/components/dashboard/Hero";
```

Replace usage in the JSX (around line 44-50):
```tsx
// Old:
<ResumeCard
  lesson={resumeTarget}
  module={resumeModule}
  variant={resumeVariant}
  snippet={snippet}
/>
// New:
<Hero
  lesson={resumeTarget}
  module={resumeModule}
  variant={resumeVariant}
  snippet={snippet}
/>
```

- [ ] **Step 3: Verify visually**

Run dev server, check dashboard:
- Hero renders with glass card styling (frosted glass over background orbs)
- Code preview fades at bottom, syntax highlighted
- CTA button is blue (`--brand-bright`), arrow slides right on hover
- "START HERE" / "PICK UP WHERE YOU LEFT OFF" shows as uppercase eyebrow

- [ ] **Step 4: Delete old `ResumeCard.tsx`**

```bash
rm components/dashboard/ResumeCard.tsx
```

Verify no other file imports it:
```bash
grep -r "ResumeCard" --include="*.tsx" --include="*.ts" app/ components/ lib/
```
Expected: no matches

- [ ] **Step 5: Commit**

```bash
git add components/dashboard/Hero.tsx components/dashboard/Dashboard.tsx
git rm components/dashboard/ResumeCard.tsx
git commit -m "feat(dashboard): replace ResumeCard with Hero component on GlassCard"
```

---

## Task 5: StatCard refit + StreakCard + StatsStrip update

**Files:**
- Modify: `components/dashboard/StatCard.tsx`
- Create: `components/dashboard/StreakCard.tsx`
- Modify: `components/dashboard/StatsStrip.tsx`

- [ ] **Step 1: Rewrite `components/dashboard/StatCard.tsx`**

```tsx
import { GlassCard } from "@/components/ui/GlassCard";

interface StatCardProps {
  label: string;
  value: number | string;
  suffix?: string;
  zeroText?: string;
}

export function StatCard({ label, value, suffix, zeroText }: StatCardProps) {
  const isZero = value === 0 || value === "0";
  const displayValue = isZero && zeroText ? zeroText : value;

  return (
    <GlassCard className="p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-mono text-lg tabular-nums text-primary">
        {displayValue}
        {!isZero && suffix && <span className="text-sm text-muted"> {suffix}</span>}
      </p>
    </GlassCard>
  );
}
```

- [ ] **Step 2: Create `components/dashboard/StreakCard.tsx`**

```tsx
import { GlassCard } from "@/components/ui/GlassCard";

interface StreakCardProps {
  streakDays: number;
}

function FlameIcon({ active }: { active: boolean }) {
  return (
    <svg
      className={`inline-block h-5 w-5 text-streak ${active ? "flame-flicker" : "opacity-40"}`}
      style={active ? { animation: "flame-flicker 3s ease-in-out infinite" } : undefined}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 23c-3.866 0-7-3.134-7-7 0-2.692 1.475-5.598 3.434-8.12a.75.75 0 011.232.028C11.01 9.817 12 11.7 12 11.7s2.25-3.6 3.75-5.4a.75.75 0 011.248.06C18.664 9.1 19 12.05 19 16c0 3.866-3.134 7-7 7z" />
    </svg>
  );
}

export function StreakCard({ streakDays }: StreakCardProps) {
  const isZero = streakDays === 0;

  return (
    <GlassCard className="p-4">
      <p className="text-xs text-muted">Day streak</p>
      <div className="mt-1 flex items-center gap-2">
        <FlameIcon active={!isZero} />
        <p className="font-mono text-lg tabular-nums text-primary">
          {isZero ? "Start today" : streakDays}
        </p>
      </div>
    </GlassCard>
  );
}
```

- [ ] **Step 3: Update `components/dashboard/StatsStrip.tsx`**

```tsx
import { StatCard } from "@/components/dashboard/StatCard";
import { StreakCard } from "@/components/dashboard/StreakCard";

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
  const weeklyValue =
    weeklyGoal != null
      ? `${lessonsCompletedThisWeek} / ${weeklyGoal}`
      : String(lessonsCompletedThisWeek);

  const weeklyZero =
    weeklyGoal != null
      ? `0 / ${weeklyGoal} — first one's the hardest`
      : "0 so far";

  return (
    <div className="grid grid-cols-3 gap-3 max-[480px]:grid-cols-1">
      <StatCard
        label="This week"
        value={weeklyValue}
        zeroText={lessonsCompletedThisWeek === 0 ? weeklyZero : undefined}
      />
      <StatCard
        label="Lessons done"
        value={totalLessonsCompleted}
        zeroText="Day 1"
      />
      <StreakCard streakDays={streakDays} />
    </div>
  );
}
```

- [ ] **Step 4: Update the stats error fallback in `Dashboard.tsx`**

In `Dashboard.tsx`, update the error fallback (around line 64-70) to also use GlassCard styling:

```tsx
{["This week", "Lessons done", "Day streak"].map((label) => (
  <div key={label} className="rounded-card border border-glass-border bg-[var(--glass-fill)] p-4">
    <p className="text-xs text-muted">{label}</p>
    <p className="mt-1 font-mono text-lg text-muted">&mdash;</p>
  </div>
))}
```

- [ ] **Step 5: Verify visually**

Run dev server, check:
- Stat cards render as glass cards
- Zero state shows "Day 1" for lessons, "Start today" with dimmed flame for streak, weekly goal copy for week
- Non-zero states show numbers normally
- Flame icon flickers subtly when streak > 0
- Flame frozen under reduced-motion

- [ ] **Step 6: Commit**

```bash
git add components/dashboard/StatCard.tsx components/dashboard/StreakCard.tsx components/dashboard/StatsStrip.tsx components/dashboard/Dashboard.tsx
git commit -m "feat(dashboard): refit StatCard onto GlassCard, add StreakCard with flame, zero-state copy"
```

---

## Task 6: `lib/path.ts` — stage state derivation (TDD)

**Files:**
- Create: `lib/path.ts`
- Create: `__tests__/dashboard/path.test.ts`
- Modify: `lib/dashboard/types.ts` (add `StageState` type)

- [ ] **Step 1: Add `StageState` type to `lib/dashboard/types.ts`**

Add at the end of the file:

```ts
export type StageState = {
  stageId: Stage;
  status: "completed" | "active" | "locked" | "unlocked";
  completed: number;
  total: number;
};
```

- [ ] **Step 2: Write failing tests in `__tests__/dashboard/path.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { deriveStageStates, getPrereqHint } from "@/lib/path";
import type { Module, Lesson, DashboardProgress } from "@/lib/dashboard/types";

function makeLessons(count: number, moduleId: string): Lesson[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${moduleId}-${i}`,
    moduleId: moduleId as any,
    title: `Lesson ${i}`,
    slug: `${moduleId}-${i}`,
    order: i,
  }));
}

function makeCurriculum(): Module[] {
  return [
    { id: "variables", stage: "basics", title: "Variables", order: 1, lessons: makeLessons(3, "variables") },
    { id: "control-flow", stage: "basics", title: "Control Flow", order: 2, lessons: makeLessons(2, "control-flow") },
    { id: "pointers", stage: "memory-oop", title: "Pointers", order: 3, lessons: makeLessons(2, "pointers") },
    { id: "templates", stage: "stl-templates", title: "Templates", order: 4, lessons: makeLessons(2, "templates") },
    { id: "concurrency", stage: "advanced", title: "Concurrency", order: 5, lessons: makeLessons(1, "concurrency") },
  ];
}

function emptyProgress(): DashboardProgress {
  return {
    lessonProgress: {},
    streakDays: 0,
    lastActiveDate: null,
    weeklyGoal: null,
    totalLessonsCompleted: 0,
    lessonsCompletedThisWeek: 0,
  };
}

describe("deriveStageStates", () => {
  const curriculum = makeCurriculum();

  it("marks first stage active and others locked for zero-progress user", () => {
    const states = deriveStageStates(curriculum, emptyProgress(), null);
    expect(states[0]!.status).toBe("active");     // basics
    expect(states[1]!.status).toBe("locked");      // memory-oop
    expect(states[2]!.status).toBe("locked");      // stl-templates
    expect(states[3]!.status).toBe("locked");      // advanced
  });

  it("marks the stage containing lastVisitedLessonId as active", () => {
    const progress = emptyProgress();
    progress.lessonProgress["pointers-0"] = { status: "in_progress", lastVisitAt: "2026-01-02T00:00:00Z" };
    const states = deriveStageStates(curriculum, progress, "pointers-0");
    expect(states.find((s) => s.stageId === "memory-oop")!.status).toBe("active");
  });

  it("active overrides locked even if prior stage has 0 completions", () => {
    const progress = emptyProgress();
    progress.lessonProgress["templates-0"] = { status: "in_progress", lastVisitAt: "2026-01-02T00:00:00Z" };
    const states = deriveStageStates(curriculum, progress, "templates-0");
    expect(states.find((s) => s.stageId === "stl-templates")!.status).toBe("active");
  });

  it("marks a completed stage as completed regardless of active", () => {
    const progress = emptyProgress();
    // Complete all basics lessons
    ["variables-0", "variables-1", "variables-2", "control-flow-0", "control-flow-1"].forEach((id) => {
      progress.lessonProgress[id] = { status: "completed", lastVisitAt: "2026-01-01T00:00:00Z" };
    });
    progress.totalLessonsCompleted = 5;
    const states = deriveStageStates(curriculum, progress, "variables-0");
    expect(states.find((s) => s.stageId === "basics")!.status).toBe("completed");
  });

  it("marks a stage as unlocked (not locked) when prior stage has some completions", () => {
    const progress = emptyProgress();
    progress.lessonProgress["variables-0"] = { status: "completed", lastVisitAt: "2026-01-01T00:00:00Z" };
    progress.totalLessonsCompleted = 1;
    const states = deriveStageStates(curriculum, progress, "variables-0");
    expect(states.find((s) => s.stageId === "basics")!.status).toBe("active");
    expect(states.find((s) => s.stageId === "memory-oop")!.status).toBe("unlocked");
  });

  it("returns correct completed/total counts per stage", () => {
    const progress = emptyProgress();
    progress.lessonProgress["variables-0"] = { status: "completed", lastVisitAt: "" };
    progress.lessonProgress["variables-1"] = { status: "skipped", lastVisitAt: "" };
    const states = deriveStageStates(curriculum, progress, "variables-2");
    const basics = states.find((s) => s.stageId === "basics")!;
    expect(basics.completed).toBe(2);
    expect(basics.total).toBe(5);
  });

  it("has exactly one active stage", () => {
    const progress = emptyProgress();
    progress.lessonProgress["pointers-0"] = { status: "in_progress", lastVisitAt: "2026-01-02T00:00:00Z" };
    const states = deriveStageStates(curriculum, progress, "pointers-0");
    const activeCount = states.filter((s) => s.status === "active").length;
    expect(activeCount).toBe(1);
  });
});

describe("getPrereqHint", () => {
  it("returns empty string for basics", () => {
    expect(getPrereqHint("basics")).toBe("");
  });

  it("returns a non-empty hint for non-basics stages", () => {
    expect(getPrereqHint("memory-oop").length).toBeGreaterThan(0);
    expect(getPrereqHint("stl-templates").length).toBeGreaterThan(0);
    expect(getPrereqHint("advanced").length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `cd /Users/raghavmehta/Downloads/cpp-course && npx vitest run __tests__/dashboard/path.test.ts 2>&1 | tail -10`
Expected: FAIL — `Cannot find module '@/lib/path'`

- [ ] **Step 4: Implement `lib/path.ts`**

```ts
import type { Module, DashboardProgress, Stage, StageState } from "@/lib/dashboard/types";
import { STAGES } from "@/lib/dashboard/curriculum";

export function deriveStageStates(
  curriculum: Module[],
  progress: DashboardProgress,
  lastVisitedLessonId: string | null,
): StageState[] {
  let activeStageId: Stage | null = null;

  if (lastVisitedLessonId) {
    for (const mod of curriculum) {
      if (mod.lessons.some((l) => l.id === lastVisitedLessonId)) {
        activeStageId = mod.stage;
        break;
      }
    }
  }

  const stageStats = STAGES.map((stage) => {
    const stageLessons = curriculum
      .filter((m) => m.stage === stage.id)
      .flatMap((m) => m.lessons);
    const total = stageLessons.length;
    const completed = stageLessons.filter((l) => {
      const status = progress.lessonProgress[l.id]?.status;
      return status === "completed" || status === "skipped";
    }).length;

    return { stageId: stage.id, completed, total };
  });

  if (!activeStageId) {
    activeStageId = STAGES[0]!.id;
  }

  return stageStats.map((stat, index) => {
    if (stat.completed === stat.total && stat.total > 0) {
      return { ...stat, status: "completed" as const };
    }

    if (stat.stageId === activeStageId) {
      return { ...stat, status: "active" as const };
    }

    if (index > 0) {
      const prevStat = stageStats[index - 1]!;
      if (prevStat.completed === 0) {
        return { ...stat, status: "locked" as const };
      }
    }

    return { ...stat, status: "unlocked" as const };
  });
}

const PREREQ_HINTS: Record<Stage, string> = {
  basics: "",
  "memory-oop": "This section builds on variables, control flow, and functions from Basics.",
  "stl-templates": "You'll want to be comfortable with classes, pointers, and references first.",
  advanced: "Assumes familiarity with OOP, templates, and the standard library.",
};

export function getPrereqHint(stageId: Stage): string {
  return PREREQ_HINTS[stageId];
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd /Users/raghavmehta/Downloads/cpp-course && npx vitest run __tests__/dashboard/path.test.ts 2>&1 | tail -15`
Expected: All tests PASS

- [ ] **Step 6: Run existing tests to check for regressions**

Run: `cd /Users/raghavmehta/Downloads/cpp-course && npx vitest run 2>&1 | tail -10`
Expected: All tests pass

- [ ] **Step 7: Commit**

```bash
git add lib/path.ts lib/dashboard/types.ts __tests__/dashboard/path.test.ts
git commit -m "feat(dashboard): add deriveStageStates and getPrereqHint with tests (REQ-2 fix)"
```

---

## Task 7: RoadNode component

**Files:**
- Create: `components/dashboard/RoadNode.tsx`

- [ ] **Step 1: Create `components/dashboard/RoadNode.tsx`**

```tsx
"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import type { Stage, StageState } from "@/lib/dashboard/types";
import { getPrereqHint } from "@/lib/path";
import { trackDashboardEvent } from "@/lib/dashboard/analytics";

interface RoadNodeProps {
  state: StageState;
  title: string;
  targetLessonSlug: string;
}

function CheckIcon() {
  return (
    <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg className="h-4 w-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  );
}

const nodeStyles: Record<StageState["status"], { ring: string; bg: string; label: string }> = {
  completed: {
    ring: "ring-2 ring-node-complete",
    bg: "bg-node-complete",
    label: "text-primary",
  },
  active: {
    ring: "ring-2 ring-node-active node-pulse",
    bg: "bg-node-active",
    label: "text-primary font-semibold",
  },
  unlocked: {
    ring: "ring-1 ring-glass-border",
    bg: "bg-[var(--bg-elevated)]",
    label: "text-secondary",
  },
  locked: {
    ring: "ring-1 ring-glass-border",
    bg: "bg-node-locked",
    label: "text-muted",
  },
};

export function RoadNode({ state, title, targetLessonSlug }: RoadNodeProps) {
  const [showHint, setShowHint] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const isLocked = state.status === "locked";
  const style = nodeStyles[state.status];
  const hint = getPrereqHint(state.stageId);
  const statusLabel =
    state.status === "completed" ? "complete" :
    state.status === "active" ? "in progress" :
    state.status === "locked" ? "locked" : "available";

  useEffect(() => {
    if (!showHint) return;
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowHint(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setShowHint(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showHint]);

  const nodeContent = (
    <>
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-full ${style.bg} ${style.ring} transition-all duration-fast ease-smooth`}
        style={
          state.status === "active"
            ? { animation: "node-pulse 2.4s ease-in-out infinite", boxShadow: "0 0 20px var(--glow-blue)" }
            : undefined
        }
      >
        {state.status === "completed" && <CheckIcon />}
        {state.status === "active" && <PlayIcon />}
        {state.status === "locked" && <LockIcon />}
        {state.status === "unlocked" && (
          <span className="font-mono text-xs text-secondary">{state.completed}</span>
        )}
      </div>
      <div className="mt-2 text-center">
        <p className={`text-sm ${style.label}`}>{title}</p>
        <p className="font-mono text-xs tabular-nums text-muted">
          {state.completed} / {state.total}
        </p>
        {state.status === "active" && (
          <p className="mt-0.5 text-xs text-accent-cyan">you&apos;re here</p>
        )}
      </div>
    </>
  );

  if (isLocked && hint) {
    return (
      <li className="relative flex flex-col items-center" ref={popoverRef}>
        <button
          type="button"
          onClick={() => {
            setShowHint(true);
            trackDashboardEvent("locked_stage_clicked", { stage: state.stageId });
          }}
          className="flex flex-col items-center opacity-60 transition-opacity duration-fast hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]"
          aria-label={`${title}, ${state.completed} of ${state.total} lessons, ${statusLabel}`}
        >
          {nodeContent}
        </button>

        {showHint && (
          <div
            className="absolute top-full z-10 mt-3 w-64 rounded-card border border-glass-border bg-[var(--bg-surface)] p-4 shadow-lg"
            role="dialog"
            aria-label="Prerequisites"
          >
            <p className="text-sm text-secondary">{hint}</p>
            <Link
              href={`/lessons/${targetLessonSlug}`}
              className="mt-3 inline-block rounded-lg bg-brand-bright px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[var(--accent-cyan)]"
              onClick={() => {
                setShowHint(false);
                trackDashboardEvent("locked_stage_continued", { stage: state.stageId });
              }}
            >
              Continue anyway
            </Link>
          </div>
        )}
      </li>
    );
  }

  return (
    <li className="flex flex-col items-center">
      <Link
        href={`/lessons/${targetLessonSlug}`}
        onClick={() => trackDashboardEvent("stage_clicked", { stage: state.stageId })}
        className={`flex flex-col items-center transition-transform duration-fast ease-smooth hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)] ${isLocked ? "opacity-60" : ""}`}
        aria-label={`${title}, ${state.completed} of ${state.total} lessons, ${statusLabel}`}
      >
        {nodeContent}
      </Link>
    </li>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No new type errors

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/RoadNode.tsx
git commit -m "feat(dashboard): add RoadNode component with state styling and prereq popover"
```

---

## Task 8: Road component (SVG track + responsive layout)

**Files:**
- Create: `components/dashboard/Road.tsx`
- Modify: `components/dashboard/Dashboard.tsx` (swap PathMap for Road)

- [ ] **Step 1: Create `components/dashboard/Road.tsx`**

```tsx
"use client";

import { RoadNode } from "@/components/dashboard/RoadNode";
import type { StageState, Stage } from "@/lib/dashboard/types";
import { STAGES } from "@/lib/dashboard/curriculum";

interface RoadProps {
  stageStates: StageState[];
  pathPercent: number;
  stageTargetSlugs: Record<Stage, string>;
}

function TrackSVG({ percent, vertical }: { percent: number; vertical: boolean }) {
  if (vertical) {
    const height = 100;
    return (
      <svg
        className="absolute left-1/2 top-0 -z-10 h-full -translate-x-1/2"
        width="4"
        height="100%"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <line
          x1="2" y1="0" x2="2" y2={height}
          stroke="var(--node-locked)"
          strokeWidth="4"
          vectorEffect="non-scaling-stroke"
        />
        <line
          x1="2" y1="0" x2="2" y2={height}
          stroke="url(#road-gradient-v)"
          strokeWidth="4"
          strokeDasharray={`${height}`}
          strokeDashoffset={`${height - (height * percent) / 100}`}
          vectorEffect="non-scaling-stroke"
          className="transition-all duration-slow ease-smooth"
        />
        <defs>
          <linearGradient id="road-gradient-v" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--brand)" />
            <stop offset="100%" stopColor="var(--accent-cyan)" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  const width = 100;
  return (
    <svg
      className="absolute left-0 top-1/2 -z-10 w-full -translate-y-1/2"
      height="4"
      width="100%"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <line
        x1="0" y1="2" x2={width} y2="2"
        stroke="var(--node-locked)"
        strokeWidth="4"
        vectorEffect="non-scaling-stroke"
      />
      <line
        x1="0" y1="2" x2={width} y2="2"
        stroke="url(#road-gradient-h)"
        strokeWidth="4"
        strokeDasharray={`${width}`}
        strokeDashoffset={`${width - (width * percent) / 100}`}
        vectorEffect="non-scaling-stroke"
        className="transition-all duration-slow ease-smooth"
      />
      <defs>
        <linearGradient id="road-gradient-h" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--brand)" />
          <stop offset="100%" stopColor="var(--accent-cyan)" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function Road({ stageStates, pathPercent, stageTargetSlugs }: RoadProps) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-medium text-primary">Your path</h3>
        <span className="font-mono text-xs tabular-nums text-muted">{pathPercent}%</span>
      </div>

      {/* Mobile: vertical */}
      <div className="relative md:hidden">
        <TrackSVG percent={pathPercent} vertical />
        <ol className="relative flex flex-col items-center gap-10 py-4">
          {STAGES.map((stage) => {
            const state = stageStates.find((s) => s.stageId === stage.id);
            if (!state) return null;
            return (
              <RoadNode
                key={stage.id}
                state={state}
                title={stage.title}
                targetLessonSlug={stageTargetSlugs[stage.id]}
              />
            );
          })}
        </ol>
      </div>

      {/* Desktop: horizontal */}
      <div className="relative hidden md:block">
        <TrackSVG percent={pathPercent} vertical={false} />
        <ol className="relative flex items-start justify-between py-4">
          {STAGES.map((stage) => {
            const state = stageStates.find((s) => s.stageId === stage.id);
            if (!state) return null;
            return (
              <RoadNode
                key={stage.id}
                state={state}
                title={stage.title}
                targetLessonSlug={stageTargetSlugs[stage.id]}
              />
            );
          })}
        </ol>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update `Dashboard.tsx` to use Road instead of PathMap**

Replace import:
```ts
// Old:
import { PathMap } from "@/components/dashboard/PathMap";
// New:
import { Road } from "@/components/dashboard/Road";
```

Add import for `deriveStageStates`:
```ts
import { deriveStageStates } from "@/lib/path";
```

Add `lastVisitedLessonId` to `DashboardProps`:
```ts
interface DashboardProps {
  curriculum: Module[];
  progress: DashboardProgress;
  resumeTarget: Lesson;
  resumeVariant: ResumeVariant;
  pathPercent: number;
  stageTargetSlugs: Record<Stage, string>;
  lastVisitedLessonId: string | null;
  statsError?: boolean;
}
```

Add destructuring of `lastVisitedLessonId` and compute stage states inside the component:
```ts
const stageStates = deriveStageStates(curriculum, progress, lastVisitedLessonId);
```

Replace the PathMap JSX with Road:
```tsx
// Old:
<PathMap
  curriculum={curriculum}
  progress={progress}
  pathPercent={pathPercent}
  resumeTargetId={resumeTarget.id}
  stageTargetSlugs={stageTargetSlugs}
/>
// New:
<Road
  stageStates={stageStates}
  pathPercent={pathPercent}
  stageTargetSlugs={stageTargetSlugs}
/>
```

- [ ] **Step 3: Update `dashboard/page.tsx` to pass `lastVisitedLessonId`**

In `app/(app)/dashboard/page.tsx`, add the prop to the `<Dashboard>` component (around line 153-163):

```tsx
<Dashboard
  curriculum={curriculum}
  progress={dashboardProgress}
  resumeTarget={resumeTarget}
  resumeVariant={resumeVariant}
  pathPercent={pathPercent}
  stageTargetSlugs={stageTargetSlugs}
  lastVisitedLessonId={lastActiveLessonId}
  statsError={statsError}
/>
```

- [ ] **Step 4: Delete old files**

```bash
rm components/dashboard/PathMap.tsx components/dashboard/StageCard.tsx
```

Verify no other file imports them:
```bash
grep -r "PathMap\|StageCard" --include="*.tsx" --include="*.ts" app/ components/ lib/
```
Expected: no matches

- [ ] **Step 5: Verify visually**

Run dev server:
- Road renders as connected nodes with SVG track
- Mobile (< 768px): vertical layout
- Desktop: horizontal layout
- Active node has glow + pulse
- Locked node shows prereq popup on click
- Completed nodes show check icon

- [ ] **Step 6: Run all tests**

Run: `npx vitest run 2>&1 | tail -10`
Expected: All pass (path.test.ts passes, existing tests unbroken)

- [ ] **Step 7: Commit**

```bash
git add components/dashboard/Road.tsx components/dashboard/Dashboard.tsx "app/(app)/dashboard/page.tsx"
git rm components/dashboard/PathMap.tsx components/dashboard/StageCard.tsx
git commit -m "feat(dashboard): add Road component with SVG track, replace PathMap and StageCard (REQ-3)"
```

---

## Task 9: Motion pass (load reveal, count-up, track fill)

**Files:**
- Modify: `components/dashboard/Dashboard.tsx`
- Modify: `components/dashboard/StatCard.tsx`
- Modify: `components/dashboard/StreakCard.tsx`
- Modify: `app/globals.css` (remove old reveal classes)

- [ ] **Step 1: Add motion-based stagger to `Dashboard.tsx`**

Add imports at top:
```ts
import { motion, useReducedMotion } from "motion/react";
```

Wrap each section in `<motion.div>` with staggered reveal. Replace the current `<div className="space-y-8">` block with:

```tsx
const reducedMotion = useReducedMotion();

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07 },
  },
};

const itemVariants = reducedMotion
  ? { hidden: {}, visible: {} }
  : {
      hidden: { opacity: 0, y: 12 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
      },
    };
```

Then in the return, replace `<div className="space-y-8">` and each `<div className="reveal ...">` wrapper with:

```tsx
<motion.div
  className="space-y-8"
  variants={containerVariants}
  initial="hidden"
  animate="visible"
>
  {/* Greeting slot — Task 11 adds <Greeting> here */}

  <motion.div variants={itemVariants}>
    <Hero ... />
  </motion.div>

  <motion.div variants={itemVariants}>
    <Road ... />
  </motion.div>

  <motion.div variants={itemVariants}>
    {/* StatsStrip (already wired) */}
    {statsError ? (/* error fallback */) : (<StatsStrip ... />)}
  </motion.div>

  {/* Heatmap slot — Task 12 adds <ActivityHeatmap> here */}
</motion.div>
```

- [ ] **Step 2: Add count-up to `StatCard.tsx`**

Add imports:
```ts
"use client";

import { useEffect, useRef } from "react";
import { useMotionValue, useSpring, useReducedMotion } from "motion/react";
```

Add a `CountUp` sub-component:

```tsx
function CountUp({ target }: { target: number }) {
  const reducedMotion = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const motionVal = useMotionValue(0);
  const springVal = useSpring(motionVal, { duration: 560, bounce: 0 });

  useEffect(() => {
    if (reducedMotion) {
      if (ref.current) ref.current.textContent = String(target);
      return;
    }
    motionVal.set(target);
    const unsubscribe = springVal.on("change", (v) => {
      if (ref.current) ref.current.textContent = String(Math.round(v));
    });
    return unsubscribe;
  }, [target, motionVal, springVal, reducedMotion]);

  return <span ref={ref}>{reducedMotion ? target : 0}</span>;
}
```

Use `CountUp` when value is a number:

```tsx
<p className="mt-1 font-mono text-lg tabular-nums text-primary">
  {isZero && zeroText ? (
    zeroText
  ) : typeof value === "number" ? (
    <>
      <CountUp target={value} />
      {suffix && <span className="text-sm text-muted"> {suffix}</span>}
    </>
  ) : (
    <>
      {value}
      {suffix && <span className="text-sm text-muted"> {suffix}</span>}
    </>
  )}
</p>
```

- [ ] **Step 3: Add count-up to `StreakCard.tsx`**

Add the same `"use client"` directive (already present from FlameIcon state) and the same `CountUp` component, or import it. For simplicity, duplicate `CountUp` inline (same code).

Replace the streak number display:
```tsx
<p className="font-mono text-lg tabular-nums text-primary">
  {isZero ? "Start today" : <CountUp target={streakDays} />}
</p>
```

Add imports:
```ts
import { useEffect, useRef } from "react";
import { useMotionValue, useSpring, useReducedMotion } from "motion/react";
```

- [ ] **Step 4: Remove old CSS reveal classes from `globals.css`**

Remove the `.reveal`, `.reveal-d1` through `.reveal-d4` utility classes and the `@keyframes reveal` block — these are replaced by motion's stagger.

- [ ] **Step 5: Verify visually**

Run dev server:
- Sections stagger in on load (greeting → hero → road → stats → heatmap)
- Stat numbers count up from 0
- Toggle reduced-motion in devtools: everything appears instantly, no animation
- No jank in Performance panel

- [ ] **Step 6: Commit**

```bash
git add components/dashboard/Dashboard.tsx components/dashboard/StatCard.tsx components/dashboard/StreakCard.tsx app/globals.css
git commit -m "feat(dashboard): add motion stagger reveal, count-up animation, reduced-motion support (REQ-9)"
```

---

## Task 10: Schema migration + onboarding update for `display_name`

**Files:**
- Create: `supabase/migrations/008_display_name.sql`
- Modify: `lib/onboarding/types.ts`
- Modify: `app/api/onboarding/route.ts`

- [ ] **Step 1: Create migration `supabase/migrations/008_display_name.sql`**

```sql
-- 008_display_name.sql — Add display name to user_stats for greeting
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS display_name TEXT;
```

- [ ] **Step 2: Add `displayName` to `OnboardingPayload` in `lib/onboarding/types.ts`**

Add to the `OnboardingPayload` interface:
```ts
export interface OnboardingPayload {
  background: Background;
  motivation: Motivation;
  startModule: ModuleId;
  fastTrack: boolean;
  placementTaken: boolean;
  placementScore: number | null;
  weeklyGoal: number | null;
  displayName: string | null;
}
```

Add to `OnboardingState`:
```ts
export interface OnboardingState {
  step: Step;
  background: Background | null;
  motivation: Motivation | null;
  startModule: ModuleId | null;
  fastTrack: boolean;
  placementTaken: boolean;
  placementScore: number | null;
  weeklyGoal: number | null;
  displayName: string | null;
}
```

Add to `INITIAL_STATE`:
```ts
export const INITIAL_STATE: OnboardingState = {
  step: "background",
  background: null,
  motivation: null,
  startModule: null,
  fastTrack: false,
  placementTaken: false,
  placementScore: null,
  weeklyGoal: null,
  displayName: null,
};
```

Add action type:
```ts
| { type: "SET_DISPLAY_NAME"; value: string }
```

- [ ] **Step 3: Update `app/api/onboarding/route.ts` POST handler**

In `isValidPayload`, add validation:
```ts
if (b.displayName !== null && typeof b.displayName !== "string") return false;
```

In the `user_stats` upsert, add `display_name`:
```ts
await supabase.from("user_stats").upsert(
  {
    user_id: userId,
    weekly_goal: body.weeklyGoal,
    display_name: body.displayName ?? null,
    streak_days: 0,
    updated_at: new Date().toISOString(),
  },
  { onConflict: "user_id" },
);
```

- [ ] **Step 4: Update `AppShell.tsx` onboarding sync to send `displayName`**

In `components/layout/AppShell.tsx`, add `displayName` to the body sent to `/api/onboarding` (around line 47):

```ts
body: JSON.stringify({
  background: parsed.background,
  motivation: parsed.motivation,
  startModule: parsed.startModule,
  fastTrack: parsed.fastTrack ?? false,
  placementTaken: parsed.placementTaken ?? false,
  placementScore: parsed.placementScore ?? null,
  weeklyGoal: parsed.weeklyGoal ?? null,
  displayName: parsed.displayName ?? null,
}),
```

- [ ] **Step 5: Apply migration locally**

Run: `cd /Users/raghavmehta/Downloads/cpp-course && npx supabase db push 2>&1 | tail -5`
Expected: Migration applies successfully

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/008_display_name.sql lib/onboarding/types.ts app/api/onboarding/route.ts components/layout/AppShell.tsx
git commit -m "feat(dashboard): add display_name column and onboarding write path (REQ-7)"
```

---

## Task 11: Greeting component

**Files:**
- Create: `components/dashboard/Greeting.tsx`
- Modify: `components/dashboard/Dashboard.tsx` (add Greeting)
- Modify: `app/(app)/dashboard/page.tsx` (fetch + pass displayName)

- [ ] **Step 1: Create `components/dashboard/Greeting.tsx`**

```tsx
interface GreetingProps {
  displayName: string | null;
  hour: number;
}

function getTimeOfDay(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function Greeting({ displayName, hour }: GreetingProps) {
  const timeGreeting = getTimeOfDay(hour);
  const name = displayName?.trim();

  return (
    <h1 className="text-lg font-semibold text-primary sm:text-xl">
      {name ? `${timeGreeting}, ${name}` : "Welcome back"}
    </h1>
  );
}
```

- [ ] **Step 2: Update `dashboard/page.tsx` to fetch and pass `displayName` + `hour`**

In the `user_stats` select query (line 50-51), add `display_name`:
```ts
supabase
  .from("user_stats")
  .select("streak_days, last_active_date, weekly_goal, display_name")
  .single(),
```

Update the `userStats` type (around line 96-100):
```ts
const userStats = statsResult.data as {
  streak_days: number;
  last_active_date: string | null;
  weekly_goal: number | null;
  display_name: string | null;
} | null;
```

Compute the hour and displayName before the return:
```ts
const currentHour = new Date().getUTCHours();
const displayName = statsError ? null : (userStats?.display_name ?? null);
```

Pass to `<Dashboard>`:
```tsx
<Dashboard
  ...existing props...
  displayName={displayName}
  currentHour={currentHour}
/>
```

- [ ] **Step 3: Update `Dashboard.tsx` to render Greeting**

Add to `DashboardProps`:
```ts
displayName: string | null;
currentHour: number;
```

Add import:
```ts
import { Greeting } from "@/components/dashboard/Greeting";
```

Add as the first `<motion.div>` child (before Hero):
```tsx
<motion.div variants={itemVariants}>
  <Greeting displayName={displayName} hour={currentHour} />
</motion.div>
```

- [ ] **Step 4: Verify visually**

Run dev server:
- Greeting appears above hero
- Shows "Good morning/afternoon/evening, [name]" or "Welcome back" if no name
- Animates in as part of the stagger

- [ ] **Step 5: Commit**

```bash
git add components/dashboard/Greeting.tsx components/dashboard/Dashboard.tsx "app/(app)/dashboard/page.tsx"
git commit -m "feat(dashboard): add personalized greeting with time-of-day (REQ-7)"
```

---

## Task 12: Activity Heatmap

**Files:**
- Create: `components/dashboard/ActivityHeatmap.tsx`
- Modify: `components/dashboard/Dashboard.tsx` (add Heatmap)
- Modify: `app/(app)/dashboard/page.tsx` (fetch activity data)

- [ ] **Step 1: Create `components/dashboard/ActivityHeatmap.tsx`**

```tsx
"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";

interface ActivityHeatmapProps {
  activityData: Record<string, number>;
}

function getIntensityClass(count: number): string {
  if (count === 0) return "bg-[var(--bg-elevated)]";
  if (count === 1) return "bg-brand-bright/20";
  if (count <= 3) return "bg-brand-bright/45";
  return "bg-brand-bright/75";
}

function buildGrid(activityData: Record<string, number>): { date: string; count: number }[][] {
  const today = new Date();
  const weeks: { date: string; count: number }[][] = [];

  const dayOfWeek = today.getUTCDay();
  const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const totalDays = 16 * 7;

  const startDate = new Date(today);
  startDate.setUTCDate(startDate.getUTCDate() - totalDays + (6 - adjustedDay));

  let currentWeek: { date: string; count: number }[] = [];

  for (let i = 0; i < totalDays + adjustedDay + 1; i++) {
    const d = new Date(startDate);
    d.setUTCDate(startDate.getUTCDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    const dow = d.getUTCDay();
    const mondayBased = dow === 0 ? 6 : dow - 1;

    if (mondayBased === 0 && currentWeek.length > 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }

    if (d <= today) {
      currentWeek.push({ date: dateStr, count: activityData[dateStr] ?? 0 });
    }
  }

  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  return weeks;
}

export function ActivityHeatmap({ activityData }: ActivityHeatmapProps) {
  const [tooltip, setTooltip] = useState<{ date: string; count: number } | null>(null);
  const weeks = buildGrid(activityData);
  const hasActivity = Object.values(activityData).some((v) => v > 0);

  return (
    <GlassCard className="p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-primary">Activity</h3>
        {tooltip && (
          <span className="text-xs text-secondary">
            {tooltip.date}: {tooltip.count} {tooltip.count === 1 ? "action" : "actions"}
          </span>
        )}
      </div>

      <div className="overflow-x-auto">
        <div className="flex gap-[3px]">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((day) => (
                <button
                  key={day.date}
                  type="button"
                  className={`h-3 w-3 rounded-sm ${getIntensityClass(day.count)} transition-colors duration-fast`}
                  onMouseEnter={() => setTooltip(day)}
                  onFocus={() => setTooltip(day)}
                  onMouseLeave={() => setTooltip(null)}
                  onBlur={() => setTooltip(null)}
                  aria-label={`${day.date}: ${day.count} actions`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {!hasActivity && (
        <p className="mt-3 text-xs text-muted">Your activity will show up here.</p>
      )}
    </GlassCard>
  );
}
```

- [ ] **Step 2: Add activity data query to `dashboard/page.tsx`**

Add a new query inside the existing `Promise.all` (or as a separate query after it):

```ts
const sixteenWeeksAgo = new Date();
sixteenWeeksAgo.setDate(sixteenWeeksAgo.getDate() - 16 * 7);
const cutoffDate = sixteenWeeksAgo.toISOString().slice(0, 10);

const activityResult = await supabase
  .from("progress")
  .select("last_visit_at, completed_at")
  .or(`last_visit_at.gte.${cutoffDate}T00:00:00Z,completed_at.gte.${cutoffDate}T00:00:00Z`);

const activityData: Record<string, number> = {};
for (const row of activityResult.data ?? []) {
  const visitDate = (row as { last_visit_at: string | null }).last_visit_at?.slice(0, 10);
  const completeDate = (row as { completed_at: string | null }).completed_at?.slice(0, 10);
  if (visitDate && visitDate >= cutoffDate) {
    activityData[visitDate] = (activityData[visitDate] ?? 0) + 1;
  }
  if (completeDate && completeDate >= cutoffDate && completeDate !== visitDate) {
    activityData[completeDate] = (activityData[completeDate] ?? 0) + 1;
  }
}
```

Pass to `<Dashboard>`:
```tsx
<Dashboard
  ...existing props...
  activityData={activityData}
/>
```

- [ ] **Step 3: Update `Dashboard.tsx` to render ActivityHeatmap**

Add to `DashboardProps`:
```ts
activityData: Record<string, number>;
```

Add import:
```ts
import { ActivityHeatmap } from "@/components/dashboard/ActivityHeatmap";
```

Add as the last `<motion.div>` child (after StatsStrip):
```tsx
<motion.div variants={itemVariants}>
  <ActivityHeatmap activityData={activityData} />
</motion.div>
```

- [ ] **Step 4: Verify visually**

Run dev server:
- Heatmap renders as a grid of small squares
- Hovering/focusing a cell shows the date + count
- Zero-state shows empty grid with "Your activity will show up here"
- Scrollable horizontally on narrow screens

- [ ] **Step 5: Commit**

```bash
git add components/dashboard/ActivityHeatmap.tsx components/dashboard/Dashboard.tsx "app/(app)/dashboard/page.tsx"
git commit -m "feat(dashboard): add activity heatmap with CSS grid (REQ-8)"
```

---

## Task 13: Tutor tooltip + final cleanup

**Files:**
- Modify: `components/layout/TopBar.tsx:62-67`
- Modify: `components/dashboard/Dashboard.tsx` (remove unused imports)

- [ ] **Step 1: Add tooltip to Tutor link in `TopBar.tsx`**

Update the Tutor `<Link>` (around line 62-67) to add a `title` attribute:

```tsx
<Link
  href={`/lessons/${resumeLessonSlug}?tutor=open`}
  onClick={() => trackDashboardEvent("tutor_opened", { from: "dashboard" })}
  className="rounded-md px-2.5 py-1.5 text-xs font-medium text-secondary transition-colors hover:bg-hover hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
  aria-label="Open AI tutor"
  title="AI tutor — get hints when you're stuck"
>
  Tutor
</Link>
```

- [ ] **Step 2: Clean up unused imports**

Check `Dashboard.tsx` for any remaining references to deleted components (PathMap, StageCard, ResumeCard). Remove any unused imports or type references.

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Lint and format**

Run: `npm run lint 2>&1 | tail -10`
Run: `npx prettier --write app/globals.css styles/tokens.css tailwind.config.ts components/Background.tsx components/ui/GlassCard.tsx components/dashboard/ lib/path.ts components/layout/TopBar.tsx components/layout/AppShell.tsx "app/(app)/layout.tsx" "app/(app)/dashboard/page.tsx" app/api/onboarding/route.ts lib/onboarding/types.ts`

- [ ] **Step 4: Run all tests**

Run: `npx vitest run 2>&1 | tail -15`
Expected: All tests pass (path.test.ts + existing resume.test.ts + curriculum.test.ts)

- [ ] **Step 5: Verify build**

Run: `npm run build 2>&1 | tail -10`
Expected: Build succeeds with no errors

- [ ] **Step 6: Commit**

```bash
git add components/layout/TopBar.tsx components/dashboard/Dashboard.tsx
git commit -m "feat(dashboard): add Tutor tooltip and clean up imports (REQ-11)"
```

---

## Task 14: Visual QA pass

This is a manual verification task. No code changes — just checking everything against `quality.md`.

- [ ] **Step 1: View at 360px width** — usable? No horizontal scroll? Tap targets don't overlap? Road is vertical?
- [ ] **Step 2: View at ~768px width** — road transitions cleanly to horizontal? No broken intermediate state?
- [ ] **Step 3: View at desktop width** — everything looks balanced and aligned?
- [ ] **Step 4: Toggle `prefers-reduced-motion: reduce`** in devtools — all animations disabled? Numbers show final values? Background orbs frozen? Node pulse stopped?
- [ ] **Step 5: Tab through all interactive elements** — focus ring visible on every one? Sensible tab order? Locked nodes reachable?
- [ ] **Step 6: Check contrast** — text over orb hotspots still readable? Body text ≥ 4.5:1? Large headings ≥ 3:1?
- [ ] **Step 7: Performance panel** — scroll while background animates. 60fps? No layout shift from count-up?
- [ ] **Step 8: Re-read each REQ** in `requirements.md` — confirm acceptance criteria are actually met

- [ ] **Step 9: Commit any fixes discovered during QA**

```bash
git add -A
git commit -m "fix(dashboard): address visual QA findings"
```

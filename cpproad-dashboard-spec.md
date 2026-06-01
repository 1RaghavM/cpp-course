# cpproad — Dashboard Spec

Implementation spec for the returning-learner dashboard. Written for Claude Code. Shares types and conventions with `cpproad-onboarding-spec.md` — read that first if `ModuleId` / `weeklyGoal` are unfamiliar.

---

## 1. Goal & non-goals

The dashboard is the screen a returning learner lands on after login. Its only job is to collapse "what do I do now?" into one obvious action and get them back into the editor. It is **not** an analytics screen.

**Optimize for:** time-to-resume (clicks from dashboard → writing code) and a visible sense of forward motion.

**Non-goals (do not build):** leaderboards, achievement walls, activity heatmaps as primary UI, social features, an admin/analytics view. Behavioral analytics live in an internal tool, not on the learner's screen.

**Hard rule:** the resume action is the single highest-emphasis element on the page. Nothing else competes with it visually.

---

## 2. Route & files

```
app/dashboard/page.tsx            # server component: fetch progress, render Dashboard
components/dashboard/
  Dashboard.tsx                   # client: layout + state orchestration
  TopBar.tsx
  ResumeCard.tsx                  # the hero
  PathMap.tsx
  StageCard.tsx
  StatsStrip.tsx
  StatCard.tsx
lib/dashboard/
  curriculum.ts                   # static curriculum definition (modules + lessons)
  resume.ts                       # computeResumeTarget, computeProgress
  types.ts
```

`/dashboard` is the post-login default route. Unauthenticated → redirect to `/login`. A learner mid-onboarding (no account yet) never reaches here; they finish onboarding first.

---

## 3. Data model

```ts
// lib/dashboard/types.ts
import type { ModuleId } from '@/lib/onboarding/types';

export type Stage = 'basics' | 'memory-oop' | 'stl-templates' | 'advanced';

export interface Lesson {
  id: string;            // stable slug, e.g. 'deref-pointers'
  moduleId: ModuleId;
  title: string;         // 'Dereferencing pointers'
  order: number;         // order within module
}

export interface Module {
  id: ModuleId;
  stage: Stage;
  title: string;         // 'Memory & OOP'
  order: number;         // global order across the path
  lessons: Lesson[];
}

export type LessonStatus = 'not_started' | 'in_progress' | 'completed';

export interface LessonProgress {
  lessonId: string;
  status: LessonStatus;
  lastCodeSnippet?: string;   // last editor buffer, for the resume preview
  updatedAt: string;          // ISO
}

export interface LearnerProgress {
  userId: string;
  lessonProgress: Record<string, LessonProgress>; // keyed by lessonId
  lastActiveLessonId: string | null;              // primary resume hint
  streakDays: number;
  lastActiveDate: string;                         // ISO date (no time)
  weeklyGoal: number | null;                      // from onboarding
  lessonsCompletedThisWeek: number;
  totalLessonsCompleted: number;
}
```

`curriculum.ts` exports the full `Module[]` (static, ordered). Total lesson count is derived from it, never hardcoded.

---

## 4. Derived values (`lib/dashboard/resume.ts`)

Pure functions, unit-tested. The dashboard renders entirely from these — no business logic in components.

```ts
// The single most important function.
export function computeResumeTarget(
  curriculum: Module[],
  progress: LearnerProgress
): Lesson {
  const ordered = flattenLessons(curriculum); // by module.order then lesson.order

  // 1. An explicitly in-progress lesson always wins.
  if (progress.lastActiveLessonId) {
    const last = ordered.find(l => l.id === progress.lastActiveLessonId);
    if (last && progress.lessonProgress[last.id]?.status === 'in_progress') return last;
  }
  // 2. Otherwise, first lesson not yet completed.
  const next = ordered.find(
    l => progress.lessonProgress[l.id]?.status !== 'completed'
  );
  // 3. Path finished → return last lesson (UI switches to "complete" state).
  return next ?? ordered[ordered.length - 1];
}

export function computePathPercent(curriculum, progress): number {
  // Math.round(completed / total * 100)
}

export function computeStageProgress(curriculum, progress, stage): {
  completed: number; total: number; status: 'done' | 'active' | 'locked';
}

export function isPathComplete(curriculum, progress): boolean;
```

Stage `status`: `done` when all lessons complete; `active` when it contains the resume target; `locked` otherwise. Exactly one stage is `active` at a time (unless the path is complete).

---

## 5. Layout & responsive behavior

Single column, centered, `max-width: 720px`. Vertical order top → bottom, which is also the emphasis order:

1. `TopBar` — slim, full width.
2. `ResumeCard` — hero. Strongest border, largest type, the only filled/primary button on the page.
3. `PathMap` — 4 `StageCard`s.
4. `StatsStrip` — 3 `StatCard`s.

Responsive:
- PathMap: 4 columns → 2 (`< 640px`) → 1 (`< 420px`). Use `grid-template-columns: repeat(auto-fit, minmax(150px, 1fr))`.
- StatsStrip: 3 columns → 1 (`< 480px`).
- ResumeCard: the code preview and button column stack vertically on narrow screens; the resume button stays full-width and above the fold.

Aesthetic matches the marketing site: clean, flat, monospace for code, generous whitespace, no gradients or shadows. If the codebase uses Tailwind, use existing tokens; otherwise CSS variables. Support dark mode.

---

## 6. Components

### TopBar
Slim row: `cpproad` wordmark + "· C++ path" · right side: streak chip (`flame` icon + number), Tutor button, avatar (initial in a circle).
- Tutor button opens the AI tutor. From the dashboard it routes to the resume lesson with the tutor panel open (`/learn/[lessonId]?tutor=open`).
- Streak chip is display-only here (detail lives in StatsStrip).

### ResumeCard (hero)
Props: `{ lesson: Lesson; module: Module; snippet?: string; variant: 'resume' | 'start' | 'complete' }`.

Layout: small uppercase-free label, then module name (secondary), lesson title (20px/500), a monospace code preview, and the action column.

| variant | When | Label | Title shown | Primary button | Secondary button |
|---|---|---|---|---|---|
| `resume` | in-progress lesson exists | "Pick up where you left off" | resume lesson | "Resume coding" → `/learn/[id]` | "Open scratch editor" |
| `start` | brand-new learner, 0 completed | "Start here" | first lesson (from onboarding `startModule`) | "Start lesson 1" → `/learn/[id]` | "Open scratch editor" |
| `complete` | path 100% done | "You finished the path" | — | "Open scratch editor" → `/sandbox` | "Review a topic" |

Code preview:
- `resume`: show `snippet` (last editor buffer) if present; else the first 2–3 lines of the lesson's starter code.
- `start` / `complete`: show a short, friendly stock snippet.
- Truncate to ~3 lines, monospace, muted, on a tinted background. Never scroll.

Primary button is the only solid/inverted button on the page (e.g. `background: text-primary; color: background-primary` so it inverts correctly in dark mode). Keep `aria-label` descriptive: "Resume: Dereferencing pointers".

### PathMap
Renders the four stages in fixed order: Basics → Memory & OOP → STL & Templates → Advanced. Header row: "Your path" + path percent.

### StageCard
Props: `{ stage: Stage; title: string; completed: number; total: number; status: 'done'|'active'|'locked' }`.
- `done`: check icon, success-colored fill bar at 100%, "N / N done".
- `active`: 2px info-colored border (the only 2px border on the page besides none), play icon, partial fill bar, "N / M · you're here".
- `locked`: lock icon, muted title, empty bar, "0 / M".
- Whole card is a button. Click → navigate to that stage's first non-completed lesson (or its first lesson if none started). `locked` stages are still clickable — cpproad does not gate content; locking is visual signaling only. Confirm this with the product owner; if hard-gating is wanted later, add an `enabled` flag rather than disabling clicks here.

### StatsStrip
Three `StatCard`s, secondary emphasis (filled secondary background, no border, smaller than the hero):
1. "This week" → `lessonsCompletedThisWeek / weeklyGoal`. If `weeklyGoal` is null, label reads just the count with no "/ goal".
2. "Lessons done" → `totalLessonsCompleted`.
3. "Day streak" → `streakDays`.

All numbers `Math.round`ed / integers. No progress rings, no confetti. This strip is a nudge, not a scoreboard — see §9.

---

## 7. States

| State | Trigger | Behavior |
|---|---|---|
| Loading | data fetching | Skeleton: greyed hero + 4 stage placeholders + 3 stat placeholders. No spinner-only screens. |
| First-time | `totalLessonsCompleted === 0` | ResumeCard `variant='start'`; stats show 0; Basics stage `active`, rest locked. |
| Returning (default) | in-progress or partial | ResumeCard `variant='resume'`. |
| Path complete | `isPathComplete` | ResumeCard `variant='complete'`; all stages `done`; optionally surface review slot (§10). |
| Error | fetch fails | Inline retry card in place of hero: "Couldn't load your progress." + Retry. Never a blank dashboard. |

Streak edge cases (compute server-side, pass down):
- `lastActiveDate === today` → streak unchanged.
- `lastActiveDate === yesterday` and they act today → +1.
- gap > 1 day → reset to current session (1). Do not show streak-loss shaming copy.

---

## 8. Interactions & routing

| Action | Route / effect | Analytics |
|---|---|---|
| Resume / Start button | `/learn/[lessonId]` | `resume_clicked { lessonId, moduleId, variant }` |
| Open scratch editor | `/sandbox` | `scratch_opened { from: 'dashboard' }` |
| Stage card | `/learn/[firstIncompleteLessonId]` | `stage_clicked { stage }` |
| Tutor (TopBar) | `/learn/[resumeLessonId]?tutor=open` | `tutor_opened { from: 'dashboard' }` |
| Review (complete variant) | `/learn/[reviewLessonId]` | `review_clicked` |
| Dashboard mount | — | `dashboard_viewed { state }` |

Prefetch the resume lesson route on dashboard load so "Resume" feels instant.

---

## 9. Engagement guardrails (requirements, not suggestions)

cpproad's audience skews intrinsically motivated, so gamification is tuned down on purpose:
- Weekly goal is a soft target from onboarding, shown with context (`2 / 3`), never a hard gate or a loss-aversion prompt.
- No streak-loss guilt copy, no red warnings, no "don't break your streak!" nags on the dashboard.
- No leaderboards or comparative ranking anywhere.
- The hero always offers a path to *writing code* (scratch editor) even when no lesson is queued, because output — lines written, challenges solved — is the real success metric, not lessons viewed.

If A/B testing later, the StatsStrip is the only safe place to experiment. The ResumeCard is not.

---

## 10. Future / optional (do not build now)

- "Recommended next" slot: a single spaced-repetition card surfacing one concept the learner got wrong, shown only when one exists. One item max — a suggestion, not another decision.
- A "code written" stat (lines or challenges solved) to replace or augment "Lessons done", once that data is tracked. This aligns stats with the output goal.

Leave clear extension points (`Dashboard` accepts an optional `recommended?: Lesson` prop) but don't render anything until the data exists.

---

## 11. Accessibility

- Each StageCard button has an `aria-label` like "Memory and OOP, 2 of 5 lessons complete, in progress".
- Resume button `aria-label` names the lesson.
- Progress bars use `role="progressbar"` with `aria-valuenow/min/max`.
- Color is never the only status signal — icons (check/play/lock) carry status too.
- Full keyboard navigation; visible focus rings; respects `prefers-reduced-motion` (no animated fills if set).

---

## 12. Acceptance criteria

- [ ] On login, learner lands on `/dashboard` and the resume target is correct per `computeResumeTarget` (in-progress lesson wins; else first incomplete; else complete state).
- [ ] Resume is reachable in exactly one click and prefetched.
- [ ] First-time, returning, complete, loading, and error states all render correctly.
- [ ] Path percent and per-stage progress are computed from curriculum, never hardcoded; adding a lesson to `curriculum.ts` updates all counts automatically.
- [ ] Exactly one stage shows `active` (unless path complete).
- [ ] `weeklyGoal === null` hides the "/ goal" suffix cleanly.
- [ ] Streak increments/resets per §7 rules; no shaming copy.
- [ ] No leaderboard, heatmap, or achievement wall present.
- [ ] Dark mode and the three responsive breakpoints verified.
- [ ] `resume.ts` pure functions covered by unit tests, including empty-progress and all-complete inputs.
- [ ] All analytics events from §8 fire with correct payloads.

---

## 13. Implementation notes

- Fetch `LearnerProgress` in the server component; pass to the client `Dashboard`. Keep `curriculum` static/bundled.
- All ordering flows from `module.order` + `lesson.order`. Never sort by object key order.
- Round every displayed number.
- Reuse onboarding tokens/components where they exist (button styles, card shell) for visual consistency.
- Match the marketing-site voice in copy: direct, plain, a little dry. No exclamation marks in default-state copy.

# Dashboard Design Spec

Returning-learner dashboard for cpproad. Replaces the existing chapter-based roadmap view with a resume-first, single-column dashboard optimized for time-to-resume.

Source spec: `cpproad-dashboard-spec.md`

---

## Decisions

| Question | Decision |
|---|---|
| Spec's 4-stage/16-module model vs existing 34-chapter DB | Static mapping layer in `curriculum.ts`; DB schema unchanged |
| Streak, weekly count, last code snippet | New `user_stats` table + `last_code_snippet` column on `progress` |
| TopBar vs existing AppHeader | TopBar replaces AppHeader globally for all `(app)` routes |
| `/sandbox` route | Skip the button entirely until `/sandbox` exists |
| Old roadmap view | Replace entirely; delete HomeLayout, ChapterSidebar, ChapterDetail, ContinueLearning |

---

## 1. Database changes

### New table: `user_stats`

```sql
CREATE TABLE user_stats (
  user_id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  streak_days      INT NOT NULL DEFAULT 0,
  last_active_date DATE,
  weekly_goal      INT,
  updated_at       TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own stats"  ON user_stats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users update own stats" ON user_stats FOR UPDATE USING (auth.uid() = user_id);
```

### New column on `progress`

```sql
ALTER TABLE progress ADD COLUMN last_code_snippet TEXT;
```

### Streak update logic

Lives in `POST /api/progress/[lesson_id]`, runs after every state change:

- `last_active_date === today` → no change
- `last_active_date === yesterday` → streak_days + 1, last_active_date = today
- gap > 1 day → streak_days = 1, last_active_date = today
- No `user_stats` row → insert with streak_days = 1

### Weekly completed count

Derived at query time, not stored:

```sql
SELECT COUNT(*) FROM progress
WHERE user_id = $1 AND state = 'completed'
AND completed_at >= date_trunc('week', CURRENT_DATE)
```

### `weekly_goal` duplication

Copied from `onboarding.weekly_goal` to `user_stats.weekly_goal` during account creation. Avoids a second table join on every dashboard load.

### `last_code_snippet` writes

Added to `POST /api/submissions` — after a successful submission, update `progress.last_code_snippet` with the submitted source code.

---

## 2. Static curriculum mapping

File: `lib/dashboard/curriculum.ts`

A static `ModuleDefinition[]` maps existing chapter IDs into 16 modules across 4 stages. The DB schema is unchanged — the mapping is purely in code.

```ts
type Stage = 'basics' | 'memory-oop' | 'stl-templates' | 'advanced';

interface ModuleDefinition {
  id: ModuleId;
  stage: Stage;
  title: string;
  order: number;       // global order 1–16
  chapterIds: number[];
}
```

Each module maps to one or more chapter IDs. Lessons within a module are the union of all lessons in its chapters, ordered by `sort_order`.

Exports:
- `CURRICULUM: ModuleDefinition[]` — static, 16 entries
- `buildCurriculum(dbLessons): Module[]` — resolves chapter IDs against fetched lesson rows, produces runtime `Module[]` with nested `Lesson[]`
- `flattenLessons(curriculum): Lesson[]` — all lessons in global order

Total lesson count, per-module count, per-stage count are all derived from the curriculum, never hardcoded.

Runtime types in `lib/dashboard/types.ts`:

```ts
interface Lesson {
  id: string;
  moduleId: ModuleId;
  title: string;
  slug: string;
  order: number;
}

interface Module {
  id: ModuleId;
  stage: Stage;
  title: string;
  order: number;
  lessons: Lesson[];
}
```

---

## 3. Pure business logic

File: `lib/dashboard/resume.ts`

All dashboard state derives from pure functions. No side effects, no DB calls.

### `computeResumeTarget(curriculum, progress, lastActiveLessonId) → Lesson`

1. If `lastActiveLessonId` points to an `in_progress` lesson, return it.
2. Otherwise, first lesson (global order) not yet completed.
3. If all completed, return the last lesson (UI switches to `complete` variant).

`lastActiveLessonId` is the lesson with the most recent `last_visit_at` among `in_progress` lessons. Computed at query time in the server component.

### `computeResumeVariant(curriculum, progress) → 'resume' | 'start' | 'complete'`

- `totalLessonsCompleted === 0` → `'start'`
- `isPathComplete()` → `'complete'`
- else → `'resume'`

### `computePathPercent(curriculum, progress) → number`

`Math.round(completedCount / totalCount * 100)`

### `computeStageProgress(curriculum, progress, stage) → { completed, total, status }`

- `done`: all lessons complete
- `active`: contains the resume target
- `locked`: otherwise
- Exactly one stage is `active` at a time (unless path complete)

### `isPathComplete(curriculum, progress) → boolean`

Every lesson has status `completed`.

### `computeStreakDays(lastActiveDate, today) → number`

Pure validation of stored streak. Today → stored value. Yesterday → stored value. Gap > 1 → 0.

### `computeWeeklyCompleted(progressRecords, today) → number`

Counts records with `completed_at` in the current ISO week (Monday–Sunday).

### Input type

```ts
interface DashboardProgress {
  lessonProgress: Map<string, {
    status: LessonStatus;
    lastCodeSnippet?: string;
    lastVisitAt: string;
  }>;
  streakDays: number;
  lastActiveDate: string | null;
  weeklyGoal: number | null;
  totalLessonsCompleted: number;
  lessonsCompletedThisWeek: number;
}
```

---

## 4. Server component data fetching

File: `app/(app)/dashboard/page.tsx`

### Parallel queries via `Promise.all`

1. **Lessons** — `serviceClient.from('lessons').select(...)` — build curriculum
2. **Progress** — `supabase.from('progress').select(...)` — per-user via RLS
3. **User stats** — `supabase.from('user_stats').select(...).single()` — per-user via RLS
4. **Onboarding** — `supabase.from('onboarding').select('start_module').single()` — for `start` variant

### Assembly

- `buildCurriculum(dbLessons)` → `Module[]`
- Map progress rows into `DashboardProgress`
- Find `lastActiveLessonId` from most recent `last_visit_at` among in-progress lessons
- Compute resume target and variant server-side (pure functions)

### Passed to client

```tsx
<Dashboard
  curriculum={curriculum}
  progress={dashboardProgress}
  resumeTarget={computeResumeTarget(...)}
  resumeVariant={computeResumeVariant(...)}
  startModule={onboarding?.start_module ?? null}
/>
```

### Error handling

- Full fetch failure → pass `error: true`, render retry card
- Partial failure (stats only) → degrade gracefully, StatCards show "—"
- Retry triggers `router.refresh()`

---

## 5. Component tree

```
Dashboard (client, components/dashboard/Dashboard.tsx)
├── TopBar (components/layout/TopBar.tsx — replaces AppHeader globally)
│   ├── Wordmark ("cpproad · C++ path")
│   ├── Streak chip (flame icon + number)
│   ├── Tutor button → /lessons/[resumeSlug]?tutor=open
│   └── Avatar (initial in circle, dropdown with email + sign out)
├── ResumeCard (hero, components/dashboard/ResumeCard.tsx)
│   ├── Label + module name + lesson title
│   ├── Code preview (monospace, 3 lines, bg-elevated)
│   └── Primary button (only solid/inverted button on page)
├── PathMap (components/dashboard/PathMap.tsx)
│   ├── Header ("Your path" + path percent)
│   └── 4× StageCard (components/dashboard/StageCard.tsx)
│       ├── Icon (check / play / lock)
│       ├── Title + progress bar (role="progressbar")
│       └── Count ("N / M done" or "you're here")
└── StatsStrip (components/dashboard/StatsStrip.tsx)
    └── 3× StatCard (components/dashboard/StatCard.tsx)
        ├── "This week" — N / goal (or just N if weeklyGoal is null)
        ├── "Lessons done" — totalLessonsCompleted
        └── "Day streak" — streakDays
```

### TopBar integration

TopBar replaces `AppHeader` in `AppShell`. `(app)/layout.tsx` extends its query to include `user_stats` and compute resume slug, passing `streakDays`, `resumeLessonSlug`, and user email/initial to `AppShell` → `TopBar`.

The progress bar from AppHeader is removed globally. Path percent is shown only in PathMap on the dashboard.

### ResumeCard variants

| variant | When | Label | Primary button |
|---|---|---|---|
| `resume` | in-progress lesson exists | "Pick up where you left off" | "Resume coding" → `/lessons/[slug]` |
| `start` | 0 lessons completed | "Start here" | "Start lesson 1" → `/lessons/[slug]` |
| `complete` | path 100% done | "You finished the path" | "Review a topic" → `/lessons/[lastLessonSlug]` |

No secondary button on any variant (sandbox deferred). The `complete` variant's primary button is "Review a topic" — a soft re-entry point, not a sandbox link.

Code preview: `resume` shows `lastCodeSnippet` or starter code; `start`/`complete` show a stock snippet.

### StageCard click

Navigates to `/lessons/[slug]` where slug is the first non-completed lesson in that stage. If all complete, navigates to the stage's first lesson. Locked stages are clickable (visual signaling only).

---

## 6. Styling and responsive behavior

### Layout

Single column, `max-w-[720px] mx-auto`, vertical stack.

### Design tokens

Uses existing CSS variables and Tailwind tokens from `globals.css` / `tailwind.config.ts`. No new tokens.

### ResumeCard

- `border-border-subtle bg-surface` — strongest visual weight
- Primary button: `bg-white text-black` (same as existing ContinueLearning button)
- Code preview: `bg-elevated font-mono text-sm text-muted line-clamp-3`
- Narrow (`< 640px`): code preview and button stack vertically, button full-width

### PathMap

- `grid-template-columns: repeat(auto-fit, minmax(150px, 1fr))` — naturally responsive: 4 → 2 → 1 columns

### StageCard states

- `done`: check icon `text-success`, fill bar 100% `bg-success`, normal border
- `active`: 2px `border-accent`, play icon `text-accent`, partial fill `bg-accent`
- `locked`: lock icon `text-muted`, muted title, empty bar, default border

### StatsStrip

- `grid grid-cols-3` → `grid-cols-1` at `< 480px`
- StatCard: `bg-elevated rounded-lg p-4`, no border, `font-mono tabular-nums`

### Dark mode

App is dark-only. All styling uses CSS variable tokens. Light mode support is automatic if variables are later overridden.

### Animation

Reuse existing `reveal` / `reveal-d1` etc. classes for staggered entry. `motion-safe:` prefix respects `prefers-reduced-motion`. Progress bar fills use `transition-all duration-500`.

---

## 7. States

| State | Condition | Behavior |
|---|---|---|
| Loading | Server component suspense | Skeleton: grey hero + 4 stage placeholders + 3 stat placeholders. `loading.tsx`. |
| First-time | `totalLessonsCompleted === 0` | ResumeCard `start`, stats show 0, Basics `active`, rest `locked` |
| Returning | In-progress or partial | ResumeCard `resume`, active stage highlighted |
| Path complete | `isPathComplete()` | ResumeCard `complete`, all stages `done` |
| Error | Fetch fails | Inline retry card replaces hero. PathMap + StatsStrip hidden. |

### Streak edge cases

- `lastActiveDate === today` → streak unchanged
- `lastActiveDate === yesterday` + activity today → +1
- gap > 1 day → reset to 1
- No streak-loss guilt copy, no red warnings

### Partial error degradation

Stats query fails → StatCards show "—". Progress query fails → full error state.

---

## 8. Analytics and routing

### Events

| Event | Trigger | Payload |
|---|---|---|
| `dashboard_viewed` | Dashboard mounts | `{ state }` |
| `resume_clicked` | Primary button | `{ lessonId, moduleId, variant }` |
| `stage_clicked` | StageCard click | `{ stage, targetLessonId }` |
| `tutor_opened` | Tutor button in TopBar | `{ from: 'dashboard' }` |
| `review_clicked` | Review on complete variant | `{ lessonId }` |

`scratch_opened` deferred until `/sandbox` exists.

Implementation: `lib/dashboard/analytics.ts`, matches pattern from `lib/onboarding/analytics.ts`.

### Routing

| Action | Destination |
|---|---|
| Resume / Start | `/lessons/[slug]` |
| StageCard | `/lessons/[firstIncompleteSlug]` |
| Tutor (TopBar) | `/lessons/[resumeSlug]?tutor=open` |
| Review | `/lessons/[slug]` |
| Sign out | `/login` |

Prefetch resume lesson route on Dashboard mount via `router.prefetch()`.

---

## 9. Accessibility

- `aria-label` on ResumeCard button names the lesson
- `aria-label` on StageCard: "{title}, {n} of {m} lessons complete, {status}"
- Progress bars: `role="progressbar"` with `aria-valuenow/min/max`
- Color never the sole status signal — icons (check/play/lock) carry status
- Full keyboard navigation, visible `focus-visible:ring-2 ring-accent ring-offset-2 ring-offset-base`
- `motion-safe:` on all animations
- All interactive elements are `<button>` or `<a>`, no `onClick` on `<div>`

---

## 10. Testing

Tests only where they prevent silent bugs. Pure functions in `resume.ts` and `curriculum.ts`.

### `__tests__/dashboard/resume.test.ts`

- Empty progress → returns first lesson, variant `start`
- One in-progress → returns that lesson
- Partial completion, no in-progress → first non-completed
- All completed → last lesson, variant `complete`, `isPathComplete` true
- `computePathPercent` — 0%, partial, 100%
- `computeStageProgress` — each status, exactly one `active`
- `computeStreakDays` — today, yesterday, gap
- `computeWeeklyCompleted` — week boundaries

### `__tests__/dashboard/curriculum.test.ts`

- `buildCurriculum` produces 16 modules
- Every lesson belongs to exactly one module
- `flattenLessons` order matches global sort_order
- Total lesson count matches input

No tests for: components, analytics events, server component queries, streak API logic.

---

## 11. Files changed

### Created

| File | Purpose |
|---|---|
| `lib/dashboard/types.ts` | Stage, Module, Lesson, DashboardProgress types |
| `lib/dashboard/curriculum.ts` | Static mapping + buildCurriculum + flattenLessons |
| `lib/dashboard/resume.ts` | Pure business logic functions |
| `lib/dashboard/analytics.ts` | Typed analytics event functions |
| `components/dashboard/Dashboard.tsx` | Client layout orchestrator |
| `components/dashboard/ResumeCard.tsx` | Hero resume card |
| `components/dashboard/PathMap.tsx` | 4-stage path visualization |
| `components/dashboard/StageCard.tsx` | Individual stage card |
| `components/dashboard/StatsStrip.tsx` | 3-stat strip |
| `components/dashboard/StatCard.tsx` | Individual stat card |
| `components/layout/TopBar.tsx` | Global header replacement |
| `app/(app)/dashboard/loading.tsx` | Streaming skeleton |
| `infra/supabase/migrations/XXX_user_stats.sql` | New table + progress column |
| `__tests__/dashboard/resume.test.ts` | Resume logic unit tests |
| `__tests__/dashboard/curriculum.test.ts` | Curriculum mapping tests |

### Modified

| File | Change |
|---|---|
| `app/(app)/dashboard/page.tsx` | Rewritten: new queries, new component |
| `app/(app)/layout.tsx` | Extended query for TopBar data |
| `components/layout/AppShell.tsx` | Renders TopBar instead of AppHeader |
| `app/api/submissions/route.ts` | Writes last_code_snippet |
| `app/api/progress/[lesson_id]/route.ts` | Adds streak update logic |
| `lib/supabase/types.ts` | Add user_stats, last_code_snippet |

### Deleted

| File | Reason |
|---|---|
| `components/home/HomeLayout.tsx` | Replaced by Dashboard |
| `components/home/ChapterSidebar.tsx` | No longer needed |
| `components/home/ChapterDetail.tsx` | No longer needed |
| `components/home/ContinueLearning.tsx` | Absorbed into ResumeCard |
| `components/layout/AppHeader.tsx` | Replaced by TopBar |

No backwards compatibility shims. Clean cut.

---

## Engagement guardrails

- Weekly goal is a soft target, shown as `N / M`, never a hard gate or loss-aversion prompt
- No streak-loss guilt copy, no red warnings, no "don't break your streak" nags
- No leaderboards or comparative ranking
- The hero always offers a path to writing code
- StatsStrip is the only safe place for future A/B experiments; ResumeCard is not

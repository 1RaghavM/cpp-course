# Dashboard Redesign — Design Spec

Consolidated design for the cpproad dashboard redesign. Merges the original spec files (`dashboard-specs/`) with decisions made during brainstorming. This is the implementation source of truth.

Companion files: `dashboard-specs/requirements.md` (acceptance criteria), `dashboard-specs/quality.md` (definition of done), `dashboard-specs/steering.md` (scope rules).

---

## 1. Approach

**Token overlay + incremental component swap.** Extend the existing `globals.css` token layer with new variables. Build new components, refit existing ones onto `GlassCard`. No breaking changes to pages outside the dashboard. Other pages can adopt the new tokens later.

## 2. Decisions log

| Question | Decision | Rationale |
|---|---|---|
| User name source | `display_name TEXT` on `user_stats`, set during onboarding | No auth metadata dependency, onboarding already writes to this table |
| "You're here" logic | Tracks last-visited lesson (`last_visit_at`), not first incomplete | Users jump around freely; resume pointer should reflect actual activity |
| Stage locking | Soft lock — dimmed but clickable, shows prereq hint popup | Don't gate learning; nudge, don't block |
| Prereq popup content | Curated hint string per stage (`getPrereqHint`) | Feels crafted, not algorithmic |
| Heatmap data | Any activity: visits (`last_visit_at`), completions (`completed_at`) | Fuller grid is more motivating early on |
| Fonts | Keep Geist Sans + Geist Mono everywhere | Already loaded, no extra font weight |
| Background scope | App-wide in `(app)/layout.tsx` | Atmosphere is part of the product identity |

## 3. Token layer

Extend `globals.css` `:root`. Existing tokens stay untouched except `--bg-base` which shifts from `#0a0a0a` to `#07090D` (blue-cast near-black, feeds the app-wide Background).

New tokens:

```css
/* glass */
--glass-fill:     rgba(255,255,255,0.04);
--glass-fill-hi:  rgba(255,255,255,0.06);
--glass-border:   rgba(255,255,255,0.08);
--glass-shadow:   0 8px 32px rgba(0,0,0,0.45);
--glass-blur:     16px;

/* brand */
--brand:          #00599C;
--brand-bright:   #2B8FE6;
--accent-cyan:    #38BDF8;
--glow-blue:      rgba(43,143,230,0.45);
--glow-cyan:      rgba(56,189,248,0.30);

/* node states */
--node-locked:    #1A2029;
--node-active:    var(--brand-bright);
--node-complete:  var(--brand);

/* streak */
--streak:         #FF8A3D;

/* shape + motion */
--radius-card:    18px;
--radius-node:    50%;
--ease:           cubic-bezier(0.22, 1, 0.36, 1);
--dur-fast:       180ms;
--dur-med:        320ms;
--dur-slow:       560ms;
--stagger:        70ms;
```

Tailwind config gets new mappings for all added tokens. Existing mappings untouched.

## 4. Background component

`components/Background.tsx`, rendered once in `app/(app)/layout.tsx` as a fixed-position element behind all content.

**Layer A — Blueprint grid.** CSS `background-image` gradients (horizontal + vertical lines) at ~3-4% opacity. Masked with a radial gradient so it fades toward the edges.

```css
background-image:
  linear-gradient(var(--grid-line) 1px, transparent 1px),
  linear-gradient(90deg, var(--grid-line) 1px, transparent 1px);
background-size: 28px 28px;
```

**Layer B — Ambient glows.** Two large, blurred radial gradient orbs (`--glow-blue` top-right, `--glow-cyan` lower-left). Animate position/opacity on 20-40s CSS animation loops using `transform`/`opacity` only (no layout thrash).

Under `prefers-reduced-motion: reduce`: orbs render at static positions, no animation loop.

Pure CSS, no JS, no canvas.

## 5. GlassCard primitive

`components/ui/GlassCard.tsx`. Single source of card styling for the entire dashboard.

- `background: var(--glass-fill)` + `backdrop-filter: blur(var(--glass-blur))`
- `border: 1px solid var(--glass-border)`, `border-radius: var(--radius-card)`, `box-shadow: var(--glass-shadow)`
- Hover: fill brightens to `--glass-fill-hi`, `translateY(-2px)` lift, `--dur-fast` transition
- Accepts `as` prop for semantic element (`div`, `article`, `section`, `a`)
- Passes through `className` and `children`

## 6. Hero (ResumeCard refit)

`components/dashboard/Hero.tsx` (renamed from `ResumeCard`). Composes `GlassCard`.

- Eyebrow: uppercase, `tracking-wide`, muted text ("START HERE" / "PICK UP WHERE YOU LEFT OFF" / "PATH COMPLETE")
- Module name + lesson title below eyebrow
- Code preview: `react-syntax-highlighter` with dark theme tuned to token palette. Bottom `mask-image: linear-gradient(to bottom, black 60%, transparent)` gradient fade. Never raw-clips a line.
- CTA: `--brand-bright` fill, white text, arrow icon translates `+4px` on hover (`--dur-fast`)
- Highest-contrast element in zero state: brightest glass fill, largest padding
- Consumes same `ResumeVariant` type for start/resume/complete states

## 7. The Road

### 7.1 Data layer — `lib/path.ts`

Pure functions, unit-testable. Replaces stage logic currently in `resume.ts`.

**`deriveStageStates(curriculum, progress, lastVisitedLessonId)`** returns `StageState[]`:
- "Completed" = all lessons in the stage are completed/skipped
- "Active" = stage containing the user's last-visited lesson (from `last_visit_at`). Takes priority over "locked" — if the user jumped to a later stage, it shows as active regardless of prior stage progress.
- "Locked" = the immediately preceding stage has 0 completions AND this stage is not active (soft lock, visual only — clickable with prereq hint)
- Zero-progress fallback: first stage is always active
- A stage can only be one state. Priority: completed > active > locked > default (unlocked, no special treatment)

**`getPrereqHint(stageId: Stage): string`** — static map of curated hint strings:
- `basics`: (none, first stage is never locked)
- `memory-oop`: "This section builds on variables, control flow, and functions from Basics."
- `stl-templates`: "You'll want to be comfortable with classes, pointers, and references first."
- `advanced`: "Assumes familiarity with OOP, templates, and the standard library."

### 7.2 Road component

`components/dashboard/Road.tsx` + `components/dashboard/RoadNode.tsx`. Replaces `PathMap` + `StageCard`.

**Structure:** `<ol>` of `RoadNode` elements connected by an SVG `<path>` track line. Filled portion uses `--brand` → `--accent-cyan` gradient; remaining uses `--node-locked`.

**Track:** SVG with `stroke-dasharray`/`stroke-dashoffset` for fill-reveal animation on load.

**Node states (by luminance):**
- *Completed:* solid `--node-complete`, check glyph, full-bright label
- *Active:* `--node-active` with soft outer glow ring + continuous gentle pulse (~2.4s CSS keyframes), brightest label, "you're here" tag
- *Locked:* `--node-locked`, lock glyph, `--text-muted` label, reduced opacity

**Each node shows:** stage title, lesson count in Geist Mono (`0 / 75`), state icon.

**Interaction:**
- Hover/focus: slight scale + ring brighten (`--dur-fast`)
- Click (unlocked): routes to the stage's first incomplete lesson
- Click (locked): dismissible popover with `getPrereqHint()` text + "Continue anyway" button that routes through

**Responsive:** Mobile-first vertical road (< 768px, top-to-bottom), horizontal at >= 768px. No broken intermediate state during transition.

## 8. StatCard & StatsStrip

`components/dashboard/StatCard.tsx` refitted onto `GlassCard`. Big Geist Mono number, label, optional sublabel.

**Zero-state copy (REQ-1) — no lone "0" anywhere:**
- "This week": `"0 / {weeklyGoal} — first one's the hardest"` (or `"0 so far"` if no goal set)
- "Lessons done": `"Day 1"`
- "Day streak": `"Start today"`

Populated state uses the same component — no separate zero-state code path.

**Streak treatment (REQ-10):** When `streakDays > 0`, flame SVG icon with slow flicker animation (opacity/scale, ~3s CSS keyframes loop). When 0, dormant flame icon with "Start today" text.

Numbers count up on entry (see Section 10 — Motion).

## 9. Greeting & Activity Heatmap

### 9.1 Greeting (REQ-7)

`components/dashboard/Greeting.tsx`. Server-side time-of-day message + `display_name`.

- "Good morning, Raghav" / "Good afternoon, Raghav" / "Good evening, Raghav"
- Cutoffs: morning = before 12:00, afternoon = 12:00–16:59, evening = 17:00+
- When `display_name` is null/empty: "Welcome back"
- Time-of-day derived server-side from response timestamp (UTC is fine — greeting is ambient, not precise)

### 9.2 Activity Heatmap (REQ-8)

`components/dashboard/ActivityHeatmap.tsx`. Composes `GlassCard`.

**Data:** Server-side query aggregates activity by date — `progress.last_visit_at` and `progress.completed_at` grouped by day, last 16 weeks. Passed as `Record<string, number>` (date string → count).

**Rendering:** CSS grid, 7 rows (Mon–Sun) × N week columns. Small rounded squares. Intensity mapped to `--brand-bright` at 4 opacity levels (0, 1, 2–3, 4+). No charting library.

**Interaction:** Hover/focus on cell shows tooltip with date and count. Tooltip accessible via focus, not hover-only.

**Zero state:** All cells at empty tint, panel present. Subtle label: "Your activity will show up here."

### 9.3 Tutor label (REQ-11)

Existing "Tutor" link in `TopBar` gets `title` attribute + focus-visible tooltip: "AI tutor — get hints when you're stuck." Labeling only, no new functionality.

## 10. Motion specification (REQ-9)

Library: `motion` (v12, already installed). All animations gated by `prefers-reduced-motion`.

**Load reveal.** `motion` `staggerChildren`. Order: greeting → hero → road → stats → heatmap. Each section: `opacity 0→1`, `translateY 12px→0`, `--dur-med` (320ms), `--stagger` (70ms) between. Replaces current CSS `reveal` keyframe classes.

**Count-up.** Stat numbers animate 0 → value over `--dur-slow` (560ms), ease-out. `useMotionValue` + `useTransform` or `useSpring`. Geist Mono `tabular-nums` keeps width stable.

**Track fill.** Road SVG `stroke-dashoffset` animates to progress value over `--dur-slow`, triggered on viewport entry.

**Active node pulse.** CSS `@keyframes`, ~2.4s loop, subtle glow/scale oscillation on outer ring. Not JS-driven.

**Hover micro-interactions:**
- `GlassCard`: `translateY(-2px)` lift + fill brighten — `--dur-fast`
- `RoadNode`: slight scale + ring brighten — `--dur-fast`
- CTA arrow: `translateX(4px)` — `--dur-fast`

**Reduced motion.** `useReducedMotion()` from `motion` gates all JS animations. Background orbs frozen via CSS `@media (prefers-reduced-motion: reduce)`. Everything renders at final state instantly.

## 11. Data flow & schema

### 11.1 Schema change

One migration: add `display_name TEXT` to `user_stats`. Inherits existing RLS policy.

### 11.2 Onboarding update

`/api/onboarding` route writes `display_name` to `user_stats` alongside existing streak/weekly-goal fields. Name sourced from an input added to an existing onboarding step.

### 11.3 Dashboard server component

`dashboard/page.tsx` adjustments:
- Fetch `display_name` from existing `user_stats` query (add column to select)
- New query: aggregate activity data for heatmap from `progress` table, grouping `last_visit_at` and `completed_at` by date, last 16 weeks
- Use `lastActiveLessonId` (already computed) with new `deriveStageStates` from `lib/path.ts`
- Pass `displayName`, `activityData`, and updated stage states to client `Dashboard` component

No new API routes. No changes to existing API routes.

## 12. File structure

```
app/(app)/layout.tsx                  # add Background component
app/(app)/dashboard/page.tsx          # updated server component
components/Background.tsx             # grid + ambient orbs (app-wide)
components/ui/GlassCard.tsx           # glass card primitive
components/dashboard/
  Dashboard.tsx                       # updated composition
  Hero.tsx                            # replaces ResumeCard
  Road.tsx                            # replaces PathMap
  RoadNode.tsx                        # replaces StageCard
  StatCard.tsx                        # refitted onto GlassCard
  StreakCard.tsx                       # StatCard variant with flame
  StatsStrip.tsx                      # updated wrapper
  Greeting.tsx                        # time-of-day + name
  ActivityHeatmap.tsx                 # CSS grid heatmap
lib/path.ts                           # stage state derivation + prereq hints
styles/tokens.css                     # new token block (imported by globals.css)
```

Old files removed after migration: `components/dashboard/PathMap.tsx`, `components/dashboard/StageCard.tsx`, `components/dashboard/ResumeCard.tsx`.

## 13. Build order

Matches `steering.md`'s commit story. Each step verified against `quality.md` before moving on.

1. **Tokens + Background.** New token file, extend globals.css + Tailwind config, Background component in `(app)/layout.tsx`.
2. **GlassCard + Hero + StatCard.** Build `GlassCard` primitive. Refit `ResumeCard` → `Hero` and `StatCard` onto it. Code preview fix (mask). Zero-state copy.
3. **`lib/path.ts` + Road.** Stage state derivation with last-visited logic. `Road` + `RoadNode` components. Prereq hint popup. Remove `PathMap` + `StageCard`.
4. **Motion pass.** Load reveal with `motion` stagger. Count-up. Track fill animation. Active node pulse. Hover micro-interactions. Reduced-motion gating.
5. **Heatmap + Greeting + polish.** `ActivityHeatmap` (data query + CSS grid). `Greeting` (display_name + time-of-day). Streak flame treatment. Tutor label tooltip. Schema migration for `display_name`. Onboarding update.

## 14. Out of scope

Per `steering.md`:
- No new lesson content or lesson player changes
- No Tutor feature behavior changes (label/affordance only)
- No backend/API changes beyond the `display_name` column and heatmap query
- No light theme
- No changes to auth, routing, or unrelated pages (except `--bg-base` token shift and Background in layout)

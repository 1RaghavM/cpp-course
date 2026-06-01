# Dashboard Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the 7 items in `fixes.md` — make stat cards show real data, fix the invisible road track, polish the heatmap with labels/legend, and widen/center the desktop layout.

**Architecture:** Four files changed. Data-layer fix first (page.tsx + Dashboard.tsx) so stats are correct before visual fixes land. Then Road.tsx SVG fix, then ActivityHeatmap.tsx polish, then layout width bump. FIX-4 (greeting) and FIX-7 (Tutor tooltip) are already landed — verify only.

**Tech Stack:** Next.js 14 App Router, React, Tailwind CSS, Supabase, Motion (framer-motion), SVG

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `app/(app)/dashboard/page.tsx` | Modify | FIX-1: treat missing user_stats as defaults, not error. FIX-6: bump error-fallback max-width. |
| `components/dashboard/Dashboard.tsx` | Modify | FIX-1: remove em-dash fallback branch. FIX-6: bump max-width, add w-full. |
| `components/dashboard/Road.tsx` | Modify | FIX-3: add viewBox to TrackSVG, fix z-index, bump stroke width, add entrance animation class. |
| `app/globals.css` | Modify | FIX-3: add `@keyframes road-fill` and reduced-motion rule. |
| `components/dashboard/ActivityHeatmap.tsx` | Modify | FIX-5: add month labels, weekday markers, intensity legend. |

---

### Task 1: FIX-1/2 — Make stats resilient to missing user_stats row

**Files:**
- Modify: `app/(app)/dashboard/page.tsx:53-62,96-101,125-127,144`
- Modify: `components/dashboard/Dashboard.tsx:29,111-121`

- [ ] **Step 1: Fix page.tsx — treat missing user_stats as safe defaults**

In `app/(app)/dashboard/page.tsx`, replace the statsResult error handling and userStats derivation. The `.single()` call returns error code `PGRST116` when no row exists — that's not a real error, it's a new user.

Replace lines 53-62 (the Promise.all and error checks):

```tsx
  // Keep the existing Promise.all on lines 41-53 as-is.
  // Replace the error handling block (lines 55-62) with:

  if (lessonsResult.error || progressResult.error) {
    fetchError = true;
  }

  const isMissingStats =
    statsResult.error?.code === "PGRST116" || (!statsResult.error && !statsResult.data);

  if (statsResult.error && !isMissingStats) {
    statsError = true;
  }
```

Then replace the `userStats` type assertion (lines 96-101) with:

```tsx
  const userStats = (isMissingStats ? null : statsResult.data) as {
    streak_days: number;
    last_active_date: string | null;
    weekly_goal: number | null;
    display_name: string | null;
  } | null;
```

No changes needed to `streakDays` computation (line 125-127) or `displayName` (line 144) — they already handle `null` userStats. But `statsError` is now only `true` for genuine DB failures, so the downstream code won't short-circuit on a missing row.

- [ ] **Step 2: Fix Dashboard.tsx — remove em-dash fallback, always render StatsStrip**

In `components/dashboard/Dashboard.tsx`, remove the `statsError` prop from the interface (line 29) and remove the entire conditional branch (lines 111-121) that renders em-dashes.

Remove from `DashboardProps` interface:

```tsx
  statsError?: boolean;
```

Replace the stats `<motion.div>` block (lines 102-130) with:

```tsx
        <motion.div variants={itemVariants}>
          <StatsStrip
            lessonsCompletedThisWeek={progress.lessonsCompletedThisWeek}
            weeklyGoal={progress.weeklyGoal}
            totalLessonsCompleted={progress.totalLessonsCompleted}
            streakDays={progress.streakDays}
          />
        </motion.div>
```

Then in `app/(app)/dashboard/page.tsx`, remove the `statsError` prop from the `<Dashboard>` JSX (around line 188):

Remove this line from the Dashboard component call:

```tsx
      statsError={statsError}
```

- [ ] **Step 3: Build and verify no TypeScript errors**

Run: `npx tsc --noEmit`
Expected: Clean exit, no errors related to `statsError` or `Dashboard` props.

- [ ] **Step 4: Verify in browser**

Run: `npm run dev`
Open dashboard in browser. Confirm:
- Stat cards show real values (or motivating zero copy), never em-dashes.
- Greeting shows the user's name if `display_name` is set (FIX-4 verified).

- [ ] **Step 5: Commit**

```bash
git add app/\(app\)/dashboard/page.tsx components/dashboard/Dashboard.tsx
git commit -m "fix(dashboard): make stats resilient to missing user_stats row (FIX-1, FIX-2)

Treat a missing user_stats row as safe defaults (streak 0, no name, no goal)
instead of triggering statsError. Remove the em-dash fallback branch that
bypassed StatsStrip. Stat cards now always render real values or motivating
zero-state copy.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 2: FIX-3 — Fix road track SVG rendering

**Files:**
- Modify: `components/dashboard/Road.tsx:13-93`
- Modify: `app/globals.css:109-120`

- [ ] **Step 1: Add @keyframes road-fill to globals.css**

In `app/globals.css`, add the keyframe before the existing `@media (prefers-reduced-motion)` block (before line 110):

```css
@keyframes road-fill {
  from {
    stroke-dashoffset: var(--track-length);
  }
  to {
    stroke-dashoffset: var(--track-offset);
  }
}
```

Then inside the existing `@media (prefers-reduced-motion: reduce)` block, add:

```css
  .road-fill-animate {
    animation: none !important;
  }
```

- [ ] **Step 2: Fix TrackSVG in Road.tsx — horizontal (desktop)**

Replace the horizontal SVG (the `if (!vertical)` / else branch, lines 54-93) with:

```tsx
  const width = 100;
  return (
    <svg
      className="absolute left-0 top-1/2 -z-[1] w-full -translate-y-1/2"
      height="6"
      viewBox="0 0 100 6"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <line
        x1="0"
        y1="3"
        x2={width}
        y2="3"
        stroke="var(--node-locked)"
        strokeWidth="6"
        vectorEffect="non-scaling-stroke"
      />
      <line
        x1="0"
        y1="3"
        x2={width}
        y2="3"
        stroke="url(#road-gradient-h)"
        strokeWidth="6"
        strokeDasharray={`${width}`}
        className="road-fill-animate"
        style={{
          "--track-length": `${width}`,
          "--track-offset": `${width - (width * percent) / 100}`,
          strokeDashoffset: `${width - (width * percent) / 100}`,
          animation: `road-fill var(--dur-slow) var(--ease) forwards`,
        } as React.CSSProperties}
        vectorEffect="non-scaling-stroke"
      />
      <defs>
        <linearGradient id="road-gradient-h" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--brand)" />
          <stop offset="100%" stopColor="var(--accent-cyan)" />
        </linearGradient>
      </defs>
    </svg>
  );
```

- [ ] **Step 3: Fix TrackSVG in Road.tsx — vertical (mobile)**

Replace the vertical SVG (the `if (vertical)` branch, lines 15-52) with:

```tsx
  if (vertical) {
    const height = 100;
    return (
      <svg
        className="absolute left-1/2 top-0 -z-[1] h-full -translate-x-1/2"
        width="6"
        viewBox="0 0 6 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <line
          x1="3"
          y1="0"
          x2="3"
          y2={height}
          stroke="var(--node-locked)"
          strokeWidth="6"
          vectorEffect="non-scaling-stroke"
        />
        <line
          x1="3"
          y1="0"
          x2="3"
          y2={height}
          stroke="url(#road-gradient-v)"
          strokeWidth="6"
          strokeDasharray={`${height}`}
          className="road-fill-animate"
          style={{
            "--track-length": `${height}`,
            "--track-offset": `${height - (height * percent) / 100}`,
            strokeDashoffset: `${height - (height * percent) / 100}`,
            animation: `road-fill var(--dur-slow) var(--ease) forwards`,
          } as React.CSSProperties}
          vectorEffect="non-scaling-stroke"
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
```

- [ ] **Step 4: Build and verify no TypeScript errors**

Run: `npx tsc --noEmit`
Expected: Clean exit. The `as React.CSSProperties` cast handles the custom properties.

- [ ] **Step 5: Verify in browser**

Run: `npm run dev`
Check at desktop width (> 768px):
- A gradient line (blue → cyan) connects all four road nodes horizontally.
- The filled portion matches `pathPercent`. The unfilled portion is dim (`--node-locked`).
- On page load, the filled portion animates in.

Check at mobile width (< 768px):
- The line is vertical, connecting nodes top-to-bottom.
- Same gradient and animation behavior.

Emulate `prefers-reduced-motion: reduce` in devtools:
- Track renders at its final state immediately, no animation.

- [ ] **Step 6: Commit**

```bash
git add components/dashboard/Road.tsx app/globals.css
git commit -m "fix(dashboard): make road track visible with viewBox and entrance animation (FIX-3)

TrackSVG was invisible because it lacked a viewBox, so the SVG coordinate
system didn't map to the container. Also fixed z-index (-z-10 → -z-[1]),
bumped stroke width to 6 for visibility, and added a road-fill keyframe
animation with reduced-motion support.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 3: FIX-5 — Activity heatmap labels and legend

**Files:**
- Modify: `components/dashboard/ActivityHeatmap.tsx`

- [ ] **Step 1: Add month label derivation helper**

Add this function above the `ActivityHeatmap` component in `ActivityHeatmap.tsx`:

```tsx
function deriveMonthLabels(
  weeks: { date: string; count: number }[][],
): { weekIndex: number; label: string }[] {
  const labels: { weekIndex: number; label: string }[] = [];
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  let lastMonth = -1;

  for (let wi = 0; wi < weeks.length; wi++) {
    const firstDay = weeks[wi]?.[0];
    if (!firstDay) continue;
    const month = new Date(firstDay.date + "T00:00:00Z").getUTCMonth();
    if (month !== lastMonth) {
      if (lastMonth !== -1) {
        labels.push({ weekIndex: wi, label: months[month]! });
      }
      lastMonth = month;
    }
  }

  return labels;
}
```

- [ ] **Step 2: Add weekday labels column**

Inside the `ActivityHeatmap` component, replace the grid rendering section. The new structure wraps the grid in a flex container with a weekday labels column on the left.

Replace the `<div className="overflow-x-auto">` block (lines 71-89) with:

```tsx
      <div className="overflow-x-auto">
        {/* Month labels row */}
        <div className="mb-1 flex" style={{ paddingLeft: "28px" }}>
          <div className="flex gap-[3px]">
            {weeks.map((_, wi) => {
              const monthLabel = monthLabels.find((m) => m.weekIndex === wi);
              return (
                <div key={wi} className="w-3 text-center">
                  {monthLabel ? (
                    <span className="text-[10px] leading-none text-muted">
                      {monthLabel.label}
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        {/* Grid with weekday labels */}
        <div className="flex gap-2">
          {/* Weekday labels */}
          <div className="flex flex-col gap-[3px]" style={{ width: "20px" }}>
            {[0, 1, 2, 3, 4, 5, 6].map((row) => (
              <div key={row} className="flex h-3 items-center">
                {row === 0 ? (
                  <span className="text-[10px] leading-none text-muted">Mo</span>
                ) : row === 2 ? (
                  <span className="text-[10px] leading-none text-muted">We</span>
                ) : row === 4 ? (
                  <span className="text-[10px] leading-none text-muted">Fr</span>
                ) : null}
              </div>
            ))}
          </div>

          {/* Heatmap cells */}
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
      </div>
```

Also add this line inside the component body, after `const weeks = buildGrid(activityData);`:

```tsx
  const monthLabels = deriveMonthLabels(weeks);
```

- [ ] **Step 3: Add intensity legend**

After the `overflow-x-auto` div and before the empty-state paragraph, add the legend:

```tsx
      {/* Intensity legend */}
      <div className="mt-3 flex items-center justify-end gap-1.5">
        <span className="text-[10px] text-muted">Less</span>
        {[
          "bg-[var(--bg-elevated)]",
          "bg-brand-bright/20",
          "bg-brand-bright/45",
          "bg-brand-bright/75",
        ].map((cls) => (
          <div key={cls} className={`h-2.5 w-2.5 rounded-sm ${cls}`} />
        ))}
        <span className="text-[10px] text-muted">More</span>
      </div>
```

- [ ] **Step 4: Build and verify no TypeScript errors**

Run: `npx tsc --noEmit`
Expected: Clean exit.

- [ ] **Step 5: Verify in browser**

Run: `npm run dev`
Confirm:
- Month labels (e.g. "Mar", "Apr", "May", "Jun") appear above the grid, aligned with their week columns.
- "Mo", "We", "Fr" appear to the left of rows 0, 2, 4.
- "Less → More" legend with 4 colored squares appears bottom-right of the card.
- Hover tooltip still works. Focus (Tab) onto cells still shows the tooltip.
- Empty-state message still appears when there's no activity.

- [ ] **Step 6: Commit**

```bash
git add components/dashboard/ActivityHeatmap.tsx
git commit -m "fix(dashboard): add month labels, weekday markers, and intensity legend to heatmap (FIX-5)

The heatmap grid now shows month labels along the top, weekday abbreviations
(Mo/We/Fr) on the left, and a Less-to-More intensity legend at the bottom.
Existing tooltip and empty-state behavior preserved.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 4: FIX-6 — Center and widen desktop layout

**Files:**
- Modify: `components/dashboard/Dashboard.tsx:82`
- Modify: `app/(app)/dashboard/page.tsx:65`

- [ ] **Step 1: Bump max-width in Dashboard.tsx**

In `components/dashboard/Dashboard.tsx`, replace line 82:

```tsx
    <div className="mx-auto max-w-[720px] px-6 py-8">
```

with:

```tsx
    <div className="mx-auto w-full max-w-[800px] px-6 py-8">
```

- [ ] **Step 2: Bump max-width in page.tsx error fallback**

In `app/(app)/dashboard/page.tsx`, replace line 65:

```tsx
      <div className="mx-auto max-w-[720px] px-6 py-8">
```

with:

```tsx
      <div className="mx-auto w-full max-w-[800px] px-6 py-8">
```

- [ ] **Step 3: Verify in browser**

Run: `npm run dev`
Resize browser to 1440px+. Confirm:
- Dashboard content is centered, not left-hugging.
- Content is slightly wider (800px vs 720px).
- At 360px mobile, layout is unchanged (still full-width minus padding).

- [ ] **Step 4: Commit**

```bash
git add components/dashboard/Dashboard.tsx app/\(app\)/dashboard/page.tsx
git commit -m "fix(dashboard): widen and center desktop layout to 800px (FIX-6)

Bumped max-width from 720px to 800px and added explicit w-full so the
container stretches before centering. Reduces the empty-right-half
feeling on wide screens.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 5: Final verification pass

**Files:** None modified — this is a verification-only task.

- [ ] **Step 1: Run TypeScript and lint checks**

```bash
npx tsc --noEmit && npm run lint
```

Expected: Clean exit, no errors.

- [ ] **Step 2: Run dev server and verify all fixes**

Run: `npm run dev`

Check each fix:

| Check | How to verify |
|-------|--------------|
| FIX-1/2 | Stat cards show real values or motivating zero copy. No em-dashes. |
| FIX-3 | Road track visible on desktop (horizontal) and mobile (vertical). Gradient fill animates on load. |
| FIX-4 | Greeting shows "Good {time}, {name}" when display_name exists. Falls back to "Welcome back" gracefully. |
| FIX-5 | Heatmap has month labels (top), weekday markers (left), intensity legend (bottom). Tooltip on hover + focus. |
| FIX-6 | Content centered at 1440px. No dead-space feeling. Mobile unchanged. |
| FIX-7 | "Tutor" link in TopBar has tooltip on hover (`title` attr) and `aria-label` on focus. |

- [ ] **Step 3: Reduced motion check**

In Chrome DevTools → Rendering → Emulate prefers-reduced-motion: reduce.

Confirm:
- Road track renders at final state (no animation).
- Node pulse stopped.
- Flame flicker stopped.
- Stagger reveal instant.
- Count-up shows final number immediately.

- [ ] **Step 4: Responsive check**

Check at three widths:
- 360px (mobile): vertical road, stacked stat cards, heatmap scrollable.
- 768px (tablet): horizontal road, 3-column stats.
- 1440px+ (desktop): centered 800px column, horizontal road.

No horizontal overflow at any width.

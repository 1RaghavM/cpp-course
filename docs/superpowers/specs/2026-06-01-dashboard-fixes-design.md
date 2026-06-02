# Dashboard Fixes Design Spec

Addresses the 7 items in `fixes.md` (v2 review punch list). Approach A: bottom-up data fixes first, then visual. FIX-4 and FIX-7 are already landed and need verification only.

Governing docs: `dashboard-specs/design.md`, `dashboard-specs/quality.md`, `dashboard-specs/requirements.md`, `STEERING.md`.

---

## Scope

| Fix | Priority | Status | Summary |
|-----|----------|--------|---------|
| FIX-1 | P0 | Needs implementation | Stat cards not wired — dashes instead of real values |
| FIX-2 | P0 | Needs implementation | Em-dash is wrong zero state |
| FIX-3 | P0 | Needs implementation | Road has no visible connecting track |
| FIX-4 | P1 | Already landed — verify | Greeting missing user's name |
| FIX-5 | P1 | Needs implementation | Activity heatmap missing labels/legend |
| FIX-6 | P1 | Needs implementation | Desktop layout leaves right half empty |
| FIX-7 | P2 | Already landed — verify | Tutor nav item unexplained |

Implementation order: FIX-1/2 → FIX-3 → FIX-4 (verify) → FIX-5 → FIX-6 → FIX-7 (verify).

Desktop layout choice: **centered column** (not right rail).

---

## FIX-1 + FIX-2: Stats resilience and zero-state copy

### Root cause

`page.tsx` fetches `user_stats` with `.single()`. When the row doesn't exist (new user, or row not yet created), Supabase returns an error. `page.tsx:59` sets `statsError = true`. `Dashboard.tsx:111-121` then renders a hardcoded em-dash fallback, bypassing `StatsStrip` entirely — which already handles zeros correctly.

### Changes

**`app/(app)/dashboard/page.tsx`:**

- Treat a missing `user_stats` row (Supabase error code `PGRST116` — "no rows returned") as "no stats yet," not as an error. Only set `statsError = true` for actual network/DB failures.
- When `user_stats` is absent, use safe defaults: `streak_days = 0`, `last_active_date = null`, `weekly_goal = null`, `display_name = null`. The downstream compute functions (`computeStreakDays`, `computeWeeklyCompleted`) already handle these nulls/zeros.
- Remove or constrain `statsError` so it only gates a genuine failure message, not a missing-row case.

**`components/dashboard/Dashboard.tsx`:**

- Remove the `statsError` branch (lines 111-121) that renders em-dashes. `StatsStrip` is always rendered.
- If a genuine fetch error occurs (network failure), show a small inline error inside the stats area — not dashes. Something like: "Couldn't load stats" with a muted style matching the card system.

**No changes to `StatsStrip`, `StatCard`, or `StreakCard`** — they already handle zero correctly:
- `StreakCard`: 0 → "Start today" with dimmed flame
- `StatCard` ("Lessons done"): 0 → "Day 1"
- `StatCard` ("This week"): 0 → "0 / {goal} — first one's the hardest" or "0 so far"

### Acceptance

- A brand-new user with no `user_stats` row sees motivating zero-state copy in all three stat cards, not dashes.
- A user with real activity sees their actual numbers — matching the nav streak and path progress.
- No em-dash (`—`) appears anywhere in the stats section. The character is reserved for genuine data-load failures only (and even then, a text message is preferred).

---

## FIX-3: Road track rendering

### Root cause

`TrackSVG` in `Road.tsx` has two bugs:

1. **No viewBox.** The SVG uses `width="100%"` / `height="100%"` but draws lines to hardcoded coordinates (e.g. `x2="100"`) without a `viewBox`. The SVG's internal coordinate system doesn't map to the rendered container, so the lines draw in a 100-user-unit space inside a container hundreds of pixels wide. Result depends on browser, but typically invisible or clipped.

2. **Aggressive z-index.** `-z-10` pushes the SVG behind the page background, not just behind the nodes.

### Changes

**`components/dashboard/Road.tsx` — `TrackSVG`:**

Horizontal (desktop):
- Add `viewBox="0 0 100 4"` with `preserveAspectRatio="none"` (already present).
- Change `-z-10` to `-z-[1]`.
- Increase `strokeWidth` from `4` to `6` for visibility against the dark background.
- The existing gradient (`--brand` → `--accent-cyan`) and `strokeDashoffset` animation based on `pathPercent` are correct — they'll work once the viewBox is fixed.

Vertical (mobile):
- Add `viewBox="0 0 4 100"` with `preserveAspectRatio="none"`.
- Same z-index and stroke-width fixes.

**Entrance animation:**
- Replace the CSS `transition-all` on the filled line with a CSS `@keyframes road-fill` animation (`stroke-dashoffset` from full length to `0`) applied via a class. The actual target offset is set inline via `style`; the animation runs once on mount (`animation: road-fill var(--dur-slow) var(--ease) forwards`). Define the keyframe in the global stylesheet alongside existing dashboard keyframes (`node-pulse`, `flame-flicker`).
- Respect `prefers-reduced-motion`: skip animation, render final state immediately (same pattern as existing `node-pulse`).

### Acceptance

- A visible gradient track connects all four stage nodes on desktop (horizontal) and mobile (vertical).
- Completed portion is bright (brand → cyan gradient). Locked/remaining portion is dim (`--node-locked`).
- Track fill animates in on page load.
- `prefers-reduced-motion`: track renders at final state, no animation.

---

## FIX-4: Greeting with user's name (verify only)

### Already landed

`Greeting.tsx` renders `"Good {morning|afternoon|evening}, {name}"` when `displayName` exists, falling back to `"Welcome back"` when absent. No "undefined" risk — guarded by `displayName?.trim()`.

### Connection to FIX-1

When `statsError` was `true`, `page.tsx:144` forced `displayName` to `null`. Once FIX-1 stops treating a missing `user_stats` row as an error, `displayName` flows through for users who set it during onboarding.

### Verification

After FIX-1 lands, confirm the greeting shows the user's name when `display_name` exists in `user_stats`.

---

## FIX-5: Activity heatmap polish

### Current state

`ActivityHeatmap.tsx` renders a 16-week CSS grid of 12×12px `<button>` cells with intensity classes. Hover and focus tooltips work (buttons with `onFocus`/`onBlur` + `aria-label`). Missing: month labels, weekday markers, intensity legend.

### Changes

**`components/dashboard/ActivityHeatmap.tsx`:**

**Month labels (top):**
- After `buildGrid()` returns weeks, derive month boundaries: when the first Monday of a week falls in a new month, record the week index and month name.
- Render a row of `<span>` labels above the grid, absolutely or flex-positioned to align with their corresponding week columns.
- Show ~3–4 labels (e.g. "Mar", "Apr", "May", "Jun"). Skip months that span fewer than 2 weeks to avoid clutter.
- Style: `text-[10px] text-muted`.

**Weekday markers (left side):**
- Add a narrow column to the left of the grid with 2–3 labels: "Mon", "Wed", "Fri" — corresponding to rows 0, 2, 4 in the Monday-based layout.
- Style: `text-[10px] text-muted`, vertically aligned to their respective grid rows.
- Implementation: wrap the grid in a flex container; the labels column is a sibling of the weeks container.

**Intensity legend (bottom):**
- A small row below the grid: text "Less", then 4 small squares showing the intensity scale (`bg-elevated` → `brand-bright/20` → `/45` → `/75`), then "More".
- Style: `text-[10px] text-muted`, right-aligned or tucked into the bottom-right of the card.
- Squares match the grid cell size (12×12px or slightly smaller).

**No other changes.** Tooltip is already focus-reachable. Empty state ("Your activity will show up here") stays.

### Acceptance

- Month labels visible along the top, aligned to week columns.
- Weekday markers ("Mon", "Wed", "Fri") on the left side.
- "Less → More" intensity legend below the grid.
- Tooltip still works on hover and focus.
- Empty state unchanged.

---

## FIX-6: Centered desktop layout

### Current state

`Dashboard.tsx:82` renders `mx-auto max-w-[720px] px-6 py-8`. `mx-auto` should center, and it does — but 720px on a 1440px+ screen occupies exactly half the width, making the right side feel empty.

### Changes

**`components/dashboard/Dashboard.tsx`:**
- Change `max-w-[720px]` to `max-w-[800px]`.
- Add `w-full` explicitly so the container stretches to max-width before centering.

**`app/(app)/dashboard/page.tsx` (error fallback):**
- Apply the same `max-w-[800px]` to the error state container (line 65) for consistency.

### Acceptance

- Content is visibly centered at all desktop widths.
- 1440px+ screens no longer feel lopsided.
- Mobile layout unchanged (container is already full-width minus padding at narrow viewports).

---

## FIX-7: Tutor tooltip (verify only)

Already landed in commit `0a746af`. Verify the tooltip is present on the "Tutor" nav item and accessible on both hover and focus.

---

## Verification gate

After all fixes land, run the full `quality.md` gate with specific focus on:

1. **Stats consistency (FIX-1/2):** The three stat card values agree with the nav streak and path progress. No em-dash appears for any value that exists. Zero values show motivating copy.
2. **Road track (FIX-3):** Visible on desktop (horizontal) and mobile (vertical). Completed portion bright, locked portion dim. Fill animates on load. Reduced-motion: instant final state.
3. **Heatmap (FIX-5):** Month labels, weekday markers, and intensity legend all present. Tooltip works on hover and focus.
4. **Responsive (FIX-6):** View at 360px, ~768px, and 1440px+. Content centered, no dead-space feeling.
5. **Reduced motion:** All animations disabled or instant final state with `prefers-reduced-motion: reduce`.
6. **No regressions:** Greeting, hero, node states, streak, heatmap empty state all still work.

---

## Files touched

| File | Changes |
|------|---------|
| `app/(app)/dashboard/page.tsx` | FIX-1: handle missing user_stats gracefully; FIX-6: bump max-width on error fallback |
| `components/dashboard/Dashboard.tsx` | FIX-1: remove em-dash fallback branch; FIX-6: bump max-width, add w-full |
| `components/dashboard/Road.tsx` | FIX-3: add viewBox to TrackSVG, fix z-index, bump stroke width, add entrance animation |
| `components/dashboard/ActivityHeatmap.tsx` | FIX-5: add month labels, weekday markers, intensity legend |

## Files NOT touched

| File | Reason |
|------|--------|
| `components/dashboard/StatsStrip.tsx` | Already handles zeros correctly |
| `components/dashboard/StatCard.tsx` | Already has zero-state copy and count-up animation |
| `components/dashboard/StreakCard.tsx` | Already shows "Start today" for zero streak |
| `components/dashboard/Greeting.tsx` | Already landed (FIX-4) |
| `components/dashboard/Hero.tsx` | No changes needed |
| `components/dashboard/RoadNode.tsx` | No changes needed |

# requirements.md — Dashboard Redesign

Requirements for the cpproad dashboard redesign. Each requirement has a rationale and testable acceptance criteria. Read alongside `STEERING.md` (context), `design.md` (implementation), and `quality.md` (gate). Acceptance criteria use "WHEN … the dashboard SHALL …" so they're checkable.

Priority: **P0** = must ship, **P1** = should ship, **P2** = nice to have.

---

## REQ-1 — Designed empty / zero states (P0)

**Why.** On first load every metric is 0 (0%, 0/5, 0 lessons, 0 streak). Today this reads as dead, not as a fresh start. Zero is the *most common* first impression and must be motivating.

**Acceptance criteria.**
- WHEN the user has no progress, the dashboard SHALL replace bare "0" metrics with forward-looking framing (e.g. streak shows "Start today", week progress shows "0 / 5 — first one's the hardest" or similar, overall progress reads "Day 1").
- WHEN the user has progress, the dashboard SHALL show the real numbers with the same components (no separate code path that drifts).
- The hero ("Start here") SHALL be the highest-contrast, highest-priority element on the page in the zero state.
- No metric SHALL render as a lone "0" with no context anywhere in the zero state.

## REQ-2 — Fix the path-lock logic (P0, correctness)

**Why.** "Basics" (the first module) currently shows locked while "Memory & OOP" (module 2) shows "you're here." A new user's first module must never be locked.

**Acceptance criteria.**
- WHEN a user has zero progress, the first module SHALL be unlocked and marked as the current/active module.
- A module SHALL be locked only if a prior module it depends on is incomplete.
- The "you're here" marker SHALL point to the earliest incomplete unlocked module.
- This SHALL be fixed in the data/logic layer, not papered over in the view.

## REQ-3 — The Road (signature path component) (P0)

**Why.** The product is *cpproad*. The four flat boxes ("Basics / Memory & OOP / STL & Templates / Advanced") should become a visible **road** — connected milestone nodes along a track — that the user walks. This is the single biggest differentiator.

**Acceptance criteria.**
- The path SHALL render as connected nodes joined by a visible track/line, not as four detached cards.
- Each node SHALL communicate its state visually: locked, active (current), and completed are each distinct at a glance via luminance, not just an icon.
- The active node SHALL be the visual focal point of the path (glow / emphasis per `design.md`).
- The completed portion of the track SHALL be visually filled/brighter; the locked portion dim.
- Each node SHALL show its title and lesson count (e.g. "0 / 75") and be clickable to its module (or show locked affordance).
- The road SHALL work as a vertical/stacked layout on mobile and a wider layout on desktop (see `design.md` for the exact responsive behavior).
- Hovering/focusing a node SHALL give clear interactive feedback.

## REQ-4 — Atmospheric background (P0)

**Why.** Flat pure-dark is the flattest possible look and kills the "premium" goal. The background should add depth without competing with content.

**Acceptance criteria.**
- The page SHALL have a layered background: a faint technical grid plus one or two slow ambient color glows (per `design.md`), not a flat fill.
- Background motion (if any) SHALL be slow and non-distracting and SHALL stop under `prefers-reduced-motion`.
- Text contrast over the background SHALL remain accessible (see `quality.md`).
- The background SHALL be a single reusable layer, not duplicated per component.

## REQ-5 — Glass card system (P0)

**Why.** Cards should read as frosted glass layered over the atmospheric background, giving cohesive depth.

**Acceptance criteria.**
- The hero card, stat cards, and any panel SHALL share one card primitive — shadcn **`Card`** extended with glass treatment (consistent tint, blur, border, radius, shadow per `design.md`).
- Cards SHALL use luminance and subtle borders for separation rather than heavy drop shadows.
- The shadcn `Card` primitive (with `CardHeader`, `CardContent`, `CardFooter`) SHALL be reused everywhere — no one-off card styling.

## REQ-6 — Fix the hero code preview (P0)

**Why.** The code snippet currently clips mid-line (`std::endl;` is cut), which looks broken rather than intentional.

**Acceptance criteria.**
- The hero code preview SHALL either show a clean, complete short snippet OR fade out deliberately with a gradient mask so the cut looks intentional.
- The snippet SHALL be syntax-highlighted in a monospace face (see `design.md`).
- The snippet SHALL never appear to be a rendering bug.

## REQ-7 — Personalized greeting (P1)

**Why.** A named, time-aware greeting makes the home screen feel like *the user's* home.

**Acceptance criteria.**
- The dashboard SHALL greet the signed-in user by name with a time-of-day aware message (morning/afternoon/evening).
- WHEN the name is unavailable, it SHALL degrade gracefully to a non-broken generic greeting (no "Welcome, undefined").

## REQ-8 — Activity heatmap (P1)

**Why.** A GitHub-style contribution grid makes consistency visible and is a proven motivator for coders.

**Acceptance criteria.**
- The dashboard SHALL show a calendar grid of recent activity (lessons completed per day) using intensity to encode volume.
- It SHALL be built as a CSS/SVG grid (no charting library — see `STEERING.md`).
- In the zero state it SHALL render an empty-but-inviting grid, not an error or a blank gap.
- Hover/focus on a cell SHALL reveal the date and count via shadcn **`Tooltip`** (`TooltipProvider` + `TooltipTrigger` + `TooltipContent`).

## REQ-9 — Motion and micro-interactions (P1)

**Why.** Considered motion is the difference between static and sleek. It must feel intentional, never busy.

**Acceptance criteria.**
- On load, primary sections SHALL reveal with a single orchestrated staggered entrance (per `design.md`), not scattered unrelated animations.
- Stat numbers SHALL count up to their value on entry.
- Progress bars / the road's filled track SHALL animate to their value on entry.
- The active road node SHALL have a gentle continuous emphasis (e.g. soft pulse/glow).
- The primary CTA ("Start lesson") SHALL respond on hover (e.g. arrow slide).
- ALL of the above SHALL be disabled or reduced to instant under `prefers-reduced-motion`.

## REQ-10 — Streak treatment (P2)

**Why.** Streak is the strongest retention hook and currently has the least visual weight.

**Acceptance criteria.**
- The streak SHALL be visually elevated relative to other stats when a streak exists (e.g. a flame motif with subtle animation).
- WHEN the streak is 0, it SHALL invite the user to start one rather than display a sad "0".

## REQ-11 — Clarify the "Tutor" nav item (P2)

**Why.** "Tutor" in the nav is an unexplained word.

**Acceptance criteria.**
- The "Tutor" affordance SHALL communicate what it does on hover/focus (shadcn **`Tooltip`** or label) without requiring a click to find out.
- No new Tutor functionality is in scope — labeling/affordance only.

---

## Non-functional requirements (all P0)

- **Responsive.** The dashboard SHALL be fully usable and good-looking from ~360px wide up to large desktop.
- **Accessible.** SHALL meet the contrast, focus, reduced-motion, and semantics rules in `quality.md`.
- **Performant.** SHALL meet the performance budget in `quality.md` (no jank from background or motion).
- **Non-regressive.** SHALL not change progress/streak/lesson computations (except REQ-2) or break existing routes.

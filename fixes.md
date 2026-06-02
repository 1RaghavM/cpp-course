# fixes.md — Current Issues to Fix (v2 review)

A punch list of everything still wrong on the dashboard as currently built, in priority order. This is a review of the *second* iteration — some original requirements landed (hero, node states, "you're here", nav streak, activity grid — good), but these remain. Each item references the original requirement where one exists. The full rules in `STEERING.md` / `design.md` / `quality.md` still govern every fix.

Work top to bottom; the P0s are what make it look broken or unfinished.

---

## FIX-1 — Stat cards are not wired to real data (P0, correctness) — most urgent

The dashboard contradicts itself. The nav shows a streak of **1**, the path shows Basics at **2 / 155**, and overall progress reads **1%** — so there is real activity. But the three stat cards ("This week", "Lessons done", "Day streak") all show "—". The streak is 1 but "Day streak" says "—"; 2 lessons are done but "Lessons done" says "—". This reads as a broken dashboard, which is the worst possible first impression.

Fix:
- Wire each stat card to its actual computed value from the same source the nav and path already use.
- "Day streak" SHALL match the nav streak (single source of truth — derive both from one value).
- "Lessons done" SHALL reflect real completed-lesson count (≥ 2 in the current state).
- Reserve "—" for *genuinely unavailable* data only, never for a value that exists (see FIX-2 for the zero case).
- Add a check to `quality.md` §4 verification: the three stat values must be internally consistent with the nav streak and the path progress.

## FIX-2 — "—" is the wrong empty state (P0) — ref REQ-1

Even where a value is truly zero, the em-dash is the wrong choice: "—" reads as *no data / unavailable / broken*, which is colder and more demotivating than a designed zero. This is exactly the zero-state problem REQ-1 called for designing around, and it's currently unsolved (just relocated from "0" to "—").

Fix:
- WHEN a metric is genuinely zero, show forward-looking copy, not a dash. Examples: streak 0 → "Start today"; lessons this week 0 → "0 / 5 · let's go"; lessons done 0 → "Begin chapter 1".
- WHEN a metric has a real value, show the number (see FIX-1).
- "—" is reserved strictly for data that failed to load / is unavailable, and that case should be rare.

## FIX-3 — The road has no connecting track (P0) — ref REQ-3

The four chapter nodes look good individually, but they float in a row with no line joining them. Without the track it's "four icons," not a road — and the road is the product's whole identity. This is the single highest-impact visual fix remaining.

Fix:
- Draw the connecting track between nodes (SVG `<path>` preferred per `design.md` §5.3 so it can curve and animate its fill).
- The completed portion of the track SHALL be brighter (brand → cyan); the locked portion dim (`--node-locked`).
- The filled portion SHALL animate in on load (`stroke-dashoffset`).
- On mobile the track is vertical (a road descending the screen) per `design.md` — design that layout, don't just stack the icons.

## FIX-4 — Greeting dropped the user's name (P1) — ref REQ-7

"Welcome back" is generic. The avatar already knows the user ("R"), so the name is available.

Fix:
- Greet by name with a time-of-day message: "Good evening, [name]" etc.
- Degrade gracefully if the name is missing — never render "Welcome back, undefined".

## FIX-5 — Activity heatmap is bare (P1) — ref REQ-8

The grid renders, but it's decorative: no month labels, no day-of-week markers, no less→more legend, no hover tooltip. Right now it doesn't tell the user anything.

Fix:
- Add month labels along the top and (at least) a couple of weekday markers down the side.
- Add a "less → more" intensity legend.
- Add a hover/focus tooltip per cell showing the date and the count (tooltip must be focus-reachable, not hover-only — `quality.md` §1).
- Keep the inviting empty state for no-activity days (don't show errors or gaps).

## FIX-6 — Desktop layout leaves the right half empty (P1)

On desktop the content sits in a narrow left-aligned column and the entire right half of the screen is dead space. It reads as unfinished.

Fix (pick one, note the choice):
- Center the content column with balanced margins, OR
- Use the space as a right rail — e.g. move the stat cards / streak / a "next topics" preview into a sidebar so the hero and road get the main column. The right-rail option pairs well with the `module-view.md` §6 next-topics stepper.

## FIX-7 — "Tutor" nav item is still unexplained (P2) — ref REQ-11

"Tutor" remains a bare word with no hint of what it does.

Fix:
- Add a tooltip/label on hover and focus explaining the affordance. No new Tutor functionality is in scope — labeling only.

---

## Already landed (do not redo)

For clarity, these from earlier reviews are working and should be preserved: the "pick up where you left off" hero with a complete, masked, syntax-highlighted code snippet (REQ-6); the "Resume coding" CTA with arrow; per-node locked/active/completed states and the "you're here" marker (partial REQ-3 — track still missing, see FIX-3); the streak in the nav; and the activity grid scaffold (needs FIX-5 polish).

## Verification

Before calling this done, re-run the full `quality.md` gate, and specifically confirm: the three stat cards agree with the nav streak and path progress (FIX-1); no "—" appears for any value that exists, and zeros show motivating copy (FIX-2); the road has a visible, state-aware, animated track on both desktop and mobile (FIX-3).

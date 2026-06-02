# module-view.md — Chapter / Topic Detail View

Spec for the view a user lands on when they click a chapter node on the dashboard road. Today that click drops the user straight into "the next topic" with no map of the chapter. This adds the map. Reads alongside `STEERING.md`, `requirements.md`, `design.md`, and `quality.md` — all of those rules (tokens, glass system, motion, accessibility gate, scope discipline) apply here too.

Priority: this whole view is **P1** overall, but the data-derivation logic (§4) is **P0** because the dashboard road depends on the same function.

---

## 1. The idea

The dashboard is a road of **chapters**. Clicking a chapter opens a view that is itself a vertical road of **topics** — the same metaphor, one level down. The view answers, at a glance:

1. What's in this chapter?
2. Which topics have I done, which is next, which are still locked?
3. How do I keep going (one tap) *or* jump to a specific topic?

Default action stays effortless (a big Continue button), but the user is no longer trapped on rails — any unlocked topic is directly clickable.

## 2. Route & entry

- Route: `app/path/[chapterSlug]/page.tsx` (or match the repo's existing routing convention — verify first).
- Entry points: clicking an **unlocked** chapter node on the dashboard road routes here. A **locked** chapter node does NOT route — it shows the locked tooltip (per `requirements.md` REQ-3).
- The current/active chapter's node and the hero "Resume" CTA both deep-link to this view (or directly to the active topic — see §6).
- Back navigation returns to the dashboard with the road scroll position preserved.

## 3. Layout & components

Reuse the `GlassCard` primitive (extends shadcn `Card`) and tokens from `design.md`. Do not invent new card styling — compose from shadcn `Card`, `CardHeader`, `CardContent`, `CardFooter`.

### 3.1 `ModuleHeader`
- Eyebrow ("Chapter 1") via shadcn **`Badge`** variant="outline", chapter title, and a progress readout (`2 / 155` in mono, per `design.md` typography).
- shadcn **`Progress`** bar that animates to value on entry (reuse the road's track-fill treatment).

### 3.2 `ContinueButton`
- Full-width shadcn **`Button`** `variant="default" size="lg"` at the top: "Continue where you left off" with the arrow that slides on hover.
- Routes to the current topic. This makes the old "just load the next topic" behavior the one-tap default — nothing is lost for the user who only wants to push forward.
- WHEN the chapter is complete, this becomes "Review" (`Button variant="outline"`) or routes to the next chapter (your call — note the choice in a comment).

### 3.3 `SubSection` (grouping)
- Topics are grouped under sub-section headers (e.g. "Getting started", "Variables & types"). A 155-topic chapter must never render as one flat endless list — grouping is what makes it digestible.
- Each sub-section header shows its title and, when locked, why (e.g. "locked until you finish Getting started").
- A locked sub-section renders its topic rows dimmed (reduced opacity) and non-interactive.

### 3.4 `TopicRow`
Each topic is a row with three parts: a **state indicator** (left), the **title** (center), and a **meta** hint (right).

- **State indicator** (luminance-distinct, per `design.md` — do not rely on icon alone). Use shadcn **`Badge`** for each state:
  - *completed* — `Badge variant="default"` success-colored + check glyph.
  - *current* — `Badge variant="default"` brand-colored + play glyph; row gets a subtle brand border and a small shadcn **`Badge`** "you're here" tag; this is the visual focal point of the list.
  - *locked* — `Badge variant="secondary"` muted + lock glyph (or its topic number); `--text-muted`; non-interactive. Wrap in shadcn **`Tooltip`** with lock reason.
- **Title** — full-bright for done/current, muted for locked.
- **Meta** — a time estimate ("5 min") in a muted shadcn `Badge variant="outline"`. Cheap, strong motivator ("I've got five minutes, I can do one"). If you don't have real durations, derive a rough estimate or omit the field entirely — do NOT show a fake hardcoded number on every row.
- **Interaction** — an unlocked row (done or current, or any topic in an unlocked sub-section) is clickable and routes to that topic. A locked row shows the locked affordance via shadcn **`Tooltip`**, no route. Whole row is the target, ≥44px tall.

## 4. State derivation (P0 — shared logic)

Put this in `lib/path.ts` alongside the chapter-level lock/active logic from `requirements.md` REQ-2. One pure, unit-tested source of truth, consumed by both the dashboard road and this view.

Rules:
- A topic is **completed** if the user has finished it.
- The **current** topic is the earliest incomplete topic in the earliest unlocked sub-section.
- **Locking is at the sub-section level, not per-topic.** Within an unlocked sub-section, every topic is freely browsable — reviewing an earlier topic or peeking ahead within the group is one click. A sub-section unlocks when the prior sub-section it depends on is complete.
- Do not force strictly-linear per-topic unlocking. That frustrates people who want to review or skip within a section, and it's the main thing to avoid here.

Acceptance:
- WHEN a user opens a chapter with partial progress, completed/current/locked derive correctly and the "you're here" tag points at exactly one topic.
- Topics within an unlocked sub-section are all clickable regardless of order.
- A unit test in `lib/path.ts` covers: fresh chapter, mid-sub-section, sub-section boundary, fully complete.

## 5. Motion & responsive

- Topic rows fade+rise in a single staggered entrance on load (reuse the dashboard's choreography and `--stagger`), grouped so each sub-section reveals as a unit. Respect `prefers-reduced-motion` (instant final state).
- Progress bar animates to value on entry.
- Mobile: single column, comfortable row height, sticky `ContinueButton` at top or bottom so it's always reachable. Desktop: same column, centered, comfortable max-width (don't let rows stretch full-bleed).
- All of `quality.md` (contrast, keyboard order, focus ring, semantics, targets) applies. The topic list is an ordered list semantically; the play/check/lock glyphs carry accessible labels.

## 6. Dashboard tie-in: "next topics" mini-stepper

So "what's next" is visible *without* a click, add to the dashboard (under the hero):

- A compact horizontal stepper showing the **next 2–3 topics** of the active chapter (current + the two after it), each a small node with title.
- Tapping the current one resumes; the view-all affordance opens this module view.
- This is the bridge between the dashboard road (chapters) and the module view (topics) — it previews the topic level inline.

Acceptance:
- WHEN the active chapter has upcoming topics, the dashboard shows the next 2–3 with the current one emphasized.
- WHEN the active chapter is complete, the stepper rolls to the next chapter's first topics or hides gracefully (no empty box).

## 7. Out of scope

- The topic/lesson player itself (the screen you land on after clicking a topic) — unchanged.
- Search across topics, bookmarking, notes — not now.

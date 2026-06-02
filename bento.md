# bento.md — the capabilities grid (Vercel-style boxes)

> The mid-page section below the hero: separated-but-adjacent boxes of different sizes, each a self-contained idea, sharing 1px hairline borders like a clean table. Uses the tokens in `design.md` and the hover/spotlight motion in `motion.md`. **No social-proof cells** (no testimonials, stats, logos) — every cell is a real cpproad capability.

## Where this sits

```
Hero (done)  →  [ BENTO CAPABILITIES GRID ]  →  Curriculum path (sequential, keep as-is)  →  Final CTA  →  Footer
```

Bento is for **parallel** propositions of similar weight. The curriculum is **sequential**, so it stays a stepped section and is NOT folded into the grid. Don't bento the path.

## The look: shared-border "table", not floating cards

The clean Vercel effect comes from cells that share hairlines, not cards with big gaps. Each cell uses a shadcn **`Card`** component with the shared-border trick applied at the grid level. Make the grid background the border color and let a 1px gap reveal it; each cell paints its own surface on top. One outer hairline wraps the whole block.

```css
.bento {
  display: grid;
  gap: 1px;                                   /* the shared hairline */
  background: var(--color-border);            /* shows through the gap */
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;                            /* clip cells to the rounded corner */
  grid-template-columns: repeat(4, 1fr);
  grid-auto-rows: minmax(180px, auto);
  grid-template-areas:
    "tutor     tutor     editor     editor"
    "tutor     tutor     pointers   stl"
    "templates toolchain setup      setup";
}
```

Each `.bento-cell` is a shadcn `Card` with custom className to remove its default border/radius (the grid handles that) and apply the cell surface styling:

```tsx
<Card className="rounded-none border-0 bg-[var(--color-surface)] p-7 flex flex-col gap-3">
  <CardHeader className="p-0">
    <CardTitle className="text-h3">{headline}</CardTitle>
    <CardDescription className="text-sm text-fg-muted">{supporting line}</CardDescription>
  </CardHeader>
  <CardContent className="p-0">
    {/* mono code chip via Badge variant="outline" with mono font */}
  </CardContent>
</Card>
```

That's the whole trick. No drop shadows, no gaps full of dead space — adjacent, separated, calm.

## Cell inventory (7 cells — all real content)

Sizes follow the 40/20/rest rule: one hero cell, one wide secondary, the rest small.

| Area | Cell | Size | Purpose | Visual inside |
|---|---|---|---|---|
| `tutor` | **AI tutor** | 2×2 (hero ~40%) | The standout capability from your hero copy | A tiny 2-message chat: a stuck question + a short tutor reply. Mono, muted. |
| `editor` | **Sandboxed editor** | 2×1 (wide) | "Write real code in the browser" | A mini editor chrome (one `main.cpp` tab + a Run pill) over 3–4 highlighted lines. |
| `pointers` | **Pointers & memory** | 1×1 | Real topic | `int* ptr = &x;` mono chip + one line. |
| `stl` | **The STL in practice** | 1×1 | Real topic | `std::vector<int>` chip + one line. |
| `templates` | **Templates & generics** | 1×1 | Real topic | `template<typename T>` chip + one line. |
| `toolchain` | **Compile · link · debug** | 1×1 | Real topic | `g++ -std=c++17` chip + one line. |
| `setup` | **No setup required** | 2×1 (wide) | Removes the #1 beginner blocker | Short line: runs in the browser, nothing to install. Optional tiny "✓ 0 installs" mono tag (real, not a stat). |

Keep size variations to **3** (2×2, 2×1, 1×1). More than that reads as chaos. 7 cells is in the 6–9 sweet spot.

### Cell content rules
- Each cell uses shadcn `Card` → `CardHeader` (`CardTitle` for headline, `CardDescription` for supporting line) + `CardContent` for the visual element.
- The two large cells (`tutor`, `editor`) carry a real visual; the four small topic cells carry just a mono code chip; the `setup` cell is mostly text. That mix is what creates the rhythm.
- Mono chips use shadcn **`Badge`** `variant="outline"` with `font-mono` class: `<Badge variant="outline" className="font-mono text-xs">int* ptr = &x;</Badge>`. Reuse the syntax colors from `design.md`.
- Headlines are real and specific. No "Powerful." / "Flexible." / "Fast." one-word cells.

## Responsive reflow (redefine areas, don't rewrite markup)

```css
/* Tablet: 2 columns */
@media (max-width: 900px) {
  .bento {
    grid-template-columns: repeat(2, 1fr);
    grid-template-areas:
      "tutor     tutor"
      "editor    editor"
      "pointers  stl"
      "templates toolchain"
      "setup     setup";
  }
}

/* Mobile: single column, ordered by importance; let heights be content-driven */
@media (max-width: 600px) {
  .bento {
    grid-template-columns: 1fr;
    grid-auto-rows: auto;
    grid-template-areas:
      "tutor" "editor" "setup" "pointers" "stl" "templates" "toolchain";
  }
  .bento-cell { padding: 22px; }
}
```

Do **not** force equal heights on mobile; let each cell size to its content.

## Motion (from motion.md, applied here)

- Each `.bento-cell` gets the **cursor spotlight + border lift** from `motion.md` §3 (one accent blue, hover only).
- The whole grid is one **`<Reveal>` block** (`motion.md` §2) with its cells staggered ~60ms by DOM order so they tile in on scroll.
- Continuous animation stays in the hero only — bento cells animate on hover/enter, never on a loop.

## Anti-slop guardrails (re-check against QUALITY.md)

- Flat surfaces, 1px shared hairlines, **no** drop shadows / neon / glassmorphism / gradient-mesh fills on cells.
- One accent color across all hover states.
- 3 size variations max; 6–9 cells; one clear hero cell.
- No testimonial / logo / metric cells. Nothing on a cell is invented.
- Headlines specific, never single-adjective filler.

## Sources

- Vercel's shared-border "table" bento effect: https://effect-labs.com/en/pages/blog/bento-grid-layouts.html
- Cell-size ratios and 6–9 sweet spot (Apple/Vercel/Linear converge ~8): https://digitalheroes.co.in/styles/bento-grid/
- Bento for parallel value props, not sequential/dominant ones: https://www.pravinkumar.co/blog/bento-grids-b2b-saas-homepage-design-trend-2026
- CSS Grid `grid-template-areas` responsive reflow: https://developer.mozilla.org/en-US/docs/Web/CSS/grid-template-areas

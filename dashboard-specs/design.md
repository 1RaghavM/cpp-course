# design.md — Dashboard Redesign

How to build what `requirements.md` describes. This is the technical and visual blueprint: design tokens, component breakdown, the road component, background layers, motion specs, and file structure. Defer to the actual repo's conventions where they differ; flag conflicts rather than fighting the codebase.

---

## 1. Aesthetic direction

One sentence: **a quiet, technical "blueprint at night" — a dark road through C++ lit by cool blue.**

- Dark-first, near-black base with a faint blueprint grid.
- C++ blue as the brand anchor, a brighter electric blue/cyan for interactive glow.
- Frosted-glass surfaces layered over slow ambient light.
- Hierarchy by **luminance**, not by heavy shadows or bold weights.
- Motion is slow, deliberate, and mostly reserved for one load reveal plus a few live touches.

Avoid: cartoon/gamey styling, purple-on-white SaaS gradients, neon overload, generic system fonts.

## 2. Design tokens

Define these once (CSS variables in the global stylesheet, mapped into Tailwind's theme if the repo uses Tailwind config). Every component consumes tokens — no hardcoded hex in components.

```css
:root {
  /* surfaces */
  --bg-base:        #07090D;   /* page base, near-black with blue cast */
  --bg-raised:      #0C1018;   /* slightly raised regions */
  --grid-line:      rgba(255,255,255,0.035); /* blueprint grid */

  /* glass */
  --glass-fill:     rgba(255,255,255,0.04);
  --glass-fill-hi:  rgba(255,255,255,0.06);  /* hover */
  --glass-border:   rgba(255,255,255,0.08);
  --glass-shadow:   0 8px 32px rgba(0,0,0,0.45);
  --glass-blur:     16px;

  /* brand */
  --brand:          #00599C;   /* official C++ blue — anchor */
  --brand-bright:   #2B8FE6;   /* interactive / fills */
  --accent-cyan:    #38BDF8;   /* active glow highlight */
  --glow-blue:      rgba(43,143,230,0.45);  /* ambient orb 1 */
  --glow-cyan:      rgba(56,189,248,0.30);  /* ambient orb 2 */

  /* text */
  --text-primary:   #E6EDF3;
  --text-secondary: #8B949E;
  --text-muted:     #4D5866;

  /* status */
  --streak:         #FF8A3D;   /* flame */
  --success:        #3FB950;

  /* node states (the road) */
  --node-locked:    #1A2029;
  --node-active:    var(--brand-bright);
  --node-complete:  var(--brand);

  /* shape + motion */
  --radius-card:    18px;
  --radius-node:    50%;
  --ease:           cubic-bezier(0.22, 1, 0.36, 1);
  --dur-fast:       180ms;
  --dur-med:        320ms;
  --dur-slow:       560ms;
  --stagger:        70ms;
}
```

If the existing accent is a generic blue and the user prefers it, swap `--brand`/`--brand-bright` and leave everything else. The token layer makes that a one-line change.

## 3. Typography

Avoid generic system fonts. Free, distinctive pairing (load via Fontshare or self-host):

- **Display / headings:** Clash Display or General Sans (Fontshare) — geometric, characterful.
- **Body / UI:** Satoshi or Switzer (Fontshare) — clean, neutral, not Inter.
- **Code / mono:** JetBrains Mono or Geist Mono — for the hero snippet and lesson counts.

Use the mono face for numeric metrics (counts, streaks, percentages) — it reads as "technical instrument" and the tabular figures stop numbers from jittering during count-up animation.

If the repo already loads brand fonts, keep them; do not stack a third family.

## 4. Background layer

A single fixed background element behind all content (not per-card). Two stacked layers:

**Layer A — blueprint grid.** A dot or fine-line grid at ~3–4% opacity.
```css
background-image:
  linear-gradient(var(--grid-line) 1px, transparent 1px),
  linear-gradient(90deg, var(--grid-line) 1px, transparent 1px);
background-size: 28px 28px;
```
Mask it with a radial gradient so it fades toward the edges (avoids a hard rectangle of grid).

**Layer B — ambient glows.** One or two large, very soft radial gradients ("orbs") in `--glow-blue` and `--glow-cyan`, blurred, positioned off-corner (e.g. top-right and lower-left). Animate position/opacity *very slowly* (20–40s loops, small movement). These are what the glass distorts.

Under `prefers-reduced-motion`, freeze the orbs (static positions, no loop).

## 5. Components

Build these as composable pieces; reuse the shadcn **`Card`** primitive everywhere, extended with the glass treatment.

### 5.1 `GlassCard` (primitive — extends shadcn `Card`)

Extend shadcn's `Card` component (`@/components/ui/card`) with glass styling applied via className or a custom variant in the `cva` call:
```
fill: var(--glass-fill); backdrop-filter: blur(var(--glass-blur));
border: 1px solid var(--glass-border); border-radius: var(--radius-card);
box-shadow: var(--glass-shadow);
hover: fill -> --glass-fill-hi, subtle 1–2px lift (translateY), --dur-fast
```
Use `CardHeader`, `CardContent`, `CardFooter` from shadcn for consistent internal structure. Everything visual (hero, stats, heatmap panel) composes this. No bespoke card CSS elsewhere.

### 5.2 `Hero` ("Start here")
- Highest contrast element. Eyebrow ("Start here" + module name via shadcn **`Badge`** variant="outline"), big title, code preview, primary CTA.
- **Code preview (REQ-6):** short complete snippet, syntax-highlighted in mono, with a bottom gradient mask (`mask-image: linear-gradient(to bottom, black 60%, transparent)`) so any clip is intentional. Never let a line clip raw.
- **CTA:** shadcn **`Button`** `variant="default"` styled with filled `--brand-bright`, arrow icon that translates +4px on hover (`--dur-fast`). Secondary action uses `Button variant="outline"`.

### 5.3 `Road` (signature — REQ-3)
The centerpiece. Replace the four detached boxes with connected milestone nodes on a track.

- **Structure:** an ordered list of module nodes connected by a track line. The track is a single element behind the nodes; the *filled* portion (up to current progress) uses `--brand`→`--accent-cyan`, the *remaining* portion uses `--node-locked`.
- **Node states (luminance, REQ-3):**
  - *completed* — solid `--node-complete`, check glyph, full-bright label.
  - *active* — `--node-active` with a soft outer glow ring + continuous gentle pulse; brightest label; small "you're here" tag.
  - *locked* — `--node-locked`, lock glyph, `--text-muted` label, reduced opacity, non-interactive (shows locked tooltip).
- **Each node shows:** title, lesson count (`0 / 75` in mono), state.
- **Layout (responsive):**
  - Desktop (≥ ~768px): horizontal or gently diagonal track left→right, nodes evenly spaced, filled track animating in from the left on load.
  - Mobile (< 768px): vertical track top→bottom (a true "road" descending the screen), nodes stacked, track is a vertical line; this is the primary, most on-brand layout — design it first, then adapt up.
- **Interaction:** hover/focus scales the node slightly and brightens its ring; click routes to the module (locked → tooltip, no route).

Implementation note: draw the connecting track with SVG `<path>` (so it can curve like a road and you can animate `stroke-dashoffset` for the fill reveal) or a positioned `div` line for a straight track. SVG path is preferred for the curve and the clean fill animation.

### 5.4 `StatCard` (week / lessons done / streak)
- Composes `GlassCard` (shadcn `Card` + glass treatment). Big mono number, label, optional sublabel. Use shadcn **`Badge`** for inline stat labels.
- **Streak (REQ-10):** flame motif; when streak > 0, flame has a subtle flicker (opacity/scale, slow); when 0, shows "Start today" instead of a bare 0. Display streak count with shadcn **`Badge`** variant="secondary" and flame icon.
- **Zero states (REQ-1):** each stat owns its zero-state copy; never a lone "0". Use shadcn **`Skeleton`** for loading.
- Numbers count up on entry (REQ-9).

### 5.5 `ActivityHeatmap` (REQ-8)
- CSS grid (7 rows × N week-columns) or SVG of small rounded squares. Wrap in a shadcn `Card` for consistent container styling.
- Intensity buckets map count→opacity of `--brand-bright` (e.g. 0, 1, 2–3, 4+).
- Cell hover/focus → shadcn **`Tooltip`** with date + count (use `TooltipProvider` + `TooltipTrigger` + `TooltipContent`).
- Zero state: all cells at the empty tint, panel still present and inviting.

### 5.6 `Greeting` (REQ-7)
- Time-of-day message + user name, degrades gracefully if name missing.

## 6. Motion specification (REQ-9)

One orchestrated load reveal, then sparing live motion. Use the Motion library (or repo's existing animation tool).

- **Load reveal:** sections fade+rise (`opacity 0→1`, `translateY 12px→0`) staggered by `--stagger`, order: greeting → hero → road → stats → heatmap. `--dur-med`, `--ease`.
- **Count-up:** stat numbers animate 0→value over `--dur-slow`, ease-out; mono tabular figures so width is stable.
- **Track fill:** road's filled path animates `stroke-dashoffset` to its progress value over `--dur-slow` on entry.
- **Active node pulse:** continuous, subtle, slow (~2.4s loop) glow/scale on the active node only.
- **Hover micro-interactions:** card lift, node brighten, CTA arrow slide — all `--dur-fast`.
- **Reduced motion:** wrap all of the above; under `prefers-reduced-motion: reduce`, render final states instantly, no loops, frozen background orbs.

## 7. Suggested file structure

Adapt to the repo's conventions. If it's Next.js App Router:

```
app/dashboard/page.tsx            // composes the sections
components/dashboard/
  Hero.tsx                        // uses Card, Button, Badge from shadcn
  Road.tsx                        // uses Tooltip for locked nodes
  RoadNode.tsx                    // uses Badge for status, Tooltip for hover
  StatCard.tsx                    // extends Card with glass treatment
  StreakCard.tsx                   // uses Badge for streak display
  ActivityHeatmap.tsx             // uses Card container, Tooltip for cell hover
  Greeting.tsx
components/ui/                     // shadcn/ui primitives (do not modify unless extending variants)
  accordion.tsx                    // shadcn: used in FAQ
  avatar.tsx                       // shadcn: user avatar
  badge.tsx                        // shadcn: status labels, streak, tier
  button.tsx                       // shadcn: all CTAs
  card.tsx                         // shadcn: base for all cards
  chart.tsx                        // shadcn: wraps Recharts for stats
  progress.tsx                     // shadcn: stage/path progress bars
  skeleton.tsx                     // shadcn: loading states
  tooltip.tsx                      // shadcn: locked states, heatmap, stats
  GlassCard.tsx                    // extends shadcn Card with glass effect
components/Background.tsx          // grid + ambient orbs, rendered once
lib/path.ts                        // module/lock/active derivation (REQ-2 fix lives here)
styles/tokens.css                  // the :root token block
```

Keep the REQ-2 lock/active logic in `lib/path.ts` as a pure function of progress, unit-testable, and consumed by both `Road` and `Hero`.

## 8. Build order (matches STEERING.md commit story)

1. Tokens + fonts + `Background`.
2. `GlassCard` + refit `Hero` and `StatCard` onto it (incl. code-preview fix, zero states).
3. `lib/path.ts` lock/active fix (REQ-2) + the `Road`/`RoadNode` component.
4. Motion pass (load reveal, count-up, track fill, pulse, hovers, reduced-motion).
5. `ActivityHeatmap` + `Greeting` + streak/Tutor polish.

Verify each step against `quality.md` before moving on.

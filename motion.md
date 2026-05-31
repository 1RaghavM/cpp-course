# motion.md — the atmosphere & motion layer

> Adds "life" to the static homepage without breaking the single-accent dark system in `design.md`. Everything here is `transform`/`opacity`/`filter`-only, gated behind `prefers-reduced-motion`, and uses one blue. **Do not** add Vercel's multicolor (blue/teal/pink) hero gradient — it violates the one-accent rule and reads as generic. A single-hue breathing glow is the disciplined version of the same idea.

Priority order (do them top-down; the first three give ~80% of the effect):
1. Hero atmosphere — breathing glow + faded grid
2. Scroll reveals — sections rise/fade in on enter
3. Card cursor spotlight + border lift
4. Animated gradient border on the code "editor" card
5. Nav scroll transition + button micro-interactions

---

## 0. Global reduced-motion guard (add once, globally)

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
  }
}
```

Motion-library components must also check the hook (see §2).

---

## 1. Hero atmosphere — breathing glow + faded grid

Two stacked, `aria-hidden`, `pointer-events:none` layers behind the hero content. The glow provides the motion; the grid provides texture.

```css
.hero { position: relative; isolation: isolate; overflow: hidden; }

/* Layer A: single-blue glow that slowly breathes */
.hero::before {
  content: "";
  position: absolute;
  inset: -20% 0 auto 0;
  height: 70%;
  z-index: -2;
  background: radial-gradient(
    50% 50% at 50% 0%,
    var(--color-glow),      /* rgba(47,129,247,0.18) */
    transparent 70%
  );
  animation: heroGlow 8s ease-in-out infinite;
  will-change: opacity, transform;
}
@keyframes heroGlow {
  0%, 100% { opacity: 0.7; transform: translateY(0)    scale(1);    }
  50%      { opacity: 1;   transform: translateY(-2%)  scale(1.06); }
}

/* Layer B: faint line grid, masked so it fades out at the edges */
.hero::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  background-image:
    linear-gradient(to right,  color-mix(in oklch, var(--color-border) 60%, transparent) 1px, transparent 1px),
    linear-gradient(to bottom, color-mix(in oklch, var(--color-border) 60%, transparent) 1px, transparent 1px);
  background-size: 56px 56px;
  -webkit-mask-image: radial-gradient(70% 60% at 50% 35%, #000 30%, transparent 75%);
          mask-image: radial-gradient(70% 60% at 50% 35%, #000 30%, transparent 75%);
}
```

Optional, very subtle: swap the grid for a dot field (`radial-gradient(circle, ... 1px, transparent 1px)`). Pick one. Keep grid opacity ~3–6%.

---

## 2. Scroll reveals — the single biggest "life" win on a long page

Reusable component. Sections fade + rise 12px as they enter; stagger their children. `once: true` so it doesn't re-fire on scroll-up.

```tsx
// components/Reveal.tsx
'use client';
import { motion, useReducedMotion } from 'motion/react';

export function Reveal({ children, delay = 0 }:{ children: React.ReactNode; delay?: number }) {
  const reduce = useReducedMotion();
  if (reduce) return <>{children}</>;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
```

Stagger a grid of cards:

```tsx
{features.map((f, i) => (
  <Reveal key={f.title} delay={i * 0.07}>
    <FeatureCard {...f} />
  </Reveal>
))}
```

CSS-only fallback (no Motion) using `animation-timeline: view()` — progressive enhancement, degrades to "just visible" in older browsers:

```css
@supports (animation-timeline: view()) {
  .reveal {
    animation: rise linear both;
    animation-timeline: view();
    animation-range: entry 0% entry 40%;
  }
  @keyframes rise { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
}
```

---

## 3. Card cursor spotlight + border lift

The recognizable "the card knows where my mouse is" effect, in one blue. Track the cursor as CSS vars; reveal a soft radial only on hover.

```tsx
'use client';
function SpotlightCard({ children }: { children: React.ReactNode }) {
  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
  };
  return <div className="spotlight-card" onMouseMove={onMove}>{children}</div>;
}
```

```css
.spotlight-card {
  position: relative;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  transition: border-color .15s ease, background .15s ease, transform .15s ease;
}
.spotlight-card::before {                 /* the spotlight */
  content: "";
  position: absolute; inset: 0;
  border-radius: inherit;
  background: radial-gradient(180px circle at var(--mx, 50%) var(--my, 50%),
    color-mix(in oklch, var(--color-accent) 16%, transparent), transparent 60%);
  opacity: 0; transition: opacity .2s ease;
  pointer-events: none;
}
.spotlight-card:hover { border-color: var(--color-border-strong); transform: translateY(-2px); }
.spotlight-card:hover::before { opacity: 1; }
```

---

## 4. Animated gradient border on the code "editor" card

A slow single-blue sheen rotating around the hero snippet's border. Uses a registered angle so it's GPU-cheap.

```css
@property --angle { syntax: '<angle>'; initial-value: 0deg; inherits: false; }

.editor-card {
  position: relative;
  border-radius: var(--radius-lg);
  background: var(--color-surface);
}
.editor-card::after {
  content: "";
  position: absolute; inset: 0;
  border-radius: inherit;
  padding: 1px;                            /* border thickness */
  background: conic-gradient(from var(--angle),
    transparent 0deg,
    color-mix(in oklch, var(--color-accent) 70%, transparent) 60deg,
    transparent 140deg);
  /* mask trick: show only the 1px ring */
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor; mask-composite: exclude;
  animation: spin 6s linear infinite;
}
@keyframes spin { to { --angle: 360deg; } }
```

Keep it understated — the snippet is content, not a disco. If it competes with the code, drop the sheen and just animate a one-time fade-in of the lines.

---

## 5. Nav transition + button micro-interactions

```css
/* Nav: transparent over hero -> blurred bar once scrolled (toggle .is-scrolled via IntersectionObserver on a sentinel) */
.nav { transition: background .25s ease, border-color .25s ease, backdrop-filter .25s ease; }
.nav.is-scrolled {
  background: color-mix(in oklch, var(--color-bg) 80%, transparent);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--color-border);
}

/* Primary button: subtle press + sheen */
.btn-primary { transition: background .15s ease, transform .08s ease; }
.btn-primary:hover  { background: color-mix(in oklch, #fff 92%, transparent); }
.btn-primary:active { transform: translateY(1px); }

/* Focus ring uses the accent — never remove it */
:where(a, button, [tabindex]):focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
```

The `is-scrolled` toggle, cheaply (no scroll listener):

```tsx
'use client';
import { useEffect, useRef } from 'react';
function useNavScroll(navRef: React.RefObject<HTMLElement>) {
  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinel.current, nav = navRef.current; if (!el || !nav) return;
    const io = new IntersectionObserver(
      ([e]) => nav.classList.toggle('is-scrolled', !e.isIntersecting),
      { rootMargin: '-1px 0px 0px 0px', threshold: 0 }
    );
    io.observe(el); return () => io.disconnect();
  }, [navRef]);
  return sentinel; // render <div ref={sentinel} /> at the very top of the page
}
```

---

## Performance & taste guardrails

- Animate only `transform`, `opacity`, `filter`, and registered custom props. Never animate `width`/`top`/`box-shadow` on scroll.
- `will-change` only on the few elements that animate continuously (hero glow). Don't sprinkle it.
- One continuously-running animation max in view at a time (the hero glow). Everything else is hover- or scroll-triggered and `once`.
- Total added JS is tiny: the `Reveal` component + one IntersectionObserver. No animation runs on the server-rendered first paint, so LCP is unaffected.
- Re-check the `QUALITY.md` blocklist after: still one accent, still no rainbow gradient, still no bouncing/scaling-in cards.

## Sources

- Single-hue glow + masked grid is the restrained read of the Vercel hero (vs. its multicolor gradient): https://vercel.com/geist/introduction
- Scroll-linked animations / `animation-timeline: view()`: https://developer.mozilla.org/en-US/docs/Web/CSS/animation-timeline
- Cursor-spotlight card pattern (reference, reimplemented in one accent): https://ui.aceternity.com/components/card-spotlight
- Motion for React `whileInView` / `useReducedMotion`: https://motion.dev/docs/react-scroll-animations

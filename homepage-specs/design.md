# design.md — the design system (exact tokens)

> Copy these tokens verbatim. They merge Vercel's near-black/off-white/white-button language with GitHub Primer's dark surface + syntax palette. Everything in `requirements.md` is built from these.

## Stack & setup (Next.js on Vercel)

- Next.js **App Router**, single route `/` rendered as a server component (the page is static; no client JS needed except a tiny bit for the mobile menu and the optional tab panel).
- **Tailwind CSS v4** — define the tokens below in `globals.css` under `@theme` (v4 is CSS-first; no `tailwind.config.js`). If the existing app pins Tailwind 3, mirror these as CSS variables in `:root` instead and map them in the legacy config.
- **Fonts via `next/font`.** Easiest path that matches Vercel: `npm i geist`, then `import { GeistSans } from 'geist/font/sans'` and `import { GeistMono } from 'geist/font/mono'`. GitHub flavor alternative: self-host Mona Sans + Hubot Sans `.woff2` via `next/font/local`. **Do not use Inter / Roboto / system-ui as the brand font.**
- Preload the woff2 and use `font-display: swap` to protect against layout shift.

## Color tokens (dark — the only theme)

```css
@theme {
  /* Surfaces — near-black canvas, stepped up for elevation */
  --color-bg:            #0a0a0a;  /* page canvas (Vercel near-black) */
  --color-surface:       #0f1115;  /* cards, the code "editor" body */
  --color-surface-2:     #161b22;  /* nested/hover surface (Primer) */
  --color-elevated:      #1c2128;  /* menus, popovers */

  /* Borders — hairlines do the structural work */
  --color-border:        #23262d;  /* default 1px hairline */
  --color-border-strong: #30363d;  /* Primer default border, for emphasis */

  /* Foreground — off-white, never pure #fff for body */
  --color-fg:            #ededed;  /* primary text (Vercel foreground) */
  --color-fg-muted:      #8b949e;  /* secondary text (Primer) */
  --color-fg-subtle:     #6e7681;  /* captions, footnotes */

  /* Single accent — one blue, used sparingly */
  --color-accent:        #2f81f7;  /* primary blue (links/active) */
  --color-link:          #58a6ff;  /* Primer link blue (slightly lighter) */
  --color-accent-fg:     #ffffff;  /* text on accent */

  /* Hero glow (one, subtle) */
  --color-glow:          rgba(47,129,247,0.18);
}
```

**Buttons (via shadcn `Button` component — the recognizable Vercel/GitHub move):**

Configure these as variants in `components/ui/button.tsx`:
- **Primary CTA (`variant="default"`) = solid `#ffffff` fill, `#000` text.** This is the Vercel signature. Hover: drop to ~92% white. Not a gradient, not a pill, not the accent blue.
- **Secondary CTA (`variant="outline"`) = transparent fill, `1px solid var(--color-border-strong)`, `--color-fg` text.** Hover: border → `--color-fg-subtle`, bg → `--color-surface-2`.
- Radius `8px`, height `40px` (`44px` for the hero CTAs via `size="lg"`), horizontal padding `16–20px`, font-weight `500`.
- Additional variants available: `variant="ghost"` (no border, subtle hover), `variant="link"` (underline style), `variant="destructive"` (red for dangerous actions).

## Syntax highlighting (for the C++ hero — GitHub dark)

Highlight at **build/server time** (Shiki, theme close to `github-dark`) and ship static HTML — no client highlighter, keeps JS ~0.

```css
--code-bg:        #0f1115;
--code-plain:     #e6edf3;
--code-comment:   #8b949e;
--code-keyword:   #ff7b72;  /* int, return, class, const, #include */
--code-string:    #a5d6ff;  /* "..." and <iostream> */
--code-func:      #d2a8ff;  /* function / entity names */
--code-number:    #79c0ff;  /* numeric + constants */
--code-variable:  #ffa657;
```

## Typography

- **Display / headings:** Geist Sans (or Mona Sans / Hubot Sans). Weight 600–700. Negative tracking on large sizes.
- **Body:** Geist Sans (or Mona Sans). Weight 400–450.
- **Code:** Geist Mono (or `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`).

```css
--font-sans: var(--font-geist-sans), ui-sans-serif, sans-serif;
--font-mono: var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, monospace;

/* Type scale (tight, Vercel/GitHub feel) */
--text-hero:  clamp(2.75rem, 6vw, 4.5rem);  /* line-height 1.05, tracking -0.03em, weight 700 */
--text-h2:    clamp(1.75rem, 3vw, 2.25rem);  /* line-height 1.1,  tracking -0.02em, weight 600 */
--text-h3:    1.25rem;                        /* line-height 1.3, weight 600 */
--text-body:  1.0625rem;                      /* line-height 1.6,  weight 400, color --color-fg-muted for paragraphs */
--text-sm:    0.875rem;                       /* line-height 1.5 */
--text-eyebrow: 0.8125rem;                    /* uppercase, tracking 0.08em, --color-fg-subtle */
```

Headlines in `--color-fg`; body paragraphs default to `--color-fg-muted` for the calm Vercel contrast hierarchy.

## Spacing, layout, radius

```css
/* 4px base scale */
--space: 4 8 12 16 24 32 48 64 96 128 160;  /* px; use as a guide */

--container-max: 1100px;   /* content column; nav/footer may go to 1280px */
--container-pad: 24px;     /* 16px on mobile */
--section-y:     clamp(80px, 12vw, 160px);  /* vertical padding between sections */

--radius-sm: 6px;
--radius-md: 8px;
--radius-lg: 12px;

--hairline: 1px solid var(--color-border);
```

- Content lives in a centered `max-width: var(--container-max)` column.
- Section dividers are a single `--hairline` top border, **not** big shadows or color blocks.

## Atmosphere (depth without slop)

Pick **at most one** background treatment per section, very subtle:
- **Hero:** one radial glow centered behind the headline/code — `radial-gradient(60% 50% at 50% 0%, var(--color-glow), transparent 70%)`. Optional faint 1px line grid or dot grid at ~3–5% opacity behind it. Nothing more.
- **Final CTA:** the same glow, or a single `--color-border` top hairline + slightly lighter `--color-surface` band.
- Everywhere else: flat `--color-bg`. Resist the urge to decorate.

## Component visual specs — shadcn/ui mappings

All components use **shadcn/ui** primitives from `@/components/ui/*`. Customize via className and token overrides, not by rebuilding from scratch.

- **Nav (sticky, ~64px):** transparent over hero; on scroll, `--color-bg` at ~80% opacity + `backdrop-filter: blur(8px)` + bottom `--hairline`. Wordmark left (mono or display). Right side: shadcn **`Button`** `variant="outline"` (secondary CTA) + **`Button`** `variant="default"` (primary CTA, solid white fill). Use shadcn **`NavigationMenu`** if adding dropdown sections later.
- **Code "editor" card (hero centerpiece):** shadcn **`Card`** with `--color-surface` body, `--hairline`, `--radius-lg`. Top bar: either a single filename tab `main.cpp` (left-aligned, `--text-sm`, `--color-fg-muted`) **or** three muted dots — pick one, not both. Real syntax-highlighted C++ inside, `--font-mono`, comfortable padding (20–24px), line-height 1.6. No line numbers unless they're real.
- **Feature / topic card:** shadcn **`Card`** with `--color-surface`, `--hairline`, `--radius-md`, 24–32px padding. Hover: border → `--color-border-strong`, bg → `--color-surface-2`, 150ms ease. A small monospace topic label (shadcn **`Badge`** variant="outline" with mono font) or a 2–3 line code fragment beats a generic icon.
- **Tabs (curriculum):** shadcn **`Tabs`** component with underline-style variant. `TabsList` in `--color-fg-muted`, active `TabsTrigger` in `--color-fg` with a 2px `--color-accent` underline. `TabsContent` below swaps a topic list / small code sample.
- **FAQ section:** shadcn **`Accordion`** — see `cpproad-faq-design-doc.md` §4.
- **Buttons:** all CTAs use shadcn **`Button`**. Primary = `variant="default"` (solid `#ffffff` fill, `#000` text — the Vercel signature). Secondary = `variant="outline"`. Ghost = `variant="ghost"`. Link = `variant="link"`.
- **Separators:** shadcn **`Separator`** replaces manual `--hairline` `<hr>` elements between sections.
- **Tooltips:** shadcn **`Tooltip`** for any hover info (curriculum topic previews, feature explanations).

## Motion

- One page-load reveal: hero elements fade+rise 8px, staggered 60ms (`animation-delay`). Done once.
- Hover transitions 150ms ease on borders/bg only.
- Wrap everything in `@media (prefers-reduced-motion: reduce) { animation: none; transition: none; }`.

## Sources

- Primer dark tokens & syntax colors: https://primer.style/guides/react/theme-reference/
- Geist font for Next.js (`geist` package): https://vercel.com/font · https://www.npmjs.com/package/geist
- Mona Sans / Hubot Sans: https://github.com/mona-sans · https://github.com/github/hubot-sans
- Tailwind v4 CSS-first `@theme`: https://tailwindcss.com/blog

# QUALITY.md — anti-slop & polish gate

> The bar that separates "looks like Vercel/GitHub" from "looks AI-generated." Check every item before considering the homepage done.

## The AI-slop blocklist (do NONE of these)

- ❌ Purple/violet or rainbow gradient text; gradient headline as the whole idea.
- ❌ Purple-gradient-on-white hero. We are **dark, near-black, one blue accent.**
- ❌ Glassmorphism everywhere — frosted translucent cards stacked over a blurry gradient.
- ❌ The generic feature trio: three cards, a random Lucide icon each (rocket / shield / lightning), labeled Fast / Secure / Scalable.
- ❌ Emoji used as section icons or bullets.
- ❌ Fake dashboards, mock analytics charts, invented product screenshots.
- ❌ Inter / Roboto / Arial / system-ui as the brand typeface. Use Geist or Mona Sans (`design.md`).
- ❌ Heavy, soft, multi-layer drop shadows on floating cards. Depth = 1px hairlines + surface steps.
- ❌ More than one accent hue. One blue. Everything else grayscale.
- ❌ Pill buttons with gradient fills. Primary = solid white/black; secondary = ghost + hairline.
- ❌ Placeholder/pseudo C++ in the hero. Real, correct, idiomatic code only.
- ❌ Center-everything with giant text and no rhythm. Vary section composition; keep negative space.
- ❌ Any social proof — testimonials, logos, star/learner counts (we have none; see `STEERING.md`).
- ❌ Filler links / fake 4-column footer / fake nav anchors.

## The "does it actually look like the references" checklist

- [ ] Canvas is near-black (`--color-bg`), body text is off-white (`--color-fg`), **not** pure `#fff`.
- [ ] Exactly one accent color appears, and it's used sparingly (links, active tab, focus ring, glow).
- [ ] Structure reads through 1px hairline borders and surface lightness, not shadows.
- [ ] Brand font is Geist or Mona Sans; code is Geist Mono / system mono; headings have slight negative tracking.
- [ ] Hero centerpiece is a real C++ snippet in a bordered editor card with one top-bar treatment (tab *or* dots, not both).
- [ ] Exactly one subtle glow on the page (hero), maybe echoed once at the final CTA. No section is over-decorated.
- [ ] Sections are tall and calm (`--section-y`), content in a centered `--container-max` column, dividers are single hairlines.
- [ ] Spacing snaps to the 4px scale — no eyeballed one-off margins.

## Visual QA passes

- View at 320 / 768 / 1280 / 1920 px: no horizontal scroll, CTAs stack on mobile, hero headline scales cleanly via `clamp()`.
- Hover states are subtle (border/bg only, 150ms). Nothing bounces or scales aggressively.
- Page-load reveal happens once, is quiet, and is fully disabled under `prefers-reduced-motion`.
- Fonts are preloaded with `font-display: swap`; no flash of huge fallback text causing layout shift.

## Accessibility (still required, even though scope is design)

- Contrast holds against `--color-bg`: `--color-fg` (~17:1) and `--color-fg-muted` (passes AA for body) are fine; verify any text placed on `--color-surface`/glow. Accent text and white-button text both pass.
- Every interactive element reachable by keyboard; **visible focus ring** (use `--color-accent`, never `outline:none` without a replacement).
- One `h1` (the hero headline); logical heading order; real landmarks (`header`/`nav`/`main`/`footer`).
- Mobile menu: focus-trapped, `Esc` closes, focus returns to the trigger.
- Decorative glow/grid marked `aria-hidden`; the code snippet is readable text, not an image.

## Performance (it's on Vercel — keep it light)

- C++ snippet highlighted at build/server time (Shiki), shipped as static HTML — no client highlighter.
- Page is effectively static; the only client JS is the mobile menu (and the optional curriculum tabs). Keep total page JS minimal.
- LCP element (hero headline or code card) renders server-side; no layout shift from late fonts/images. Target Lighthouse ≥ 90 across the board on mobile throttling, CLS < 0.1.

## Sign-off

Done when: every blocklist item is absent, every "looks like the references" box is checked, the accessibility list passes, and there is **no social-proof content anywhere** on the page.

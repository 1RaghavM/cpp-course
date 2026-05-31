# STEERING.md — design north star

> Written to be read by a coding agent (Claude Code). This is the *why* and the *taste*. `design.md` has the exact tokens, `requirements.md` has the section-by-section layout, `QUALITY.md` is the anti-slop gate. Scope is **the public homepage only** — nothing else.

## The one job

Build a single public homepage for **cpproad** (a C++ learning tool) that looks like it belongs next to **vercel.com** and **github.com** — dark, near-monochrome, high-contrast, code-forward, lots of negative space — and does **not** look like a generic AI-generated landing page.

The site is on **Next.js, deployed on Vercel**. Today `/` redirects to `/login`; we are adding a real marketing homepage at `/` in front of the existing auth app. Do not touch auth or any app logic — this is a pure design/markup task.

## What we're copying (and why it works)

Both references share the same DNA. Reproduce the *DNA*, not pixels:

- **Near-black canvas, off-white text.** Not pure white text — off-white (`#ededed`-ish) on near-black. High contrast, zero harshness.
- **One accent, used sparingly.** A single blue. Everything else is grayscale. No second hue.
- **1px hairline borders + contrast do the work.** Depth comes from thin borders and surface lightness steps, *not* big drop shadows or glassmorphism.
- **Real code is the hero visual.** Vercel shows deploy snippets; GitHub shows real repos. For us the centerpiece is a **real, correct C++ snippet** in a bordered "editor" card — not a fake dashboard, not an illustration.
- **Distinctive-but-restrained type.** Vercel = Geist Sans/Mono. GitHub = Mona Sans / Hubot Sans + system mono. Both are free. We use one of these — never Inter/Roboto/system-ui as the brand face.
- **Generous, rhythmic spacing.** Tall sections, wide gutters, a calm vertical rhythm. The pages breathe.
- **Motion is almost absent.** One quiet staggered reveal on load; subtle hover states. Nothing bouncing.

## Hard scope rules

- **Homepage only.** One route, one page.
- **No social proof of any kind.** We have **zero traction**, so: no testimonials, no "trusted by" logo wall, no star counts, no "10,000 learners" stat counters, no review cards. Do not invent any. The layout must look intentional and finished *without* them. (This is a design constraint, not a TODO — see `requirements.md`.)
- **No backend / API / auth changes.** CTAs link to the existing `/register` and `/login`. That's the whole integration.
- **Dark theme is the default and only required theme.** A light theme is out of scope for v1.

## Definition of done

The homepage is done when a developer who knows vercel.com and github.com would look at it and think "this was made by someone with taste," and an AI-slop detector would find none of the tells listed in `QUALITY.md`. Concretely: matches the token system in `design.md`, contains every section in `requirements.md` in order, contains no social-proof block, passes the anti-slop and accessibility checklist in `QUALITY.md`, and ships a real C++ snippet (not placeholder pseudo-code) as the hero.

## Sources (observed references)

- Vercel Geist design language + Geist Sans/Mono: https://vercel.com/geist/introduction
- GitHub Primer color system (dark tokens used in `design.md`): https://primer.style/guides/react/theme-reference/
- Mona Sans / Hubot Sans (free, OFL): https://github.com/mona-sans
- Devtool landing-page patterns (centered hero, code-as-visual, big final CTA): https://evilmartians.com/chronicles/we-studied-100-devtool-landing-pages-here-is-what-actually-works-in-2025

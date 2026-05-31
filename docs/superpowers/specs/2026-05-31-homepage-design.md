# Homepage Design Spec

> Public marketing homepage for cpproad. One route (`/`), dark only, Vercel/GitHub aesthetic. No social proof. This spec is the single source of truth — built from `homepage-specs/` (steering, requirements, design tokens, quality gates) plus decisions made during brainstorming.

## Architecture decisions

| Decision | Choice | Rationale |
|---|---|---|
| Token scope | Homepage-only, scoped via `[data-page="homepage"]` | Avoids breaking existing app UI; eventual full migration planned separately |
| Route group | `app/(marketing)/` | Isolates layout, fonts, and styles from `(app)` and `(auth)` groups |
| Dashboard path | `/dashboard` (moved from `/`) | Resolves route collision — `/` is now the public homepage |
| Auth routing | Unauthed → homepage; authed → `/dashboard` | Middleware redirect; homepage is never shown to logged-in users |
| Fonts | Geist Sans + Geist Mono via `geist` npm package | Matches Vercel design language per `design.md`; loaded via `next/font` |
| Syntax highlighting | Shiki at build time, `github-dark` theme | Zero client JS for code rendering; ships static HTML |
| Client JS | Nav (scroll detection + mobile menu) + CurriculumTabs only | Everything else is server-rendered |
| Curriculum display | Static 4-stage tab grouping of 34 chapters | Hardcoded mapping, not a DB query — this is a marketing page |
| Social proof | None, by design | Zero traction; the layout is intentionally complete without it |

## New dependencies

- `geist` — Geist Sans and Geist Mono fonts for `next/font`
- `shiki` — Build-time syntax highlighting for the hero code card

## File structure

```
app/(marketing)/
  layout.tsx            # Geist fonts, imports homepage.css, sets data-page="homepage"
  page.tsx              # Server component — assembles all sections
  homepage.css          # All design tokens as scoped CSS custom properties
  components/
    Nav.tsx              # Client — sticky nav, scroll state, mobile menu
    Hero.tsx             # Server — headline, sub-line, CTAs
    CodeCard.tsx         # Server — Shiki-highlighted C++ snippet
    Features.tsx         # Server — "What you'll learn" cards
    CurriculumTabs.tsx   # Client — tabbed curriculum panel
    FinalCTA.tsx         # Server — bottom conversion band
    Footer.tsx           # Server — minimal footer
```

## Routing & middleware

### Middleware changes (`middleware.ts`)

Add `/` to the passthrough logic for unauthenticated users. For authenticated users on `/`, redirect to `/dashboard`.

```
pathname === "/" →
  if session exists → redirect to /dashboard
  else → pass through (render marketing homepage)
```

### Dashboard move

Rename `app/(app)/page.tsx` route from `/` to `/dashboard`:

- Create `app/(app)/dashboard/page.tsx` (move existing `page.tsx` content)
- Update any internal links that point to `/` as the authenticated home to point to `/dashboard`
- The `(app)` layout and its auth requirements stay unchanged

## Design tokens (`homepage.css`)

All tokens from `design.md`, scoped under `[data-page="homepage"]`. These are CSS custom properties, not Tailwind theme extensions — the homepage uses them directly via `var()` in Tailwind arbitrary values or in the CSS file itself.

### Colors

```css
[data-page="homepage"] {
  --color-bg:            #0a0a0a;
  --color-surface:       #0f1115;
  --color-surface-2:     #161b22;
  --color-elevated:      #1c2128;
  --color-border:        #23262d;
  --color-border-strong: #30363d;
  --color-fg:            #ededed;
  --color-fg-muted:      #8b949e;
  --color-fg-subtle:     #6e7681;
  --color-accent:        #2f81f7;
  --color-link:          #58a6ff;
  --color-accent-fg:     #ffffff;
  --color-glow:          rgba(47,129,247,0.18);
}
```

### Syntax highlighting

```css
[data-page="homepage"] {
  --code-bg:        #0f1115;
  --code-plain:     #e6edf3;
  --code-comment:   #8b949e;
  --code-keyword:   #ff7b72;
  --code-string:    #a5d6ff;
  --code-func:      #d2a8ff;
  --code-number:    #79c0ff;
  --code-variable:  #ffa657;
}
```

### Typography

```css
[data-page="homepage"] {
  --font-sans: var(--font-geist-sans), ui-sans-serif, sans-serif;
  --font-mono: var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, monospace;

  --text-hero:    clamp(2.75rem, 6vw, 4.5rem);
  --text-h2:      clamp(1.75rem, 3vw, 2.25rem);
  --text-h3:      1.25rem;
  --text-body:    1.0625rem;
  --text-sm:      0.875rem;
  --text-eyebrow: 0.8125rem;
}
```

### Spacing & layout

```css
[data-page="homepage"] {
  --container-max: 1100px;
  --container-pad: 24px;
  --section-y:     clamp(80px, 12vw, 160px);
  --radius-sm:     6px;
  --radius-md:     8px;
  --radius-lg:     12px;
  --hairline:      1px solid var(--color-border);
}

@media (max-width: 640px) {
  [data-page="homepage"] {
    --container-pad: 16px;
  }
}
```

### Button styles

- **Primary:** `background: #ffffff; color: #000000;` Hover: `background: rgba(255,255,255,0.92)`. Height 40px (44px for hero CTAs). Radius 8px. Padding 16–20px horizontal. Weight 500.
- **Secondary/ghost:** `background: transparent; border: 1px solid var(--color-border-strong); color: var(--color-fg);` Hover: `border-color: var(--color-fg-subtle); background: var(--color-surface-2)`. Same dimensions.

## Section specs

### 1. Nav (sticky, ~64px)

**Component:** `Nav.tsx` (client)

- Transparent over hero on initial load
- On scroll: `background: rgba(10,10,10,0.8); backdrop-filter: blur(8px);` + bottom `--hairline`
- Scroll detection via `IntersectionObserver` on a sentinel `<div>` at page top — toggles `data-scrolled` attribute
- **Left:** Wordmark "cpproad" in Geist Mono, weight 600
- **Right:** "Sign in" (secondary button → `/login`) + "Start learning" (primary white button → `/register`)
- **No center links** — omitted rather than padded with fake anchors
- **Mobile (< 768px):** Buttons collapse to hamburger icon. Opens full-screen overlay menu with both links. Focus-trapped, `Esc` closes, focus returns to trigger. Keyboard-operable.

### 2. Hero

**Components:** `Hero.tsx` (server) + `CodeCard.tsx` (server)

**Background:** Single radial glow centered behind headline — `radial-gradient(60% 50% at 50% 0%, var(--color-glow), transparent 70%)` on an `aria-hidden` div. Nothing else.

**Content (centered, max-width 720–820px):**

1. **Eyebrow** (conditional) — only rendered if there's a true claim (e.g. "Free and open-source" if repo is public). `--text-eyebrow`, uppercase, `--color-fg-subtle`, tracking `0.08em`. Omit if nothing honest to say.

2. **Headline** — `--text-hero`, weight 700, `--color-fg`, tracking `-0.03em`. Max two lines. Placeholder: *"Learn C++ the way it's actually written."*

3. **Sub-line** — `--text-body`, `--color-fg-muted`. 1–2 sentences. Placeholder: *"A structured, hands-on path through modern C++ — from first program to templates. Write real code in a sandboxed editor, get help from an AI tutor when you're stuck."*

4. **CTAs** — side by side desktop, stacked mobile. Primary white "Start learning C++" (44px tall) → `/register`. Secondary ghost "Sign in" (44px) → `/login`.

5. **Code card** — directly below CTAs with generous margin.

**Code card spec:**
- `--color-surface` background, `--hairline` border, `--radius-lg`
- Top bar: single filename tab "main.cpp" left-aligned, `--text-sm`, `--color-fg-muted`
- Body: Shiki-highlighted C++ (server-rendered static HTML), `--font-mono`, padding 20–24px, line-height 1.6
- Snippet: ~12–15 lines showing `#include`, `std::vector`, range-for, `auto` — modern C++ basics, correct and idiomatic

**Example snippet (final version may vary):**
```cpp
#include <iostream>
#include <vector>
#include <string>

int main() {
    std::vector<std::string> topics = {
        "variables", "functions",
        "pointers",  "templates"
    };

    for (const auto& topic : topics) {
        std::cout << "Learning: " << topic << "\n";
    }

    return 0;
}
```

**Reveal animation:** Elements fade up 8px, staggered 60ms. Runs once. Disabled under `prefers-reduced-motion`.

### 3. What you'll learn (features)

**Component:** `Features.tsx` (server)

- Separated from hero by `--hairline` top border
- Section header: `--text-h2`, `--color-fg`, centered. Placeholder: *"What you'll actually learn"*
- **4 cards** in a 2-up grid (desktop), single column (mobile). Gutters 24–32px.

**Card spec:** `--color-surface` bg, `--hairline` border, `--radius-md`, 24–32px padding. Hover: border → `--color-border-strong`, bg → `--color-surface-2`, 150ms ease.

**Card content:** Headline (`--text-h3`, `--color-fg`) + description (`--text-body`, `--color-fg-muted`) + code label (`--font-mono`, `--text-sm`, `--color-fg-subtle`).

| Card | Headline | Description | Code label |
|---|---|---|---|
| 1 | Pointers & memory | Pointers stop being scary once you can see what they point at. | `int* ptr = &x;` |
| 2 | The STL in practice | Vectors, maps, algorithms — learn the standard library by using it. | `std::vector<int>` |
| 3 | Templates & generics | Write code that works with any type, without the mystery. | `template<typename T>` |
| 4 | Compile, link, debug | Understand what happens between 'Save' and 'Run'. | `g++ -std=c++17` |

### 4. Curriculum path (tabbed modules)

**Component:** `CurriculumTabs.tsx` (client)

- Separated from features by `--hairline` top border
- Section header: `--text-h2`, centered. Placeholder: *"A clear path from basics to proficiency"*

**Tab bar:** 4 underline-style tabs, centered. Inactive: `--color-fg-muted`. Active: `--color-fg` + 2px `--color-accent` underline.

**Tabs and content:**

| Tab | Approx. chapters | Sample topics (5–7 per panel) |
|---|---|---|
| Basics | 1–6 | Variables & types, Control flow, Functions, Arrays & strings, I/O streams |
| Memory & OOP | 7–15 | Pointers & references, Dynamic allocation, Classes & objects, Inheritance, Operator overloading |
| STL & Templates | 16–25 | std::vector & std::array, Iterators, Algorithms, Function & class templates, Smart pointers |
| Advanced | 26–34 | Move semantics, Exceptions, Lambda expressions, The preprocessor, Input & output streams |

**Panel:** Topic list in `--text-body`, `--color-fg-muted`. Flat `--color-bg` background — no card wrapper. Static data, hardcoded.

### 5. Final CTA

**Component:** `FinalCTA.tsx` (server)

- `--hairline` top border. Flat `--color-bg` background (one glow on the page is enough — hero has it).
- Centered: one line `--text-h2` — placeholder: *"Start with the basics. No setup required."*
- One primary white button → `/register`
- Generous vertical padding (`--section-y`)

### 6. Footer

**Component:** `Footer.tsx` (server)

- `--hairline` top border, `--color-bg` background
- `--text-sm`, `--color-fg-subtle`
- Single line: wordmark "cpproad" + `© 2026` + login link + GitHub link (if repo is public)
- ~60px tall, no multi-column layout

## Motion

- **Page load:** Hero elements fade up 8px, staggered 60ms (`animation-delay`). One-shot, applied via CSS animation classes.
- **Hover:** 150ms ease transitions on card borders/backgrounds only. No scale, no bounce.
- **Reduced motion:** `@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; } }`

## Accessibility

- Semantic landmarks: `<header>` (nav), `<main>` (content), `<footer>`
- One `<h1>` — the hero headline. Logical heading order: h1 → h2 per section
- All interactive elements keyboard-reachable with visible focus ring (`outline: 2px solid var(--color-accent); outline-offset: 2px`)
- Mobile menu: focus-trapped, `Esc` closes, `aria-expanded` on trigger, focus returns on dismiss
- Decorative glow div: `aria-hidden="true"`
- Code snippet is real text, not an image — screen-readable
- Contrast: `--color-fg` on `--color-bg` = ~17:1. `--color-fg-muted` (#8b949e) on `--color-bg` (#0a0a0a) = ~5.2:1 (passes AA). White button text on white bg is N/A (black text on white).

## Responsive behavior

- Breakpoints: 320px → 1920px+, no horizontal scroll
- Container padding: 16px mobile / 24px desktop
- Hero headline: scales via `clamp(2.75rem, 6vw, 4.5rem)`
- CTAs: side by side desktop, stacked mobile
- Feature cards: 2-up grid desktop, single column mobile
- Curriculum tabs: horizontal scroll if labels overflow on small screens
- Nav: full buttons desktop, hamburger + overlay mobile (breakpoint ~768px)

## Performance

- Page is effectively static — server-rendered, no data fetching
- C++ snippet highlighted at build time via Shiki, shipped as static HTML
- Client JS limited to Nav (scroll observer + mobile menu) and CurriculumTabs (tab state)
- Geist fonts preloaded via `next/font` with `font-display: swap`
- LCP element (hero headline) renders server-side, no layout shift
- Target: Lighthouse >= 90 mobile, CLS < 0.1

## Quality gates (from `QUALITY.md`)

Before considering done, verify:

- [ ] No purple/rainbow gradients, no glassmorphism, no generic icon trio
- [ ] No Inter/Roboto/system-ui as brand font
- [ ] No social proof anywhere — no testimonials, logos, counters
- [ ] No filler links or fake footer columns
- [ ] Canvas is `--color-bg` (#0a0a0a), text is `--color-fg` (#ededed), not pure #fff
- [ ] Exactly one accent color (blue), used sparingly
- [ ] Structure uses hairlines and surface steps, not shadows
- [ ] Hero code is real, correct, idiomatic C++ — not pseudo-code
- [ ] One subtle glow (hero), no over-decorated sections
- [ ] Spacing on 4px grid, sections use `--section-y`
- [ ] Hover states are subtle (border/bg only, 150ms)
- [ ] Reveal animation runs once, disabled under `prefers-reduced-motion`
- [ ] Fonts preloaded, no layout shift
- [ ] Keyboard navigation works, visible focus rings, landmarks correct
- [ ] Mobile menu focus-trapped, `Esc` closes
- [ ] No horizontal scroll at any viewport width

## Explicitly excluded

- Testimonials, review cards, quote blocks
- "Trusted by" or logo walls
- Stat counters of any kind
- Fake product screenshots or dashboards
- Pricing table
- Light theme
- Any changes to auth, API, or app logic

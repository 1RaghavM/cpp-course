# requirements.md — homepage layout spec

> Section-by-section design spec for the single homepage. Built entirely from the tokens in `design.md`. Order is top-to-bottom. **No social-proof section exists anywhere** (we have zero traction — see `STEERING.md`).

## Page shell

- One route: `/` (currently redirects to `/login` — replace with this page; keep the auth routes intact).
- Dark only. Canvas `--color-bg`. Centered `--container-max` content column, `--section-y` between sections, single `--hairline` top border as the only section divider.
- Vertical order: **Nav → Hero → What you'll learn → Curriculum path → Final CTA → Footer.** That's it. Nothing between that implies users/customers we don't have.

## 1. Nav (sticky)

- Height ~64px. Transparent over the hero; on scroll → blurred near-black bar + bottom hairline (`design.md` → Nav).
- Left: wordmark **cpproad** (monospace or display weight 600). Right: **Sign in** (secondary/ghost → `/login`) and **Start learning** (primary white button → `/register`).
- Center links optional and only if they target real sections: `Curriculum`. Skip a links bar entirely rather than padding it with fake anchors.
- Mobile: collapse to a button → full-screen or sheet menu. Must be keyboard-operable, focus-trapped, `Esc` to close.

## 2. Hero (the page)

- **Centered composition** in a ~720–820px text column, glow behind (`design.md` → Atmosphere). This is the centered-hero devtool pattern.
- Optional **eyebrow** (`--text-eyebrow`) — only if there's something true to say (e.g. "Free and open"). If not, omit. Never a fake "Now in beta — join 5,000 devs."
- **Headline** (`--text-hero`, `--color-fg`): two lines max, concrete and specific to C++. Placeholder for real copy: *"Learn C++ the way it's actually written."* (Owner replaces; keep it specific, not "Build amazing things faster.")
- **Sub-line** (`--text-body`, `--color-fg-muted`): 1–2 sentences on what the tool does and who it's for.
- **CTAs:** primary white **"Start learning C++"** → `/register`; secondary ghost **"Sign in"** → `/login`. Side by side desktop, stacked mobile.
- **Hero visual = real C++ in the editor card** (`design.md` → Code editor card), directly under the CTAs. Use a short, correct, idiomatic snippet that previews the teaching style — e.g. a clean `main.cpp` showing a vector + range-for, or RAII, or a small class. It must compile in a reader's head. No `// TODO`, no lorem, no pseudo-code.

## 3. What you'll learn (features, problem-oriented)

- Replaces a generic feature grid. **Do not** ship three icon cards labeled Fast / Structured / Practical.
- 3–5 cards (`design.md` → Feature card), each anchored to a real C++ pain point, headline + one line + a tiny mono label or 2–3 line code fragment. Concrete topics, e.g.: *Pointers & memory*, *The STL in practice*, *Templates & generics*, *Compile, link, debug*. Each frames the problem then the payoff ("Pointers stop being scary once you can see what they point at").
- Layout: even grid (2-up / 3-up responsive) **or** an alternating image/text "chess" rhythm if cards carry a code sample. Keep gutters generous; let cards breathe.

## 4. Curriculum path (progression)

- Show the learning path as an ordered journey. Two acceptable patterns (pick one):
  - **Tabbed modules:** underline tabs (`design.md` → Tabs) grouping stages — *Basics → Memory → STL → Projects* — each panel listing that stage's topics, optionally a small code sample.
  - **Numbered vertical path:** steps connected by a hairline, each with a stage title + a few topics.
- Goal: a visitor sees there's a real, sequenced curriculum, not a pile of articles. No progress bars or completion stats (no users yet).

## 5. Final CTA (full-width)

- Visually separated band (`design.md` → Atmosphere): hairline top border, optional single glow.
- One short line (*"Start with the basics. No setup required."* — placeholder) + **one** primary white button → `/register`. No secondary action here; this is the catch-all conversion point.

## 6. Footer (minimal)

- Hairline top border, `--color-bg`, small type (`--text-sm`, `--color-fg-subtle`).
- Wordmark + copyright + only real links (e.g. a GitHub link if one exists, the login link). Omit columns of placeholder links — an honest 1–2 line footer beats a fake 4-column sitemap.

## Explicitly excluded (by design, not omission)

- Testimonials / review cards / quote blocks.
- "Trusted by" or logo walls.
- Stat counters (learners, stars, lessons completed, uptime).
- Fake product screenshots, dashboards, or mock charts.
- Pricing table (unless a real paid tier exists; none assumed).
- Any number or claim that isn't true today.

## Responsive

- 320px → ≥1920px, no horizontal scroll. Container padding `16px` mobile / `24px` desktop. CTAs stack on mobile. Hero headline scales via the `clamp()` in `design.md`.

## Sources

- Centered hero, code-as-visual, big final CTA: https://evilmartians.com/chronicles/we-studied-100-devtool-landing-pages-here-is-what-actually-works-in-2025
- Existing auth routes the CTAs link into: https://cpp-course-ten.vercel.app/login , /register

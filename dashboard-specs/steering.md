# STEERING.md — cpproad

Persistent project context for Claude Code. Read this first on every session before touching the dashboard. It defines what cpproad is, how the codebase works, and the rules of engagement for this redesign. The detailed work lives in `requirements.md` (the what), `design.md` (the how), and `quality.md` (the done bar).

---

## What cpproad is

cpproad is a single-user web app for learning C++ along a guided path. The name is the product: a *road* through C++, from Basics to Advanced. The dashboard is the home screen — the first thing the user sees after sign-in. Its job is to answer three questions instantly:

1. Where am I on the road?
2. What do I do next?
3. Am I keeping momentum?

The current dashboard answers these, but flatly. This redesign keeps the information architecture and makes it feel alive, branded, and motivating.

## North star

> Refined, technical, and quietly premium — a dev tool, not a kids' app.

Lean into the **road metaphor** as the signature element. Everything else (background, glass cards, motion) is in service of making the road feel like a place worth walking. Do not turn this into a cartoon game. Restraint wins.

## Tech stack (verify against the actual repo before assuming)

- Next.js (App Router) + React + TypeScript
- Tailwind CSS for styling
- Deployed on Vercel

Confirm these by inspecting `package.json`, `next.config.*`, and the existing dashboard route before writing code. If the stack differs, adapt the approach in `design.md` to match what is actually there. Do not introduce a second styling system.

## New dependencies

- Animation: prefer `motion` (the Motion library, formerly Framer Motion) if not already present. If the repo already animates with something else, use that instead of adding a competing library.
- Do not add a component kit (no MUI, no Chakra). Build the cards and the road from primitives + Tailwind.
- Do not add a charting library for the activity heatmap — it's a CSS grid, build it by hand.

## Rules of engagement

- **Scope discipline.** Only touch the dashboard and the components/styles it needs. Do not refactor auth, lesson content, routing, or unrelated pages. If a change tempts you outside the dashboard, stop and note it instead.
- **Preserve data and logic.** The redesign is visual and structural. Do not change how progress, streaks, or lesson counts are computed — only how they are displayed. The one exception is the path-lock bug (see `requirements.md` REQ-2), which is a correctness fix.
- **Make assumptions explicit.** Where the real data shape, route names, or props differ from what these docs assume, write the assumption in a comment and proceed with the most reasonable interpretation. Do not block.
- **One coherent commit story.** Group work so each commit is reviewable: tokens/background first, then cards, then the road component, then motion, then the heatmap/greeting. Don't ship everything in one blob.
- **No placeholder slop.** No lorem ipsum, no fake avatars, no dummy numbers left in the shipped UI. Empty states are designed deliberately (see `requirements.md` REQ-1).
- **Respect the user.** Honor `prefers-reduced-motion`, keep contrast accessible, keep it usable on mobile. `quality.md` is the gate.

## Definition of done (summary)

A change is done when it satisfies its acceptance criteria in `requirements.md`, follows the technical approach in `design.md`, and passes every item in `quality.md`. If any of the three conflict, surface the conflict rather than silently picking one.

## Out of scope for this redesign

- New lesson content or the lesson player itself
- The "Tutor" feature's behavior (you may clarify its label/affordance, not build it)
- Backend, database, or API changes
- Light theme (this product is dark-first; do not build a light variant now)

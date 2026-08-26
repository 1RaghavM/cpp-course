# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

**cpproad** — a consumer-facing C++ learning platform built around the learncpp.com curriculum (345 lessons, 34 chapters). Lesson summaries and exercises are authored offline, committed under `scripts/regenerated/v2/`, and pushed into Postgres; serving a lesson is a pure DB read and never calls a model. An AI tutor (streaming, 4-tier hint policy) helps when stuck, billed to the user's own key. Code runs in a sandboxed Judge0 instance.

Open to any user who signs up. One repo, one deploy.

## Architecture

- **Next.js 14+ App Router** (TypeScript, strict mode) on Vercel — both frontend and API (Route Handlers under `app/api/`)
- **Supabase** — Postgres + Auth (magic link, open signup) + RLS on every table (per-user isolation)
- **Google Gemini 2.5 Flash** — tutor conversations only, streamed via the AI SDK using the user's own API key (BYOAK, encrypted at rest). There is no server-owned model key and no live content-generation path; `ANTHROPIC_API_KEY` is no longer used.
- **Judge0** — sandboxed C++ compilation and execution. **Currently uses the RapidAPI shared host (`judge0-ce.p.rapidapi.com`)**; a self-hosted gVisor instance on Fly.io is staged in `infra/judge0/` but not deployed. The dockerfile + fly config there are NOT production-ready (gVisor runtime is commented out, workers run privileged) — re-harden before any `fly deploy`. Sandbox isolation, patch level, and rate limits on RapidAPI are out of our control; verified safe verdicts for fork bombs, network egress, FS writes, OOM, infinite loops, and process enumeration as of 2026-06-11.

No separate backend service. No Redis, no queues. Next.js Route Handlers handle tutor streaming and Judge0 proxying directly.

### Content is data, not a runtime model call (load-bearing decision)

The entire cost model depends on this: **nothing in the request path calls a model to produce content.** Lesson summaries, exercises, and concept checks are authored offline, validated by `scripts/validate_v2.ts`, and pushed to Postgres by `scripts/push_v2.ts`. `getOrGenerateLesson` in `lib/content/lesson-generation.ts` is a pure cache read — a lesson with `summary_md IS NULL` renders "coming soon" rather than generating anything. Tutor conversation history loads from Postgres without model calls until the user types something new.

Guard this in every code path that touches `lib/content/`. Reintroducing a live generation call on the read path would put an unbounded, operator-paid cost behind an open-signup endpoint.

Phase B adds `concept_check_reviews` — per-user-per-check scheduler state (`interval_index`, `next_due`). It is derived from `concept_check_attempts` and written atomically alongside each attempt via the `record_check_attempt` RPC. All writes funnel through `applyAttempt` in `lib/content/review.ts`; both Route Handlers (`/api/concept-checks`, `/api/review/attempt`) and any future surface MUST go through that single helper so the two tables can never diverge.

### Key data flow

1. **Lesson visit (content present):** Page → `GET /api/lessons/[slug]` → return cached content directly
2. **Lesson visit (not yet authored):** Page → `GET /api/lessons/[slug]` → `summary_md IS NULL` → return lesson with null summary, UI shows "coming soon". No model call.
3. **Code run/submit:** Page → `POST /api/submissions` → Judge0 VM → results back (synchronous, no queue)
4. **Tutor:** Page → `POST /api/chat` (streamed) → load conversation history from DB → compute hint tier → stream from Gemini using the user's key → persist messages
5. **Daily review:** Page → `GET /api/review/due` → returns up to 20 due cards from `concept_check_reviews` + nextDueDate when empty. Each answer → `POST /api/review/attempt` → `applyAttempt` (no LLM).

## Planned file structure

```
app/
  (auth)/login/          # magic link login
  (app)/                 # authenticated layout
    page.tsx             # roadmap home
    lessons/[slug]/      # lesson page
    exercises/[id]/      # exercise page
    stats/               # cost stats
  api/
    lessons/[slug]/      # GET lesson, POST regenerate
    submissions/         # POST run/submit code
    tutor/               # POST SSE streaming
    progress/[lesson_id]/
    stats/costs/
components/
  ui/                    # shadcn/ui primitives (accordion, badge, button, card, chart, dialog, drawer, progress, sheet, skeleton, tabs, tooltip, etc.)
  editor/MonacoEditor    # Monaco with C++ highlighting
  tutor/ChatPanel        # streaming chat, tier badges (uses Sheet, ScrollArea, Badge, Button)
  roadmap/RoadmapTree    # chapter/lesson tree with completion state (uses Card, Progress, Badge, Tooltip)
lib/
  supabase/              # server.ts + client.ts
  anthropic/             # prompt/cache helpers used by offline scripts/ only — no runtime API client
  ai/                    # tutor model, system prompt, context, pricing (Gemini, BYOAK)
  judge0/                # client + verdict (test-case diffing)
  auth/require-auth.ts   # middleware: require authenticated session
  content/lesson-generation.ts  # generate-or-cache orchestration
infra/
  judge0/                # docker-compose.yml (gVisor, no-network, non-root)
  supabase/migrations/   # SQL migrations
scripts/
  seed_db.ts             # loads curriculum_seed.json into Postgres
```

## Build and dev commands

```bash
npm install
npm run dev              # Next.js dev server
npm run build            # production build
npm run lint             # ESLint (next/core-web-vitals + @typescript-eslint/recommended)
npx prettier --check .   # check formatting
npx prettier --write .   # auto-format

# Database
npx supabase db push     # apply migrations
npx supabase gen types typescript --local > lib/supabase/types.ts  # regenerate types after schema changes

# Seed curriculum
npx tsx scripts/seed_db.ts

# Judge0 — production currently runs against RapidAPI's shared judge0-ce host (set JUDGE0_URL + JUDGE0_AUTH_TOKEN).
# The Fly.io self-host below is staged but NOT deployed; re-harden infra/judge0/docker-compose.yml
# (uncomment gVisor runtime, drop privileged: true on workers) before running this.
# fly deploy --config infra/judge0/deploy.fly.toml
```

### GitHub Sync setup (one-time, operator only)

Mirrors each user's passed submissions to their own public `cpproad-submissions` repo
(commits land on their contribution graph). Inert until an OAuth App is registered:

1. Create a GitHub OAuth App at https://github.com/settings/developers
   - Homepage URL: your site URL
   - Authorization callback URL: `<your-site>/api/github/callback`
2. Set `GITHUB_OAUTH_CLIENT_ID` and `GITHUB_OAUTH_CLIENT_SECRET` in the environment.
3. Token encryption reuses the existing `API_KEY_ENCRYPTION_SECRET` (no new secret).

Scope requested is `public_repo` (create + write public repos only). Users connect at
`/dashboard/profile`; passed submits then commit to their repo via the GitHub Contents API.
The `github_connections` table (migration `016`) stores one encrypted token per user.

## UI component library — shadcn/ui

All UI primitives come from [shadcn/ui](https://ui.shadcn.com) (`@shadcn` registry). Components live in `components/ui/` and are installed via `npx shadcn@latest add <name>`. Never hand-roll a primitive that shadcn already provides.

**Installed components** (update this list when adding new ones):

| Component | Primary usage |
|---|---|
| `accordion` | FAQ section (single-open default), notes overview chapter groups |
| `avatar` | User avatar in nav / TopBar |
| `badge` | Tutor tier badges, streak chip, status labels |
| `breadcrumb` | Lesson / module navigation breadcrumbs |
| `button` | All CTAs — resume, start, run, submit, onboarding actions |
| `card` | Hero card, stat cards, stage cards, feature cards, bento cells |
| `chart` | Stats visualization, activity heatmap (wraps Recharts) |
| `checkbox` | Placement check options, settings toggles |
| `collapsible` | Sidebar sections, expandable content |
| `dialog` | Confirmation modals (e.g. account creation prompt) |
| `drawer` | Tutor panel on mobile viewports |
| `dropdown-menu` | User menu, settings dropdown |
| `input` | Tutor chat composer, search fields |
| `label` | Form field labels in onboarding / settings |
| `progress` | Stage progress bars, path percent, weekly goal indicator |
| `radio-group` | Onboarding single-select screens (background, motivation, goal) |
| `scroll-area` | Chat message list, long lesson content, notes preview |
| `select` | Language standard picker, settings selects |
| `separator` | Section dividers (replaces manual hairline `<hr>`) |
| `sheet` | Tutor panel as side sheet on desktop |
| `sidebar` | App-wide sidebar navigation |
| `skeleton` | Loading states — dashboard, lessons, tutor |
| `sonner` | Toast notifications (streak, completion, errors) |
| `table` | Cost stats table, test results, submission history |
| `tabs` | Curriculum section tabs, editor file tabs |
| `textarea` | Notes editor writing surface (floating notepad + dedicated view) |
| `toggle` | Theme toggle, feature switches, notes toolbar formatting buttons |
| `toggle-group` | Weekly goal selection, view mode switcher, notes edit/preview toggle |
| `tooltip` | Locked stage explanations, stat details, heatmap cell hover, notes toolbar labels |

**Adding a new component:** `npx shadcn@latest add <name>`. Customize via the component file in `components/ui/`, not by wrapping. Extend variants in the component's `cva` call when needed.

## Code conventions

- **Strict TypeScript:** `strict: true`, `noUncheckedIndexedAccess: true`. No `any` without an eslint-disable comment explaining why.
- **Prettier:** default config + `printWidth: 100`
- **Imports:** absolute via `@/*` alias; relative only within the same directory
- **Components:** server components by default; `'use client'` only when explicitly needed
- **UI primitives:** always use shadcn/ui components from `@/components/ui/*` before building custom ones
- **Commits:** conventional commits (`feat:`, `fix:`, `chore:`)
- **Migrations:** one per logical change, forward-only (no rollback scripts), index in same migration as its column

## Project commands

Run these with `/project:<name>` to enforce project invariants:

| Command | When to use |
|---|---|
| `/project:cache-guard` | Before modifying code that touches LLM calls, lesson loading, or conversation retrieval |
| `/project:scope-check` | Before building any new feature — decision filter + exclusion list |
| `/project:security-verify` | After changes to Judge0 infra, auth middleware, or RLS policies |
| `/project:llm-integration` | When adding or modifying any model call — model selection, cost tracking, content quality |
| `/project:new-route` | When creating or modifying API route handlers — auth pattern, error responses, API contracts |

## Testing strategy

Tests exist only where they prevent silent bugs: sandbox security (malicious C++ samples), cost calculator (unit tests), verdict logic (unit tests), auth middleware (integration: unauthenticated gets 401), lesson cache (integration: two hits, one LLM call). No tests for UI components, most API routes, or LLM output quality.

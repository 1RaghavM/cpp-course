# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

**cpproad** — a consumer-facing C++ learning platform built around the learncpp.com curriculum (345 lessons, 34 chapters). LLM-generated lesson summaries and exercises are cached in Postgres on first visit; revisits never call the LLM. An AI tutor (streaming, 4-tier hint policy) helps when stuck. Code runs in a sandboxed Judge0 instance.

Open to any user who signs up. One repo, one deploy.

## Architecture

- **Next.js 14+ App Router** (TypeScript, strict mode) on Vercel — both frontend and API (Route Handlers under `app/api/`)
- **Supabase** — Postgres + Auth (magic link, open signup) + RLS on every table (per-user isolation)
- **Anthropic Claude** — Haiku 4.5 for lesson/exercise generation, Sonnet 4.6 for tutor conversations
- **Judge0 + gVisor** on Fly.io — sandboxed C++ compilation and execution, the only piece outside Vercel

No separate backend service. No Redis, no queues. Next.js Route Handlers handle LLM calls and Judge0 proxying directly.

### The caching pattern (load-bearing decision)

The entire cost model depends on this: a lesson with non-NULL `summary_md` never triggers an LLM call. Exercises that exist in the DB never regenerate. Tutor conversation history loads from Postgres without LLM calls until the user types something new. Anthropic prompt caching (`cache_control: {type: 'ephemeral'}`) is applied on every call's system prompt + lesson context block.

If caching breaks, costs blow up. Guard this invariant in every code path that touches `lib/anthropic/` or `lib/content/`.

### Key data flow

1. **Lesson visit (cache miss):** Page → `GET /api/lessons/[slug]` → `summary_md IS NULL` → call Haiku → write to DB → return
2. **Lesson visit (cache hit):** Page → `GET /api/lessons/[slug]` → return cached content directly
3. **Code run/submit:** Page → `POST /api/submissions` → Judge0 VM → results back (synchronous, no queue)
4. **Tutor:** Page → `POST /api/tutor` (SSE) → load conversation history from DB → compute hint tier → stream from Sonnet → persist messages

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
  editor/MonacoEditor    # Monaco with C++ highlighting
  tutor/ChatPanel        # streaming chat, tier badges
  roadmap/RoadmapTree    # chapter/lesson tree with completion state
lib/
  supabase/              # server.ts + client.ts
  anthropic/             # client, prompts, cache helpers, cost logging
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

# Judge0 (on Fly.io VM)
fly deploy --config infra/judge0/deploy.fly.toml
```

## Code conventions

- **Strict TypeScript:** `strict: true`, `noUncheckedIndexedAccess: true`. No `any` without an eslint-disable comment explaining why.
- **Prettier:** default config + `printWidth: 100`
- **Imports:** absolute via `@/*` alias; relative only within the same directory
- **Components:** server components by default; `'use client'` only when explicitly needed
- **Commits:** conventional commits (`feat:`, `fix:`, `chore:`)
- **Migrations:** one per logical change, forward-only (no rollback scripts), index in same migration as its column

## Project commands

Run these with `/project:<name>` to enforce project invariants:

| Command | When to use |
|---|---|
| `/project:cache-guard` | Before modifying code that touches LLM calls, lesson loading, or conversation retrieval |
| `/project:scope-check` | Before building any new feature — decision filter + exclusion list |
| `/project:security-verify` | After changes to Judge0 infra, auth middleware, or RLS policies |
| `/project:llm-integration` | When adding or modifying any Anthropic API call — model selection, cost tracking, content quality |
| `/project:new-route` | When creating or modifying API route handlers — auth pattern, error responses, API contracts |

## Testing strategy

Tests exist only where they prevent silent bugs: sandbox security (malicious C++ samples), cost calculator (unit tests), verdict logic (unit tests), auth middleware (integration: unauthenticated gets 401), lesson cache (integration: two hits, one LLM call). No tests for UI components, most API routes, or LLM output quality.

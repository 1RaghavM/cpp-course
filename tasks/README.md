# Task Breakdown — cpproad

14 tasks across 6 waves. Tasks within the same wave are independent and can run in parallel. A task in wave N depends only on tasks from earlier waves.

## Dependency Graph

```
Wave 0 (fully independent — no code dependencies)
├── T01: Project Scaffolding
├── T02: Database Schema, Migrations & Seed
└── T03: Judge0 Infrastructure

Wave 1 (depends on T01)
├── T04: Supabase Client Library          ← T01
├── T05: Auth System                      ← T01
├── T06: Anthropic Client Library         ← T01
└── T07: Judge0 Client Library            ← T01

Wave 2 (depends on Wave 0 + Wave 1)
├── T08: Content Generation Engine        ← T04, T06
└── T09: Roadmap Feature                  ← T04, T05

Wave 3 (depends on Wave 2)
├── T10: Lesson Feature                   ← T05, T08, T09
├── T11: Code Execution Feature           ← T04, T05, T07
├── T12: Progress Tracking                ← T04, T05
└── T13: Cost Stats Feature               ← T04, T05, T06

Wave 4 (depends on Wave 3)
└── T14: Tutor Feature                    ← T05, T06, T10, T11
```

## Parallel execution plan

| Phase | Tasks (parallel) | Sub-agents |
|-------|-----------------|------------|
| Phase 1 | T01 + T02 + T03 | 3 agents |
| Phase 2 | T04 + T05 + T06 + T07 | 4 agents |
| Phase 3 | T08 + T09 | 2 agents |
| Phase 4 | T10 + T11 + T12 + T13 | 4 agents |
| Phase 5 | T14 | 1 agent |

Total: 14 tasks, 5 phases, max 4 agents in parallel.

## Files by task

| Task | Files created |
|------|--------------|
| T01 | package.json, tsconfig.json, .eslintrc.js, .prettierrc, .env.example, .gitignore, next.config.ts, tailwind.config.ts, postcss.config.js, app/layout.tsx, app/globals.css |
| T02 | infra/supabase/migrations/001_schema.sql, infra/supabase/migrations/002_rls.sql, infra/supabase/migrations/003_indexes.sql, scripts/seed_db.ts |
| T03 | infra/judge0/docker-compose.yml, infra/judge0/deploy.fly.toml |
| T04 | lib/supabase/server.ts, lib/supabase/client.ts, lib/supabase/types.ts |
| T05 | middleware.ts, lib/auth/owner-only.ts, app/(auth)/login/page.tsx |
| T06 | lib/anthropic/client.ts, lib/anthropic/prompts.ts, lib/anthropic/cache.ts, lib/anthropic/cost.ts |
| T07 | lib/judge0/client.ts, lib/judge0/verdict.ts |
| T08 | lib/content/lesson-generation.ts |
| T09 | app/api/roadmap/route.ts, app/(app)/page.tsx, app/(app)/layout.tsx, components/roadmap/RoadmapTree.tsx |
| T10 | app/api/lessons/[slug]/route.ts, app/api/lessons/[slug]/regenerate/route.ts, app/(app)/lessons/[slug]/page.tsx, components/lesson/SummaryView.tsx, components/lesson/ExerciseCard.tsx |
| T11 | app/api/submissions/route.ts, app/(app)/exercises/[id]/page.tsx, components/editor/MonacoEditor.tsx |
| T12 | app/api/progress/[lesson_id]/route.ts |
| T13 | app/api/stats/costs/route.ts, app/(app)/stats/page.tsx |
| T14 | app/api/tutor/route.ts, app/api/conversations/route.ts, app/api/conversations/[id]/route.ts, components/tutor/ChatPanel.tsx, components/tutor/TierBadge.tsx |

## File ownership conflicts

No two tasks create or modify the same file. Each file has exactly one owner task.

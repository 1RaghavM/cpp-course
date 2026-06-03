# T02: Database Schema, Migrations & Seed

## Wave: 0 (independent — no dependencies)

## Objective

Create all Supabase Postgres migrations (tables, indexes, RLS policies) and the seed script that loads `curriculum_seed.json` into the database. This task defines the entire data layer.

## Files to create

```
infra/supabase/migrations/001_schema.sql      # all tables + indexes
infra/supabase/migrations/002_rls.sql         # RLS policies for every table
scripts/seed_db.ts                            # loads curriculum_seed.json → chapters + lessons
```

## Schema

Create these tables exactly as specified in `design.md` section 3.2:

### Tables

1. **chapters** — `id` (SMALLINT PK), `number`, `learncpp_title`, `my_title`, `sort_order`
2. **lessons** — `id` (UUID), `chapter_id` (FK), `number`, `slug` (UNIQUE), `learncpp_title`, `learncpp_url`, `my_title`, `summary_md` (nullable — NULL means not yet generated), `summary_generated_at`, `summary_model`, `tags` (TEXT[]), `sort_order`, timestamps
3. **exercises** — `id` (UUID), `lesson_id` (FK CASCADE), `title`, `prompt_md`, `starter_code`, `difficulty`, `sort_order`, `generated_at`, `generated_model`
4. **test_cases** — `id` (UUID), `exercise_id` (FK CASCADE), `label`, `is_sample`, `stdin`, `expected_stdout`, `sort_order`
5. **submissions** — `id` (UUID), `exercise_id` (FK), `mode` (CHECK: run|submit), `language_std`, `source_code`, `status` (CHECK: compile_error|passed|failed|tle|mle|runtime_error|error), `stdout`, `stderr`, `compile_output`, `exit_code`, `wall_time_ms`, `test_results` (JSONB), `created_at`
6. **progress** — `lesson_id` (UUID PK, FK CASCADE), `state` (CHECK: not_started|in_progress|completed|skipped), `first_visit_at`, `completed_at`, `last_visit_at`
7. **conversations** — `id` (UUID), `lesson_id` (FK), `title`, timestamps
8. **messages** — `id` (UUID), `conversation_id` (FK CASCADE), `role` (CHECK: user|assistant|system), `content`, `hint_tier`, `tokens_in`, `tokens_out`, `cached_tokens_in`, `model`, `created_at`
9. **token_usage** — `id` (BIGSERIAL), `call_type`, `model`, `tokens_in`, `tokens_out`, `cached_in`, `cost_usd_micro` (BIGINT), `lesson_id` (FK), `created_at`

### Indexes

- `idx_lessons_chapter_sort` on lessons(chapter_id, sort_order)
- `idx_submissions_exercise` on submissions(exercise_id, created_at DESC)
- `idx_messages_conv` on messages(conversation_id, created_at)
- `idx_token_usage_day` on token_usage(date_trunc('day', created_at))

### RLS

Enable RLS on every table except `chapters` (public read is fine).

- **User-scoped tables** (progress, submissions, conversations, notes, etc.): `USING (user_id = auth.uid())`
- **Shared content tables** (lessons, exercises, test_cases): `SELECT` open to all authenticated users; writes via service role only
- **messages**: access gated through parent conversation's `user_id`

## Seed script (scripts/seed_db.ts)

Reads `curriculum_seed.json` from the project root. Structure:

```json
{
  "chapters": [
    {
      "number": "0",
      "learncpp_title": "Introduction / Getting Started",
      "sort_order": 0,
      "lessons": [
        {
          "number": "0.1",
          "learncpp_title": "Introduction to these tutorials",
          "learncpp_url": "https://...",
          "chapter_sort_order": 0,
          "global_sort_order": 0
        }
      ]
    }
  ]
}
```

The script should:
1. Connect to Supabase using the service role key (from env)
2. Upsert chapters (use `number` as the natural key, assign `id` = sort_order)
3. Upsert lessons (generate slug from `number`, e.g. "1.5" → "1-5", "F.3" → "f-3")
4. Log counts: "Seeded X chapters, Y lessons"
5. Be idempotent — safe to re-run without duplicating data

Run with: `npx tsx scripts/seed_db.ts`

## Conventions

- One migration per logical change (here: schema in 001, RLS in 002)
- Forward-only migrations — no rollback scripts
- Index in the same migration as its table

## Skills to reference

- `/project:security-verify` — Part 2 (Auth) covers RLS policy requirements

## Acceptance criteria

- [ ] Migrations apply cleanly via `npx supabase db push`
- [ ] All 9 tables exist with correct columns and constraints
- [ ] RLS is enabled on all tables except chapters
- [ ] `npx tsx scripts/seed_db.ts` loads 34 chapters and 345 lessons
- [ ] Re-running the seed script doesn't create duplicates
- [ ] A query for per-user data returns only the requesting user's rows (RLS works)

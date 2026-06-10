# Phase A — Lesson Content Overhaul (Pedagogy)

**Date:** 2026-06-09
**Status:** Approved design, pending implementation plan

## Problem

cpproad is the learner's sole source of instruction (no learncpp.com content is ever shown),
but the current per-lesson experience is: read a 250–400 word summary → write 2 programs
from scratch → move on. Diagnosed gaps:

1. **No retrieval practice.** Nothing asks the learner to recall anything, ever. No concept
   questions, no review. Massed practice → fast forgetting.
2. **One exercise format.** Both exercises are write-from-scratch with exact stdout matching.
   Learners fail on formatting, not concepts. No predict-the-output, no find-the-bug — the
   formats that target C++ misconceptions directly.
3. **No connection between lessons.** Each lesson is an island. The only interleaving in the
   system is exercise 2's "combine with one prior concept".
4. **Summaries too thin for sole-source instruction.** Syntax-dense, missing mental models,
   common mistakes, and "when would I use this".
5. **Generation bugs** (documented in `scripts/regenerated/chapters/ch_*_audit.md`): forward
   references (loops in ch4 exercises, `std::string` before ch5, `auto` taught in 4.1),
   broken test cases, scope creep.

Phase A fixes 1, 2, 4, and 5 at the content layer. Phases B (retention engine) and C
(re-sequencing) build on it — see Future Phases.

## Constraints (from scope-check and cache-guard)

- **Caching invariant holds:** all new content is generated once per lesson and cached in
  Postgres. Costs scale with content (345 lessons), never with users. Per-user data is
  cheap rows only (attempts, schedules) — never per-user LLM generation.
- Single `main.cpp` per exercise (no multi-file).
- A lesson row with existing content NEVER triggers an LLM call on load. The regenerate
  endpoint remains the only path that clears cached content — extended to cover concept
  checks.
- Every Anthropic call applies `cache_control: { type: 'ephemeral' }` to system/context blocks.

## Design

### 1. Lesson body format

`lessons.summary_md` column unchanged; generated content becomes 800–1,200 words with
required sections, in order:

1. **Mental model** — analogy/intuition before syntax.
2. **Core content** — 2–3 short code examples (≤15 lines each), each a distinct facet.
3. **Common mistakes** — 2–3 concrete failure cases showing the compiler error or wrong
   output (integer division, narrowing, semicolon-after-struct, copy-vs-reference, etc.).
4. **When to use this** — 2–4 sentences connecting to real programs, referencing prior
   lessons by title.

All existing concept-boundary rules carry over verbatim: no forward references, no untaught
syntax, no markdown tables, fast-track mode preserved.

### 2. Concept checks (new content type)

3–5 per lesson, generated once by the offline pipeline, cached forever. (As-built note:
runtime generation is disabled — `getOrGenerateLesson` is read-only and the regenerate
endpoint returns 403. All generation happens offline; this design keeps that.)

```sql
create table concept_checks (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references lessons(id),
  kind text not null check (kind in ('predict_output', 'spot_bug', 'mcq')),
  prompt_md text not null,        -- question + code snippet
  options jsonb,                  -- MCQ choices; null for predict_output
  answer text not null,           -- correct option key or expected output
  explanation_md text not null,   -- shown after answering: the WHY
  position int not null
);

create table concept_check_attempts (
  user_id uuid not null references auth.users(id),
  check_id uuid not null references concept_checks(id),
  correct boolean not null,
  answered_at timestamptz not null default now(),
  primary key (user_id, check_id, answered_at)
);
-- RLS: per-user isolation on attempts; concept_checks readable by authenticated users.
```

Each item targets a named misconception genre (off-by-one, narrowing, copy-vs-reference,
precedence, uninitialized reads) — not trivia recall. `concept_check_attempts` is
deliberately the substrate Phase B's review queue will read; no migration needed later.

### 3. Recall warm-up (zero LLM cost)

Top of each lesson page: up to 3 concept checks **reused from prior lessons**, selected by
SQL — prefer items the user answered wrong, then least-recently-seen. If prior items don't
exist (user skipped ahead), the block shrinks or hides. Pure reuse; embryonic Phase B.

### 4. Exercises

- Exercise 1: guided write-from-scratch (unchanged role).
- Exercise 2 rotates format per lesson, deterministically by lesson position within the
  chapter (even → `fix_the_bug`, odd → `complete_the_function`), so regeneration is stable:
  - `fix_the_bug` — starter compiles but contains one specific planted bug hidden tests catch
  - `complete_the_function` — scaffold given, one function to fill in
- Both run on existing Judge0 stdin/stdout infra. Predict-the-output moves to concept
  checks (no Judge0 needed).
- **Verdict softening** (`lib/judge0/verdict.ts`): normalize trailing whitespace per line
  and trailing newlines before diffing. Everything else stays exact-match.

### 5. Prompts (`lib/anthropic/prompts.ts`)

- `LESSON_SUMMARY_SYSTEM` rewritten for the four-section format; `maxTokens` 1024 → 3072.
- New `buildConceptCheckPrompt(lessonTitle, summaryMd, priorTitles)` — separate call
  mirroring the exercise pattern; returns JSON array of 3–5 items; system block cached.
- `buildExercisePrompt` updated for format rotation and audit-derived rules.

### 6. Regeneration pipeline (offline, `scripts/`)

1. Regenerate all 345 lessons: body → concept checks → exercises (sequential, each feeds
   the next).
2. **Automated validation gate:**
   - `g++ -std=c++20 -Wall -Wextra` compile-check every `starter_code` and `solution_code`
   - Run every solution against its test cases locally; mismatch fails the lesson
   - Concept-boundary lint: per-chapter forbidden-token list derived from
     `scripts/regenerated/curriculum_reference.md` (e.g. `for`/`while` before ch8,
     `std::string` before ch5)
3. Failures: regenerate once with the error appended to the prompt, then flag for manual
   review.
4. Seed DB.

Cost: one-time ≈ 345 × ~8K output tokens (Sonnet) ≈ $40–80. Never recurs.

### 7. Runtime data flow

- **Lesson visit:** reads summary, concept checks, and exercises from Postgres. Zero LLM
  calls in all cases — content that hasn't been generated yet renders as "coming soon".
- **Content replacement:** the offline push script is the only path that clears and
  replaces cached content (summary, exercises, concept checks). The runtime regenerate
  endpoint stays disabled.

### 8. Frontend (lesson page, existing shadcn primitives)

- Warm-up block: collapsible card at top, up to 3 prior items; answers recorded to
  `concept_check_attempts`.
- Concept checks after lesson body, before exercises: MCQ via `radio-group`,
  predict-output via code block + text input; reveal answer + `explanation_md` after
  attempt. Formative, not gated — lesson completion logic unchanged.

### 9. Error handling

Generation failures are an offline concern: unparseable JSON retries once with the parse
error appended; lessons that still fail are flagged in the validation report and not
pushed. At runtime, a lesson with no concept checks simply renders without the section —
nothing blocks.

### 10. Testing

- Unit: verdict whitespace normalisation (per-line trailing spaces, trailing newlines).
- Unit: warm-up selection picker (wrong-first ordering, unseen next, graceful empty case).
- Content correctness is covered by the offline validation gate, not runtime tests.

## Future Phases (recorded, not designed)

- **Phase B — retention engine:** SM-2-lite spaced review queue reading
  `concept_check_attempts`; daily review page; chapter `.x` lessons become cumulative
  quizzes mixing current chapter with items from two chapters back. Pure scheduling + one
  page; all content already exists.
- **Phase C — re-sequencing:** survival-bridge module (minimal if/else + loops after ch2),
  three single-file project checkpoints (number-guesser, text inventory, blackjack-scale),
  merge/fast-track low-value lessons. Requires updating `priorTitles` boundary lists, so
  deliberately last.

## Out of scope

Multi-file exercises, social features, gating completion on checks, per-user content
generation, changes to tutor behavior, curriculum re-sequencing (Phase C).

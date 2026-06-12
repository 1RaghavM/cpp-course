# Capstone Projects — Design

**Status:** Approved 2026-06-11
**Author:** Brainstormed with Claude (Opus 4.7)
**Implementation phase:** Hands off to `writing-plans` next

---

## 1. Problem

The curriculum is split into 4 parts on the dashboard — Basics, Memory & OOP, STL & Templates, Advanced — but finishing a part has no consolidating artifact. Lessons end and the next part unlocks; nothing ties the topics together into something the user can point at and say "I built this."

## 2. Solution at a glance

Add 4 optional **capstone projects**, one per part. Each is a single-file C++ project the user builds in 5 sequential milestones inside the existing Monaco editor. Capstones unlock at **80% of the part's lessons complete** and do **not gate** progress to the next part — they are a celebratory consolidation, not a barrier.

Each capstone is strictly scoped to topics covered in its part. The Basics capstone uses no vectors, classes, or pointers; the Memory & OOP capstone uses no STL containers; etc. Scope is enforced by a forbidden-symbol grep test in CI.

The 4 capstone specs are authored by 4 parallel Opus Code agents — one per part — each running in an isolated git worktree, each self-testing that its reference solution compiles and passes all 5 milestone test cases before declaring DONE.

## 3. Topic scope per part

Part-to-chapter mapping is fixed in `lib/dashboard/curriculum.ts`:

| Part | Chapters | Lessons | Allowed C++ surface | Forbidden surface (must not appear in reference) |
|---|---|---|---|---|
| Basics | 0–11 | 134 | `std::cout`/`cin`, fundamental types, `if`/`else`, `while`/`for`/`do`, functions, function params, return values, scope/linkage, `std::string` intro use, `static_cast`, bit ops | `std::vector`, `std::array`, `class `, `struct ` (with member fns), `new`, `delete`, `*` ptr decls, `&` ref decls, smart pointers, templates, lambdas, STL algorithms |
| Memory & OOP | 12–17 | 78 | Above + function overloading, function templates, references, pointers, enums, structs, classes (member fns, ctors, access specifiers) | `std::vector`, `std::array`, iterators, STL algorithms, smart pointers, dynamic memory in user code (`new`/`delete` only allowed where chapter introduces it), virtual, inheritance, move semantics, exceptions |
| STL & Templates | 18–23 | 60 | Above + `std::vector`, `std::array`, iterators, STL algorithms, function objects, operator overloading, `new`/`delete`, raw dynamic memory | Smart pointers, inheritance, virtual, move semantics, class templates beyond intro, exceptions, fstream |
| Advanced | 24–33 | 73 | Above + move semantics, `std::unique_ptr`/`shared_ptr`, inheritance, `virtual`/polymorphism, class templates, exceptions, `<fstream>`/`<sstream>` | (none — everything is on the table) |

Each Opus agent receives both lists frozen in its prompt. The reference solution is grep-checked against the forbidden list before the agent declares DONE; the same check runs in CI long-term (§8).

## 4. Spec file format

Each capstone is two files under a new `content/capstones/` directory:

```
content/capstones/
  basics.md
  basics.tests.json
  memory-oop.md
  memory-oop.tests.json
  stl-templates.md
  stl-templates.tests.json
  advanced.md
  advanced.tests.json
```

### 4.1 `<slug>.md` shape

Markdown, ~600–1000 words. Sections:

1. **Title** — H1, e.g. `# Capstone: Build a [theme] in C++`
2. **Project pitch** — 1 paragraph, what they're building and why
3. **What you'll build** — short prose description of the finished program's behavior (no diagrams; no images)
4. **Milestones (1–5)** — each an H2 with:
   - **Goal** — what this milestone adds
   - **Acceptance criteria** — observable behavior, mapped to the test cases
   - **Hint** — one nudge, not a solution
5. **Stretch goals** — bullet list, no tests, purely optional
6. **Topics you'll use** — bullet list, each item is `(lesson_number) Topic name` referencing a lesson from that part

### 4.2 `<slug>.tests.json` shape

```json
{
  "slug": "basics",
  "stage": "basics",
  "title": "...",
  "language_standard": "c++20",
  "compile_flags": ["-std=c++20", "-Wall", "-Wextra"],
  "starter_code": "// single-file starter that compiles to a no-op main",
  "reference_solution": "// full working reference, private — never returned to client",
  "milestones": [
    {
      "id": 1,
      "title": "Milestone 1: ...",
      "spec_anchor": "milestone-1",
      "tests": [
        {
          "name": "human-readable case name",
          "stdin": "...",
          "expected_stdout": "...",
          "timeout_ms": 2000
        }
      ]
    }
  ]
}
```

Constraints:

- Exactly 5 milestones, IDs 1–5
- ≥ 2 tests per milestone, ≥ 10 tests across the capstone in total
- `spec_anchor` must match a slugified H2 in the `.md` file
- `reference_solution` is the agent's self-test artifact; lives in the DB but is **never** returned by any client-facing API
- Total reference solution size budget: 50–150 LOC

## 5. Data model

One new migration: `infra/supabase/migrations/<timestamp>_capstones.sql`.

```sql
create table capstones (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  stage text not null,
  title text not null,
  description_md text not null,
  language_standard text not null default 'c++20',
  compile_flags text[] not null,
  starter_code text not null,
  reference_solution text not null,
  created_at timestamptz default now()
);

create table capstone_milestones (
  id uuid primary key default gen_random_uuid(),
  capstone_id uuid not null references capstones(id) on delete cascade,
  ordinal int not null,
  title text not null,
  spec_anchor text not null,
  tests jsonb not null,
  unique (capstone_id, ordinal)
);

create table capstone_attempts (
  user_id uuid not null references auth.users(id) on delete cascade,
  milestone_id uuid not null references capstone_milestones(id) on delete cascade,
  passed boolean not null,
  submission_id uuid references submissions(id),
  last_attempted_at timestamptz default now(),
  primary key (user_id, milestone_id)
);

alter table capstones enable row level security;
alter table capstone_milestones enable row level security;
alter table capstone_attempts enable row level security;

-- capstones + capstone_milestones: readable by any authenticated user, server-side projection
-- excludes reference_solution from API responses. No client-side write policy.

-- capstone_attempts: user can select/insert/update only rows where user_id = auth.uid().
```

Indexing: `capstone_milestones (capstone_id, ordinal)` already covered by the unique constraint. `capstone_attempts (user_id, milestone_id)` is the PK.

## 6. Data flow

### 6.1 Seeding

A new `scripts/seed_capstones.ts` reads `content/capstones/*.md` + `*.tests.json` and upserts into `capstones` + `capstone_milestones`. Idempotent on `slug`. Run as part of the existing `npx tsx scripts/seed_db.ts` or as a standalone command.

### 6.2 Loading a capstone (no LLM call ever)

1. User navigates to `/capstones/[slug]`
2. Server reads `capstones` + `capstone_milestones` for that slug
3. Server reads the user's `capstone_attempts` rows for those milestones
4. Server computes stage progress using the existing dashboard definition (lesson status `completed` OR `skipped` counts as done, per `lib/path.ts`); if `< 80%`, returns locked state with reason
5. Server returns `{ capstone (no reference_solution), milestones, attempts }` to the client

There is no regeneration path. Capstones are authored once, committed, seeded. To edit: change the `.md`/`.tests.json` and re-seed.

### 6.3 Running a milestone

1. Client `POST /api/capstones/[slug]/run` with `{ milestone_ordinal, code }`
2. Server loads that milestone's `tests` jsonb
3. Server forwards `code` + each test's stdin to Judge0 with the capstone's compile flags
4. Server diffs each test's stdout against `expected_stdout`
5. Server upserts a `capstone_attempts` row with the milestone's pass result
6. Server returns per-test pass/fail to client

Reuses `lib/judge0/` client and `lib/judge0/verdict.ts` diffing — no new sandbox surface.

## 7. UI integration

### 7.1 Curriculum Progress panel (dashboard)

Each of the 4 part rows in the existing Curriculum Progress accordion gets a new chip after `Active`/`Locked`:

- `stage progress < 80%` → no chip (stage progress = `completed + skipped` over total, per §6.2)
- `≥ 80%` and `0/5` milestones passed → chip `Capstone available` (clickable, links to `/capstones/<slug>`)
- `1–4 / 5` passed → chip `Capstone N/5` (shows progress)
- `5/5` passed → chip `Capstone ✓` (subtle, neutral color — no celebration emoji unless explicitly requested)

Chip uses the existing shadcn `badge` primitive.

### 7.2 New route `/capstones/[slug]`

Layout reuses the exercise page primitives:

- **Left rail:** collapsible milestone list (1..5) with pass state per milestone, current one highlighted
- **Center:** rendered `description_md` scoped to the selected milestone's section + acceptance criteria
- **Right:** Monaco editor + Run / Submit / Reset buttons (same component as exercise pages); output panel below

Local storage key for editor content: `capstone:<slug>:code` (single file per capstone, not per milestone — the user is iterating on one program).

### 7.3 Dashboard resume CTA

If the user has a capstone in progress (≥1 milestone passed, <5) **and** an in-progress lesson, the in-progress lesson wins the resume slot. Capstone-only resume only shows when no lesson is in progress.

### 7.4 Tutor

No new tutor logic. The existing tutor panel works on `/capstones/[slug]` as it does on lesson pages. Sonnet 4.6 over SSE, same 4-tier hint policy. Capstone context for the tutor: project description + current milestone's acceptance criteria.

## 8. Testing

Light, targeted — matches the existing policy of "tests only where they prevent silent bugs."

1. **Seed script integration test** — seeds all 4 capstones into a test DB, asserts 4 rows in `capstones`, 20 in `capstone_milestones`, every `reference_solution` non-null, every milestone's `tests` jsonb is a non-empty array.
2. **Unlock unit test** — pure function `isCapstoneUnlocked(completed, total): boolean`, table-driven at 79%, 80%, 100%, edge cases (0/0, 1/1).
3. **Forbidden-symbol regression test** — for each `<slug>.tests.json`, parse `reference_solution`, grep for that part's forbidden set, fail loud on any hit. Catches future hand-edits to the content files that violate scope.

Not tested: the UI route, milestone chip rendering, LLM/agent output quality. Authoring quality is the agent self-test contract's job, not CI's.

## 9. Agent dispatch plan

### 9.1 Override note

The `feedback_generation_workflow` memory says content-generation agents use **Sonnet + self-test**. User explicitly overrode to **Opus** for capstones. This is a one-off override for this run; the Sonnet default stands for lesson generation.

### 9.2 Parallelism + isolation

4 agents dispatched in parallel (single message, 4 Agent tool calls). Each runs in its own git worktree (`superpowers:using-git-worktrees`) on its own branch:

- `capstone/basics`
- `capstone/memory-oop`
- `capstone/stl-templates`
- `capstone/advanced`

Each agent is restricted to writing inside `content/capstones/` only. They do not touch the migration, route handlers, UI, or each other's files. Merges happen sequentially in the main session after each branch returns clean.

### 9.3 Per-agent prompt template

Each agent receives (with the part-specific block swapped in):

1. **Topic envelope:** stage slug, chapter range, full list of lesson titles for the part (extracted from `curriculum_seed.json`), the allowed C++ surface list, and the **explicit forbidden surface list** from §3.
2. **Output contract:** write exactly `content/capstones/<slug>.md` and `content/capstones/<slug>.tests.json` matching §4.
3. **Self-test contract:**
   - Write the reference solution to a temp file
   - Compile with `g++ -std=c++20 -Wall -Wextra -Werror` (stricter than the runtime flags in `compile_flags` so agent-time mistakes can't slip through as warnings)
   - For each of the 5 milestones, run every test case (pipe `stdin`, capture stdout, compare to `expected_stdout`)
   - Only declare DONE when all milestones' tests pass against the reference
   - Iterate the reference + tests if any milestone fails
4. **Scope enforcement:** before declaring DONE, run a grep over the reference solution for each forbidden symbol. Any hit blocks DONE.
5. **Theme freedom:** the agent picks the project topic. No coordination between agents; thematic inconsistency between the 4 capstones is acceptable.
6. **No edits outside `content/capstones/`.** Migration, routes, UI, tests are this session's work, not the agents'.

### 9.4 Acceptance check after agents return

Before merging each agent's branch:

1. Both files present at expected paths
2. `tests.json` parses; schema matches §4.2
3. Exactly 5 milestones; ≥ 2 tests per milestone
4. Reference solution compiles in this session (re-verify, don't trust the agent's word)
5. Reference passes every milestone's test cases in this session
6. Forbidden-symbol grep returns zero hits
7. Reference solution LOC within 50–150 budget

Any failure: send the agent back with the specific failure, do not merge.

## 10. Out of scope

- Multi-file projects (deferred; would require new editor + Judge0 multi-file infra)
- LLM-judged free-form capstones
- Per-milestone code snapshots/replay
- Capstone leaderboards or social features
- Capstones for future curriculum reorganizations — when chapter-to-part mapping changes, capstones must be reviewed and re-authored

## 11. Open questions

None at design time. Resolved during brainstorming:

- Format → single-file mega-exercise w/ milestones
- Scope → strict per part
- Unlock → 80% of part, optional
- Milestone count → 5
- Theme picker → agents pick freely
- Storage → `.md` + `.tests.json` in repo, seeded to DB
- Self-test bar → compile + all 5 milestones pass against reference

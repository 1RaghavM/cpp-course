# Task: rewrite the coding challenges so learners IMPLEMENT, one agent per chapter

You are the **orchestrator**. You do not edit files yourself — you dispatch one
sub-agent per chapter, all in parallel, and each sub-agent fixes every coding
challenge in its chapter.

## The problem we're fixing

Right now most coding challenges spoon-feed the answer. The learner doesn't
actually implement what the lesson taught — they just fill in `cout` lines or
follow a step-by-step recipe baked into the starter code. Examples:

- **Lesson 22.6 (`std::shared_ptr`)** — the structure is pre-written; the learner
  writes essentially no real logic.
- **Lesson 22.7** — effectively just asks the learner to *print* things.

This pattern is everywhere. We want challenges where the learner has to **build the
thing the lesson taught**, not transcribe it.

## What "good" looks like

- The learner writes the **core logic that embodies the lesson's concept** — not
  `cout` statements around a solution that's already there.
- `prompt_md` states **what to build and the input/output contract**. It does NOT
  dictate the algorithm line-by-line ("create x, then set x = y, then print…").
- `starter_code` is a **minimal compilable frame** (includes, `main`, and only the
  I/O scaffolding the tests genuinely require). No "// TODO: do X then Y" recipe
  comments, no pre-written solution structure with blanks to fill.
- The output is a **consequence of a correct implementation**, verified across
  varied inputs — so a "print the constants" program cannot pass.

## Scope rule: build on prior chapters, but tailor to THIS topic

- **Foundation context (read-only):** before touching its chapter, each agent skims
  the summaries of **all earlier chapters** (`scripts/regenerated/M.*_summary.md` for
  every chapter `M` before its own) so it knows what the learner already knows and can
  safely assume. It does not edit those files.
- **Primary signal:** each challenge is built **primarily from the current lesson's own
  summary** — the specific topic being taught. Tailor the challenge to exercise *that*
  concept directly, using earlier material only as supporting scaffolding.
- **Never** require a concept from a later lesson. Example: a 22.6 (`shared_ptr`)
  challenge must not use `weak_ptr` — that's introduced in 22.7.

So the allowed-concept set = (this lesson's topic, primary) + (everything taught before
it, foundation) − (anything taught later).

## Files (source of truth — these are what ship to users)

Per lesson `N.Y` in `scripts/regenerated/`:

- `N.Y_summary.md` — **what was taught** in that lesson. Read it to scope concepts.
- `N.Y_exercises.json` — **the coding challenges** (a JSON array). This is what you edit.

Ignore `scripts/regenerated/chapters/**` — it's intermediate, not shipped.

### In each `N.Y_exercises.json`, per exercise object:

| Field | What to do |
|---|---|
| `prompt_md` | Rewrite: state the goal + IO contract, remove the step-by-step recipe. |
| `starter_code` | Strip to a minimal frame; remove dictating TODOs / pre-built structure. |
| `solution_code` | A correct reference implementation of the (re-framed) challenge. |
| `test_cases` | Keep the stdin→expected_stdout format. Revise/add cases (varied/hidden inputs) so real logic is required. |
| `title`, `difficulty` | Leave as-is. |

**Do NOT touch the "check yourself" concept checks** — they're good and they live
elsewhere, not in these files. Don't go looking to change them.

## Orchestration

1. List `scripts/regenerated/*_exercises.json` and group by chapter (the integer
   before the first dot). Chapters present: **1, 13, 17, 18, 19, 20, 21, 22, 23, 24, 25** (11 total).
2. Spawn **one sub-agent per chapter, in parallel** (issue the dispatches together;
   let the harness queue any overflow). Each agent owns **all** lessons in its chapter.
   **Spawn every sub-agent with the `opus` model** (pass the model override on each dispatch).
3. Give each agent: this brief, its chapter number, and its file list. Chapters are
   independent — no shared state.

## Each sub-agent's procedure

First, **once per chapter:** skim the summaries of all earlier chapters
(`scripts/regenerated/M.*_summary.md` for `M` < your chapter) to load the foundation
the learner already has. Then, **per lesson in your chapter, in order:**

1. Read `N.Y_summary.md` closely → this lesson's specific topic is the **primary**
   driver of the challenge. Allowed set = this topic + everything taught earlier.
2. Read `N.Y_exercises.json` → rewrite each challenge per the rules above, tailored to
   exercise this lesson's concept directly.
3. **Self-test (required):** `node infra/claude-sandbox/validate.mjs scripts/regenerated/N.Y_exercises.json`
   — it compiles `solution_code` and runs every test case. Do not move on until it
   prints `all solutions compile and pass`.
4. You are running on the **opus** model. Do not add any Anthropic API calls — you are the generator.

## Definition of done (per chapter)

`node infra/claude-sandbox/validate.mjs scripts/regenerated/N.*_exercises.json`
prints `all solutions compile and pass`, and every challenge in the chapter now
requires real implementation scoped to what was taught. Commit per chapter with a
conventional message, e.g. `feat(exercises): rewrite ch22 challenges to require implementation`.

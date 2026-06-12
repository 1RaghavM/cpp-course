# Capstone Author Agent — {{STAGE_TITLE}}

You are writing a single end-of-part C++ capstone project for the cpproad
learning platform. Read `docs/superpowers/specs/2026-06-11-capstone-projects-design.md`
for full context; this prompt is the spec re-stated as your contract.

## Scope (frozen — do not negotiate)

- **Stage slug:** `{{STAGE_SLUG}}`
- **Stage chapter range:** `{{STAGE_CHAPTERS}}`
- **Lesson titles in this stage:**
{{LESSON_TITLES_BULLETED}}

## Allowed C++ surface

{{ALLOWED_SURFACE_BULLETED}}

## Forbidden C++ surface — your reference solution MUST NOT use any of these

{{FORBIDDEN_SURFACE_BULLETED}}

The platform runs an automated grep-based check against this list. Hits block
DONE. Treat the list as load-bearing.

## What you must produce

Exactly two files. No others. No edits anywhere else in the repo.

1. `content/capstones/{{STAGE_SLUG}}.md` — project description (markdown,
   ~600–1000 words). Sections in this order:
   - `# Capstone: <project title>` (H1)
   - 1-paragraph project pitch
   - `## What you'll build` — prose description of the finished program's
     behavior (no images, no diagrams)
   - `## Milestone 1: <title>` through `## Milestone 5: <title>` — each with:
     - `**Goal:**` what this milestone adds
     - `**Acceptance criteria:**` observable behavior matching the test cases
     - `**Hint:**` one nudge, not a solution
   - `## Stretch goals` — optional, untested ideas
   - `## Topics you'll use` — bullet list, each item formatted
     `(<lesson_number>) <Topic name>` referencing lessons listed above

2. `content/capstones/{{STAGE_SLUG}}.tests.json` — strict schema:

   ```json
   {
     "slug": "{{STAGE_SLUG}}",
     "stage": "{{STAGE_SLUG}}",
     "title": "<same as the .md H1, without the 'Capstone: ' prefix>",
     "language_standard": "c++20",
     "compile_flags": ["-std=c++20", "-Wall", "-Wextra"],
     "starter_code": "<single-file starter that compiles to a working no-op main>",
     "reference_solution": "<full working reference solution, 50–150 LOC, single file>",
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
   - `spec_anchor` matches the slugified H2 in your `.md`
   - `reference_solution` fits in 50–150 lines total
   - Tests pipe `stdin` and compare to `expected_stdout` literally (trailing
     whitespace ignored, full leading/trailing whitespace trimmed)

## Self-test contract — MUST complete before declaring DONE

1. Write your reference solution to `/tmp/capstone-{{STAGE_SLUG}}-ref.cpp`.
2. Compile: `g++ -std=c++20 -Wall -Wextra -Werror /tmp/capstone-{{STAGE_SLUG}}-ref.cpp -o /tmp/capstone-{{STAGE_SLUG}}-ref`
3. For each of the 5 milestones, for each test case:
   - Run `printf '<stdin>' | /tmp/capstone-{{STAGE_SLUG}}-ref` (or write stdin
     to a file and pipe it in)
   - Compare actual stdout against `expected_stdout` (apply the same
     normalisation the platform uses: trim trailing whitespace on each line,
     then trim leading + trailing whitespace overall)
   - If any test fails, fix the reference OR the test case and rerun.
4. Run the forbidden-symbol check: grep your reference solution for each
   forbidden pattern listed above. Any hit means re-author until clean.
5. Only declare DONE when (a) all 5 milestones' tests pass against the
   reference and (b) the reference is forbidden-symbol-clean.

## Theme

Pick the project theme yourself. Examples are fine but not required: a CLI
calculator, a temperature converter, a number-guessing game, a budget tracker,
an event scheduler — whatever maps cleanly onto the allowed surface. No
coordination with the other 3 agents; thematic inconsistency is acceptable.

## Boundaries

- You do NOT touch the migration, route handlers, UI, or any file outside
  `content/capstones/`.
- You do NOT add new dependencies.
- You do NOT add tests in `__tests__/`; the platform owns those.
- You do NOT use external network calls in the reference solution.

When done, output: a 1-paragraph summary of the project theme + the milestone
titles + confirmation that the self-test passed.

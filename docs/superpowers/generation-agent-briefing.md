# Content Generation Agent Briefing — Template

> Reusable briefing template for cpproad Phase A content-generation agents. The
> controller dispatches a sonnet-model `general-purpose` agent per batch of
> 4–5 lessons, pastes the canonical spec text from `lib/anthropic/prompts.ts`,
> the per-batch metadata, and the workflow below. Each agent writes files
> directly and self-tests its own work before declaring DONE.

## Hard rules

- **Sonnet model only** (`model: "sonnet"` on the Agent dispatch).
- **Zero Anthropic API calls.** Generation is the agent's own work — never invoke `lib/anthropic/client.ts` or the SDK.
- **Zero git operations.** The controller validates and commits.
- **Branch is already checked out** (`feat/phase-a-content-overhaul`). Never switch branches, never stash.
- **Stage nothing.** The controller's per-task `git add` lists are surgical to avoid stomping unrelated working-tree changes.

## Canonical specs

Every briefing includes verbatim copies of these three constants from `lib/anthropic/prompts.ts`:

- `LESSON_SUMMARY_SYSTEM` — four-section body format (`## The idea` / `## How it works` / `## Common mistakes` / `## When to use this`), 800–1200 words.
- `CONCEPT_CHECK_SYSTEM` — 3–5 items, ≥1 `predict_output` AND ≥1 `mcq`, exact JSON schema.
- `EXERCISE_SYSTEM` — 2 exercises, exact test-case JSON schema (`label`, `is_sample`, `stdin`, `expected_stdout` — no synonyms), starter compiles, solution produces expected_stdout for every test case.

Briefings paste these constants verbatim (the prompts.ts builders are spec text used by agent briefings, never invoked against the API).

## Per-lesson metadata

The controller exports `scripts/regenerated/v2/_meta/ch_<num>.json` via
`scripts/export_lesson_meta.ts`. Each lesson entry has:

```jsonc
{
  "number": "13.7",
  "title": "Introduction to structs, members, and member selection",
  "chapterNumber": "13",
  "chapterTitle": "Compound Types: Enums and Structs",
  "priorTitles": [/* earlier lesson titles in this chapter */],
  "tags": [],
  "withContent": true,           // false → summary.md only (intro chapters)
  "exercise2Format": "fix_the_bug" | "complete_the_function"
}
```

For chapter 13's `exercise2Format` rotation, the convention is `idx % 2 === 0 → fix_the_bug`.

## Output contract

Per lesson, write three files (skip `checks.json` and `exercises.json` when `withContent: false`):

- `scripts/regenerated/v2/<number>/summary.md` — raw markdown, no surrounding fences
- `scripts/regenerated/v2/<number>/checks.json` — JSON array of 3–5 items
- `scripts/regenerated/v2/<number>/exercises.json` — JSON array of exactly 2 items

The Write tool sometimes rejects `.md` files with a "subagents shouldn't write report files" guard. Use a Bash heredoc as the documented fallback:

```bash
mkdir -p scripts/regenerated/v2/13.7
cat > scripts/regenerated/v2/13.7/summary.md <<'CPPROAD_SUMMARY_EOF'
## The idea
...full markdown content here...
CPPROAD_SUMMARY_EOF
```

JSON files go through Write without issue.

## Mandatory self-test (NEW — added after the chapter 13 pilot)

After drafting all three files for a lesson and BEFORE moving to the next lesson, the agent MUST run the mechanical gate on its own output and only mark the lesson done when it passes:

```bash
# 1. Per-exercise compile-and-run smoke test (use /tmp so the validator's own .build/ stays clean):
TMPDIR=$(mktemp -d)
python3 - "$TMPDIR" <<'PYEOF'
import json, sys, subprocess, os
tmp = sys.argv[1]
lesson = "13.7"  # ← controller substitutes per lesson
ex = json.load(open(f"scripts/regenerated/v2/{lesson}/exercises.json"))
fail = 0
for i, e in enumerate(ex, 1):
    for label, code in [("starter", e["starter_code"]), ("solution", e["solution_code"])]:
        src = f"{tmp}/ex{i}_{label}.cpp"
        binp = f"{tmp}/ex{i}_{label}.out"
        open(src, "w").write(code)
        r = subprocess.run(["g++", "-std=c++20", "-Wall", "-Wextra", "-o", binp, src], capture_output=True, text=True, timeout=30)
        if r.returncode != 0:
            print(f"[{lesson} ex{i} {label}] COMPILE FAIL\n{r.stderr[:500]}")
            fail += 1
    # run solution against each test case
    binp = f"{tmp}/ex{i}_solution.out"
    if os.path.exists(binp):
        for j, tc in enumerate(e["test_cases"], 1):
            r = subprocess.run([binp], input=tc["stdin"], capture_output=True, text=True, timeout=5)
            actual = "\n".join(l.rstrip() for l in r.stdout.split("\n")).strip()
            expected = "\n".join(l.rstrip() for l in tc["expected_stdout"].split("\n")).strip()
            if actual != expected:
                print(f"[{lesson} ex{i} test {j} \"{tc['label']}\"] WRONG OUTPUT\n  expected: {expected!r}\n  actual:   {actual!r}")
                fail += 1
print(f"\n{lesson}: {fail} failure(s)")
sys.exit(1 if fail else 0)
PYEOF

# 2. Run the project's validator on the lesson — must report `pass`:
npx tsx scripts/validate_v2.ts --lessons 13.7
```

If the self-test fails:
- For compile errors: fix the starter/solution and rewrite the JSON.
- For wrong-output errors: trace the solution against the stdin manually, fix it, rewrite the JSON.
- For schema errors (missing `stdin`, etc.): rewrite using the canonical field names — `label`, `is_sample`, `stdin`, `expected_stdout`. Do not invent synonyms.

Do NOT declare DONE for a lesson until both the smoke test and `validate_v2.ts` pass for it.

## Fixes-catalog: things the chapter 13 pilot taught us (read before generating)

Three classes of error came up in the pilot. The hardened EXERCISE_SYSTEM text and this self-test loop close them, but each agent should still keep them in mind.

### 1. Test-case field-name drift (69 of 102 cases across 13 lessons)

Three different agents invented three different schemas: `input`/`is_sample`, `input`/`is_hidden`, and `stdin`/`hidden`. The validator silently treated missing `stdin` as empty input, masking the issue. The canonical names are EXACTLY:

```jsonc
{ "label": "...", "is_sample": true | false, "stdin": "...", "expected_stdout": "..." }
```

The schema-enforcement check now errors on any other shape. Do not invent synonyms.

### 2. Solution code that doesn't solve the problem

- 13.5: agent left the buggy operator>> in solution_code so the program always printed "West".
- 13.8: agent left the `complete_the_function` stub `return {};` in solution_code so output was zeros.

The new self-test runs every test case against the compiled solution. The agent MUST observe a clean pass before writing the JSON.

### 3. fix_the_bug starter that doesn't compile

- 13.11: starter passed a `const Resolution` into a `Resolution&` (non-const) parameter — compile error, not a runtime bug.

The starter must COMPILE; the bug is always a LOGIC bug. Hidden tests fail buggy / pass fixed. The new self-test compile-checks the starter too.

### 4. Coverage gaps the user noted

- Three lessons (13.5, 13.8, 13.9) came in below the 800-word target (751–788). Validator warns at <700 / >1400 but the target is 800–1200. Aim for the middle of the range; one short example is enough, more prose is fine.

## Reporting format (when all lessons in batch are done)

- Status: DONE | DONE_WITH_CONCERNS | BLOCKED
- Per lesson: number + ✓/✗ for each of summary.md / checks.json / exercises.json + word count + self-test result line
- Concerns (lessons where the boundary felt tight, where you had to repair after a self-test failure, etc.)
- Do NOT git add or commit — the controller does that.

# Phase A Lesson Content Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn each lesson from a thin 250–400 word summary + 2 identical-format exercises into real sole-source instruction: an 800–1,200 word four-section lesson body, 3–5 cached concept-check questions, a recall warm-up block reusing prior-lesson checks, rotating exercise-2 formats, and a mechanical offline validation gate (compile + run + concept-boundary lint).

**Architecture:** Content generation is fully offline and makes ZERO Anthropic API calls: deployed Claude Code agents (briefed with the canonical prompts) write content files → mechanical validation gate → push to Supabase. Runtime stays cache-read-only — zero LLM calls on lesson visits. New `concept_checks` table follows the same generate-once pattern as `exercises`; per-user data is only cheap `concept_check_attempts` rows under RLS. Warm-up selection is pure SQL + a pure TypeScript picker function.

**Tech Stack:** Next.js 14 App Router, Supabase (Postgres + RLS), Anthropic SDK (`claude-sonnet-4-6`), Judge0, vitest, tsx scripts, shadcn/ui.

**Spec:** `docs/superpowers/specs/2026-06-09-phase-a-content-overhaul-design.md`

**Key as-built facts (differ from CLAUDE.md's "planned" docs):**
- Runtime generation is disabled. `lib/content/lesson-generation.ts:getOrGenerateLesson` only reads the DB; the regenerate endpoint returns 403. The prompt builders in `lib/anthropic/prompts.ts` have **zero callers by design** — they are the canonical spec text used to brief content-generation agents, never invoked against the API.
- Content pipeline: scripts write JSON/MD to `scripts/regenerated/`, `push_regenerated.ts` pushes to Supabase using a deterministic UUID derived from the lesson number.
- Tests: vitest, files in `__tests__/`, `@` alias resolves to repo root (see `vitest.config.ts`). Run with `npm run test`.
- `scripts/*.ts` run via `npx tsx` and must use **relative imports** for repo files (tsx does not resolve the `@/*` alias). `lib/anthropic/prompts.ts` and `lib/anthropic/cache.ts` use only relative/SDK imports, so scripts may import them relatively. Do NOT import `lib/anthropic/client.ts` or `lib/judge0/verdict.ts` from scripts (they use `@/` imports).
- Auth pattern in routes: `createRouteClient()` from `@/lib/supabase/server` + `requireAuth(supabase)` from `@/lib/auth/require-auth` (returns `{ user }` or a 401 `NextResponse`).
- `components/ui/radio-group.tsx` does NOT exist yet despite being listed in CLAUDE.md — Task 10 installs it.

## File structure

**Create:**
- `supabase/migrations/20260609120000_concept_checks.sql` — tables + RLS
- `__tests__/judge0/verdict.test.ts` — verdict normalisation tests
- `__tests__/content/concept-checks.test.ts` — warm-up picker tests
- `lib/content/concept-checks.ts` — loaders + pure warm-up picker
- `app/api/concept-checks/route.ts` — POST attempt recording
- `components/lesson/ConceptChecks.tsx` — check card, section, warm-up block
- `scripts/export_lesson_meta.ts` — per-lesson briefing metadata for generation agents (zero LLM calls)
- `scripts/validate_v2.ts` — compile/run/boundary-lint gate
- `scripts/push_v2.ts` — push validated content + concept checks to DB

**Modify:**
- `lib/judge0/verdict.ts` — per-line trailing-whitespace normalisation
- `lib/anthropic/prompts.ts` — lesson body prompt rewrite, `buildConceptCheckPrompt`, exercise-2 format rotation
- `lib/supabase/types.ts` — new table types + exports
- `app/(app)/lessons/[slug]/page.tsx` — fetch checks + warm-ups, pass to client
- `app/(app)/lessons/[slug]/LessonClient.tsx` — render warm-up + checks in lesson tab

---

### Task 1: Concept-check tables, RLS, and types

**Files:**
- Create: `supabase/migrations/20260609120000_concept_checks.sql`
- Modify: `lib/supabase/types.ts` (insert after the `test_cases` table block ending at line 156; exports near line 549)

- [ ] **Step 1: Write the migration**

```sql
-- 20260609120000_concept_checks.sql — Concept checks (cached content) + per-user attempts.
-- concept_checks follows the same generate-once/cache-forever model as exercises.
-- concept_check_attempts is per-user data under RLS (substrate for the future review queue).

CREATE TABLE IF NOT EXISTS concept_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('predict_output', 'spot_bug', 'mcq')),
  prompt_md TEXT NOT NULL,
  options JSONB,
  answer TEXT NOT NULL,
  explanation_md TEXT NOT NULL,
  position INT NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  generated_model TEXT
);

CREATE INDEX IF NOT EXISTS idx_concept_checks_lesson
  ON concept_checks(lesson_id, position);

CREATE TABLE IF NOT EXISTS concept_check_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  check_id UUID NOT NULL REFERENCES concept_checks(id) ON DELETE CASCADE,
  correct BOOLEAN NOT NULL,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cc_attempts_user
  ON concept_check_attempts(user_id, check_id, answered_at DESC);

ALTER TABLE concept_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE concept_check_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS read_concept_checks ON concept_checks;
CREATE POLICY read_concept_checks ON concept_checks FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS own_cc_attempts ON concept_check_attempts;
CREATE POLICY own_cc_attempts ON concept_check_attempts FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

- [ ] **Step 2: Apply the migration**

Run: `npx supabase db push`
Expected: migration `20260609120000_concept_checks.sql` applied without error.

- [ ] **Step 3: Add table types to `lib/supabase/types.ts`**

Insert this block immediately after the `test_cases` table definition (after its `Relationships: [];` and closing `};`, before `submissions:`):

```typescript
      concept_checks: {
        Row: {
          id: string;
          lesson_id: string;
          kind: string;
          prompt_md: string;
          options: Json | null;
          answer: string;
          explanation_md: string;
          position: number;
          generated_at: string;
          generated_model: string | null;
        };
        Insert: {
          id?: string;
          lesson_id: string;
          kind: string;
          prompt_md: string;
          options?: Json | null;
          answer: string;
          explanation_md: string;
          position: number;
          generated_at?: string;
          generated_model?: string | null;
        };
        Update: {
          id?: string;
          lesson_id?: string;
          kind?: string;
          prompt_md?: string;
          options?: Json | null;
          answer?: string;
          explanation_md?: string;
          position?: number;
          generated_at?: string;
          generated_model?: string | null;
        };
        Relationships: [];
      };
      concept_check_attempts: {
        Row: {
          id: string;
          user_id: string;
          check_id: string;
          correct: boolean;
          answered_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          check_id: string;
          correct: boolean;
          answered_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          check_id?: string;
          correct?: boolean;
          answered_at?: string;
        };
        Relationships: [];
      };
```

Then next to the existing exports (`export type Lesson = ...`, around line 547), add:

```typescript
export type ConceptCheck = Database["public"]["Tables"]["concept_checks"]["Row"];
export type ConceptCheckAttempt = Database["public"]["Tables"]["concept_check_attempts"]["Row"];
```

- [ ] **Step 4: Verify types compile**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260609120000_concept_checks.sql lib/supabase/types.ts
git commit -m "feat(db): concept_checks and concept_check_attempts tables with RLS"
```

---

### Task 2: Verdict per-line whitespace normalisation (TDD)

**Files:**
- Create: `__tests__/judge0/verdict.test.ts`
- Modify: `lib/judge0/verdict.ts:39-42` (the `normalise` helper)

- [ ] **Step 1: Write the failing tests**

```typescript
// __tests__/judge0/verdict.test.ts
import { describe, it, expect } from "vitest";
import { evaluateTestCases } from "@/lib/judge0/verdict";

const accepted = (stdout: string | null) => ({ stdout, status: "accepted" as const });
const tc = (expected: string) => [{ label: "t1", stdin: "", expectedStdout: expected }];

describe("evaluateTestCases output normalisation", () => {
  it("passes when actual output has trailing spaces on lines", () => {
    const verdict = evaluateTestCases(tc("a\nb"), [accepted("a  \nb")]);
    expect(verdict.overallStatus).toBe("passed");
  });

  it("passes when expected has trailing whitespace but actual does not", () => {
    const verdict = evaluateTestCases(tc("a \nb\n"), [accepted("a\nb")]);
    expect(verdict.overallStatus).toBe("passed");
  });

  it("passes when actual output has a trailing newline", () => {
    const verdict = evaluateTestCases(tc("Sum: 42"), [accepted("Sum: 42\n")]);
    expect(verdict.overallStatus).toBe("passed");
  });

  it("fails when line content differs", () => {
    const verdict = evaluateTestCases(tc("a\nb"), [accepted("a\nc")]);
    expect(verdict.overallStatus).toBe("wrong_answer");
    expect(verdict.testResults[0]?.passed).toBe(false);
  });

  it("fails when internal blank lines differ", () => {
    const verdict = evaluateTestCases(tc("a\n\nb"), [accepted("a\nb")]);
    expect(verdict.overallStatus).toBe("wrong_answer");
  });

  it("treats null stdout as empty output", () => {
    const verdict = evaluateTestCases(tc(""), [accepted(null)]);
    expect(verdict.overallStatus).toBe("passed");
  });
});
```

- [ ] **Step 2: Run tests to verify the new ones fail**

Run: `npm run test -- __tests__/judge0/verdict.test.ts`
Expected: FAIL — "passes when actual output has trailing spaces on lines" and "passes when expected has trailing whitespace but actual does not" fail (current `normalise` only trims the whole string). The other four pass.

- [ ] **Step 3: Implement per-line normalisation**

Replace the `normalise` function in `lib/judge0/verdict.ts` (lines 33–42) with:

```typescript
/**
 * Normalise stdout for comparison.
 *
 * - Treats null / undefined as empty string
 * - Trims trailing whitespace on every line (formatting noise, not correctness)
 * - Trims leading and trailing whitespace overall (including trailing newlines)
 */
function normalise(value: string | null | undefined): string {
  if (value === null || value === undefined) return "";
  return value
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .trim();
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test`
Expected: all tests pass (including the pre-existing `__tests__/dashboard/` suites).

- [ ] **Step 5: Commit**

```bash
git add __tests__/judge0/verdict.test.ts lib/judge0/verdict.ts
git commit -m "fix(judge0): ignore per-line trailing whitespace in verdicts"
```

---

### Task 3: Rewrite the lesson body prompt

**Files:**
- Modify: `lib/anthropic/prompts.ts:26-35` (`LESSON_SUMMARY_SYSTEM`) and `lib/anthropic/prompts.ts:70` (`maxTokens`)

No unit test — prompt content is validated by the offline gate (Task 7) and pilot review (Task 12).

- [ ] **Step 1: Replace `LESSON_SUMMARY_SYSTEM`**

Replace the entire `LESSON_SUMMARY_SYSTEM` constant with:

````typescript
const LESSON_SUMMARY_SYSTEM = `You are an expert C++ educator writing complete, self-contained lessons for cpproad, a consumer C++ learning platform. Your lesson is the learner's ONLY instruction for this topic — they never read another textbook. Assume motivated beginners; some know another language such as Python.

OUTPUT REQUIREMENTS:
- 800-1200 words of markdown, structured as exactly these four sections, in this order:

## The idea
The mental model. Open with the intuition or a concrete analogy for what this construct IS and what problem it solves. No syntax in this section.

## How it works
The mechanics. Include 2-3 short original code examples (each <= 15 lines), each demonstrating a distinct facet of the topic. Walk through each example in prose. Build from the simplest case to the most realistic one.

## Common mistakes
2-3 concrete mistakes learners actually make with this topic. For each: show the wrong code or the wrong assumption, then show what really happens — the exact compiler error, the wrong output, or the silent bug. Prefer the classic C++ traps (uninitialized variables, integer division, narrowing, copy-vs-reference, missing semicolon after a type definition) when they apply to this lesson.

## When to use this
2-4 sentences connecting the concept to real programs: when you would reach for it, and what you would use instead when it does not fit. Cross-reference earlier lessons by title where useful.

STYLE AND BOUNDARY RULES:
- Use modern C++20 idioms only when the feature has been covered in a prior lesson or the current lesson. For early chapters, stick to the features the student already knows. Never use std::format, structured bindings, ranges, or auto unless those have been taught.
- Plain, direct language. No "let's dive in", "it's important to note", "in conclusion", or "I hope this helps".
- NEVER reference concepts, keywords, or features from later lessons. The student has only seen what is listed in the "prior lessons" field. Do not say "we'll cover X later" or use syntax not yet introduced. If cin/cout has not been covered, do not use it in examples.
- Never use markdown tables (no pipe syntax). For comparisons or type lists, use bullet points or short prose instead. Example: "- int8_t — 8-bit signed integer"`;
````

- [ ] **Step 2: Raise the token budget**

In `buildLessonSummaryPrompt`, change `maxTokens: 1024,` to `maxTokens: 3072,`.

- [ ] **Step 3: Verify compile and confirm no other callers**

Run: `npx tsc --noEmit && grep -rn "buildLessonSummaryPrompt" --include="*.ts" --include="*.tsx" app lib scripts`
Expected: tsc clean; grep shows only the definition in `lib/anthropic/prompts.ts` (the builders currently have no callers — generation is offline-only).

- [ ] **Step 4: Commit**

```bash
git add lib/anthropic/prompts.ts
git commit -m "feat(prompts): four-section sole-source lesson body format"
```

---

### Task 4: Add `buildConceptCheckPrompt`

**Files:**
- Modify: `lib/anthropic/prompts.ts` (add after the exercise-prompt section, before the tutor section)

- [ ] **Step 1: Add the item type and prompt builder**

````typescript
// ---------------------------------------------------------------------------
// 6.2b Concept-check generation prompt
// ---------------------------------------------------------------------------

/** Shape of one generated concept-check item (matches the concept_checks table). */
export interface ConceptCheckItem {
  kind: "predict_output" | "spot_bug" | "mcq";
  prompt_md: string;
  options: Record<string, string> | null;
  answer: string;
  explanation_md: string;
}

/**
 * Build the prompt for generating 3-5 concept-check questions with Sonnet 4.6.
 * Takes the finished lesson body so checks test exactly what was taught.
 */
export function buildConceptCheckPrompt(
  lessonTitle: string,
  summaryMd: string,
  priorTitles: string[],
): PromptPayload {
  const priorList = priorTitles.length > 0 ? priorTitles.join(", ") : "(none)";

  const systemText = `Design 3-5 concept-check questions for the C++ lesson "${lessonTitle}".

PURPOSE: Quick formative checks shown right after the learner reads the lesson. Each question must target a real MISCONCEPTION — something a learner plausibly believes that is wrong — not trivia recall. Good misconception genres: integer division truncation, narrowing conversions, copy vs reference semantics, operator precedence surprises, uninitialized reads, off-by-one errors, scope/shadowing confusion, implicit conversions.

CONCEPT BOUNDARY (CRITICAL):
The learner has completed only these prior lessons: [${priorList}], plus the lesson body below. Use ONLY concepts, syntax, and library features that appear in those sources. If a feature is not in the lesson body or prior lessons list, the learner does not know it.

QUESTION KINDS:
- "predict_output": a code snippet (<= 12 lines) that compiles cleanly and prints deterministic output; the learner types the exact stdout. "options" must be null; "answer" is the exact expected stdout.
- "spot_bug": a snippet (<= 12 lines) containing exactly one bug; 3-4 options (keys "a" through "d") each describing a candidate explanation of the bug; exactly one is correct. "answer" is the correct key.
- "mcq": a conceptual question with 3-4 options (keys "a" through "d"); wrong options must be plausible misconceptions. "answer" is the correct key.

RULES:
- Produce 3-5 items. Include at least one "predict_output" and at least one "mcq".
- Code inside prompt_md goes in \`\`\`cpp fences.
- explanation_md teaches WHY the right answer is right and why the most tempting wrong answer is wrong, in 2-4 sentences.
- No markdown tables anywhere.
- Output ONLY a JSON array, no prose before or after, with each element conforming to:
{ "kind": "predict_output" | "spot_bug" | "mcq", "prompt_md": "string", "options": {"a": "string", "b": "string"} | null, "answer": "string", "explanation_md": "string" }`;

  return {
    model: MODEL_SONNET,
    system: [withCache({ type: "text", text: systemText })],
    messages: [
      {
        role: "user",
        content: `Lesson body:\n\n${summaryMd}\n\nWrite the concept checks.`,
      },
    ],
    maxTokens: 4096,
  };
}
````

- [ ] **Step 2: Verify compile**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/anthropic/prompts.ts
git commit -m "feat(prompts): concept-check generation prompt builder"
```

---

### Task 5: Exercise-2 format rotation in `buildExercisePrompt`

**Files:**
- Modify: `lib/anthropic/prompts.ts:93-182` (`buildExercisePrompt`)

- [ ] **Step 1: Add the format type and update the builder**

Add above `buildExercisePrompt`:

```typescript
/** Format for the second (applied) exercise — rotates by lesson position. */
export type Exercise2Format = "fix_the_bug" | "complete_the_function";
```

Change the `buildExercisePrompt` signature to add a final parameter:

```typescript
export function buildExercisePrompt(
  lessonTitle: string,
  summaryMd: string,
  chapterNumber: string,
  chapterTitle: string,
  priorTitles: string[],
  exercise2Format: Exercise2Format,
): PromptPayload {
```

Inside the function, before `const systemText`, add:

```typescript
  const exercise2Spec =
    exercise2Format === "fix_the_bug"
      ? `- Exercise 2: fix-the-bug — starter_code is a COMPLETE program (no TODOs) that compiles cleanly but contains exactly ONE planted logic bug related to this lesson's concept. prompt_md describes what the program SHOULD do and states that the code contains one bug to find and fix — do not reveal the bug's location or nature. Hidden test cases must fail on the buggy version and pass once fixed. solution_code is the corrected program.`
      : `- Exercise 2: complete-the-function — starter_code contains a complete main() plus exactly one function with a TODO stub for the learner to implement. prompt_md names the exact function signature. The exercise combines the lesson concept with one prior concept from the prior lessons list above.`;
```

In the `EXERCISE DESIGN PRINCIPLES` block of `systemText`, replace the line:

```
- Exercise 2: applied — combines the lesson concept with one prior concept from the prior lessons list above
```

with:

```
${exercise2Spec}
```

Also update the starter-code rule line `- Must compile as-is (with TODO stubs)` to:

```
- Must compile as-is (with TODO stubs; for fix-the-bug, the complete buggy program)
```

- [ ] **Step 2: Verify compile and absence of callers**

Run: `npx tsc --noEmit && grep -rn "buildExercisePrompt" --include="*.ts" --include="*.tsx" app lib scripts`
Expected: tsc clean; only the definition is found (no call sites to update yet — `scripts/generate_v2.ts` arrives in Task 6).

- [ ] **Step 3: Commit**

```bash
git add lib/anthropic/prompts.ts
git commit -m "feat(prompts): rotating exercise-2 format (fix-the-bug / complete-the-function)"
```

---

### Task 6: Lesson metadata export + agent generation protocol (zero API calls)

**Files:**
- Create: `scripts/export_lesson_meta.ts`

**Generation policy (user directive, 2026-06-09):** NO Anthropic API calls are made for
content generation — not from scripts, not at runtime. Content is produced by deployed
Claude Code agents, each briefed with the canonical prompt text from
`lib/anthropic/prompts.ts` (LESSON_SUMMARY_SYSTEM, CONCEPT_CHECK_SYSTEM, EXERCISE_SYSTEM)
plus per-lesson metadata, writing files directly under
`scripts/regenerated/v2/<lesson_number>/`. The prompt builders remain the canonical spec
text for agent briefings; they are never invoked against the API.

This task creates the metadata export script (a read-only DB query — not an LLM call) and
documents the agent protocol that Tasks 12/13 execute.

- [ ] **Step 1: Write `scripts/export_lesson_meta.ts`**

```typescript
/**
 * export_lesson_meta.ts — Export per-lesson briefing metadata for generation agents.
 *
 * Zero LLM calls. Reads chapters + lessons from Supabase and writes
 * scripts/regenerated/v2/_meta/ch_<number>.json — one file per chapter, each an
 * array of briefing objects consumed by content-generation agents.
 *
 * Usage:
 *   npx tsx scripts/export_lesson_meta.ts                  # all chapters
 *   npx tsx scripts/export_lesson_meta.ts --chapters 13
 *
 * Env (.env / .env.local): NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";
import { shouldGenerateExercises, type Exercise2Format } from "../lib/anthropic/prompts";

config({ path: resolve(__dirname, "..", ".env") });
config({ path: resolve(__dirname, "..", ".env.local") });

const META_DIR = resolve(__dirname, "regenerated", "v2", "_meta");

interface LessonMeta {
  number: string;
  title: string;
  chapterNumber: string;
  chapterTitle: string;
  priorTitles: string[];
  tags: string[];
  withContent: boolean;
  exercise2Format: Exercise2Format;
}

async function main(): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }
  const supabase = createClient(supabaseUrl, supabaseKey);

  const args = process.argv.slice(2);
  const ci = args.indexOf("--chapters");
  const chapterFilter =
    ci !== -1 && args[ci + 1] ? args[ci + 1]!.split(",").map((s) => s.trim()) : null;

  const { data: chapters, error: chErr } = await supabase
    .from("chapters")
    .select("id, number, learncpp_title, my_title, sort_order")
    .order("sort_order");
  if (chErr || !chapters) throw new Error(`chapters query failed: ${chErr?.message}`);

  const { data: lessons, error: lsErr } = await supabase
    .from("lessons")
    .select("id, chapter_id, number, learncpp_title, my_title, tags, sort_order")
    .order("sort_order");
  if (lsErr || !lessons) throw new Error(`lessons query failed: ${lsErr?.message}`);

  mkdirSync(META_DIR, { recursive: true });

  for (const chapter of chapters) {
    if (chapterFilter && !chapterFilter.includes(chapter.number)) continue;
    const chapterLessons = lessons.filter((l) => l.chapter_id === chapter.id);
    const chapterTitle = chapter.my_title ?? chapter.learncpp_title;

    const metas: LessonMeta[] = chapterLessons.map((lesson, idx) => ({
      number: lesson.number,
      title: lesson.my_title ?? lesson.learncpp_title,
      chapterNumber: chapter.number,
      chapterTitle,
      priorTitles: chapterLessons.slice(0, idx).map((l) => l.my_title ?? l.learncpp_title),
      tags: lesson.tags,
      withContent: shouldGenerateExercises(chapter.number),
      exercise2Format: idx % 2 === 0 ? "fix_the_bug" : "complete_the_function",
    }));

    const outPath = resolve(META_DIR, `ch_${chapter.number}.json`);
    writeFileSync(outPath, JSON.stringify(metas, null, 2));
    console.log(`ch ${chapter.number}: ${metas.length} lessons → ${outPath}`);
  }
}

main();
```

- [ ] **Step 2: Run for chapter 13 and verify**

Run: `npx tsx scripts/export_lesson_meta.ts --chapters 13`
Expected: `scripts/regenerated/v2/_meta/ch_13.json` with ~17 briefing objects; first lesson
has `priorTitles: []`, later lessons accumulate prior titles; `exercise2Format` alternates
starting with `fix_the_bug`.

- [ ] **Step 3: Commit**

```bash
git add scripts/export_lesson_meta.ts scripts/regenerated/v2/_meta
git commit -m "feat(scripts): export per-lesson briefing metadata for generation agents"
```

#### Agent generation protocol (executed in Tasks 12 and 13)

The controller deploys Claude Code agents in parallel batches. Each agent handles **4–6
lessons** and receives a self-contained briefing:

1. **The canonical specs, pasted verbatim from `lib/anthropic/prompts.ts`:**
   - `LESSON_SUMMARY_SYSTEM` — the four-section lesson body format and boundary rules
   - `CONCEPT_CHECK_SYSTEM` — question kinds, misconception genres, JSON schema
   - `EXERCISE_SYSTEM` — exercise design principles, PROMPT_MD format, JSON schema
2. **Per-lesson metadata** from `_meta/ch_<n>.json`: number, title, chapterNumber,
   chapterTitle, priorTitles, tags, withContent, exercise2Format (including the matching
   exercise-2 format directive text from `buildExercisePrompt`)
3. **Output contract** per lesson, written with the Write tool:
   - `scripts/regenerated/v2/<number>/summary.md` — raw markdown, no surrounding fences
   - `scripts/regenerated/v2/<number>/checks.json` — JSON array (skip when `withContent` is false)
   - `scripts/regenerated/v2/<number>/exercises.json` — JSON array (skip when `withContent` is false)
4. **The validator's shape rules** (so agents self-check before finishing): 3–5 checks
   with ≥1 `predict_output` and ≥1 `mcq`; `predict_output` has `options: null`; option-based
   kinds have the answer key present in options; every check has `explanation_md`; exactly
   2 exercises, each with exactly 3 test cases (1 sample + 2 hidden); all code compiles
   with `g++ -std=c++20 -Wall -Wextra`; solutions produce the expected stdout for each
   test's stdin; no concepts from later chapters; no markdown tables.

Generation agents must NOT touch git — the controller validates (Task 7 gate) and commits.

---

### Task 7: Validation gate `scripts/validate_v2.ts`

**Files:**
- Create: `scripts/validate_v2.ts`

Mechanical gate over `scripts/regenerated/v2/`: compiles every starter and solution with `g++ -std=c++20 -Wall -Wextra`, runs every solution against its test cases (same normalisation as the runtime verdict), lints generated code for concepts not yet introduced, and shape-checks `checks.json`. Writes `validation_report.md` + `validation_status.json` (consumed by `push_v2.ts`). Exits non-zero if any lesson fails.

- [ ] **Step 1: Write the script**

````typescript
/**
 * validate_v2.ts — Mechanical validation gate for Phase A generated content.
 *
 * Per lesson dir under scripts/regenerated/v2/:
 *   - summary.md: word count 700-1400 (warn outside), has the four required ## sections
 *   - boundary lint: code in summary/checks/exercises must not use concepts
 *     introduced in a later chapter (coarse, per-chapter token rules)
 *   - checks.json: 3-5 items, valid kinds, option/answer consistency
 *   - exercises.json: starter_code and solution_code compile with
 *     g++ -std=c++20 -Wall -Wextra; solution passes all test cases
 *
 * Usage:
 *   npx tsx scripts/validate_v2.ts                 # validate everything in v2/
 *   npx tsx scripts/validate_v2.ts --lessons 13.7
 *
 * Outputs: v2/validation_report.md, v2/validation_status.json
 * Exit code 1 if any lesson has errors (warnings don't fail).
 */

import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const V2_ROOT = resolve(__dirname, "regenerated", "v2");
const BUILD_DIR = resolve(V2_ROOT, ".build");

// ---------------------------------------------------------------------------
// Concept-boundary token rules (coarse, per-chapter; finer checks live in
// validate_curriculum.ts). A token is a violation if the lesson's chapter
// number is LESS than introducedInChapter.
// ---------------------------------------------------------------------------

interface TokenRule {
  pattern: RegExp;
  name: string;
  introducedInChapter: number;
}

const TOKEN_RULES: TokenRule[] = [
  { pattern: /\bif\s*\(/, name: "if statement", introducedInChapter: 4 },
  { pattern: /\bconst\b/, name: "const", introducedInChapter: 5 },
  { pattern: /\bconstexpr\b/, name: "constexpr", introducedInChapter: 5 },
  { pattern: /std::string\b/, name: "std::string", introducedInChapter: 5 },
  { pattern: /std::string_view\b/, name: "std::string_view", introducedInChapter: 5 },
  { pattern: /\?\s*[^:]+\s*:/, name: "ternary operator", introducedInChapter: 6 },
  { pattern: /\bfor\s*\(/, name: "for loop", introducedInChapter: 8 },
  { pattern: /\bwhile\s*\(/, name: "while loop", introducedInChapter: 8 },
  { pattern: /\bswitch\s*\(/, name: "switch", introducedInChapter: 8 },
  { pattern: /\bauto\b/, name: "auto", introducedInChapter: 10 },
  { pattern: /\btemplate\b/, name: "template", introducedInChapter: 11 },
  { pattern: /\benum\b/, name: "enum", introducedInChapter: 13 },
  { pattern: /\bstruct\b/, name: "struct", introducedInChapter: 13 },
  { pattern: /\bclass\b/, name: "class", introducedInChapter: 14 },
  { pattern: /std::vector\b/, name: "std::vector", introducedInChapter: 16 },
  { pattern: /std::array\b/, name: "std::array", introducedInChapter: 17 },
  { pattern: /\bnew\b/, name: "dynamic allocation (new)", introducedInChapter: 19 },
];

const REQUIRED_SECTIONS = ["## The idea", "## How it works", "## Common mistakes", "## When to use this"];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface Issue {
  severity: "error" | "warning";
  message: string;
}

function normalise(value: string): string {
  return value
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .trim();
}

function extractCppBlocks(markdown: string): string[] {
  const blocks: string[] = [];
  const re = /```cpp\n([\s\S]*?)```/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(markdown)) !== null) blocks.push(m[1]!);
  return blocks;
}

function chapterOf(lessonNumber: string): number {
  const n = parseInt(lessonNumber.split(".")[0]!, 10);
  return Number.isNaN(n) ? 0 : n;
}

function lintCode(code: string, chapterNum: number, context: string, issues: Issue[]): void {
  for (const rule of TOKEN_RULES) {
    if (chapterNum < rule.introducedInChapter && rule.pattern.test(code)) {
      issues.push({
        severity: "error",
        message: `${context}: uses ${rule.name} (chapter ${rule.introducedInChapter} concept) in chapter ${chapterNum}`,
      });
    }
  }
}

function compileCpp(code: string, label: string, issues: Issue[]): string | null {
  mkdirSync(BUILD_DIR, { recursive: true });
  const src = resolve(BUILD_DIR, `${label}.cpp`);
  const bin = resolve(BUILD_DIR, `${label}.out`);
  writeFileSync(src, code);
  const result = spawnSync("g++", ["-std=c++20", "-Wall", "-Wextra", "-o", bin, src], {
    encoding: "utf-8",
    timeout: 30_000,
  });
  if (result.status !== 0) {
    issues.push({ severity: "error", message: `${label}: compile failed:\n${result.stderr.slice(0, 800)}` });
    return null;
  }
  if (result.stderr.trim()) {
    issues.push({ severity: "warning", message: `${label}: compiler warnings:\n${result.stderr.slice(0, 400)}` });
  }
  return bin;
}

function runBinary(bin: string, stdin: string): string {
  const result = spawnSync(bin, [], { input: stdin, encoding: "utf-8", timeout: 5_000 });
  return result.stdout ?? "";
}

// ---------------------------------------------------------------------------
// Per-lesson validation
// ---------------------------------------------------------------------------

interface CheckItem {
  kind: string;
  prompt_md: string;
  options: Record<string, string> | null;
  answer: string;
  explanation_md: string;
}

interface ExerciseItem {
  title: string;
  prompt_md: string;
  starter_code: string;
  solution_code: string;
  test_cases: Array<{ label: string; is_sample: boolean; stdin: string; expected_stdout: string }>;
}

function validateLesson(lessonNumber: string): Issue[] {
  const issues: Issue[] = [];
  const dir = resolve(V2_ROOT, lessonNumber);
  const chapterNum = chapterOf(lessonNumber);
  const safe = lessonNumber.replace(/[^a-zA-Z0-9]/g, "_");

  // --- summary.md ---
  const summaryPath = resolve(dir, "summary.md");
  if (!existsSync(summaryPath)) {
    issues.push({ severity: "error", message: "summary.md missing" });
    return issues;
  }
  const summary = readFileSync(summaryPath, "utf-8");
  const words = summary.split(/\s+/).length;
  if (words < 700 || words > 1400) {
    issues.push({ severity: "warning", message: `summary is ${words} words (target 800-1200)` });
  }
  for (const section of REQUIRED_SECTIONS) {
    if (!summary.includes(section)) {
      issues.push({ severity: "error", message: `summary missing required section "${section}"` });
    }
  }
  if (summary.includes("|--") || /\n\|.*\|\n/.test(summary)) {
    issues.push({ severity: "error", message: "summary contains a markdown table" });
  }
  extractCppBlocks(summary).forEach((code, i) => lintCode(code, chapterNum, `summary example ${i + 1}`, issues));

  // --- checks.json (optional for intro chapters) ---
  const checksPath = resolve(dir, "checks.json");
  if (existsSync(checksPath)) {
    let checks: CheckItem[];
    try {
      checks = JSON.parse(readFileSync(checksPath, "utf-8")) as CheckItem[];
    } catch (err) {
      issues.push({ severity: "error", message: `checks.json unparseable: ${String(err)}` });
      checks = [];
    }
    if (checks.length > 0 && (checks.length < 3 || checks.length > 5)) {
      issues.push({ severity: "error", message: `checks.json has ${checks.length} items (expected 3-5)` });
    }
    checks.forEach((c, i) => {
      const label = `check ${i + 1} (${c.kind})`;
      if (!["predict_output", "spot_bug", "mcq"].includes(c.kind)) {
        issues.push({ severity: "error", message: `${label}: invalid kind` });
      }
      if (c.kind === "predict_output" && c.options !== null) {
        issues.push({ severity: "error", message: `${label}: predict_output must have null options` });
      }
      if (c.kind !== "predict_output") {
        if (!c.options || !(c.answer in c.options)) {
          issues.push({ severity: "error", message: `${label}: answer key not present in options` });
        }
      }
      if (!c.explanation_md) {
        issues.push({ severity: "error", message: `${label}: missing explanation_md` });
      }
      extractCppBlocks(c.prompt_md).forEach((code, j) =>
        lintCode(code, chapterNum, `${label} snippet ${j + 1}`, issues),
      );
    });
  }

  // --- exercises.json (optional for intro chapters) ---
  const exercisesPath = resolve(dir, "exercises.json");
  if (existsSync(exercisesPath)) {
    let exercises: ExerciseItem[];
    try {
      exercises = JSON.parse(readFileSync(exercisesPath, "utf-8")) as ExerciseItem[];
    } catch (err) {
      issues.push({ severity: "error", message: `exercises.json unparseable: ${String(err)}` });
      exercises = [];
    }
    exercises.forEach((ex, i) => {
      const label = `exercise ${i + 1} "${ex.title}"`;
      lintCode(ex.starter_code, chapterNum, `${label} starter`, issues);
      lintCode(ex.solution_code, chapterNum, `${label} solution`, issues);
      extractCppBlocks(ex.prompt_md).forEach((code, j) =>
        lintCode(code, chapterNum, `${label} prompt snippet ${j + 1}`, issues),
      );

      compileCpp(ex.starter_code, `${safe}_ex${i + 1}_starter`, issues);
      const bin = compileCpp(ex.solution_code, `${safe}_ex${i + 1}_solution`, issues);
      if (bin) {
        ex.test_cases.forEach((tcase, j) => {
          const actual = normalise(runBinary(bin, tcase.stdin));
          const expected = normalise(tcase.expected_stdout);
          if (actual !== expected) {
            issues.push({
              severity: "error",
              message: `${label} test ${j + 1} "${tcase.label}": expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
            });
          }
        });
      }
    });
  }

  return issues;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  // Fail fast if g++ is unavailable.
  execFileSync("g++", ["--version"], { encoding: "utf-8" });

  const args = process.argv.slice(2);
  const li = args.indexOf("--lessons");
  const filter = li !== -1 && args[li + 1] ? args[li + 1]!.split(",").map((s) => s.trim()) : null;

  const lessonDirs = readdirSync(V2_ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== ".build" && d.name !== "_meta")
    .map((d) => d.name)
    .filter((name) => !filter || filter.includes(name))
    .sort();

  const status: Record<string, "pass" | "fail"> = {};
  const reportLines: string[] = ["# Phase A validation report", ""];
  let failed = 0;

  for (const lessonNumber of lessonDirs) {
    const issues = validateLesson(lessonNumber);
    const errors = issues.filter((i) => i.severity === "error");
    status[lessonNumber] = errors.length > 0 ? "fail" : "pass";
    if (errors.length > 0) failed++;

    console.log(`[${lessonNumber}] ${status[lessonNumber]} (${errors.length} errors, ${issues.length - errors.length} warnings)`);
    if (issues.length > 0) {
      reportLines.push(`## ${lessonNumber} — ${status[lessonNumber]}`);
      for (const issue of issues) reportLines.push(`- **${issue.severity}**: ${issue.message}`);
      reportLines.push("");
    }
  }

  writeFileSync(resolve(V2_ROOT, "validation_report.md"), reportLines.join("\n"));
  writeFileSync(resolve(V2_ROOT, "validation_status.json"), JSON.stringify(status, null, 2));
  console.log(`\n${lessonDirs.length} lessons, ${failed} failed. Report: v2/validation_report.md`);
  if (failed > 0) process.exit(1);
}

main();
````

- [ ] **Step 2: Sanity-run**

Run: `npx tsx scripts/validate_v2.ts`
Expected: completes cleanly with `0 lessons, 0 failed` while no lesson dirs exist yet (the
gate gets its first real exercise in the Task 12 pilot against agent-generated content).

- [ ] **Step 3: Commit**

```bash
git add scripts/validate_v2.ts
git commit -m "feat(scripts): mechanical validation gate (compile, run, boundary lint)"
```

---

### Task 8: Push script `scripts/push_v2.ts`

**Files:**
- Create: `scripts/push_v2.ts`

Modeled on `scripts/push_regenerated.ts` (same deterministic UUID), extended for the v2 dir layout and concept checks. Refuses to push lessons that did not pass validation.

- [ ] **Step 1: Write the script**

````typescript
/**
 * push_v2.ts — Push validated Phase A content to Supabase.
 *
 * Reads scripts/regenerated/v2/<lesson_number>/{summary.md, checks.json, exercises.json}
 * and v2/validation_status.json. Only lessons with status "pass" are pushed
 * (override with --force, e.g. for intro-chapter lessons that only have a summary).
 *
 * Per lesson: updates lessons.summary_md, replaces exercises + test_cases,
 * replaces concept_checks. This is the offline equivalent of the (disabled)
 * regenerate endpoint — the ONLY path that clears cached content.
 *
 * Usage:
 *   npx tsx scripts/push_v2.ts
 *   npx tsx scripts/push_v2.ts --lessons 13.7,13.8
 *
 * Env (.env / .env.local): NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";

config({ path: resolve(__dirname, "..", ".env") });
config({ path: resolve(__dirname, "..", ".env.local") });

const V2_ROOT = resolve(__dirname, "regenerated", "v2");
const MODEL = "claude-sonnet-4-6";

function deterministicUUID(lessonNumber: string): string {
  const hash = createHash("sha256").update(`cpproad-lesson:${lessonNumber}`).digest("hex");
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    "4" + hash.slice(13, 16),
    ((parseInt(hash[16]!, 16) & 0x3) | 0x8).toString(16) + hash.slice(17, 20),
    hash.slice(20, 32),
  ].join("-");
}

interface CheckItem {
  kind: string;
  prompt_md: string;
  options: Record<string, string> | null;
  answer: string;
  explanation_md: string;
}

interface ExerciseItem {
  title: string;
  prompt_md: string;
  starter_code: string;
  solution_code: string;
  difficulty?: string;
  test_cases: Array<{ label: string; is_sample: boolean; stdin: string; expected_stdout: string }>;
}

async function main(): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }
  const supabase = createClient(supabaseUrl, supabaseKey);

  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const li = args.indexOf("--lessons");
  const filter = li !== -1 && args[li + 1] ? args[li + 1]!.split(",").map((s) => s.trim()) : null;

  const statusPath = resolve(V2_ROOT, "validation_status.json");
  const status: Record<string, string> = existsSync(statusPath)
    ? (JSON.parse(readFileSync(statusPath, "utf-8")) as Record<string, string>)
    : {};

  const lessonDirs = readdirSync(V2_ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== ".build" && d.name !== "_meta")
    .map((d) => d.name)
    .filter((name) => !filter || filter.includes(name))
    .sort();

  let pushed = 0;
  let skipped = 0;

  for (const lessonNum of lessonDirs) {
    if (status[lessonNum] !== "pass" && !force) {
      console.log(`[${lessonNum}] skipped (validation status: ${status[lessonNum] ?? "missing"})`);
      skipped++;
      continue;
    }

    const lessonId = deterministicUUID(lessonNum);
    const dir = resolve(V2_ROOT, lessonNum);
    console.log(`\n[${lessonNum}] (id: ${lessonId})`);

    const { data: lesson, error: lessonError } = await supabase
      .from("lessons")
      .select("id, learncpp_title")
      .eq("id", lessonId)
      .single();
    if (lessonError || !lesson) {
      console.error(`  not found in DB: ${lessonError?.message}`);
      continue;
    }

    // 1. Summary
    const summaryMd = readFileSync(resolve(dir, "summary.md"), "utf-8");
    const { error: upErr } = await supabase
      .from("lessons")
      .update({
        summary_md: summaryMd,
        summary_generated_at: new Date().toISOString(),
        summary_model: MODEL,
      })
      .eq("id", lessonId);
    if (upErr) {
      console.error(`  summary update failed: ${upErr.message}`);
      continue;
    }
    console.log(`  summary updated (${summaryMd.length} chars)`);

    // 2. Concept checks: replace
    const checksPath = resolve(dir, "checks.json");
    const { error: ccDelErr } = await supabase.from("concept_checks").delete().eq("lesson_id", lessonId);
    if (ccDelErr) console.error(`  concept_checks delete failed: ${ccDelErr.message}`);
    if (existsSync(checksPath)) {
      const checks = JSON.parse(readFileSync(checksPath, "utf-8")) as CheckItem[];
      const rows = checks.map((c, i) => ({
        lesson_id: lessonId,
        kind: c.kind,
        prompt_md: c.prompt_md,
        options: c.options,
        answer: c.answer,
        explanation_md: c.explanation_md,
        position: i + 1,
        generated_model: MODEL,
      }));
      const { error: ccInsErr } = await supabase.from("concept_checks").insert(rows);
      if (ccInsErr) console.error(`  concept_checks insert failed: ${ccInsErr.message}`);
      else console.log(`  ${rows.length} concept checks inserted`);
    }

    // 3. Exercises + test cases: replace (same order as push_regenerated.ts)
    const exercisesPath = resolve(dir, "exercises.json");
    if (existsSync(exercisesPath)) {
      const { data: oldExercises } = await supabase.from("exercises").select("id").eq("lesson_id", lessonId);
      if (oldExercises && oldExercises.length > 0) {
        await supabase.from("test_cases").delete().in("exercise_id", oldExercises.map((e) => e.id));
      }
      await supabase.from("exercises").delete().eq("lesson_id", lessonId);

      const exercises = JSON.parse(readFileSync(exercisesPath, "utf-8")) as ExerciseItem[];
      for (let i = 0; i < exercises.length; i++) {
        const ex = exercises[i]!;
        const { data: insertedEx, error: exInsErr } = await supabase
          .from("exercises")
          .insert({
            lesson_id: lessonId,
            title: ex.title,
            prompt_md: ex.prompt_md,
            starter_code: ex.starter_code,
            solution_code: ex.solution_code,
            difficulty: ex.difficulty ?? "practice",
            sort_order: i + 1,
            generated_model: MODEL,
          })
          .select("id")
          .single();
        if (exInsErr || !insertedEx) {
          console.error(`  exercise "${ex.title}" insert failed: ${exInsErr?.message}`);
          continue;
        }
        const tcRows = ex.test_cases.map((tcase, j) => ({
          exercise_id: insertedEx.id,
          label: tcase.label,
          is_sample: tcase.is_sample,
          stdin: tcase.stdin,
          expected_stdout: tcase.expected_stdout,
          sort_order: j + 1,
        }));
        const { error: tcInsErr } = await supabase.from("test_cases").insert(tcRows);
        if (tcInsErr) console.error(`  test_cases insert failed: ${tcInsErr.message}`);
        else console.log(`  exercise "${ex.title}" + ${tcRows.length} test cases`);
      }
    }
    pushed++;
  }

  console.log(`\nDone. pushed=${pushed} skipped=${skipped}`);
}

main();
````

- [ ] **Step 2: Verify compile**

Run: `npx tsc --noEmit`
Expected: clean. (The first real push happens in the Task 12 pilot, after agent-generated
content passes the validation gate.)

- [ ] **Step 3: Commit**

```bash
git add scripts/push_v2.ts
git commit -m "feat(scripts): push validated v2 content incl. concept checks"
```

---

### Task 9: Warm-up picker + loaders in `lib/content/concept-checks.ts` (TDD)

**Files:**
- Create: `__tests__/content/concept-checks.test.ts`
- Create: `lib/content/concept-checks.ts`

The picker is a pure function (unit-tested); the loaders are thin SQL wrappers. Warm-up pool = earlier lessons in the same chapter + all lessons in the previous two chapters. Zero LLM calls anywhere.

- [ ] **Step 1: Write the failing tests**

```typescript
// __tests__/content/concept-checks.test.ts
import { describe, it, expect } from "vitest";
import { pickWarmupIds, type WarmupCandidate } from "@/lib/content/concept-checks";

const c = (
  checkId: string,
  lastCorrect: boolean | null,
  lastAnsweredAt: string | null = null,
): WarmupCandidate => ({ checkId, lastCorrect, lastAnsweredAt });

describe("pickWarmupIds", () => {
  it("returns empty for no candidates", () => {
    expect(pickWarmupIds([])).toEqual([]);
  });

  it("prefers wrong answers over unseen and correct", () => {
    const ids = pickWarmupIds([
      c("seen-right", true, "2026-06-01T00:00:00Z"),
      c("unseen", null),
      c("seen-wrong", false, "2026-06-01T00:00:00Z"),
    ]);
    expect(ids[0]).toBe("seen-wrong");
  });

  it("fills with unseen before correctly-answered", () => {
    const ids = pickWarmupIds([
      c("right", true, "2026-06-01T00:00:00Z"),
      c("unseen-1", null),
      c("unseen-2", null),
      c("wrong", false, "2026-06-02T00:00:00Z"),
    ]);
    expect(ids).toEqual(["wrong", "unseen-1", "unseen-2"]);
  });

  it("orders wrong answers oldest-first", () => {
    const ids = pickWarmupIds([
      c("wrong-recent", false, "2026-06-05T00:00:00Z"),
      c("wrong-old", false, "2026-06-01T00:00:00Z"),
    ]);
    expect(ids).toEqual(["wrong-old", "wrong-recent"]);
  });

  it("orders correct answers least-recently-answered first", () => {
    const ids = pickWarmupIds([
      c("right-recent", true, "2026-06-05T00:00:00Z"),
      c("right-old", true, "2026-06-01T00:00:00Z"),
    ]);
    expect(ids).toEqual(["right-old", "right-recent"]);
  });

  it("respects the max parameter", () => {
    const ids = pickWarmupIds(
      [c("a", false, "2026-06-01T00:00:00Z"), c("b", null), c("c", null), c("d", null)],
      2,
    );
    expect(ids).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- __tests__/content/concept-checks.test.ts`
Expected: FAIL — module `@/lib/content/concept-checks` not found.

- [ ] **Step 3: Implement the module**

```typescript
// lib/content/concept-checks.ts
import type { AppSupabaseClient, ConceptCheck, Lesson } from "@/lib/supabase/types";

// ---------------------------------------------------------------------------
// Pure warm-up selection
// ---------------------------------------------------------------------------

export interface WarmupCandidate {
  checkId: string;
  /** null = never answered */
  lastCorrect: boolean | null;
  lastAnsweredAt: string | null;
}

/**
 * Pick warm-up check ids: wrong answers first (oldest first), then never-seen
 * (caller's order preserved), then correct answers least-recently-answered.
 */
export function pickWarmupIds(candidates: WarmupCandidate[], max = 3): string[] {
  const byAnsweredAt = (a: WarmupCandidate, b: WarmupCandidate) =>
    (a.lastAnsweredAt ?? "").localeCompare(b.lastAnsweredAt ?? "");

  const wrong = candidates.filter((c) => c.lastCorrect === false).sort(byAnsweredAt);
  const unseen = candidates.filter((c) => c.lastCorrect === null);
  const correct = candidates.filter((c) => c.lastCorrect === true).sort(byAnsweredAt);

  return [...wrong, ...unseen, ...correct].slice(0, max).map((c) => c.checkId);
}

// ---------------------------------------------------------------------------
// Loaders
// ---------------------------------------------------------------------------

export async function loadConceptChecks(
  supabase: AppSupabaseClient,
  lessonId: string,
): Promise<ConceptCheck[]> {
  const { data, error } = await supabase
    .from("concept_checks")
    .select("*")
    .eq("lesson_id", lessonId)
    .order("position", { ascending: true });
  if (error) throw new Error(`Failed to load concept checks: ${error.message}`);
  return data ?? [];
}

export interface WarmupCheck {
  check: ConceptCheck;
  /** Lesson number the check came from, e.g. "13.5" — shown as a badge. */
  lessonNumber: string;
}

/**
 * Select up to `max` warm-up checks from prior lessons (same chapter earlier
 * lessons + everything in the previous two chapters). SQL + pure picker only —
 * never calls the LLM. Returns [] gracefully when no prior content exists.
 */
export async function loadWarmupChecks(
  supabase: AppSupabaseClient,
  userId: string,
  lesson: Lesson,
  max = 3,
): Promise<WarmupCheck[]> {
  const { data: chapters } = await supabase.from("chapters").select("id, sort_order");
  const current = (chapters ?? []).find((c) => c.id === lesson.chapter_id);
  if (!current) return [];

  const priorChapterIds = (chapters ?? [])
    .filter((c) => c.sort_order < current.sort_order && c.sort_order >= current.sort_order - 2)
    .map((c) => c.id);

  const [{ data: sameChapter }, { data: prevChapters }] = await Promise.all([
    supabase
      .from("lessons")
      .select("id, number, sort_order")
      .eq("chapter_id", lesson.chapter_id)
      .lt("sort_order", lesson.sort_order),
    priorChapterIds.length > 0
      ? supabase.from("lessons").select("id, number, sort_order").in("chapter_id", priorChapterIds)
      : Promise.resolve({ data: [] as Array<{ id: string; number: string; sort_order: number }> }),
  ]);

  const priorLessons = [...(prevChapters ?? []), ...(sameChapter ?? [])];
  if (priorLessons.length === 0) return [];
  const numberByLessonId = new Map(priorLessons.map((l) => [l.id, l.number]));

  const { data: checks } = await supabase
    .from("concept_checks")
    .select("*")
    .in(
      "lesson_id",
      priorLessons.map((l) => l.id),
    );
  if (!checks || checks.length === 0) return [];

  const { data: attempts } = await supabase
    .from("concept_check_attempts")
    .select("check_id, correct, answered_at")
    .eq("user_id", userId)
    .in(
      "check_id",
      checks.map((c) => c.id),
    )
    .order("answered_at", { ascending: false });

  // Latest attempt per check (rows are newest-first).
  const latest = new Map<string, { correct: boolean; answered_at: string }>();
  for (const a of attempts ?? []) {
    if (!latest.has(a.check_id)) latest.set(a.check_id, a);
  }

  // Closest prior lesson first so unseen items skew recent.
  const sorted = [...checks].sort((a, b) => {
    const na = numberByLessonId.get(a.lesson_id) ?? "";
    const nb = numberByLessonId.get(b.lesson_id) ?? "";
    return nb.localeCompare(na, undefined, { numeric: true });
  });

  const candidates: WarmupCandidate[] = sorted.map((c) => ({
    checkId: c.id,
    lastCorrect: latest.get(c.id)?.correct ?? null,
    lastAnsweredAt: latest.get(c.id)?.answered_at ?? null,
  }));

  const pickedIds = pickWarmupIds(candidates, max);
  const checkById = new Map(checks.map((c) => [c.id, c]));
  return pickedIds.map((id) => {
    const check = checkById.get(id)!;
    return { check, lessonNumber: numberByLessonId.get(check.lesson_id) ?? "" };
  });
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add __tests__/content/concept-checks.test.ts lib/content/concept-checks.ts
git commit -m "feat(content): concept-check loaders and warm-up picker"
```

---

### Task 10: Attempt-recording route `POST /api/concept-checks`

**Files:**
- Create: `app/api/concept-checks/route.ts`

Follows the project route pattern (see `app/api/lessons/[slug]/route.ts`): `createRouteClient` + `requireAuth`, 400 on bad input, RLS enforces per-user isolation on insert. No LLM, no Judge0.

- [ ] **Step 1: Write the route**

```typescript
// app/api/concept-checks/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/require-auth";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// POST /api/concept-checks — record a concept-check attempt
// body: { checkId: string, correct: boolean } → 204
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const supabase = createRouteClient();

  const authResult = await requireAuth(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { checkId, correct } = (body ?? {}) as { checkId?: unknown; correct?: unknown };
  if (typeof checkId !== "string" || checkId.length === 0 || typeof correct !== "boolean") {
    return NextResponse.json(
      { error: "checkId (string) and correct (boolean) are required" },
      { status: 400 },
    );
  }

  const { error } = await supabase.from("concept_check_attempts").insert({
    user_id: user.id,
    check_id: checkId,
    correct,
  });
  if (error) {
    return NextResponse.json({ error: "Failed to record attempt" }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit && npm run lint`
Expected: clean. (Behavioral verification happens in Task 12 via the UI.)

- [ ] **Step 3: Commit**

```bash
git add app/api/concept-checks/route.ts
git commit -m "feat(api): record concept-check attempts"
```

---

### Task 11: Concept-check UI + lesson page wiring

**Files:**
- Create: `components/lesson/ConceptChecks.tsx`
- Modify: `app/(app)/lessons/[slug]/page.tsx` (fetches + props)
- Modify: `app/(app)/lessons/[slug]/LessonClient.tsx` (props + two render sites)

Checks are formative: answering is never gated, wrong answers just reveal the explanation. Attempts POST is fire-and-forget.

- [ ] **Step 1: Install the missing shadcn primitive**

Run: `npx shadcn@latest add radio-group`
Expected: creates `components/ui/radio-group.tsx` (CLAUDE.md already lists it — the file was missing).

- [ ] **Step 2: Write the components**

```tsx
// components/lesson/ConceptChecks.tsx
"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { CheckCircle2, ChevronDown, XCircle } from "lucide-react";

const SummaryView = dynamic(
  () => import("@/components/lesson/SummaryView").then((m) => m.SummaryView),
  { ssr: false },
);

export interface ConceptCheckClient {
  id: string;
  kind: "predict_output" | "spot_bug" | "mcq";
  promptMd: string;
  options: Record<string, string> | null;
  answer: string;
  explanationMd: string;
  /** Set for warm-up items: lesson number the check came from. */
  originLesson?: string;
}

const KIND_LABEL: Record<ConceptCheckClient["kind"], string> = {
  predict_output: "Predict the output",
  spot_bug: "Spot the bug",
  mcq: "Quick check",
};

function normalizeOutput(s: string): string {
  return s
    .split("\n")
    .map((l) => l.trimEnd())
    .join("\n")
    .trim();
}

export function ConceptCheckCard({ check }: { check: ConceptCheckClient }) {
  const [selected, setSelected] = useState("");
  const [typed, setTyped] = useState("");
  const [result, setResult] = useState<"correct" | "incorrect" | null>(null);

  const answered = result !== null;
  const canSubmit = check.options !== null ? selected !== "" : typed.trim() !== "";

  const submit = () => {
    const correct =
      check.options !== null
        ? selected === check.answer
        : normalizeOutput(typed) === normalizeOutput(check.answer);
    setResult(correct ? "correct" : "incorrect");
    void fetch("/api/concept-checks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checkId: check.id, correct }),
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
        <Badge variant="outline">{KIND_LABEL[check.kind]}</Badge>
        {check.originLesson && (
          <Badge variant="secondary">Lesson {check.originLesson}</Badge>
        )}
        {result === "correct" && <CheckCircle2 className="ml-auto h-4 w-4 text-green-500" />}
        {result === "incorrect" && <XCircle className="ml-auto h-4 w-4 text-red-500" />}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="prose prose-sm prose-invert max-w-none">
          <SummaryView markdown={check.promptMd} />
        </div>

        {check.options !== null ? (
          <RadioGroup value={selected} onValueChange={setSelected} disabled={answered}>
            {Object.entries(check.options)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([key, text]) => (
                <div key={key} className="flex items-start gap-2">
                  <RadioGroupItem value={key} id={`${check.id}-${key}`} />
                  <Label htmlFor={`${check.id}-${key}`} className="font-normal leading-snug">
                    {text}
                  </Label>
                </div>
              ))}
          </RadioGroup>
        ) : (
          <Input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            disabled={answered}
            placeholder="Type the exact output…"
            className="font-mono"
          />
        )}

        {!answered ? (
          <Button size="sm" onClick={submit} disabled={!canSubmit}>
            Check answer
          </Button>
        ) : (
          <div className="rounded-md border border-border bg-muted/40 p-3 space-y-2">
            {result === "incorrect" && (
              <p className="text-sm font-medium">
                Correct answer:{" "}
                <code className="font-mono">
                  {check.options !== null ? check.options[check.answer] : check.answer}
                </code>
              </p>
            )}
            <div className="prose prose-sm prose-invert max-w-none">
              <SummaryView markdown={check.explanationMd} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ConceptChecksSection({ checks }: { checks: ConceptCheckClient[] }) {
  if (checks.length === 0) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-foreground">Check yourself</h2>
      {checks.map((c) => (
        <ConceptCheckCard key={c.id} check={c} />
      ))}
    </section>
  );
}

export function WarmupBlock({ checks }: { checks: ConceptCheckClient[] }) {
  const [open, setOpen] = useState(true);
  if (checks.length === 0) return null;
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="flex cursor-pointer flex-row items-center justify-between space-y-0 py-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Warm-up: quick recall</h2>
              <p className="text-xs text-muted-foreground">From earlier lessons</p>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
            />
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-3 pt-0">
            {checks.map((c) => (
              <ConceptCheckCard key={c.id} check={c} />
            ))}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
```

- [ ] **Step 3: Fetch in the server page**

In `app/(app)/lessons/[slug]/page.tsx`:

Add imports:

```typescript
import { loadConceptChecks, loadWarmupChecks } from "@/lib/content/concept-checks";
import type { ConceptCheckClient } from "@/components/lesson/ConceptChecks";
import type { ConceptCheck } from "@/lib/supabase/types";
```

After the existing `Promise.all` block (after line 86), add:

```typescript
  const [conceptChecksRaw, warmupsRaw] = await Promise.all([
    loadConceptChecks(serviceClient, lesson.id),
    loadWarmupChecks(supabase, userId, lesson),
  ]);

  const toClientCheck = (c: ConceptCheck, originLesson?: string): ConceptCheckClient => ({
    id: c.id,
    kind: c.kind as ConceptCheckClient["kind"],
    promptMd: c.prompt_md,
    options: c.options as Record<string, string> | null,
    answer: c.answer,
    explanationMd: c.explanation_md,
    ...(originLesson ? { originLesson } : {}),
  });

  const conceptChecks = conceptChecksRaw.map((c) => toClientCheck(c));
  const warmupChecks = warmupsRaw.map((w) => toClientCheck(w.check, w.lessonNumber));
```

Then pass both to the client in the JSX:

```tsx
    <LessonClient
      lesson={{ ... }}                 // unchanged
      exercises={exercisesForClient}
      initialExerciseIndex={exercisesForClient.length > 0 ? clampedIndex : 0}
      nav={navInfo}
      conceptChecks={conceptChecks}
      warmupChecks={warmupChecks}
    />
```

- [ ] **Step 4: Render in `LessonClient.tsx`**

Add import:

```typescript
import {
  ConceptChecksSection,
  WarmupBlock,
  type ConceptCheckClient,
} from "@/components/lesson/ConceptChecks";
```

Extend `Props` (line 122) and the destructuring (line 130) — optional with `[]` defaults so other callers (e.g. the exercises page) keep working:

```typescript
interface Props {
  lesson: LessonData;
  exercises: ExerciseData[];
  initialExerciseIndex?: number;
  nav: NavData | null;
  exerciseOnly?: boolean;
  conceptChecks?: ConceptCheckClient[];
  warmupChecks?: ConceptCheckClient[];
}

export default function LessonClient({
  lesson,
  exercises,
  initialExerciseIndex = 0,
  nav,
  exerciseOnly = false,
  conceptChecks = [],
  warmupChecks = [],
}: Props) {
```

There are **two** summary render sites; update both:

Site 1 — the "lesson" tab (line ~383): inside `<div className="space-y-6">`, add the warm-up above the summary and the checks section between the summary and the Challenge block:

```tsx
                <div className="space-y-6">
                  <WarmupBlock checks={warmupChecks} />

                  {/* Lesson summary */}
                  {lesson.summaryMd ? (
                    <div className="prose prose-base prose-invert max-w-none">
                      <SummaryView markdown={lesson.summaryMd} />
                    </div>
                  ) : (
                    <ComingSoon />
                  )}

                  <ConceptChecksSection checks={conceptChecks} />

                  {/* Challenge prompt + samples */}
                  ...
```

Site 2 — the second `lesson.summaryMd` render (line ~615): wrap the same way:

```tsx
      <WarmupBlock checks={warmupChecks} />
      {lesson.summaryMd && (
        <>
          <SummaryView markdown={lesson.summaryMd} />
        </>
      )}
      <ConceptChecksSection checks={conceptChecks} />
```

(Match the existing wrapper elements at that site; the rule is the same — warm-up before the summary, checks after it.)

- [ ] **Step 5: Verify in the browser**

Run: `npm run dev`, then open `/lessons/<slug-for-13.7>` (the lesson pushed in Task 8).
Expected:
- "Check yourself" section under the lesson body with 3–5 interactive cards
- MCQ/spot-bug cards: radio options, "Check answer" disabled until a choice is made, explanation revealed after answering
- Predict-output card: monospace input, exact-output comparison tolerant of trailing whitespace
- Visit a *later* lesson in chapter 13 — warm-up block appears at top with badges naming origin lessons; answer one wrong, reload the later lesson: that item is preferred again
- A row appears in `concept_check_attempts` per answer (check Supabase)
- Lesson completion behavior unchanged

- [ ] **Step 6: Lint, typecheck, build**

Run: `npm run lint && npx tsc --noEmit && npm run build`
Expected: clean.

- [ ] **Step 7: Commit**

```bash
git add components/ui/radio-group.tsx components/lesson/ConceptChecks.tsx "app/(app)/lessons/[slug]/page.tsx" "app/(app)/lessons/[slug]/LessonClient.tsx"
git commit -m "feat(lessons): concept-check cards and recall warm-up block"
```

---

### Task 12: Pilot — regenerate chapter 13 end-to-end

**Files:** none created (operational task; pilot content lands in `scripts/regenerated/v2/13.*`)

Chapter 13 (structs/enums) is the pilot: mid-curriculum, rich misconception surface, and its old content is well-audited for comparison.

- [ ] **Step 1: Generate (deployed agents, zero API calls)**

Run `npx tsx scripts/export_lesson_meta.ts --chapters 13` if `_meta/ch_13.json` doesn't
exist yet, then deploy generation agents in parallel batches of 4–6 lessons each (~3–4
agents for chapter 13), following the agent generation protocol in Task 6: each briefing
contains the canonical prompt text, the lessons' metadata, the output contract, and the
validator's shape rules. Expected: ~17 lesson dirs × 3 files each under
`scripts/regenerated/v2/13.*`.

- [ ] **Step 2: Validate**

Run: `npx tsx scripts/validate_v2.ts`
Expected: all chapter-13 lessons `pass`. For failures: inspect `scripts/regenerated/v2/validation_report.md` and re-dispatch the responsible generation agent with the validator's exact error messages so it fixes its files. If the same lesson fails twice for the same reason, stop and report to the user — that's a briefing/spec defect, not a generation flake.

- [ ] **Step 3: Manual quality review (sample of 3)**

Read `13.2`, `13.7`, and `13.x` summaries and checks. Confirm for each:
- The four sections are present and the "## The idea" section is genuinely conceptual (no syntax dump)
- "## Common mistakes" shows real wrong-code/wrong-output pairs, not platitudes
- Concept-check wrong options are plausible misconceptions
- Nothing references chapter 14+ concepts (the lint is coarse; eyeball it)

- [ ] **Step 4: Push and verify in the app**

Run: `npx tsx scripts/push_v2.ts --lessons <comma-separated chapter-13 lesson numbers>`
Then in the dev server: open three chapter-13 lessons, confirm the new four-section body renders, checks work, warm-ups pull from earlier 13.x lessons.

- [ ] **Step 5: Commit pilot content**

```bash
git add scripts/regenerated/v2
git commit -m "feat(content): chapter 13 pilot — v2 lesson bodies, checks, exercises"
```

- [ ] **Step 6: User checkpoint**

Show the user the pilot in the app before proceeding to the full run. The full run regenerates and pushes live content for all 345 lessons and deploys many generation agents — do not start it without explicit user approval.

---

### Task 13: Full regeneration, push, and wrap-up

**Files:** content only (`scripts/regenerated/v2/**`)

- [ ] **Step 1: Generate everything (deployed agents, zero API calls)**

Run `npx tsx scripts/export_lesson_meta.ts` (all chapters), then deploy generation agents
chapter by chapter in parallel batches of 4–6 lessons per agent, per the Task 6 protocol.
Chapter-13 dirs already exist and are skipped. Track per-chapter completion; resume by
re-dispatching only the missing lesson dirs.

- [ ] **Step 2: Validate everything**

Run: `npx tsx scripts/validate_v2.ts`
Expected: > 95% pass on first try. For failures, re-dispatch the responsible agent with the validator errors, re-validate. Persistent failures: fix by hand-editing the JSON/MD (the gate re-checks edited files — it validates content, not provenance).

- [ ] **Step 3: Push all passing lessons**

Run: `npx tsx scripts/push_v2.ts`
Expected: `pushed=<n>` matching the pass count, `skipped=0` (or only known stragglers). Intro-chapter lessons (no checks/exercises) push with `--lessons <n> --force` after confirming their summaries pass validation.

- [ ] **Step 4: Smoke-test across the curriculum**

In the dev server, open one lesson from chapters 1, 5, 8, 13, 17, 25: four-section body, checks present (except ch 0), warm-ups appear from chapter 2 onward, exercises run and submit correctly against Judge0 with the softened verdict.

- [ ] **Step 5: Commit content and update CLAUDE.md**

In CLAUDE.md, update the "The caching pattern" section to mention `concept_checks` follows the same cached-content invariant, and note in "Key data flow" that lesson visits additionally load concept checks + warm-ups from Postgres (no LLM).

```bash
git add scripts/regenerated/v2 CLAUDE.md
git commit -m "feat(content): full curriculum v2 regeneration (Phase A)"
```

- [ ] **Step 6: Final checks**

Run: `npm run test && npm run lint && npm run build`
Expected: all clean. Phase A complete; Phases B (review queue over `concept_check_attempts`) and C (re-sequencing + projects) are specced as future phases in the design doc.

---

## Execution notes

- **Zero-API-call policy:** no Anthropic API calls anywhere in the content pipeline — generation is performed by deployed Claude Code agents; the metadata export and push scripts only touch Supabase.
- **Cache-guard invariants** (verified in design): lesson visits never call the LLM — all generation is offline; `push_v2.ts` is the only path that replaces cached content.
- **Scope constraints honored:** single `main.cpp` exercises only; no per-user generation; per-user data limited to `concept_check_attempts` rows.
- **Order matters:** Tasks 1–5 are prerequisites for 6; 7 → 8 in order (8's gate reads 7's status file); 9–11 can proceed in parallel once Task 1 lands; 12 needs everything; 13 needs 12's user checkpoint.







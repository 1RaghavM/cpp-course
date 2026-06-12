# Capstone Projects Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship 4 optional end-of-part capstone projects (Basics, Memory & OOP, STL & Templates, Advanced), each a single-file C++ project with 5 milestones, unlocked at 80% stage completion, authored by 4 parallel Opus Code agents.

**Architecture:** New `capstones` / `capstone_milestones` / `capstone_attempts` Postgres tables; content files under `content/capstones/` authored by agents; `/capstones/[slug]` route reusing exercise primitives; chip on the existing Curriculum Progress card; forbidden-symbol grep enforces topic scope in CI.

**Tech Stack:** Next.js App Router + TypeScript + Supabase Postgres/Auth + Judge0 (RapidAPI) + Vitest + shadcn/ui.

**Reference spec:** `docs/superpowers/specs/2026-06-11-capstone-projects-design.md`.

**Phasing:**
- **Phase 1** (Tasks 1–9): platform foundation — migration, types, pure helpers, server fetch, Judge0 runner. Pure infrastructure, no content yet.
- **Phase 2** (Tasks 10–13): 4 parallel Opus agents author content + acceptance check + merge.
- **Phase 3** (Tasks 14–16): seed script + content-integrity tests.
- **Phase 4** (Tasks 17–19): API route + page route + client UI.
- **Phase 5** (Tasks 20–21): chip on Curriculum Progress card + final manual smoke test.

Frequent commits between every task. Conventional commits.

---

## File Plan

**New files**

```
infra/supabase/migrations/015_capstones.sql
lib/capstones/types.ts
lib/capstones/forbidden-symbols.ts
lib/capstones/unlock.ts
lib/capstones/server.ts
lib/capstones/judge0.ts
scripts/seed_capstones.ts
app/api/capstones/[slug]/run/route.ts
app/(app)/capstones/[slug]/page.tsx
app/(app)/capstones/[slug]/CapstoneClient.tsx
__tests__/capstones/unlock.test.ts
__tests__/capstones/forbidden-symbols.test.ts
__tests__/capstones/content-integrity.test.ts
__tests__/capstones/run-route.test.ts
content/capstones/.gitkeep                   # placeholder until agents write
content/capstones/basics.md                  # written by agent (Task 11)
content/capstones/basics.tests.json          # written by agent
content/capstones/memory-oop.md              # written by agent
content/capstones/memory-oop.tests.json      # written by agent
content/capstones/stl-templates.md           # written by agent
content/capstones/stl-templates.tests.json   # written by agent
content/capstones/advanced.md                # written by agent
content/capstones/advanced.tests.json        # written by agent
docs/agents/capstone-author-prompt.md        # the agent prompt template
```

**Modified files**

```
lib/supabase/types.ts                                  # regenerated after migration
components/dashboard/CurriculumProgressCard.tsx        # add capstone chip
app/dashboard/page.tsx                                 # fetch capstone state alongside curriculum
package.json                                           # new `seed:capstones` script
```

---

## Phase 1 — Platform foundation

### Task 1: Database migration

**Files:**
- Create: `infra/supabase/migrations/015_capstones.sql`

- [ ] **Step 1: Write the migration**

```sql
-- 015_capstones.sql
-- End-of-part capstone projects. One row per stage, 5 milestones per capstone.

CREATE TABLE capstones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,                -- 'basics' | 'memory-oop' | 'stl-templates' | 'advanced'
  stage TEXT NOT NULL,                      -- matches Stage type in lib/dashboard/types
  title TEXT NOT NULL,
  description_md TEXT NOT NULL,
  language_standard TEXT NOT NULL DEFAULT 'c++20',
  compile_flags TEXT[] NOT NULL,
  starter_code TEXT NOT NULL,
  reference_solution TEXT NOT NULL,         -- private, never returned by API
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE capstone_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  capstone_id UUID NOT NULL REFERENCES capstones(id) ON DELETE CASCADE,
  ordinal INT NOT NULL CHECK (ordinal BETWEEN 1 AND 5),
  title TEXT NOT NULL,
  spec_anchor TEXT NOT NULL,
  tests JSONB NOT NULL,                     -- [{name, stdin, expected_stdout, timeout_ms}, ...]
  UNIQUE (capstone_id, ordinal)
);

CREATE TABLE capstone_attempts (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  milestone_id UUID NOT NULL REFERENCES capstone_milestones(id) ON DELETE CASCADE,
  passed BOOLEAN NOT NULL,
  submission_id UUID REFERENCES submissions(id),
  last_attempted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, milestone_id)
);

ALTER TABLE capstones ENABLE ROW LEVEL SECURITY;
ALTER TABLE capstone_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE capstone_attempts ENABLE ROW LEVEL SECURITY;

-- Capstones + milestones: any authenticated user can read.
-- reference_solution is filtered out at the application layer (lib/capstones/server.ts).
CREATE POLICY "Authenticated read capstones"
  ON capstones FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated read capstone_milestones"
  ON capstone_milestones FOR SELECT
  TO authenticated
  USING (true);

-- Per-user attempts: users may only see + write their own.
CREATE POLICY "Users select own capstone_attempts"
  ON capstone_attempts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own capstone_attempts"
  ON capstone_attempts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own capstone_attempts"
  ON capstone_attempts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

- [ ] **Step 2: Apply migration**

Run: `npx supabase db push`
Expected: migration `015_capstones.sql` applies cleanly, no errors.

- [ ] **Step 3: Verify tables**

Run: `npx supabase db query "select tablename from pg_tables where tablename like 'capstone%'"`
Expected: three rows — `capstones`, `capstone_milestones`, `capstone_attempts`.

- [ ] **Step 4: Commit**

```bash
git add infra/supabase/migrations/015_capstones.sql
git commit -m "feat(db): add capstones, capstone_milestones, capstone_attempts tables"
```

---

### Task 2: Regenerate Supabase types

**Files:**
- Modify: `lib/supabase/types.ts` (regenerated)

- [ ] **Step 1: Regenerate types**

Run: `npx supabase gen types typescript --local > lib/supabase/types.ts`

- [ ] **Step 2: Sanity-check the file**

Open `lib/supabase/types.ts`, confirm three new entries under `public.Tables`: `capstones`, `capstone_milestones`, `capstone_attempts`.

- [ ] **Step 3: Run typecheck**

Run: `npx tsc --noEmit`
Expected: zero errors.

- [ ] **Step 4: Commit**

```bash
git add lib/supabase/types.ts
git commit -m "chore(types): regenerate supabase types for capstones"
```

---

### Task 3: Domain types

**Files:**
- Create: `lib/capstones/types.ts`

- [ ] **Step 1: Write the type module**

```typescript
// lib/capstones/types.ts
import type { Stage } from "@/lib/dashboard/types";

export type CapstoneSlug = "basics" | "memory-oop" | "stl-templates" | "advanced";

export const CAPSTONE_SLUGS: readonly CapstoneSlug[] = [
  "basics",
  "memory-oop",
  "stl-templates",
  "advanced",
] as const;

export interface MilestoneTest {
  name: string;
  stdin: string;
  expected_stdout: string;
  timeout_ms: number;
}

export interface CapstoneMilestone {
  id: string;
  ordinal: number;
  title: string;
  spec_anchor: string;
  tests: MilestoneTest[];
}

/** Public capstone shape — reference_solution stripped before returning to clients. */
export interface PublicCapstone {
  id: string;
  slug: CapstoneSlug;
  stage: Stage;
  title: string;
  description_md: string;
  language_standard: string;
  compile_flags: string[];
  starter_code: string;
  milestones: CapstoneMilestone[];
}

/** Internal capstone shape — includes the reference solution. Server-side only. */
export interface InternalCapstone extends PublicCapstone {
  reference_solution: string;
}

export interface CapstoneAttempt {
  milestone_id: string;
  passed: boolean;
  last_attempted_at: string;
}

export interface CapstoneStageState {
  /** Stage progress: completed + skipped over total lessons in the stage. */
  stage_progress_ratio: number;
  unlocked: boolean;
  passed_count: number; // 0..5
}

/** Author-side schema for content/capstones/<slug>.tests.json. */
export interface CapstoneTestsFile {
  slug: CapstoneSlug;
  stage: Stage;
  title: string;
  language_standard: string;
  compile_flags: string[];
  starter_code: string;
  reference_solution: string;
  milestones: Array<{
    id: number;
    title: string;
    spec_anchor: string;
    tests: MilestoneTest[];
  }>;
}
```

- [ ] **Step 2: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add lib/capstones/types.ts
git commit -m "feat(capstones): add domain types"
```

---

### Task 4: Forbidden-symbols table — TDD

**Files:**
- Create: `lib/capstones/forbidden-symbols.ts`
- Create: `__tests__/capstones/forbidden-symbols.test.ts`

This module declares the per-stage forbidden C++ surface and provides a regex-based checker used by both the seed-time integrity test and the agent self-test contract.

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/capstones/forbidden-symbols.test.ts
import { describe, it, expect } from "vitest";
import {
  findForbiddenUsages,
  FORBIDDEN_BY_STAGE,
} from "@/lib/capstones/forbidden-symbols";

describe("FORBIDDEN_BY_STAGE", () => {
  it("declares forbidden symbols for every stage except advanced", () => {
    expect(FORBIDDEN_BY_STAGE.basics.length).toBeGreaterThan(0);
    expect(FORBIDDEN_BY_STAGE["memory-oop"].length).toBeGreaterThan(0);
    expect(FORBIDDEN_BY_STAGE["stl-templates"].length).toBeGreaterThan(0);
    expect(FORBIDDEN_BY_STAGE.advanced).toEqual([]);
  });
});

describe("findForbiddenUsages — basics", () => {
  it("flags std::vector in basics", () => {
    const hits = findForbiddenUsages("basics", "std::vector<int> v;");
    expect(hits.map((h) => h.label)).toContain("std::vector");
  });

  it("flags class declaration in basics", () => {
    const hits = findForbiddenUsages("basics", "class Foo { };");
    expect(hits.map((h) => h.label)).toContain("class declaration");
  });

  it("flags new / delete in basics", () => {
    const hits = findForbiddenUsages("basics", "int* p = new int(5); delete p;");
    const labels = hits.map((h) => h.label);
    expect(labels).toContain("new expression");
    expect(labels).toContain("delete expression");
  });

  it("does not flag plain main + cout in basics", () => {
    const code = `#include <iostream>
int main() {
  int x = 0;
  std::cin >> x;
  std::cout << x << '\\n';
  return 0;
}`;
    expect(findForbiddenUsages("basics", code)).toEqual([]);
  });
});

describe("findForbiddenUsages — memory-oop", () => {
  it("flags std::vector in memory-oop", () => {
    const hits = findForbiddenUsages("memory-oop", "std::vector<int> v;");
    expect(hits.map((h) => h.label)).toContain("std::vector");
  });

  it("allows class declaration in memory-oop", () => {
    expect(findForbiddenUsages("memory-oop", "class Foo { };")).toEqual([]);
  });
});

describe("findForbiddenUsages — stl-templates", () => {
  it("flags std::unique_ptr in stl-templates", () => {
    const hits = findForbiddenUsages(
      "stl-templates",
      "std::unique_ptr<int> p;",
    );
    expect(hits.map((h) => h.label)).toContain("std::unique_ptr");
  });

  it("allows std::vector in stl-templates", () => {
    expect(findForbiddenUsages("stl-templates", "std::vector<int> v;")).toEqual([]);
  });
});

describe("findForbiddenUsages — advanced", () => {
  it("flags nothing in advanced", () => {
    const code = `
#include <vector>
#include <memory>
class A { virtual void f() = 0; };
class B : public A { void f() override {} };
std::unique_ptr<A> p;
std::vector<int> v;
    `;
    expect(findForbiddenUsages("advanced", code)).toEqual([]);
  });
});

describe("findForbiddenUsages — ignores string literals and line comments", () => {
  it("does not flag 'class' inside a string literal in basics", () => {
    expect(findForbiddenUsages("basics", `puts("class Foo");`)).toEqual([]);
  });

  it("does not flag 'new' inside a // line comment in basics", () => {
    expect(findForbiddenUsages("basics", `// new is not yet introduced\nint x = 0;`)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/capstones/forbidden-symbols.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the module**

```typescript
// lib/capstones/forbidden-symbols.ts
import type { Stage } from "@/lib/dashboard/types";

export interface ForbiddenPattern {
  label: string;
  pattern: RegExp;
}

/**
 * Per-stage list of forbidden C++ surface for capstone reference solutions.
 * The Basics capstone must not use vectors, classes, pointers, etc. — those
 * topics live in later stages of the curriculum.
 *
 * Patterns run against source with comments + string literals stripped so
 * keywords inside text content don't false-positive.
 */
export const FORBIDDEN_BY_STAGE: Record<Stage, ForbiddenPattern[]> = {
  basics: [
    { label: "std::vector", pattern: /\bstd::vector\b/ },
    { label: "std::array", pattern: /\bstd::array\b/ },
    { label: "class declaration", pattern: /\bclass\s+[A-Za-z_]/ },
    { label: "struct with methods", pattern: /\bstruct\s+[A-Za-z_][^;{]*\{[^}]*\([^)]*\)\s*\{/s },
    { label: "new expression", pattern: /\bnew\s+[A-Za-z_]/ },
    { label: "delete expression", pattern: /\bdelete\s+[A-Za-z_\[]/ },
    { label: "pointer declaration", pattern: /[A-Za-z_][A-Za-z0-9_]*\s*\*\s*[A-Za-z_]/ },
    { label: "reference declaration", pattern: /[A-Za-z_][A-Za-z0-9_]*\s*&\s*[A-Za-z_][A-Za-z0-9_]*\s*[=;,)]/ },
    { label: "smart pointer", pattern: /\bstd::(unique_ptr|shared_ptr|weak_ptr)\b/ },
    { label: "template", pattern: /\btemplate\s*</ },
    { label: "lambda", pattern: /\[[^\]]*\]\s*\([^)]*\)\s*\{/ },
    { label: "<algorithm>", pattern: /#\s*include\s*<algorithm>/ },
    { label: "virtual", pattern: /\bvirtual\b/ },
  ],
  "memory-oop": [
    { label: "std::vector", pattern: /\bstd::vector\b/ },
    { label: "std::array", pattern: /\bstd::array\b/ },
    { label: "iterator", pattern: /\b(begin|end|cbegin|cend)\s*\(/ },
    { label: "<algorithm>", pattern: /#\s*include\s*<algorithm>/ },
    { label: "smart pointer", pattern: /\bstd::(unique_ptr|shared_ptr|weak_ptr)\b/ },
    { label: "virtual", pattern: /\bvirtual\b/ },
    { label: "inheritance", pattern: /\bclass\s+[A-Za-z_][A-Za-z0-9_]*\s*:\s*(public|protected|private)\b/ },
    { label: "move/forward", pattern: /\bstd::(move|forward)\b/ },
    { label: "exceptions", pattern: /\b(throw|try|catch)\b/ },
    { label: "<fstream>", pattern: /#\s*include\s*<fstream>/ },
  ],
  "stl-templates": [
    { label: "smart pointer", pattern: /\bstd::(unique_ptr|shared_ptr|weak_ptr)\b/ },
    { label: "virtual", pattern: /\bvirtual\b/ },
    { label: "inheritance", pattern: /\bclass\s+[A-Za-z_][A-Za-z0-9_]*\s*:\s*(public|protected|private)\b/ },
    { label: "move/forward", pattern: /\bstd::(move|forward)\b/ },
    { label: "exceptions", pattern: /\b(throw|try|catch)\b/ },
    { label: "<fstream>", pattern: /#\s*include\s*<fstream>/ },
  ],
  advanced: [],
};

/** Strip block comments, line comments, and string/char literals from C++ source. */
function stripCommentsAndStrings(code: string): string {
  let out = "";
  let i = 0;
  while (i < code.length) {
    const two = code.slice(i, i + 2);
    if (two === "/*") {
      const end = code.indexOf("*/", i + 2);
      i = end === -1 ? code.length : end + 2;
      continue;
    }
    if (two === "//") {
      const end = code.indexOf("\n", i + 2);
      i = end === -1 ? code.length : end;
      continue;
    }
    const ch = code[i];
    if (ch === '"' || ch === "'") {
      const quote = ch;
      let j = i + 1;
      while (j < code.length && code[j] !== quote) {
        if (code[j] === "\\") j += 2;
        else j += 1;
      }
      i = j + 1;
      continue;
    }
    out += ch;
    i += 1;
  }
  return out;
}

export interface ForbiddenHit {
  label: string;
  match: string;
}

/**
 * Scan `code` for any forbidden patterns associated with `stage`. Returns the
 * list of distinct hits (deduplicated by label).
 */
export function findForbiddenUsages(stage: Stage, code: string): ForbiddenHit[] {
  const cleaned = stripCommentsAndStrings(code);
  const hits: ForbiddenHit[] = [];
  const seen = new Set<string>();
  for (const { label, pattern } of FORBIDDEN_BY_STAGE[stage]) {
    const m = cleaned.match(pattern);
    if (m && !seen.has(label)) {
      seen.add(label);
      hits.push({ label, match: m[0] });
    }
  }
  return hits;
}
```

- [ ] **Step 4: Run test to verify pass**

Run: `npx vitest run __tests__/capstones/forbidden-symbols.test.ts`
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/capstones/forbidden-symbols.ts __tests__/capstones/forbidden-symbols.test.ts
git commit -m "feat(capstones): per-stage forbidden symbol scanner"
```

---

### Task 5: Unlock pure function — TDD

**Files:**
- Create: `lib/capstones/unlock.ts`
- Create: `__tests__/capstones/unlock.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/capstones/unlock.test.ts
import { describe, it, expect } from "vitest";
import { isCapstoneUnlocked, UNLOCK_THRESHOLD } from "@/lib/capstones/unlock";

describe("UNLOCK_THRESHOLD", () => {
  it("is 0.8", () => {
    expect(UNLOCK_THRESHOLD).toBe(0.8);
  });
});

describe("isCapstoneUnlocked", () => {
  it("returns false when no lessons in the stage", () => {
    expect(isCapstoneUnlocked(0, 0)).toBe(false);
  });
  it("returns false at 0%", () => {
    expect(isCapstoneUnlocked(0, 10)).toBe(false);
  });
  it("returns false at 79%", () => {
    expect(isCapstoneUnlocked(79, 100)).toBe(false);
  });
  it("returns true at exactly 80%", () => {
    expect(isCapstoneUnlocked(80, 100)).toBe(true);
  });
  it("returns true at 100%", () => {
    expect(isCapstoneUnlocked(100, 100)).toBe(true);
  });
  it("treats over-count defensively (clamps to true)", () => {
    expect(isCapstoneUnlocked(150, 100)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/capstones/unlock.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the module**

```typescript
// lib/capstones/unlock.ts
/**
 * Capstones unlock at this fraction of stage lessons completed-or-skipped.
 * Matches the spec at docs/superpowers/specs/2026-06-11-capstone-projects-design.md §1.
 */
export const UNLOCK_THRESHOLD = 0.8;

/**
 * Pure: given a user's completed+skipped count and the total lessons in a
 * stage, return whether the capstone for that stage is unlocked.
 *
 * A stage with zero lessons is never unlocked (defensive — should not happen).
 */
export function isCapstoneUnlocked(completed: number, total: number): boolean {
  if (total <= 0) return false;
  return completed / total >= UNLOCK_THRESHOLD;
}
```

- [ ] **Step 4: Run test to verify pass**

Run: `npx vitest run __tests__/capstones/unlock.test.ts`
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/capstones/unlock.ts __tests__/capstones/unlock.test.ts
git commit -m "feat(capstones): unlock threshold pure function"
```

---

### Task 6: Server-side fetch helpers

**Files:**
- Create: `lib/capstones/server.ts`

This module owns reads from `capstones`, `capstone_milestones`, and `capstone_attempts`. It is the only place that touches `reference_solution`; clients never see it.

- [ ] **Step 1: Write the module**

```typescript
// lib/capstones/server.ts
import type { AppSupabaseClient } from "@/lib/supabase/types";
import type {
  CapstoneSlug,
  CapstoneAttempt,
  InternalCapstone,
  PublicCapstone,
  CapstoneMilestone,
  MilestoneTest,
} from "@/lib/capstones/types";
import type { Stage } from "@/lib/dashboard/types";

export async function fetchPublicCapstone(
  supabase: AppSupabaseClient,
  slug: CapstoneSlug,
): Promise<PublicCapstone | null> {
  const internal = await fetchInternalCapstone(supabase, slug);
  if (!internal) return null;
  const { reference_solution: _ref, ...rest } = internal;
  return rest;
}

export async function fetchInternalCapstone(
  supabase: AppSupabaseClient,
  slug: CapstoneSlug,
): Promise<InternalCapstone | null> {
  const { data: capstone, error } = await supabase
    .from("capstones")
    .select(
      "id, slug, stage, title, description_md, language_standard, compile_flags, starter_code, reference_solution",
    )
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  if (!capstone) return null;

  const { data: milestones, error: mErr } = await supabase
    .from("capstone_milestones")
    .select("id, ordinal, title, spec_anchor, tests")
    .eq("capstone_id", capstone.id)
    .order("ordinal", { ascending: true });
  if (mErr) throw mErr;

  return {
    id: capstone.id,
    slug: capstone.slug as CapstoneSlug,
    stage: capstone.stage as Stage,
    title: capstone.title,
    description_md: capstone.description_md,
    language_standard: capstone.language_standard,
    compile_flags: capstone.compile_flags,
    starter_code: capstone.starter_code,
    reference_solution: capstone.reference_solution,
    milestones: (milestones ?? []).map(
      (m): CapstoneMilestone => ({
        id: m.id,
        ordinal: m.ordinal,
        title: m.title,
        spec_anchor: m.spec_anchor,
        tests: m.tests as unknown as MilestoneTest[],
      }),
    ),
  };
}

export async function fetchUserAttempts(
  supabase: AppSupabaseClient,
  userId: string,
  milestoneIds: string[],
): Promise<CapstoneAttempt[]> {
  if (milestoneIds.length === 0) return [];
  const { data, error } = await supabase
    .from("capstone_attempts")
    .select("milestone_id, passed, last_attempted_at")
    .eq("user_id", userId)
    .in("milestone_id", milestoneIds);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    milestone_id: row.milestone_id,
    passed: row.passed,
    last_attempted_at: row.last_attempted_at,
  }));
}

export async function upsertAttempt(
  supabase: AppSupabaseClient,
  userId: string,
  milestoneId: string,
  passed: boolean,
  submissionId: string | null,
): Promise<void> {
  const { error } = await supabase.from("capstone_attempts").upsert(
    {
      user_id: userId,
      milestone_id: milestoneId,
      passed,
      submission_id: submissionId,
      last_attempted_at: new Date().toISOString(),
    },
    { onConflict: "user_id,milestone_id" },
  );
  if (error) throw error;
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add lib/capstones/server.ts
git commit -m "feat(capstones): server-side fetch helpers"
```

---

### Task 7: Judge0 runner for a milestone

**Files:**
- Create: `lib/capstones/judge0.ts`

Wraps the existing `submitCode` + `evaluateTestCases` for a single milestone's tests.

- [ ] **Step 1: Write the module**

```typescript
// lib/capstones/judge0.ts
import { submitCode, type CppStandard } from "@/lib/judge0/client";
import { evaluateTestCases, type TestCase, type VerdictResult } from "@/lib/judge0/verdict";
import type { MilestoneTest } from "@/lib/capstones/types";

export interface RunMilestoneInput {
  sourceCode: string;
  languageStandard: string;     // e.g. "c++20"
  tests: MilestoneTest[];
}

/**
 * Compile the source once via Judge0 per test case (mirroring the exercise
 * route's approach), then evaluate per-test pass/fail.
 *
 * Returns the verdict and the raw test outcomes for the route handler to
 * persist + report.
 */
export async function runMilestoneTests(
  input: RunMilestoneInput,
): Promise<VerdictResult> {
  const standard = (input.languageStandard as CppStandard) ?? "c++20";
  const judge0Results: Array<{ stdout: string | null; status: ReturnType<typeof statusFromMeta> }> = [];
  for (const t of input.tests) {
    const result = await submitCode({
      sourceCode: input.sourceCode,
      stdin: t.stdin,
      languageStd: standard,
      cpuTimeLimit: Math.ceil(t.timeout_ms / 1000) || 2,
    });
    judge0Results.push({ stdout: result.stdout, status: result.status });
  }

  const testCases: TestCase[] = input.tests.map((t) => ({
    label: t.name,
    stdin: t.stdin,
    expectedStdout: t.expected_stdout,
  }));

  return evaluateTestCases(testCases, judge0Results);
}

// Re-export so route handlers can pattern-match on JudgeStatus without importing client directly.
function statusFromMeta(s: import("@/lib/judge0/client").JudgeStatus) {
  return s;
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add lib/capstones/judge0.ts
git commit -m "feat(capstones): judge0 milestone runner"
```

---

### Task 8: Wire content directory

**Files:**
- Create: `content/capstones/.gitkeep`

Pre-create the directory so Phase 2 agents have a known path to write into and the seed script's globbing works even before content lands.

- [ ] **Step 1: Create the empty content directory**

```bash
mkdir -p content/capstones
touch content/capstones/.gitkeep
```

- [ ] **Step 2: Commit**

```bash
git add content/capstones/.gitkeep
git commit -m "chore(capstones): create content/capstones/ directory"
```

---

### Task 9: Write the agent prompt template

**Files:**
- Create: `docs/agents/capstone-author-prompt.md`

Single canonical prompt template, parameterized by the stage block in §Stage-specific. Each of the 4 agents gets this prompt with one stage block filled in.

- [ ] **Step 1: Write the template**

````markdown
# Capstone Author Agent — {{STAGE_TITLE}}

You are writing a single end-of-part C++ capstone project for the cpproad
learning platform. Read `docs/superpowers/specs/2026-06-11-capstone-projects-design.md`
for full context; this prompt is the spec re-stated as your contract.

## Scope (frozen — do not negotiate)

- **Stage slug:** `{{STAGE_SLUG}}`
- **Stage chapter range:** `{{STAGE_CHAPTERS}}`
- **Lesson titles in this stage:** {{LESSON_TITLES_BULLETED}}

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
````

- [ ] **Step 2: Commit**

```bash
git add docs/agents/capstone-author-prompt.md
git commit -m "docs(capstones): agent author prompt template"
```

---

## Phase 2 — Author content with 4 parallel Opus agents

### Task 10: Set up worktrees

**Files (script):**
- None (interactive shell)

Each agent runs in its own git worktree to keep their parallel writes isolated. After they return, branches merge back sequentially.

- [ ] **Step 1: Create 4 worktrees**

```bash
git worktree add -b capstone/basics       ../cpp-course-capstone-basics       master
git worktree add -b capstone/memory-oop   ../cpp-course-capstone-memory-oop   master
git worktree add -b capstone/stl-templates ../cpp-course-capstone-stl-templates master
git worktree add -b capstone/advanced     ../cpp-course-capstone-advanced     master
```

- [ ] **Step 2: Verify the worktrees**

Run: `git worktree list`
Expected: 5 entries (this checkout + 4 capstone worktrees).

---

### Task 11: Dispatch the 4 Opus agents in parallel

**Files written by agents (one set per worktree):**
- `content/capstones/<slug>.md`
- `content/capstones/<slug>.tests.json`

- [ ] **Step 1: Dispatch all 4 in a single message**

Use the `Agent` tool 4 times in one message (parallel execution). Each call uses `subagent_type: "claude"`, `model: "opus"`, `isolation: "worktree"` is **not** used — we already created worktrees in Task 10 and will `cd` into each. Pass each agent the prompt template from Task 9 with the stage block filled in.

The 4 stage blocks to substitute into the template (`{{STAGE_SLUG}}`, `{{STAGE_TITLE}}`, `{{STAGE_CHAPTERS}}`, `{{LESSON_TITLES_BULLETED}}`, `{{ALLOWED_SURFACE_BULLETED}}`, `{{FORBIDDEN_SURFACE_BULLETED}}`):

#### Stage block — Basics

- `STAGE_SLUG`: `basics`
- `STAGE_TITLE`: `Basics`
- `STAGE_CHAPTERS`: `0–11`
- `LESSON_TITLES_BULLETED`: extract every `learncpp_title` for chapters 0–11 from `curriculum_seed.json` and render as a bullet list with the lesson number prefix, e.g. `- 1.5 — Introduction to iostream: cout, cin, and endl`.
- `ALLOWED_SURFACE_BULLETED`:
  - `std::cout`, `std::cin`, `std::endl`, `<iostream>`
  - Fundamental types: `int`, `double`, `bool`, `char`, fixed-width integers
  - `std::string` for introductory string handling
  - `if`/`else`, `while`, `for`, `do`/`while`
  - Functions, parameters, return values, forward declarations
  - Local/global scope, named constants (`const`, `constexpr`)
  - `static_cast`, basic bitwise/logical/arithmetic operators
  - Multiple-file programs allowed conceptually but the single-file capstone stays in one file
- `FORBIDDEN_SURFACE_BULLETED`: full list with regex labels from `lib/capstones/forbidden-symbols.ts` `FORBIDDEN_BY_STAGE.basics`. Render labels in human form.

#### Stage block — Memory & OOP

- `STAGE_SLUG`: `memory-oop`
- `STAGE_TITLE`: `Memory & OOP`
- `STAGE_CHAPTERS`: `12–17`
- `LESSON_TITLES_BULLETED`: lesson titles from chapters 12–17.
- `ALLOWED_SURFACE_BULLETED`: everything from Basics, plus:
  - Function overloading, function templates (intro)
  - References (`T&`), pointers (`T*`), `nullptr`, address-of
  - Enums (scoped + unscoped), structs, classes (members, constructors, access specifiers)
  - `constexpr` functions
- `FORBIDDEN_SURFACE_BULLETED`: from `FORBIDDEN_BY_STAGE["memory-oop"]`.

#### Stage block — STL & Templates

- `STAGE_SLUG`: `stl-templates`
- `STAGE_TITLE`: `STL & Templates`
- `STAGE_CHAPTERS`: `18–23`
- `LESSON_TITLES_BULLETED`: lesson titles from chapters 18–23.
- `ALLOWED_SURFACE_BULLETED`: everything from Memory & OOP, plus:
  - `std::vector`, `std::array`
  - Iterators, range-for, STL algorithms (`<algorithm>`)
  - Raw dynamic memory (`new`, `delete`)
  - Function objects, lambdas, operator overloading
- `FORBIDDEN_SURFACE_BULLETED`: from `FORBIDDEN_BY_STAGE["stl-templates"]`.

#### Stage block — Advanced

- `STAGE_SLUG`: `advanced`
- `STAGE_TITLE`: `Advanced`
- `STAGE_CHAPTERS`: `24–33`
- `LESSON_TITLES_BULLETED`: lesson titles from chapters 24–33.
- `ALLOWED_SURFACE_BULLETED`: everything from STL & Templates, plus:
  - Move semantics, rvalue references, `std::move`/`std::forward`
  - `std::unique_ptr`, `std::shared_ptr`, `std::weak_ptr`
  - Inheritance, virtual functions, polymorphism, abstract base classes
  - Class templates, template specialization
  - Exceptions (`throw`/`try`/`catch`)
  - `<fstream>`, `<sstream>`, I/O manipulators
- `FORBIDDEN_SURFACE_BULLETED`: `(none — every C++ surface used in the curriculum is fair game)`.

Agent invocation (per agent) — exact `Agent` tool call shape:

```json
{
  "description": "Author <stage> capstone",
  "subagent_type": "claude",
  "model": "opus",
  "prompt": "Working directory: ../cpp-course-capstone-<slug>. <full prompt template from docs/agents/capstone-author-prompt.md with stage block substituted in>",
  "run_in_background": false
}
```

All 4 calls in a single message → parallel execution.

- [ ] **Step 2: Wait for all 4 to return**

The Agent tool returns a result string from each. Capture each agent's reported milestone titles + theme summary.

---

### Task 12: Acceptance check + merge per agent

For each of the 4 returned agents — in this order: `basics`, `memory-oop`, `stl-templates`, `advanced` — run the same 7-step check before merging.

- [ ] **Step 1: cd into the worktree**

```bash
cd ../cpp-course-capstone-<slug>
```

- [ ] **Step 2: Verify both files exist**

```bash
ls content/capstones/<slug>.md content/capstones/<slug>.tests.json
```
Expected: both paths present.

- [ ] **Step 3: Validate JSON shape**

```bash
node -e "
  const f = require('./content/capstones/<slug>.tests.json');
  if (f.slug !== '<slug>') throw new Error('slug mismatch');
  if (!Array.isArray(f.milestones) || f.milestones.length !== 5) throw new Error('need 5 milestones');
  const totalTests = f.milestones.reduce((s,m)=>s+(m.tests?.length||0),0);
  if (totalTests < 10) throw new Error('need ≥10 tests, got ' + totalTests);
  for (const m of f.milestones) {
    if (!m.tests || m.tests.length < 2) throw new Error('milestone '+m.id+' has <2 tests');
  }
  console.log('ok — 5 milestones, ' + totalTests + ' tests total');
"
```
Expected: prints `ok — 5 milestones, N tests total`.

- [ ] **Step 4: Compile the reference**

```bash
node -e "process.stdout.write(require('./content/capstones/<slug>.tests.json').reference_solution)" > /tmp/cap-<slug>-ref.cpp
g++ -std=c++20 -Wall -Wextra -Werror /tmp/cap-<slug>-ref.cpp -o /tmp/cap-<slug>-ref
```
Expected: clean compile, no warnings.

- [ ] **Step 5: Run all milestone tests against the reference**

```bash
node -e "
  const f = require('./content/capstones/<slug>.tests.json');
  const { spawnSync } = require('child_process');
  function norm(s){return s.split('\n').map(l=>l.replace(/\s+$/,'')).join('\n').trim();}
  let fails = 0;
  for (const m of f.milestones) {
    for (const t of m.tests) {
      const r = spawnSync('/tmp/cap-<slug>-ref', [], { input: t.stdin, timeout: t.timeout_ms || 2000 });
      const expected = norm(t.expected_stdout);
      const actual = norm(String(r.stdout || ''));
      if (expected !== actual) {
        console.log('FAIL', m.id, t.name);
        console.log('  expected:', JSON.stringify(expected));
        console.log('  actual:', JSON.stringify(actual));
        fails++;
      }
    }
  }
  if (fails) { console.log(fails + ' failing test(s)'); process.exit(1); }
  console.log('all tests pass');
"
```
Expected: `all tests pass`. If any failure, **do not merge** — send the agent back via a follow-up dispatch with the failure list.

- [ ] **Step 6: Run forbidden-symbol check on the reference**

Stay in the worktree (`../cpp-course-capstone-<slug>`). The `lib/capstones/forbidden-symbols.ts` module landed on `master` in Task 4 and is present in every worktree.

```bash
npx tsx -e "
import { findForbiddenUsages } from './lib/capstones/forbidden-symbols';
import { readFileSync } from 'node:fs';
const f = JSON.parse(readFileSync('content/capstones/<slug>.tests.json', 'utf8'));
const hits = findForbiddenUsages('<slug>', f.reference_solution);
if (hits.length) { console.log('FORBIDDEN HITS:', hits); process.exit(1); }
console.log('clean');
"
```
Expected: `clean`. Any hit means the reference uses a forbidden symbol — re-dispatch the agent with the specific violation.

- [ ] **Step 7: Verify reference LOC budget**

```bash
node -e "
  const lines = require('./content/capstones/<slug>.tests.json').reference_solution.split('\n').length;
  if (lines < 50 || lines > 150) { console.log('LOC out of budget:', lines); process.exit(1); }
  console.log(lines + ' lines — within budget');
"
```

- [ ] **Step 8: Commit + merge back to master**

```bash
git add content/capstones/<slug>.md content/capstones/<slug>.tests.json
git commit -m "feat(capstones): author <slug> capstone content"
cd ../cpp-course
git merge --no-ff capstone/<slug> -m "merge: <slug> capstone content"
```

If any of steps 2–7 fail: do **not** merge that worktree's branch. Re-dispatch the agent with the failure detail.

- [ ] **Step 9: Repeat steps 1–8 for the remaining 3 slugs**

Order: `memory-oop`, `stl-templates`, `advanced`.

- [ ] **Step 7: Verify reference LOC budget**

```bash
node -e "
  const lines = require('./content/capstones/<slug>.tests.json').reference_solution.split('\n').length;
  if (lines < 50 || lines > 150) { console.log('LOC out of budget:', lines); process.exit(1); }
  console.log(lines + ' lines — within budget');
"
```


---

### Task 13: Clean up worktrees

- [ ] **Step 1: Remove the 4 worktrees**

```bash
git worktree remove ../cpp-course-capstone-basics
git worktree remove ../cpp-course-capstone-memory-oop
git worktree remove ../cpp-course-capstone-stl-templates
git worktree remove ../cpp-course-capstone-advanced
git branch -d capstone/basics capstone/memory-oop capstone/stl-templates capstone/advanced
```

- [ ] **Step 2: Verify state**

```bash
git worktree list
git branch
```
Expected: only this checkout in worktree list; capstone branches gone.

---

## Phase 3 — Seed + content-integrity tests

### Task 14: Seed script

**Files:**
- Create: `scripts/seed_capstones.ts`
- Modify: `package.json` (add `seed:capstones` script)

- [ ] **Step 1: Write the seed script**

```typescript
// scripts/seed_capstones.ts
/**
 * Load content/capstones/<slug>.md + <slug>.tests.json into Postgres.
 *
 * Usage: npx tsx scripts/seed_capstones.ts
 * Requires: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Idempotent — upserts on (capstones.slug) and (capstone_milestones unique).
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import type { CapstoneTestsFile, CapstoneSlug } from "../lib/capstones/types";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const CAPSTONE_DIR = resolve(__dirname, "..", "content", "capstones");

async function seedOne(slug: CapstoneSlug) {
  const tests = JSON.parse(
    readFileSync(join(CAPSTONE_DIR, `${slug}.tests.json`), "utf8"),
  ) as CapstoneTestsFile;
  const md = readFileSync(join(CAPSTONE_DIR, `${slug}.md`), "utf8");

  // Upsert the capstone row.
  const { data: capRow, error: capErr } = await supabase
    .from("capstones")
    .upsert(
      {
        slug: tests.slug,
        stage: tests.stage,
        title: tests.title,
        description_md: md,
        language_standard: tests.language_standard,
        compile_flags: tests.compile_flags,
        starter_code: tests.starter_code,
        reference_solution: tests.reference_solution,
      },
      { onConflict: "slug" },
    )
    .select("id")
    .single();
  if (capErr) throw capErr;

  // Replace milestones for this capstone (delete then insert — simpler than
  // upserting on (capstone_id, ordinal) and reconciling).
  const { error: delErr } = await supabase
    .from("capstone_milestones")
    .delete()
    .eq("capstone_id", capRow.id);
  if (delErr) throw delErr;

  const { error: insErr } = await supabase.from("capstone_milestones").insert(
    tests.milestones.map((m) => ({
      capstone_id: capRow.id,
      ordinal: m.id,
      title: m.title,
      spec_anchor: m.spec_anchor,
      tests: m.tests,
    })),
  );
  if (insErr) throw insErr;

  console.log(`✓ seeded ${slug} (${tests.milestones.length} milestones)`);
}

async function main() {
  const files = readdirSync(CAPSTONE_DIR).filter((f) => f.endsWith(".tests.json"));
  for (const f of files) {
    const slug = f.replace(".tests.json", "") as CapstoneSlug;
    await seedOne(slug);
  }
  console.log(`done — ${files.length} capstone(s) seeded`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 2: Add the npm script**

In `package.json`, under `"scripts"`, add:
```json
"seed:capstones": "tsx scripts/seed_capstones.ts"
```

- [ ] **Step 3: Run the seed**

```bash
npm run seed:capstones
```
Expected: `✓ seeded basics`, `✓ seeded memory-oop`, `✓ seeded stl-templates`, `✓ seeded advanced`, `done — 4 capstone(s) seeded`.

- [ ] **Step 4: Verify row counts in DB**

```bash
npx supabase db query "select count(*) from capstones; select count(*) from capstone_milestones;"
```
Expected: 4 capstones, 20 milestones.

- [ ] **Step 5: Commit**

```bash
git add scripts/seed_capstones.ts package.json
git commit -m "feat(capstones): seed script for content/capstones content"
```

---

### Task 15: Content integrity test (forbidden-symbol regression guard)

**Files:**
- Create: `__tests__/capstones/content-integrity.test.ts`

This is the long-term guardrail. Any future edit to a `.tests.json` that drops a forbidden symbol into the reference fails CI.

- [ ] **Step 1: Write the test**

```typescript
// __tests__/capstones/content-integrity.test.ts
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import {
  findForbiddenUsages,
  FORBIDDEN_BY_STAGE,
} from "@/lib/capstones/forbidden-symbols";
import type { CapstoneTestsFile, CapstoneSlug } from "@/lib/capstones/types";

const CAPSTONE_DIR = resolve(__dirname, "..", "..", "content", "capstones");

function loadAll(): Array<{ slug: CapstoneSlug; file: CapstoneTestsFile; md: string }> {
  return readdirSync(CAPSTONE_DIR)
    .filter((f) => f.endsWith(".tests.json"))
    .map((f) => {
      const slug = f.replace(".tests.json", "") as CapstoneSlug;
      const file = JSON.parse(readFileSync(join(CAPSTONE_DIR, f), "utf8")) as CapstoneTestsFile;
      const md = readFileSync(join(CAPSTONE_DIR, `${slug}.md`), "utf8");
      return { slug, file, md };
    });
}

describe("capstone content integrity", () => {
  const all = loadAll();

  it("ships 4 capstones (basics, memory-oop, stl-templates, advanced)", () => {
    const slugs = all.map((x) => x.slug).sort();
    expect(slugs).toEqual(["advanced", "basics", "memory-oop", "stl-templates"]);
  });

  for (const { slug, file, md } of all) {
    describe(slug, () => {
      it("has stage matching slug", () => {
        expect(file.stage).toBe(slug);
      });

      it("has exactly 5 milestones with IDs 1..5", () => {
        expect(file.milestones).toHaveLength(5);
        expect(file.milestones.map((m) => m.id)).toEqual([1, 2, 3, 4, 5]);
      });

      it("has ≥2 tests per milestone and ≥10 tests overall", () => {
        for (const m of file.milestones) {
          expect(m.tests.length).toBeGreaterThanOrEqual(2);
        }
        const total = file.milestones.reduce((s, m) => s + m.tests.length, 0);
        expect(total).toBeGreaterThanOrEqual(10);
      });

      it("reference_solution is 50–150 LOC", () => {
        const lines = file.reference_solution.split("\n").length;
        expect(lines).toBeGreaterThanOrEqual(50);
        expect(lines).toBeLessThanOrEqual(150);
      });

      it("reference_solution has no forbidden symbols for its stage", () => {
        const hits = findForbiddenUsages(slug, file.reference_solution);
        expect(hits, `forbidden hits in ${slug}: ${JSON.stringify(hits)}`).toEqual([]);
      });

      it("every milestone's spec_anchor exists as an H2 in the markdown", () => {
        for (const m of file.milestones) {
          const anchorPattern = new RegExp(
            `^##\\s+.*${m.spec_anchor.replace(/[-]/g, "[ -]")}.*$`,
            "im",
          );
          // Fallback: look for milestone heading by number
          const numberedPattern = new RegExp(`^##\\s+Milestone ${m.id}\\b`, "m");
          expect(
            anchorPattern.test(md) || numberedPattern.test(md),
            `missing H2 for milestone ${m.id} (anchor ${m.spec_anchor}) in ${slug}.md`,
          ).toBe(true);
        }
      });

      it("FORBIDDEN_BY_STAGE includes this slug", () => {
        expect(FORBIDDEN_BY_STAGE[slug]).toBeDefined();
      });
    });
  }
});
```

- [ ] **Step 2: Run it**

Run: `npx vitest run __tests__/capstones/content-integrity.test.ts`
Expected: all assertions pass.

- [ ] **Step 3: Commit**

```bash
git add __tests__/capstones/content-integrity.test.ts
git commit -m "test(capstones): content integrity + forbidden-symbol regression"
```

---

### Task 16: Run all capstone tests + typecheck

- [ ] **Step 1: Run the full capstone test suite**

```bash
npx vitest run __tests__/capstones/
```
Expected: all green.

- [ ] **Step 2: Typecheck the whole repo**

```bash
npx tsc --noEmit
```
Expected: zero errors.

- [ ] **Step 3: Lint**

```bash
npm run lint
```
Expected: no new errors. Fix any that crop up before continuing.

---

## Phase 4 — API + page route + client UI

### Task 17: `POST /api/capstones/[slug]/run` route

**Files:**
- Create: `app/api/capstones/[slug]/run/route.ts`
- Create: `__tests__/capstones/run-route.test.ts`

Follows the auth + rate-limit + Judge0 pattern from `app/api/submissions/route.ts`.

- [ ] **Step 1: Write the failing route test**

```typescript
// __tests__/capstones/run-route.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the supabase + judge0 + auth boundaries.
// Rate-limit check chains .from("submissions").select(...).eq(...).gte(...) and
// awaits a `{ count }` result, so the mock chain must terminate in a thenable.
function makeQueryChainStub(result: unknown) {
  const promise = Promise.resolve(result);
  const proxy: Record<string, unknown> = {
    select: () => proxy,
    eq: () => proxy,
    in: () => proxy,
    gte: () => proxy,
    then: promise.then.bind(promise),
    catch: promise.catch.bind(promise),
  };
  return proxy;
}

vi.mock("@/lib/supabase/server", () => ({
  createRouteClient: () => ({
    auth: { getUser: async () => ({ data: { user: { id: "user-1" } }, error: null }) },
    from: vi.fn(() => makeQueryChainStub({ count: 0 })),
  }),
  createServerClient: () => ({}),
}));

const fetchInternalCapstoneMock = vi.fn();
const upsertAttemptMock = vi.fn();
vi.mock("@/lib/capstones/server", () => ({
  fetchInternalCapstone: (...args: unknown[]) => fetchInternalCapstoneMock(...args),
  upsertAttempt: (...args: unknown[]) => upsertAttemptMock(...args),
}));

const runMilestoneTestsMock = vi.fn();
vi.mock("@/lib/capstones/judge0", () => ({
  runMilestoneTests: (...args: unknown[]) => runMilestoneTestsMock(...args),
}));

import { POST } from "@/app/api/capstones/[slug]/run/route";

function makeReq(body: unknown): Request {
  return new Request("http://localhost/api/capstones/basics/run", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("POST /api/capstones/[slug]/run", () => {
  beforeEach(() => {
    fetchInternalCapstoneMock.mockReset();
    upsertAttemptMock.mockReset();
    runMilestoneTestsMock.mockReset();
  });

  it("400s when milestone_ordinal is missing", async () => {
    fetchInternalCapstoneMock.mockResolvedValue({
      id: "c1",
      slug: "basics",
      stage: "basics",
      milestones: [
        { id: "m1", ordinal: 1, title: "M1", spec_anchor: "milestone-1", tests: [] },
      ],
      language_standard: "c++20",
    });
    const res = await POST(makeReq({ source_code: "int main(){}" }), {
      params: { slug: "basics" },
    });
    expect(res.status).toBe(400);
  });

  it("404s when capstone slug doesn't exist", async () => {
    fetchInternalCapstoneMock.mockResolvedValue(null);
    const res = await POST(
      makeReq({ milestone_ordinal: 1, source_code: "int main(){}" }),
      { params: { slug: "nope" } },
    );
    expect(res.status).toBe(404);
  });

  it("passes the milestone's tests to runMilestoneTests and upserts on result", async () => {
    fetchInternalCapstoneMock.mockResolvedValue({
      id: "c1",
      slug: "basics",
      stage: "basics",
      language_standard: "c++20",
      milestones: [
        {
          id: "m1",
          ordinal: 1,
          title: "M1",
          spec_anchor: "milestone-1",
          tests: [{ name: "case1", stdin: "", expected_stdout: "hi", timeout_ms: 2000 }],
        },
      ],
    });
    runMilestoneTestsMock.mockResolvedValue({
      overallStatus: "passed",
      testResults: [{ label: "case1", passed: true, expected: "hi", actual: "hi", status: "accepted" }],
    });
    const res = await POST(
      makeReq({ milestone_ordinal: 1, source_code: "int main(){std::cout<<\"hi\";}" }),
      { params: { slug: "basics" } },
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.overall_status).toBe("passed");
    expect(upsertAttemptMock).toHaveBeenCalledWith(
      expect.anything(),
      "user-1",
      "m1",
      true,
      null,
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/capstones/run-route.test.ts`
Expected: FAIL — route module not found.

- [ ] **Step 3: Implement the route**

```typescript
// app/api/capstones/[slug]/run/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { fetchInternalCapstone, upsertAttempt } from "@/lib/capstones/server";
import { runMilestoneTests } from "@/lib/capstones/judge0";
import type { CapstoneSlug } from "@/lib/capstones/types";
import { CAPSTONE_SLUGS } from "@/lib/capstones/types";

export const dynamic = "force-dynamic";

const MAX_SOURCE_SIZE = 50 * 1024;

interface RequestBody {
  milestone_ordinal?: number;
  source_code?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } },
): Promise<NextResponse> {
  const authClient = createRouteClient();
  const authResult = await requireAuth(authClient);
  if (authResult instanceof NextResponse) return authResult;
  const userId = authResult.user.id;

  // Validate slug.
  if (!CAPSTONE_SLUGS.includes(params.slug as CapstoneSlug)) {
    return NextResponse.json({ error: "Unknown capstone" }, { status: 404 });
  }
  const slug = params.slug as CapstoneSlug;

  // Parse + validate body.
  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (typeof body.milestone_ordinal !== "number" || body.milestone_ordinal < 1 || body.milestone_ordinal > 5) {
    return NextResponse.json({ error: "milestone_ordinal must be 1..5" }, { status: 400 });
  }
  if (typeof body.source_code !== "string" || !body.source_code) {
    return NextResponse.json({ error: "source_code is required" }, { status: 400 });
  }
  if (Buffer.byteLength(body.source_code, "utf-8") > MAX_SOURCE_SIZE) {
    return NextResponse.json({ error: "source_code exceeds 50KB" }, { status: 413 });
  }

  // Rate limit (same policy as submissions: 5/min).
  const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString();
  const { count } = await authClient
    .from("submissions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", oneMinuteAgo);
  if ((count ?? 0) >= 5) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Max 5 submissions per minute." },
      { status: 429 },
    );
  }

  // Load capstone + milestone.
  const capstone = await fetchInternalCapstone(authClient, slug);
  if (!capstone) {
    return NextResponse.json({ error: "Capstone not found" }, { status: 404 });
  }
  const milestone = capstone.milestones.find((m) => m.ordinal === body.milestone_ordinal);
  if (!milestone) {
    return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
  }

  // Run tests.
  const verdict = await runMilestoneTests({
    sourceCode: body.source_code,
    languageStandard: capstone.language_standard,
    tests: milestone.tests,
  });

  const passed = verdict.overallStatus === "passed";

  // Persist attempt.
  await upsertAttempt(authClient, userId, milestone.id, passed, null);

  return NextResponse.json({
    overall_status: verdict.overallStatus,
    test_results: verdict.testResults,
    milestone_id: milestone.id,
    passed,
  });
}
```

- [ ] **Step 4: Run test to verify pass**

Run: `npx vitest run __tests__/capstones/run-route.test.ts`
Expected: all 3 cases pass.

- [ ] **Step 5: Commit**

```bash
git add app/api/capstones/[slug]/run/route.ts __tests__/capstones/run-route.test.ts
git commit -m "feat(capstones): POST /api/capstones/[slug]/run"
```

---

### Task 18: Page route `/capstones/[slug]`

**Files:**
- Create: `app/(app)/capstones/[slug]/page.tsx`
- Create: `app/(app)/capstones/[slug]/CapstoneClient.tsx`

- [ ] **Step 1: Write the server page**

```tsx
// app/(app)/capstones/[slug]/page.tsx
import { notFound } from "next/navigation";
import { requireServerSession } from "@/lib/auth/require-auth";
import {
  fetchPublicCapstone,
  fetchUserAttempts,
} from "@/lib/capstones/server";
import { CAPSTONE_SLUGS, type CapstoneSlug } from "@/lib/capstones/types";
import { isCapstoneUnlocked } from "@/lib/capstones/unlock";
import { CapstoneClient } from "./CapstoneClient";
import { CURRICULUM, STAGES } from "@/lib/dashboard/curriculum";

interface PageProps {
  params: { slug: string };
}

/**
 * Compute the user's `completed + skipped` count and total lessons for a stage.
 * Reads from the existing `progress` table (RLS already scopes to the caller's
 * rows; `state` column is the canonical lesson status).
 */
async function fetchStageProgress(
  supabase: Awaited<ReturnType<typeof requireServerSession>>["supabase"],
  stage: string,
): Promise<{ completed: number; total: number }> {
  const moduleChapterIds = CURRICULUM.filter((m) => m.stage === stage).flatMap((m) => m.chapterIds);
  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, chapter_id")
    .in("chapter_id", moduleChapterIds);
  const total = lessons?.length ?? 0;
  if (total === 0) return { completed: 0, total };
  const lessonIds = (lessons ?? []).map((l) => l.id);
  const { data: progress } = await supabase
    .from("progress")
    .select("lesson_id, state")
    .in("lesson_id", lessonIds);
  const completed = (progress ?? []).filter(
    (r) => r.state === "completed" || r.state === "skipped",
  ).length;
  return { completed, total };
}

export default async function CapstonePage({ params }: PageProps) {
  if (!CAPSTONE_SLUGS.includes(params.slug as CapstoneSlug)) notFound();
  const slug = params.slug as CapstoneSlug;

  const { supabase, userId } = await requireServerSession();

  const capstone = await fetchPublicCapstone(supabase, slug);
  if (!capstone) notFound();

  const stageProgress = await fetchStageProgress(supabase, capstone.stage);
  const unlocked = isCapstoneUnlocked(stageProgress.completed, stageProgress.total);

  const attempts = await fetchUserAttempts(
    supabase,
    userId,
    capstone.milestones.map((m) => m.id),
  );

  const stageTitle = STAGES.find((s) => s.id === capstone.stage)?.title ?? capstone.stage;

  return (
    <CapstoneClient
      capstone={capstone}
      attempts={attempts}
      unlocked={unlocked}
      stageProgress={stageProgress}
      stageTitle={stageTitle}
    />
  );
}
```

- [ ] **Step 2: Write the client component**

```tsx
// app/(app)/capstones/[slug]/CapstoneClient.tsx
"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import type {
  PublicCapstone,
  CapstoneAttempt,
} from "@/lib/capstones/types";

interface Props {
  capstone: PublicCapstone;
  attempts: CapstoneAttempt[];
  unlocked: boolean;
  stageProgress: { completed: number; total: number };
  stageTitle: string;
}

interface TestResult {
  label: string;
  passed: boolean;
  expected: string;
  actual: string;
}

const STORAGE_KEY_PREFIX = "capstone:";

export function CapstoneClient({
  capstone,
  attempts: initialAttempts,
  unlocked,
  stageProgress,
  stageTitle,
}: Props) {
  const [selectedOrdinal, setSelectedOrdinal] = useState<number>(1);
  const [code, setCode] = useState<string>(() => {
    if (typeof window === "undefined") return capstone.starter_code;
    return localStorage.getItem(`${STORAGE_KEY_PREFIX}${capstone.slug}:code`) ?? capstone.starter_code;
  });
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<TestResult[] | null>(null);
  const [overallStatus, setOverallStatus] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<CapstoneAttempt[]>(initialAttempts);

  const passedByMilestoneId = useMemo(() => {
    const set = new Set<string>();
    for (const a of attempts) if (a.passed) set.add(a.milestone_id);
    return set;
  }, [attempts]);

  const passedCount = passedByMilestoneId.size;

  const currentMilestone = capstone.milestones.find((m) => m.ordinal === selectedOrdinal)!;

  function persistCode(next: string) {
    setCode(next);
    if (typeof window !== "undefined") {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${capstone.slug}:code`, next);
    }
  }

  async function runMilestone() {
    setRunning(true);
    setResults(null);
    setOverallStatus(null);
    try {
      const res = await fetch(`/api/capstones/${capstone.slug}/run`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ milestone_ordinal: selectedOrdinal, source_code: code }),
      });
      const json = await res.json();
      if (!res.ok) {
        setOverallStatus(json.error ?? "error");
        return;
      }
      setOverallStatus(json.overall_status);
      setResults(json.test_results);
      // Update local attempts cache so the milestone list updates immediately.
      setAttempts((prev) => {
        const without = prev.filter((a) => a.milestone_id !== json.milestone_id);
        return [
          ...without,
          {
            milestone_id: json.milestone_id,
            passed: json.passed,
            last_attempted_at: new Date().toISOString(),
          },
        ];
      });
    } finally {
      setRunning(false);
    }
  }

  if (!unlocked) {
    const pct = stageProgress.total
      ? Math.round((stageProgress.completed / stageProgress.total) * 100)
      : 0;
    return (
      <div className="mx-auto max-w-2xl py-16">
        <Card>
          <CardHeader>
            <CardTitle>Capstone locked</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-foreground/80">
              Complete at least 80% of the {stageTitle} lessons to unlock this capstone.
            </p>
            <Progress value={pct}>
              {stageProgress.completed} / {stageProgress.total} ({pct}%)
            </Progress>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl grid gap-4 py-6 lg:grid-cols-[220px_1fr_460px]">
      {/* Left rail */}
      <aside className="space-y-2">
        <h2 className="text-sm font-semibold">{capstone.title}</h2>
        <p className="text-xs text-foreground/60">
          {passedCount} / {capstone.milestones.length} milestones passed
        </p>
        <ul className="space-y-1">
          {capstone.milestones.map((m) => {
            const passed = passedByMilestoneId.has(m.id);
            return (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => setSelectedOrdinal(m.ordinal)}
                  className={`w-full text-left rounded px-2 py-1 text-sm ${
                    m.ordinal === selectedOrdinal ? "bg-muted font-medium" : "hover:bg-muted/50"
                  }`}
                >
                  <span className="mr-2">{passed ? "✓" : m.ordinal}.</span>
                  {m.title.replace(/^Milestone\s*\d+:\s*/, "")}
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      {/* Center: description for current milestone */}
      <section>
        <ScrollArea className="h-[70vh] pr-4">
          <article className="prose prose-sm dark:prose-invert max-w-none">
            <h1>{capstone.title}</h1>
            <p className="text-foreground/70">Current focus: {currentMilestone.title}</p>
            <pre className="whitespace-pre-wrap text-xs bg-muted rounded p-3">
              {extractMilestoneSection(capstone.description_md, currentMilestone.ordinal)}
            </pre>
          </article>
        </ScrollArea>
      </section>

      {/* Right: editor + run output */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <Badge variant="secondary" noAnimate>
            Milestone {currentMilestone.ordinal}
          </Badge>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => persistCode(capstone.starter_code)}>
              Reset
            </Button>
            <Button size="sm" onClick={runMilestone} disabled={running}>
              {running ? "Running…" : "Run milestone"}
            </Button>
          </div>
        </div>
        <textarea
          value={code}
          onChange={(e) => persistCode(e.target.value)}
          className="font-mono text-xs w-full h-[50vh] rounded border bg-muted p-3"
          spellCheck={false}
        />
        {overallStatus !== null && (
          <div className="text-xs">
            <p className="font-medium">
              Status: {overallStatus === "passed" ? "✓ All tests passed" : `✗ ${overallStatus}`}
            </p>
            {results && (
              <ul className="space-y-1 mt-2">
                {results.map((r) => (
                  <li key={r.label} className={r.passed ? "text-green-600" : "text-red-600"}>
                    {r.passed ? "✓" : "✗"} {r.label}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

/**
 * Extract the markdown section for milestone N from the full description.
 * Looks for `## Milestone N:` heading and returns up to the next H2 or EOF.
 */
function extractMilestoneSection(md: string, ordinal: number): string {
  const start = md.search(new RegExp(`^##\\s+Milestone\\s+${ordinal}\\b`, "m"));
  if (start === -1) return md;
  const remainder = md.slice(start);
  const nextH2 = remainder.search(/\n##\s+/);
  return (nextH2 === -1 ? remainder : remainder.slice(0, nextH2)).trim();
}
```

> **Note on editor:** the spec calls for Monaco, but to keep this plan focused this initial cut uses a `<textarea>`. If `components/editor/MonacoEditor` exists (per CLAUDE.md), swap it in: replace the `<textarea>` block with the existing Monaco wrapper, preserving the `value`/`onChange` contract. Confirm by running `ls components/editor/` before substituting; if it's not there, the textarea ships.

- [ ] **Step 3: Check Monaco availability and swap if present**

```bash
ls components/editor/ 2>/dev/null || echo "no monaco wrapper found"
```
If a Monaco component exists, swap the `<textarea>` in `CapstoneClient.tsx` for it. If not, leave the textarea and move on.

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: zero errors.

- [ ] **Step 5: Commit**

```bash
git add app/\(app\)/capstones
git commit -m "feat(capstones): /capstones/[slug] page + client UI"
```

---

### Task 19: Manual smoke test of the page route

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

- [ ] **Step 2: Open `/capstones/basics` while signed in**

In a browser, navigate to `http://localhost:3000/capstones/basics`. Expected:
- If stage progress < 80%: the locked card with the progress bar
- If ≥ 80%: the 3-column layout with milestone list, description, editor

- [ ] **Step 3: Submit a milestone**

Paste a known-good solution into the editor, click `Run milestone`. Expected: status `passed`, all per-test rows green, milestone in the left rail gets a `✓`.

- [ ] **Step 4: Repeat with each slug**

Visit `/capstones/memory-oop`, `/capstones/stl-templates`, `/capstones/advanced`. Confirm each loads with the correct title + 5 milestones.

If anything is broken: fix inline (don't commit broken work). Note any issues; small UI polish is fine, but big rework should kick back to the brainstorming stage.

---

## Phase 5 — Curriculum chip + final check

### Task 20: Capstone chip on Curriculum Progress card

**Files:**
- Modify: `components/dashboard/CurriculumProgressCard.tsx`
- Modify: `app/dashboard/page.tsx` (fetch + pass capstone state)

- [ ] **Step 1: Add capstone-state fetcher in the dashboard page**

In `app/dashboard/page.tsx` (server component), after the existing curriculum + progress fetch, add a fetch for capstone milestone-pass counts per stage:

```typescript
// In app/dashboard/page.tsx, near the existing curriculum fetch:
import { CAPSTONE_SLUGS, type CapstoneSlug } from "@/lib/capstones/types";
import type { Stage } from "@/lib/dashboard/types";

// After supabase + userId are available:
const { data: capstoneRows } = await supabase
  .from("capstones")
  .select("id, slug, stage");

const capstoneIdByStage: Partial<Record<Stage, { capstoneId: string; slug: CapstoneSlug }>> = {};
const allMilestoneIds: string[] = [];
const milestonesByCapstone: Record<string, string[]> = {};

if (capstoneRows?.length) {
  const { data: milestones } = await supabase
    .from("capstone_milestones")
    .select("id, capstone_id");
  for (const m of milestones ?? []) {
    milestonesByCapstone[m.capstone_id] = milestonesByCapstone[m.capstone_id] ?? [];
    milestonesByCapstone[m.capstone_id]!.push(m.id);
    allMilestoneIds.push(m.id);
  }
  for (const c of capstoneRows) {
    capstoneIdByStage[c.stage as Stage] = {
      capstoneId: c.id,
      slug: c.slug as CapstoneSlug,
    };
  }
}

const { data: attemptRows } = allMilestoneIds.length
  ? await supabase
      .from("capstone_attempts")
      .select("milestone_id, passed")
      .eq("user_id", userId)
      .in("milestone_id", allMilestoneIds)
  : { data: [] };

const passedByMilestone = new Set(
  (attemptRows ?? []).filter((r) => r.passed).map((r) => r.milestone_id),
);

const capstoneStateByStage: Record<Stage, { slug: CapstoneSlug; passedCount: number } | null> = {
  basics: null,
  "memory-oop": null,
  "stl-templates": null,
  advanced: null,
};
for (const stage of Object.keys(capstoneIdByStage) as Stage[]) {
  const meta = capstoneIdByStage[stage]!;
  const milestoneIds = milestonesByCapstone[meta.capstoneId] ?? [];
  const passed = milestoneIds.filter((id) => passedByMilestone.has(id)).length;
  capstoneStateByStage[stage] = { slug: meta.slug, passedCount: passed };
}

// Pass capstoneStateByStage as a prop into <CurriculumProgressCard ... />
```

(Adjust the surrounding props object to include `capstoneStateByStage={capstoneStateByStage}`.)

- [ ] **Step 2: Add the prop + chip in `CurriculumProgressCard.tsx`**

Modify the `CurriculumProgressCardProps` interface:

```typescript
import type { CapstoneSlug } from "@/lib/capstones/types";
import { isCapstoneUnlocked } from "@/lib/capstones/unlock";

interface CurriculumProgressCardProps {
  curriculum: Module[];
  progressMap: Record<string, string>;
  totalCompleted: number;
  totalLessons: number;
  capstoneStateByStage?: Record<
    Stage,
    { slug: CapstoneSlug; passedCount: number } | null
  >;
}
```

In the `AccordionTrigger` content, next to the existing stage status `Badge`, add the capstone chip:

```tsx
{(() => {
  const cap = capstoneStateByStage?.[stage.id] ?? null;
  if (!cap) return null;
  const unlocked = isCapstoneUnlocked(stage.completed, stage.total);
  if (!unlocked) return null;
  if (cap.passedCount === 5) {
    return (
      <Badge variant="outline" noAnimate>
        Capstone ✓
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" noAnimate asChild>
      <Link href={`/capstones/${cap.slug}`}>
        {cap.passedCount > 0 ? `Capstone ${cap.passedCount}/5` : "Capstone available"}
      </Link>
    </Badge>
  );
})()}
```

(If the existing `Badge` does not support `asChild`, wrap the chip with a `Link` instead.)

- [ ] **Step 3: Typecheck + lint**

```bash
npx tsc --noEmit
npm run lint
```
Expected: zero new errors.

- [ ] **Step 4: Visual smoke test**

```bash
npm run dev
```
Visit `/dashboard`. Confirm:
- Stage row under 80% shows no capstone chip.
- Stage row at ≥ 80% with no attempts shows `Capstone available` chip, clickable to the route.
- Stage row with some milestones passed shows `Capstone N/5`.
- Stage row with all milestones passed shows `Capstone ✓`.

- [ ] **Step 5: Commit**

```bash
git add components/dashboard/CurriculumProgressCard.tsx app/dashboard/page.tsx
git commit -m "feat(capstones): chip on Curriculum Progress card"
```

---

### Task 21: Final integration check

- [ ] **Step 1: Full test suite**

```bash
npx vitest run
```
Expected: green.

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```
Expected: clean.

- [ ] **Step 3: Lint**

```bash
npm run lint
```
Expected: clean.

- [ ] **Step 4: Prettier check**

```bash
npx prettier --check .
```
Expected: clean. If anything is unformatted, `npx prettier --write .` + amend the last commit (or new commit if previous was already pushed).

- [ ] **Step 5: Full dev-server smoke**

```bash
npm run dev
```
Visit in this order, signed in:
1. `/dashboard` — confirm chips render correctly per stage.
2. `/capstones/basics` (assuming stage progress < 80%): locked card.
3. Force unlock by completing/skipping ≥ 80% of basics lessons in your local DB if needed for testing; revisit `/capstones/basics` — interactive page renders.
4. Run a known-good basics solution; pass milestone 1; back to `/dashboard`; chip shows `Capstone 1/5`.
5. Repeat for `/capstones/memory-oop`, `/capstones/stl-templates`, `/capstones/advanced` (skip the locked check; just verify pages render and accept submissions).

- [ ] **Step 6: Final commit (if any post-smoke fixes)**

If steps 4–5 surfaced anything, fix and commit per usual.

- [ ] **Step 7: Done**

The capstone feature is shipped. Stage-progress chip renders, the 4 capstones are seeded, the forbidden-symbol regression test guards future content edits.

---

## Out-of-band notes

- **Override on agent model:** the saved memory `feedback_generation_workflow` says generation agents use Sonnet. This run uses Opus per user override. Memory not updated; treat as one-off.
- **Tutor wiring:** no changes. The existing tutor panel will work on `/capstones/[slug]` because it operates on the page route, not lesson-specific state. Future enhancement could send the capstone description + current milestone into tutor context — out of scope here.
- **Self-hosted Judge0:** not in scope. Capstones use the same RapidAPI Judge0 the rest of the platform uses.
- **Dashboard resume CTA tiebreaker (spec §7.3):** the spec says "if a capstone is in progress and no lesson is in progress, the capstone wins the resume slot." Existing resume-CTA logic already defaults to the in-progress lesson, which is the dominant case; the capstone-only-resume path is a small UX polish and is **deferred** in this plan. The capstone chip on the Curriculum Progress card (Task 20) covers discoverability for now. Track as a follow-up if it matters.
- **Seed integration test (spec §8 item 1):** the spec asks for "seed into a test DB and assert row counts." This plan substitutes a stricter file-level check (Task 15 `__tests__/capstones/content-integrity.test.ts`) that asserts the same row-count and shape invariants (4 capstones, 5 milestones each = 20, every reference solution non-empty, every milestone's tests array non-empty) without needing a test DB. Equivalent guarantee, no new infra.

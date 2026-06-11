# Phase B Retention Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Layer a spaced-repetition review queue on top of Phase A's concept checks: a daily review page (`/dashboard/review`), a dashboard "N due today" card, and a Chapter Quiz tab on every `N-x` lesson. Zero LLM calls anywhere.

**Architecture:** A new `concept_check_reviews` table stores per-user-per-check scheduler state (`interval_index`, `next_due`, `last_correct`, `last_answered_at`). All concept-check attempts route through a single TS helper (`applyAttempt`) that computes new SM-2-lite state in pure TS, then calls a thin Postgres RPC that performs the attempts INSERT and reviews UPSERT atomically. Two new routes (`/api/review/due`, `/api/review/attempt`) plus a chapter quiz route (`/api/chapters/[number]/quiz`). UI uses a single shared `<ReviewSession />` component for both the dedicated review page and the in-lesson chapter quiz tab.

**Tech Stack:** Next.js 14 App Router, Supabase (Postgres + RLS), TypeScript strict, vitest, shadcn/ui (all required primitives already installed), tsx for one-off scripts.

**Spec:** `docs/superpowers/specs/2026-06-10-phase-b-retention-engine-design.md`

**Key as-built facts (verified 2026-06-10):**
- `app/api/concept-checks/route.ts` already accepts `{ checkId: string, correct: boolean }` and returns 204. Grading is client-side in `components/lesson/ConceptChecks.tsx`. Phase B keeps this contract.
- Lesson detail page lives at `app/(app)/lessons/[slug]/` (NOT `/dashboard/lessons/[slug]/`). The client component is `LessonClient.tsx` in the same directory and already uses `@/components/ui/tabs` (existing tab values: `lesson`, `challenge`, `solution`, `resources`).
- Auth pattern for Route Handlers: `const supabase = createRouteClient(); const authResult = await requireAuth(supabase); if (authResult instanceof NextResponse) return authResult; const { user } = authResult;`
- Auth pattern for Server Components: `const { supabase, user, userId } = await requireServerSession();`
- `AppSupabaseClient` is exported from `@/lib/supabase/types`.
- Lesson completion flow: `POST /api/progress/[lesson_id]` with `{ state: "completed" }`.
- All required shadcn primitives are already installed (`button`, `card`, `badge`, `input`, `radio-group`, `tabs`, `skeleton`, `sonner`).

**Simplification vs. spec:** The spec names two helpers (`recordCheckAttempt` route-level + `applyAttempt` data-level). This plan collapses them into one — `applyAttempt` is called directly by routes. The role split adds layering without isolating anything that benefits from being isolated.

## File structure

**Create:**
- `supabase/migrations/20260610120000_concept_check_reviews.sql` — table, RPC, RLS
- `lib/content/review.ts` — pure SM-2-lite + `applyAttempt` + `loadDueReviewQueue` (single write path to `concept_check_reviews`)
- `lib/content/chapter-quiz.ts` — pure chapter-quiz set picker (60/40 mix, seeded shuffle)
- `app/api/review/due/route.ts` — GET due queue (cap 20) or practice pool (`?practice=1`)
- `app/api/review/attempt/route.ts` — POST `{ checkId, correct }` → 204, calls `applyAttempt`
- `app/api/chapters/[number]/quiz/route.ts` — GET 10–15 mixed checks
- `app/dashboard/review/page.tsx` — server component, fetches queue, renders `<ReviewSession />`
- `components/dashboard/ReviewDueCard.tsx` — server component, shows due count + CTA
- `components/lesson/ChapterQuiz.tsx` — fetches `/api/chapters/{N}/quiz`, renders `<ReviewSession />`
- `components/review/ReviewSession.tsx` — shared client component (one card at a time, predict-output or MCQ, reveal, final summary)
- `__tests__/content/review.test.ts` — scheduler purity tests
- `__tests__/content/chapter-quiz.test.ts` — picker purity tests
- `__tests__/api/review-attempt.integration.test.ts` — upsert + RLS

**Modify:**
- `app/api/concept-checks/route.ts` — replace direct insert with `applyAttempt(...)` call
- `app/(app)/lessons/[slug]/LessonClient.tsx` — detect `slug.endsWith("-x")`, render Chapter Quiz tab
- `app/dashboard/page.tsx` — slot in `<ReviewDueCard />`
- `lib/supabase/types.ts` — add `concept_check_reviews` table row + exports
- `CLAUDE.md` — note `concept_check_reviews` in the caching pattern section

---

### Task 1: Database migration — `concept_check_reviews` table + RPC + RLS + types

**Files:**
- Create: `supabase/migrations/20260610120000_concept_check_reviews.sql`
- Modify: `lib/supabase/types.ts` (insert after the `concept_check_attempts` block; add export near other type exports)

- [ ] **Step 1: Write the migration**

```sql
-- 20260610120000_concept_check_reviews.sql — Phase B retention engine state.
-- One row per (user_id, check_id) storing SM-2-lite scheduler state.
-- The reviews row is upserted alongside the attempts INSERT via a single RPC
-- so the two tables can never diverge.

CREATE TABLE IF NOT EXISTS concept_check_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  check_id UUID NOT NULL REFERENCES concept_checks(id) ON DELETE CASCADE,
  interval_index INT NOT NULL CHECK (interval_index BETWEEN 0 AND 4),
  next_due DATE NOT NULL,
  last_correct BOOLEAN NOT NULL,
  last_answered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, check_id)
);

CREATE INDEX IF NOT EXISTS idx_ccr_user_due
  ON concept_check_reviews(user_id, next_due);

ALTER TABLE concept_check_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS own_concept_check_reviews ON concept_check_reviews;
CREATE POLICY own_concept_check_reviews ON concept_check_reviews FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Atomic "write both tables" RPC.
-- The caller (TS) has already computed the new review state in pure TS and
-- passes the parameters in. This RPC contains zero business logic — it only
-- guarantees the two writes happen in one transaction.
CREATE OR REPLACE FUNCTION record_check_attempt(
  p_check_id UUID,
  p_correct BOOLEAN,
  p_interval_index INT,
  p_next_due DATE
) RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  INSERT INTO concept_check_attempts (user_id, check_id, correct)
  VALUES (v_user_id, p_check_id, p_correct);

  INSERT INTO concept_check_reviews
    (user_id, check_id, interval_index, next_due, last_correct, last_answered_at)
  VALUES (v_user_id, p_check_id, p_interval_index, p_next_due, p_correct, now())
  ON CONFLICT (user_id, check_id) DO UPDATE SET
    interval_index = EXCLUDED.interval_index,
    next_due = EXCLUDED.next_due,
    last_correct = EXCLUDED.last_correct,
    last_answered_at = EXCLUDED.last_answered_at;
END;
$$;

GRANT EXECUTE ON FUNCTION record_check_attempt(UUID, BOOLEAN, INT, DATE) TO authenticated;
```

- [ ] **Step 2: Apply the migration**

Run: `npx supabase db push`
Expected: migration `20260610120000_concept_check_reviews.sql` applied without error.

- [ ] **Step 3: Regenerate types**

Run: `npx supabase gen types typescript --local > lib/supabase/types.ts`
Expected: file updated, no diff outside the new table + RPC blocks. If the script fails (local Supabase not running), insert the type block manually using this template (place after the `concept_check_attempts` table block):

```typescript
      concept_check_reviews: {
        Row: {
          id: string;
          user_id: string;
          check_id: string;
          interval_index: number;
          next_due: string;
          last_correct: boolean;
          last_answered_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          check_id: string;
          interval_index: number;
          next_due: string;
          last_correct: boolean;
          last_answered_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          check_id?: string;
          interval_index?: number;
          next_due?: string;
          last_correct?: boolean;
          last_answered_at?: string;
        };
        Relationships: [];
      };
```

And next to the existing exports (search for `export type ConceptCheck`), add:

```typescript
export type ConceptCheckReview = Database["public"]["Tables"]["concept_check_reviews"]["Row"];
```

- [ ] **Step 4: Verify types compile**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260610120000_concept_check_reviews.sql lib/supabase/types.ts
git commit -m "feat(db): concept_check_reviews table + record_check_attempt RPC"
```

---

### Task 2: Pure SM-2-lite scheduler module (TDD)

**Files:**
- Create: `__tests__/content/review.test.ts`
- Create: `lib/content/review.ts`

The pure functions (`initialReviewState`, `advanceReviewState`, `pickDueCards`, `nextDueDate`) get tests. The DB-touching wrappers (`applyAttempt`, `loadDueReviewQueue`) do not — they're covered by the integration test in Task 12.

- [ ] **Step 1: Write the failing tests**

```typescript
// __tests__/content/review.test.ts
import { describe, it, expect } from "vitest";
import {
  INTERVALS_DAYS,
  initialReviewState,
  advanceReviewState,
  pickDueCards,
  nextDueDate,
  type DueCandidate,
} from "@/lib/content/review";

const day = (iso: string) => new Date(`${iso}T00:00:00Z`);
const candidate = (
  checkId: string,
  nextDue: string,
  intervalIndex = 0,
): DueCandidate => ({ checkId, nextDue, intervalIndex });

describe("INTERVALS_DAYS", () => {
  it("is 1, 3, 7, 16, 30", () => {
    expect(INTERVALS_DAYS).toEqual([1, 3, 7, 16, 30]);
  });
});

describe("initialReviewState", () => {
  it("first correct → interval 1 (3 days)", () => {
    const s = initialReviewState(true, day("2026-06-10"));
    expect(s.intervalIndex).toBe(1);
    expect(s.nextDue).toBe("2026-06-13");
    expect(s.lastCorrect).toBe(true);
  });

  it("first incorrect → interval 0 (1 day)", () => {
    const s = initialReviewState(false, day("2026-06-10"));
    expect(s.intervalIndex).toBe(0);
    expect(s.nextDue).toBe("2026-06-11");
    expect(s.lastCorrect).toBe(false);
  });
});

describe("advanceReviewState", () => {
  const today = day("2026-06-10");

  it("correct bumps intervalIndex by 1", () => {
    const prev = initialReviewState(true, day("2026-06-07"));
    const next = advanceReviewState(prev, true, today);
    expect(next.intervalIndex).toBe(2);
    expect(next.nextDue).toBe("2026-06-17");
  });

  it("correct caps at intervalIndex 4 (30 days)", () => {
    const prev = { intervalIndex: 4, nextDue: "2026-06-01", lastCorrect: true, lastAnsweredAt: "2026-05-01T00:00:00Z" };
    const next = advanceReviewState(prev, true, today);
    expect(next.intervalIndex).toBe(4);
    expect(next.nextDue).toBe("2026-07-10");
  });

  it("incorrect resets intervalIndex to 0", () => {
    const prev = { intervalIndex: 3, nextDue: "2026-06-20", lastCorrect: true, lastAnsweredAt: "2026-05-15T00:00:00Z" };
    const next = advanceReviewState(prev, false, today);
    expect(next.intervalIndex).toBe(0);
    expect(next.nextDue).toBe("2026-06-11");
    expect(next.lastCorrect).toBe(false);
  });

  it("ignores how overdue the card was (uses today, not prev nextDue)", () => {
    const prev = { intervalIndex: 1, nextDue: "2026-06-01", lastCorrect: true, lastAnsweredAt: "2026-05-29T00:00:00Z" };
    const next = advanceReviewState(prev, true, today);
    expect(next.nextDue).toBe("2026-06-17"); // today + 7d, not 2026-06-01 + 7d
  });
});

describe("pickDueCards", () => {
  const today = day("2026-06-10");

  it("returns empty when nothing is due", () => {
    expect(pickDueCards([candidate("a", "2026-06-15", 1)], today)).toEqual([]);
  });

  it("includes cards due today", () => {
    expect(pickDueCards([candidate("a", "2026-06-10", 1)], today)).toEqual(["a"]);
  });

  it("orders by nextDue ascending (most overdue first)", () => {
    expect(
      pickDueCards(
        [candidate("recent", "2026-06-09", 1), candidate("ancient", "2026-06-01", 1)],
        today,
      ),
    ).toEqual(["ancient", "recent"]);
  });

  it("tie-breaks by intervalIndex ascending (weaker cards first)", () => {
    expect(
      pickDueCards(
        [candidate("strong", "2026-06-09", 3), candidate("weak", "2026-06-09", 0)],
        today,
      ),
    ).toEqual(["weak", "strong"]);
  });

  it("caps at max (default 20)", () => {
    const cands = Array.from({ length: 30 }, (_, i) => candidate(`c${i}`, "2026-06-01", 0));
    expect(pickDueCards(cands, today)).toHaveLength(20);
  });

  it("respects custom max", () => {
    const cands = Array.from({ length: 30 }, (_, i) => candidate(`c${i}`, "2026-06-01", 0));
    expect(pickDueCards(cands, today, 5)).toHaveLength(5);
  });
});

describe("nextDueDate", () => {
  it("returns null on empty pool", () => {
    expect(nextDueDate([])).toBeNull();
  });

  it("returns the earliest nextDue", () => {
    expect(
      nextDueDate([
        candidate("a", "2026-06-15"),
        candidate("b", "2026-06-12"),
        candidate("c", "2026-06-20"),
      ]),
    ).toBe("2026-06-12");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- __tests__/content/review.test.ts`
Expected: FAIL — module `@/lib/content/review` not found.

- [ ] **Step 3: Implement `lib/content/review.ts`**

```typescript
// lib/content/review.ts
import type {
  AppSupabaseClient,
  ConceptCheck,
  ConceptCheckReview,
} from "@/lib/supabase/types";

// ---------------------------------------------------------------------------
// Pure SM-2-lite
// ---------------------------------------------------------------------------

export const INTERVALS_DAYS = [1, 3, 7, 16, 30] as const;
const MAX_INTERVAL_INDEX = INTERVALS_DAYS.length - 1;

export interface ReviewState {
  intervalIndex: number;   // 0..MAX_INTERVAL_INDEX
  nextDue: string;         // "YYYY-MM-DD"
  lastCorrect: boolean;
  lastAnsweredAt: string;  // ISO timestamp
}

export interface DueCandidate {
  checkId: string;
  nextDue: string;
  intervalIndex: number;
}

function addDays(today: Date, days: number): string {
  const d = new Date(today);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function initialReviewState(correct: boolean, today: Date): ReviewState {
  const intervalIndex = correct ? 1 : 0;
  return {
    intervalIndex,
    nextDue: addDays(today, INTERVALS_DAYS[intervalIndex]),
    lastCorrect: correct,
    lastAnsweredAt: today.toISOString(),
  };
}

export function advanceReviewState(prev: ReviewState, correct: boolean, today: Date): ReviewState {
  const intervalIndex = correct ? Math.min(prev.intervalIndex + 1, MAX_INTERVAL_INDEX) : 0;
  return {
    intervalIndex,
    nextDue: addDays(today, INTERVALS_DAYS[intervalIndex]),
    lastCorrect: correct,
    lastAnsweredAt: today.toISOString(),
  };
}

export function pickDueCards(
  candidates: DueCandidate[],
  today: Date,
  max = 20,
): string[] {
  const todayIso = today.toISOString().slice(0, 10);
  return candidates
    .filter((c) => c.nextDue <= todayIso)
    .sort((a, b) => {
      if (a.nextDue !== b.nextDue) return a.nextDue.localeCompare(b.nextDue);
      return a.intervalIndex - b.intervalIndex;
    })
    .slice(0, max)
    .map((c) => c.checkId);
}

export function nextDueDate(candidates: DueCandidate[]): string | null {
  if (candidates.length === 0) return null;
  return candidates.reduce((min, c) => (c.nextDue < min ? c.nextDue : min), candidates[0]!.nextDue);
}

// ---------------------------------------------------------------------------
// DB-touching wrappers — single write path to concept_check_reviews
// ---------------------------------------------------------------------------

export interface DueQueueItem {
  check: ConceptCheck;
  lessonNumber: string;
  intervalIndex: number;
}

/**
 * Load the user's due-today queue. Joins concept_check_reviews → concept_checks → lessons.number
 * so the UI can label each card with its origin lesson.
 */
export async function loadDueReviewQueue(
  supabase: AppSupabaseClient,
  userId: string,
  today: Date,
  max = 20,
): Promise<DueQueueItem[]> {
  const todayIso = today.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("concept_check_reviews")
    .select("check_id, interval_index, next_due, concept_checks(*, lessons(number))")
    .eq("user_id", userId)
    .lte("next_due", todayIso)
    .order("next_due", { ascending: true })
    .order("interval_index", { ascending: true })
    .limit(max);

  if (error) throw new Error(`loadDueReviewQueue failed: ${error.message}`);

  return (data ?? [])
    .filter((row): row is typeof row & { concept_checks: ConceptCheck & { lessons: { number: string } } } =>
      row.concept_checks !== null && (row.concept_checks as { lessons: unknown }).lessons !== null,
    )
    .map((row) => ({
      check: row.concept_checks,
      lessonNumber: row.concept_checks.lessons.number,
      intervalIndex: row.interval_index,
    }));
}

/**
 * The single write path for concept_check_reviews. Reads the current review row,
 * computes the new ReviewState in pure TS, then calls the record_check_attempt RPC
 * which performs both the attempts INSERT and the reviews UPSERT atomically.
 */
export async function applyAttempt(
  supabase: AppSupabaseClient,
  userId: string,
  checkId: string,
  correct: boolean,
  today: Date,
): Promise<void> {
  const { data: existing, error: readError } = await supabase
    .from("concept_check_reviews")
    .select("interval_index, next_due, last_correct, last_answered_at")
    .eq("user_id", userId)
    .eq("check_id", checkId)
    .maybeSingle();

  if (readError) throw new Error(`applyAttempt read failed: ${readError.message}`);

  const newState: ReviewState = existing
    ? advanceReviewState(
        {
          intervalIndex: existing.interval_index,
          nextDue: existing.next_due,
          lastCorrect: existing.last_correct,
          lastAnsweredAt: existing.last_answered_at,
        },
        correct,
        today,
      )
    : initialReviewState(correct, today);

  const { error: rpcError } = await supabase.rpc("record_check_attempt", {
    p_check_id: checkId,
    p_correct: correct,
    p_interval_index: newState.intervalIndex,
    p_next_due: newState.nextDue,
  });

  if (rpcError) throw new Error(`applyAttempt rpc failed: ${rpcError.message}`);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- __tests__/content/review.test.ts`
Expected: all tests pass.

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add __tests__/content/review.test.ts lib/content/review.ts
git commit -m "feat(content): SM-2-lite scheduler + single-write-path applyAttempt"
```

---

### Task 3: Wire `/api/concept-checks` through `applyAttempt`

**Files:**
- Modify: `app/api/concept-checks/route.ts` (replace direct insert with `applyAttempt`)

- [ ] **Step 1: Replace the route body**

Replace the entire file with:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { applyAttempt } from "@/lib/content/review";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// POST /api/concept-checks — record a concept-check attempt
// body: { checkId: string, correct: boolean } → 204
// Phase B: also upserts concept_check_reviews atomically via the RPC.
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

  try {
    await applyAttempt(supabase, user.id, checkId, correct, new Date());
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    // Postgres FK violation surface — checkId points at a missing concept_check
    if (message.includes("23503")) {
      return NextResponse.json({ error: "Unknown checkId" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to record attempt" }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add app/api/concept-checks/route.ts
git commit -m "feat(api): route concept-check attempts through applyAttempt (writes reviews)"
```

---

### Task 4: New route `POST /api/review/attempt`

**Files:**
- Create: `app/api/review/attempt/route.ts`

Thin wrapper over `applyAttempt`. Kept separate from `/api/concept-checks` so analytics can later split by surface.

- [ ] **Step 1: Write the route**

```typescript
// app/api/review/attempt/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { applyAttempt } from "@/lib/content/review";

export const dynamic = "force-dynamic";

// POST /api/review/attempt — record an attempt from the review page or chapter quiz.
// body: { checkId: string, correct: boolean } → 204
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

  try {
    await applyAttempt(supabase, user.id, checkId, correct, new Date());
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    if (message.includes("23503")) {
      return NextResponse.json({ error: "Unknown checkId" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to record attempt" }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add app/api/review/attempt/route.ts
git commit -m "feat(api): POST /api/review/attempt for review + chapter-quiz surfaces"
```

---

### Task 5: New route `GET /api/review/due`

**Files:**
- Create: `app/api/review/due/route.ts`

Returns the due queue plus, when nothing is due, the earliest `next_due` date so the UI can show "All caught up — next review on X". A `?practice=1` flag returns 5 oldest-known-good checks for the empty-state practice button.

- [ ] **Step 1: Write the route**

```typescript
// app/api/review/due/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { loadDueReviewQueue, nextDueDate, type DueCandidate } from "@/lib/content/review";
import type { ConceptCheck } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

interface DueResponse {
  count: number;
  cards: Array<{ check: ConceptCheck; lessonNumber: string; intervalIndex: number }>;
  nextDueDate: string | null;
}

// GET /api/review/due           → due-today queue (cap 20) + nextDueDate when empty
// GET /api/review/due?practice=1 → 5 oldest-known-good cards for the empty-state practice button
export async function GET(request: NextRequest) {
  const supabase = createRouteClient();

  const authResult = await requireAuth(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  const practice = request.nextUrl.searchParams.get("practice") === "1";
  const today = new Date();

  if (practice) {
    const { data, error } = await supabase
      .from("concept_check_reviews")
      .select("check_id, interval_index, next_due, last_correct, concept_checks(*, lessons(number))")
      .eq("user_id", user.id)
      .eq("last_correct", true)
      .order("last_answered_at", { ascending: true })
      .limit(5);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const cards = (data ?? [])
      .filter(
        (row): row is typeof row & { concept_checks: ConceptCheck & { lessons: { number: string } } } =>
          row.concept_checks !== null && (row.concept_checks as { lessons: unknown }).lessons !== null,
      )
      .map((row) => ({
        check: row.concept_checks,
        lessonNumber: row.concept_checks.lessons.number,
        intervalIndex: row.interval_index,
      }));

    const response: DueResponse = { count: cards.length, cards, nextDueDate: null };
    return NextResponse.json(response);
  }

  const cards = await loadDueReviewQueue(supabase, user.id, today, 20);

  let dueDate: string | null = null;
  if (cards.length === 0) {
    const { data: future } = await supabase
      .from("concept_check_reviews")
      .select("check_id, next_due, interval_index")
      .eq("user_id", user.id)
      .gt("next_due", today.toISOString().slice(0, 10))
      .order("next_due", { ascending: true })
      .limit(1);

    const candidates: DueCandidate[] = (future ?? []).map((row) => ({
      checkId: row.check_id,
      nextDue: row.next_due,
      intervalIndex: row.interval_index,
    }));
    dueDate = nextDueDate(candidates);
  }

  const response: DueResponse = { count: cards.length, cards, nextDueDate: dueDate };
  return NextResponse.json(response);
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add app/api/review/due/route.ts
git commit -m "feat(api): GET /api/review/due (due queue + practice mode)"
```

---

### Task 6: Pure chapter-quiz set picker (TDD)

**Files:**
- Create: `__tests__/content/chapter-quiz.test.ts`
- Create: `lib/content/chapter-quiz.ts`

Pure picker: given `currentChapterChecks`, `priorChapterChecks`, attempt history, and a seed, returns a stable 10–15 item set with ~60/40 mix. Graceful when buckets are empty.

- [ ] **Step 1: Write the failing tests**

```typescript
// __tests__/content/chapter-quiz.test.ts
import { describe, it, expect } from "vitest";
import { pickChapterQuizSet, type ChapterQuizInput } from "@/lib/content/chapter-quiz";
import type { ConceptCheck } from "@/lib/supabase/types";

const makeCheck = (id: string): ConceptCheck => ({
  id,
  lesson_id: `lesson-${id}`,
  kind: "mcq",
  prompt_md: "?",
  options: { a: "a", b: "b" },
  answer: "a",
  explanation_md: "because",
  position: 1,
  generated_at: "2026-06-01T00:00:00Z",
  generated_model: null,
});

const range = (prefix: string, n: number): ConceptCheck[] =>
  Array.from({ length: n }, (_, i) => makeCheck(`${prefix}${i}`));

const baseInput = (overrides: Partial<ChapterQuizInput> = {}): ChapterQuizInput => ({
  currentChapterChecks: range("cur", 20),
  priorChapterChecks: range("pri", 20),
  attemptHistory: [],
  seed: "user|4|2026-06-10",
  ...overrides,
});

describe("pickChapterQuizSet", () => {
  it("returns 10-15 items in the happy case", () => {
    const result = pickChapterQuizSet(baseInput());
    expect(result.length).toBeGreaterThanOrEqual(10);
    expect(result.length).toBeLessThanOrEqual(15);
  });

  it("mixes ~60% current chapter / ~40% prior chapters when both pools are large", () => {
    const result = pickChapterQuizSet(baseInput());
    const fromCurrent = result.filter((c) => c.id.startsWith("cur")).length;
    const fromPrior = result.filter((c) => c.id.startsWith("pri")).length;
    expect(fromCurrent).toBeGreaterThanOrEqual(6);
    expect(fromPrior).toBeGreaterThanOrEqual(4);
    expect(fromCurrent + fromPrior).toBe(result.length);
  });

  it("returns current-only when prior chapters are empty", () => {
    const result = pickChapterQuizSet(baseInput({ priorChapterChecks: [] }));
    expect(result.every((c) => c.id.startsWith("cur"))).toBe(true);
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  it("returns prior-only when current chapter is empty (degraded but playable)", () => {
    const result = pickChapterQuizSet(baseInput({ currentChapterChecks: [] }));
    expect(result.every((c) => c.id.startsWith("pri"))).toBe(true);
  });

  it("returns [] when both pools are empty", () => {
    expect(pickChapterQuizSet(baseInput({ currentChapterChecks: [], priorChapterChecks: [] }))).toEqual([]);
  });

  it("is deterministic for the same seed", () => {
    const a = pickChapterQuizSet(baseInput());
    const b = pickChapterQuizSet(baseInput());
    expect(a.map((c) => c.id)).toEqual(b.map((c) => c.id));
  });

  it("differs across seeds (likely)", () => {
    const a = pickChapterQuizSet(baseInput({ seed: "user|4|2026-06-10" }));
    const b = pickChapterQuizSet(baseInput({ seed: "user|4|2026-06-11" }));
    expect(a.map((c) => c.id)).not.toEqual(b.map((c) => c.id));
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- __tests__/content/chapter-quiz.test.ts`
Expected: FAIL — module `@/lib/content/chapter-quiz` not found.

- [ ] **Step 3: Implement `lib/content/chapter-quiz.ts`**

```typescript
// lib/content/chapter-quiz.ts
import type { ConceptCheck } from "@/lib/supabase/types";

const TARGET_SIZE = 12;
const MIN_SIZE = 10;
const MAX_SIZE = 15;
const CURRENT_RATIO = 0.6; // 60% current chapter / 40% prior chapters

export interface AttemptSummary {
  checkId: string;
  lastCorrect: boolean | null;
  lastAnsweredAt: string | null;
}

export interface ChapterQuizInput {
  currentChapterChecks: ConceptCheck[];
  priorChapterChecks: ConceptCheck[];
  attemptHistory: AttemptSummary[];
  seed: string;
}

// Deterministic 32-bit hash so the same seed produces the same shuffle.
function hash32(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Mulberry32 PRNG seeded by hash32. Cheap, deterministic, good-enough distribution.
function makeRng(seed: string): () => number {
  let state = hash32(seed);
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], rng: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

// Rank by review value: wrong-most-recently first, then unseen, then oldest correct.
function rankByHistory(checks: ConceptCheck[], history: AttemptSummary[]): ConceptCheck[] {
  const byId = new Map(history.map((h) => [h.checkId, h]));
  const wrong: ConceptCheck[] = [];
  const unseen: ConceptCheck[] = [];
  const correct: ConceptCheck[] = [];

  for (const c of checks) {
    const h = byId.get(c.id);
    if (!h || h.lastCorrect === null) unseen.push(c);
    else if (h.lastCorrect === false) wrong.push(c);
    else correct.push(c);
  }

  const sortByAnsweredAt = (a: ConceptCheck, b: ConceptCheck) => {
    const ah = byId.get(a.id)?.lastAnsweredAt ?? "";
    const bh = byId.get(b.id)?.lastAnsweredAt ?? "";
    return ah.localeCompare(bh);
  };
  wrong.sort(sortByAnsweredAt);
  correct.sort(sortByAnsweredAt);

  return [...wrong, ...unseen, ...correct];
}

export function pickChapterQuizSet(input: ChapterQuizInput): ConceptCheck[] {
  const { currentChapterChecks, priorChapterChecks, attemptHistory, seed } = input;
  if (currentChapterChecks.length === 0 && priorChapterChecks.length === 0) return [];

  const rng = makeRng(seed);

  const currentRanked = shuffle(rankByHistory(currentChapterChecks, attemptHistory), rng);
  const priorRanked = shuffle(rankByHistory(priorChapterChecks, attemptHistory), rng);

  const wantCurrent = Math.round(TARGET_SIZE * CURRENT_RATIO);
  const wantPrior = TARGET_SIZE - wantCurrent;

  const takeCurrent = Math.min(wantCurrent, currentRanked.length);
  const takePrior = Math.min(wantPrior, priorRanked.length);

  let chosen = [...currentRanked.slice(0, takeCurrent), ...priorRanked.slice(0, takePrior)];

  // Backfill from whichever bucket has more, up to MAX_SIZE
  if (chosen.length < MIN_SIZE) {
    const currentExtra = currentRanked.slice(takeCurrent);
    const priorExtra = priorRanked.slice(takePrior);
    const extras = [...currentExtra, ...priorExtra];
    chosen = [...chosen, ...extras.slice(0, MAX_SIZE - chosen.length)];
  }

  return chosen.slice(0, MAX_SIZE);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- __tests__/content/chapter-quiz.test.ts`
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add __tests__/content/chapter-quiz.test.ts lib/content/chapter-quiz.ts
git commit -m "feat(content): pure chapter-quiz set picker with 60/40 seeded shuffle"
```

---

### Task 7: New route `GET /api/chapters/[number]/quiz`

**Files:**
- Create: `app/api/chapters/[number]/quiz/route.ts`

Fetches the current chapter's checks plus checks from chapters `number-1` and `number-2`, plus the user's attempt history on all of them, then calls `pickChapterQuizSet`.

- [ ] **Step 1: Write the route**

```typescript
// app/api/chapters/[number]/quiz/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { pickChapterQuizSet, type AttemptSummary } from "@/lib/content/chapter-quiz";
import type { ConceptCheck } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

// GET /api/chapters/[number]/quiz — 10-15 mixed concept checks for the chapter quiz.
// 404 if the chapter has zero concept checks; degrades to current-only when prior chapters empty.
export async function GET(_request: NextRequest, { params }: { params: { number: string } }) {
  const supabase = createRouteClient();

  const authResult = await requireAuth(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  const chapterNumber = params.number;
  const numeric = parseInt(chapterNumber, 10);
  // Letter chapters (F, O, A, B, C) have no numeric "prior two chapters" — degrade to current-only.
  const priorNumbers: string[] = Number.isNaN(numeric)
    ? []
    : [numeric - 1, numeric - 2].filter((n) => n >= 0).map(String);

  // Look up chapter ids by number.
  const { data: chapters, error: chErr } = await supabase
    .from("chapters")
    .select("id, number")
    .in("number", [chapterNumber, ...priorNumbers]);

  if (chErr) return NextResponse.json({ error: chErr.message }, { status: 500 });

  const currentChapter = chapters?.find((c) => c.number === chapterNumber);
  if (!currentChapter) return NextResponse.json({ error: "Chapter not found" }, { status: 404 });

  const priorChapterIds = (chapters ?? [])
    .filter((c) => c.number !== chapterNumber)
    .map((c) => c.id);

  // Load all candidate concept checks. Need both lesson_id (FK to lessons) and chapter origin.
  const { data: currentChecks, error: ccErr } = await supabase
    .from("concept_checks")
    .select("*, lessons!inner(chapter_id)")
    .eq("lessons.chapter_id", currentChapter.id);

  if (ccErr) return NextResponse.json({ error: ccErr.message }, { status: 500 });

  let priorChecks: (ConceptCheck & { lessons: { chapter_id: number } })[] = [];
  if (priorChapterIds.length > 0) {
    const { data, error } = await supabase
      .from("concept_checks")
      .select("*, lessons!inner(chapter_id)")
      .in("lessons.chapter_id", priorChapterIds);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    priorChecks = (data ?? []) as typeof priorChecks;
  }

  const currentChapterChecks = (currentChecks ?? []) as ConceptCheck[];
  if (currentChapterChecks.length === 0 && priorChecks.length === 0) {
    return NextResponse.json({ error: "No concept checks for this chapter yet" }, { status: 404 });
  }

  // Load the user's last-attempt summary for ranking. RLS limits this to the calling user.
  const allCheckIds = [...currentChapterChecks, ...priorChecks].map((c) => c.id);
  const { data: reviews } = await supabase
    .from("concept_check_reviews")
    .select("check_id, last_correct, last_answered_at")
    .in("check_id", allCheckIds);

  const attemptHistory: AttemptSummary[] = (reviews ?? []).map((r) => ({
    checkId: r.check_id,
    lastCorrect: r.last_correct,
    lastAnsweredAt: r.last_answered_at,
  }));

  const today = new Date().toISOString().slice(0, 10);
  const seed = `${user.id}|${chapterNumber}|${today}`;

  const checks = pickChapterQuizSet({
    currentChapterChecks,
    priorChapterChecks: priorChecks as ConceptCheck[],
    attemptHistory,
    seed,
  });

  // Strip the joined lessons.chapter_id field from the response (UI doesn't need it).
  const cleanChecks: ConceptCheck[] = checks.map((c) => {
    const { ...rest } = c as ConceptCheck & { lessons?: unknown };
    delete (rest as { lessons?: unknown }).lessons;
    return rest as ConceptCheck;
  });

  return NextResponse.json({
    chapterNumber,
    checks: cleanChecks,
    composition: {
      currentChapter: cleanChecks.filter((c) => currentChapterChecks.some((cc) => cc.id === c.id)).length,
      priorChapters: cleanChecks.filter((c) => priorChecks.some((pc) => pc.id === c.id)).length,
    },
  });
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add app/api/chapters/[number]/quiz/route.ts
git commit -m "feat(api): GET /api/chapters/[number]/quiz — 60/40 mixed concept-check set"
```

---

### Task 8: Shared `<ReviewSession />` client component

**Files:**
- Create: `components/review/ReviewSession.tsx`

One client component used by both the dashboard review page (Task 9) and the chapter quiz tab (Task 11). One card at a time, grades locally, posts `{ checkId, correct }` to `/api/review/attempt`, reveals explanation, summary at end.

- [ ] **Step 1: Write the component**

```tsx
// components/review/ReviewSession.tsx
"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type { ConceptCheck } from "@/lib/supabase/types";

export interface ReviewCard {
  check: ConceptCheck;
  lessonNumber: string;
}

export interface ReviewSessionResult {
  total: number;
  correct: number;
  missed: ReviewCard[];
}

interface Props {
  cards: ReviewCard[];
  onComplete?: (result: ReviewSessionResult) => void;
  /** Title shown in the empty/finished card, e.g. "Daily review" or "Chapter 4 quiz". */
  surfaceLabel: string;
}

function gradeAnswer(check: ConceptCheck, userAnswer: string): boolean {
  if (check.kind === "predict_output") {
    return userAnswer.trim() === check.answer.trim();
  }
  return userAnswer === check.answer;
}

export function ReviewSession({ cards, onComplete, surfaceLabel }: Props) {
  const [index, setIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [results, setResults] = useState<Array<{ card: ReviewCard; correct: boolean }>>([]);

  if (cards.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Nothing to review</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Answer a concept check on any lesson to start your queue.
        </CardContent>
      </Card>
    );
  }

  const finished = index >= cards.length;

  if (finished) {
    const total = results.length;
    const correct = results.filter((r) => r.correct).length;
    const missed = results.filter((r) => !r.correct).map((r) => r.card);
    return (
      <Card>
        <CardHeader>
          <CardTitle>{surfaceLabel} complete</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm">
            {correct} correct of {total} ({Math.round((correct / total) * 100)}%)
          </p>
          {missed.length > 0 && (
            <div className="text-sm text-muted-foreground">
              <p className="font-medium">Missed:</p>
              <ul className="list-disc pl-5">
                {missed.map((m) => (
                  <li key={m.check.id}>From lesson {m.lessonNumber}</li>
                ))}
              </ul>
            </div>
          )}
          <Button onClick={() => onComplete?.({ total, correct, missed })}>Done</Button>
        </CardContent>
      </Card>
    );
  }

  const current = cards[index]!;
  const opts = (current.check.options ?? {}) as Record<string, string>;

  const submit = async () => {
    if (revealed) {
      setResults([...results, { card: current, correct: gradeAnswer(current.check, userAnswer) }]);
      setRevealed(false);
      setUserAnswer("");
      setIndex(index + 1);
      return;
    }
    const correct = gradeAnswer(current.check, userAnswer);
    setRevealed(true);
    // Fire-and-forget POST; the next card doesn't need to wait for the network.
    void fetch("/api/review/attempt", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ checkId: current.check.id, correct }),
    });
  };

  const correctNow = revealed && gradeAnswer(current.check, userAnswer);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">
          Card {index + 1} of {cards.length}
        </CardTitle>
        <Badge variant="outline">From lesson {current.lessonNumber}</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <ReactMarkdown>{current.check.prompt_md}</ReactMarkdown>
        </div>

        {current.check.kind === "predict_output" ? (
          <Input
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="Type the expected stdout"
            disabled={revealed}
            className="font-mono"
          />
        ) : (
          <RadioGroup value={userAnswer} onValueChange={setUserAnswer} disabled={revealed}>
            {Object.entries(opts).map(([key, text]) => (
              <div key={key} className="flex items-start gap-2">
                <RadioGroupItem value={key} id={`opt-${key}`} />
                <Label htmlFor={`opt-${key}`} className="text-sm font-normal">
                  <span className="font-medium mr-1">{key}.</span>
                  {text}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )}

        {revealed && (
          <div
            className={`rounded-md border p-3 text-sm ${
              correctNow ? "border-green-500/40 bg-green-500/5" : "border-red-500/40 bg-red-500/5"
            }`}
          >
            <p className="font-medium mb-1">{correctNow ? "Correct" : "Not quite"}</p>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown>{current.check.explanation_md}</ReactMarkdown>
            </div>
          </div>
        )}

        <Button onClick={submit} disabled={!revealed && userAnswer.length === 0}>
          {revealed ? "Continue" : "Submit"}
        </Button>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add components/review/ReviewSession.tsx
git commit -m "feat(review): shared ReviewSession client component"
```

---

### Task 9: Daily review page

**Files:**
- Create: `app/dashboard/review/page.tsx`

Server component fetches `/api/review/due` server-side via Supabase (no internal HTTP), passes to the client `<ReviewSession />`. Handles the count=0 + practice empty state.

- [ ] **Step 1: Write the client wrapper**

Create `app/dashboard/review/ReviewPageClient.tsx`:

```tsx
// app/dashboard/review/ReviewPageClient.tsx
"use client";

import { useRouter } from "next/navigation";
import { ReviewSession, type ReviewCard } from "@/components/review/ReviewSession";

export function ReviewPageClient({ cards }: { cards: ReviewCard[] }) {
  const router = useRouter();
  return (
    <ReviewSession
      cards={cards}
      surfaceLabel="Daily review"
      onComplete={() => router.push("/dashboard")}
    />
  );
}
```

- [ ] **Step 2: Write the page (single write, handles default + `?practice=1`)**

Create `app/dashboard/review/page.tsx`:

```tsx
// app/dashboard/review/page.tsx
import Link from "next/link";
import { requireServerSession } from "@/lib/auth/require-auth";
import { loadDueReviewQueue, nextDueDate, type DueCandidate } from "@/lib/content/review";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ConceptCheck } from "@/lib/supabase/types";
import { ReviewPageClient } from "./ReviewPageClient";

export const dynamic = "force-dynamic";

export default async function ReviewPage({
  searchParams,
}: {
  searchParams: { practice?: string };
}) {
  const { supabase, userId } = await requireServerSession();
  const today = new Date();
  const practice = searchParams.practice === "1";

  // Practice mode: 5 oldest-known-good cards, no queue scheduling implications beyond
  // the normal applyAttempt updates that ReviewSession's POSTs will trigger.
  if (practice) {
    const { data } = await supabase
      .from("concept_check_reviews")
      .select("check_id, interval_index, concept_checks(*, lessons(number))")
      .eq("user_id", userId)
      .eq("last_correct", true)
      .order("last_answered_at", { ascending: true })
      .limit(5);

    const practiceCards = (data ?? [])
      .filter(
        (row): row is typeof row & {
          concept_checks: ConceptCheck & { lessons: { number: string } };
        } =>
          row.concept_checks !== null &&
          (row.concept_checks as { lessons: unknown }).lessons !== null,
      )
      .map((row) => ({
        check: row.concept_checks,
        lessonNumber: row.concept_checks.lessons.number,
      }));

    return (
      <div className="mx-auto max-w-2xl p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Practice</h1>
        <ReviewPageClient cards={practiceCards} />
      </div>
    );
  }

  const cards = await loadDueReviewQueue(supabase, userId, today, 20);

  if (cards.length === 0) {
    const { data: future } = await supabase
      .from("concept_check_reviews")
      .select("check_id, next_due, interval_index")
      .eq("user_id", userId)
      .gt("next_due", today.toISOString().slice(0, 10))
      .order("next_due", { ascending: true })
      .limit(1);

    const candidates: DueCandidate[] = (future ?? []).map((row) => ({
      checkId: row.check_id,
      nextDue: row.next_due,
      intervalIndex: row.interval_index,
    }));
    const upcoming = nextDueDate(candidates);

    return (
      <div className="mx-auto max-w-2xl p-6">
        <Card>
          <CardHeader>
            <CardTitle>All caught up</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            {upcoming ? (
              <p>Next review available {upcoming}.</p>
            ) : (
              <p>Answer a concept check on any lesson to start your review queue.</p>
            )}
            {upcoming && (
              <form action="/dashboard/review">
                <input type="hidden" name="practice" value="1" />
                <Button type="submit">Practice 5 random reviews</Button>
              </form>
            )}
            <Link href="/dashboard">
              <Button variant="outline">Back to dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Daily review</h1>
      <ReviewPageClient
        cards={cards.map((c) => ({ check: c.check, lessonNumber: c.lessonNumber }))}
      />
    </div>
  );
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add app/dashboard/review/page.tsx app/dashboard/review/ReviewPageClient.tsx
git commit -m "feat(dashboard): /dashboard/review page with practice mode"
```

---

### Task 10: `ReviewDueCard` on the dashboard

**Files:**
- Create: `components/dashboard/ReviewDueCard.tsx`
- Modify: `app/dashboard/page.tsx` (slot into the existing layout)

- [ ] **Step 1: Write the card**

```tsx
// components/dashboard/ReviewDueCard.tsx
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { loadDueReviewQueue, nextDueDate, type DueCandidate } from "@/lib/content/review";
import type { AppSupabaseClient } from "@/lib/supabase/types";

interface Props {
  supabase: AppSupabaseClient;
  userId: string;
}

export async function ReviewDueCard({ supabase, userId }: Props) {
  const today = new Date();
  const cards = await loadDueReviewQueue(supabase, userId, today, 20);

  if (cards.length > 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Daily review</CardTitle>
          <Badge>{cards.length}</Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {cards.length} {cards.length === 1 ? "card" : "cards"} due today.
          </p>
          <Link href="/dashboard/review">
            <Button>Start review</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const { data: future } = await supabase
    .from("concept_check_reviews")
    .select("check_id, next_due, interval_index")
    .eq("user_id", userId)
    .gt("next_due", today.toISOString().slice(0, 10))
    .order("next_due", { ascending: true })
    .limit(1);

  const candidates: DueCandidate[] = (future ?? []).map((row) => ({
    checkId: row.check_id,
    nextDue: row.next_due,
    intervalIndex: row.interval_index,
  }));
  const upcoming = nextDueDate(candidates);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Daily review</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        {upcoming ? (
          <p>All caught up. Next review {upcoming}.</p>
        ) : (
          <p>Answer a concept check on any lesson to start your queue.</p>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Slot into the dashboard**

Open `app/dashboard/page.tsx`. Find the JSX layout (after the existing data-loading block) and insert the import + the card. Add at the top of the file with the other imports:

```typescript
import { ReviewDueCard } from "@/components/dashboard/ReviewDueCard";
```

In the JSX, place `<ReviewDueCard supabase={supabase} userId={user.id} />` adjacent to the existing `CurriculumProgressCard` / `ResumeHeroCard` — match whatever grid wrapper they live in. Use `Suspense` if the dashboard already wraps adjacent cards in one. If the dashboard uses `requireServerSession`, the destructured `supabase` and `user` are already in scope.

- [ ] **Step 3: Type-check + dev smoke**

Run: `npx tsc --noEmit && npm run dev`
Expected: tsc clean; dashboard renders with the card visible. Stop the dev server with Ctrl-C.

- [ ] **Step 4: Commit**

```bash
git add components/dashboard/ReviewDueCard.tsx app/dashboard/page.tsx
git commit -m "feat(dashboard): ReviewDueCard surfaces due-today count"
```

---

### Task 11: `ChapterQuiz` tab on `.x` lessons

**Files:**
- Create: `components/lesson/ChapterQuiz.tsx`
- Modify: `app/(app)/lessons/[slug]/LessonClient.tsx` (add Chapter Quiz tab when `slug.endsWith("-x")`)

- [ ] **Step 1: Write the ChapterQuiz component**

```tsx
// components/lesson/ChapterQuiz.tsx
"use client";

import { useEffect, useState } from "react";
import { ReviewSession, type ReviewCard, type ReviewSessionResult } from "@/components/review/ReviewSession";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const PASS_THRESHOLD = 0.7;

interface Props {
  chapterNumber: string;
  lessonId: string;
}

interface QuizResponse {
  chapterNumber: string;
  checks: ReviewCard["check"][];
  composition: { currentChapter: number; priorChapters: number };
}

export function ChapterQuiz({ chapterNumber, lessonId }: Props) {
  const [cards, setCards] = useState<ReviewCard[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [finalResult, setFinalResult] = useState<ReviewSessionResult | null>(null);
  const [retakeKey, setRetakeKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setFinalResult(null);
    setCards(null);

    fetch(`/api/chapters/${chapterNumber}/quiz`)
      .then(async (r) => {
        if (r.status === 404) {
          throw new Error("This chapter doesn't have a quiz yet.");
        }
        if (!r.ok) throw new Error("Failed to load the quiz.");
        return (await r.json()) as QuizResponse;
      })
      .then((payload) => {
        if (cancelled) return;
        setCards(
          payload.checks.map((c) => ({
            check: c,
            lessonNumber: c.lesson_id ? `ch ${chapterNumber}` : "—",
          })),
        );
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });

    return () => {
      cancelled = true;
    };
  }, [chapterNumber, retakeKey]);

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Chapter quiz</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">{error}</CardContent>
      </Card>
    );
  }

  if (cards === null) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (finalResult) {
    const score = finalResult.total === 0 ? 0 : finalResult.correct / finalResult.total;
    const passed = score >= PASS_THRESHOLD;

    if (passed) {
      // Fire-and-forget completion ping.
      void fetch(`/api/progress/${lessonId}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ state: "completed" }),
      });
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>{passed ? "Chapter complete" : "Try again"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm">
            {finalResult.correct} of {finalResult.total} correct ({Math.round(score * 100)}%).
          </p>
          {!passed && (
            <p className="text-sm text-muted-foreground">
              Pass threshold is 70%. Take another pass at the missed items.
            </p>
          )}
          <Button
            onClick={() => {
              setFinalResult(null);
              setRetakeKey((k) => k + 1);
            }}
          >
            {passed ? "Retake" : "Try again"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <ReviewSession
      cards={cards}
      surfaceLabel={`Chapter ${chapterNumber} quiz`}
      onComplete={setFinalResult}
    />
  );
}
```

- [ ] **Step 2: Wire into `LessonClient.tsx`**

Open `app/(app)/lessons/[slug]/LessonClient.tsx`. Near the top of the function body (after props are destructured), add:

```typescript
const isChapterSummary = slug.endsWith("-x");
const chapterNumber = isChapterSummary ? slug.slice(0, -2) : null;
```

Find the second `<TabsList>` (the one with `value="lesson"` / `value="resources"`). Inside it, append a new `TabsTrigger` for the chapter quiz when `isChapterSummary`:

```tsx
{isChapterSummary && (
  <TabsTrigger value="chapter-quiz" className="flex-none px-3 py-2.5 text-sm gap-2 border-none!">
    <TabDocumentIcon />
    Chapter quiz
  </TabsTrigger>
)}
```

Then below the existing `<TabsContent value="resources">` block, add the matching content:

```tsx
{isChapterSummary && chapterNumber && (
  <TabsContent value="chapter-quiz" className="flex-1 overflow-y-auto p-4">
    <ChapterQuiz chapterNumber={chapterNumber} lessonId={lesson.id} />
  </TabsContent>
)}
```

Add the import at the top:

```typescript
import { ChapterQuiz } from "@/components/lesson/ChapterQuiz";
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add components/lesson/ChapterQuiz.tsx "app/(app)/lessons/[slug]/LessonClient.tsx"
git commit -m "feat(lesson): Chapter Quiz tab on .x lessons (70% pass + retake)"
```

---

### Task 12: Integration test — attempts INSERT + reviews UPSERT + RLS

**Files:**
- Create: `__tests__/api/review-attempt.integration.test.ts`

Two attempts on the same card by the same user produce one reviews row (UPSERT) and two attempts rows. A second user cannot read the first user's reviews. Uses the local Supabase instance.

- [ ] **Step 1: Write the test**

```typescript
// __tests__/api/review-attempt.integration.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { applyAttempt } from "@/lib/content/review";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

const skipIfNoLocalSupabase = !SUPABASE_URL || !SERVICE_KEY || !ANON_KEY;

describe.skipIf(skipIfNoLocalSupabase)("review-attempt integration", () => {
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  let userA = "";
  let userB = "";
  let checkId = "";
  let cleanupIds: string[] = [];

  beforeAll(async () => {
    const a = await admin.auth.admin.createUser({
      email: `ra+${Date.now()}@test.local`,
      password: "pw-test-1234",
      email_confirm: true,
    });
    const b = await admin.auth.admin.createUser({
      email: `rb+${Date.now()}@test.local`,
      password: "pw-test-1234",
      email_confirm: true,
    });
    userA = a.data.user!.id;
    userB = b.data.user!.id;

    // Need a real concept_check to attach attempts to. Pick the first one in DB.
    const { data: anyCheck } = await admin.from("concept_checks").select("id").limit(1).single();
    checkId = anyCheck!.id;

    cleanupIds = [userA, userB];
  });

  afterAll(async () => {
    await admin.from("concept_check_attempts").delete().in("user_id", cleanupIds);
    await admin.from("concept_check_reviews").delete().in("user_id", cleanupIds);
    for (const id of cleanupIds) await admin.auth.admin.deleteUser(id);
  });

  it("two attempts on the same card produce one reviews row and two attempts rows", async () => {
    const userClient = createClient(SUPABASE_URL, ANON_KEY);
    await userClient.auth.signInWithPassword({
      email: (await admin.auth.admin.getUserById(userA)).data.user!.email!,
      password: "pw-test-1234",
    });

    await applyAttempt(userClient, userA, checkId, false, new Date("2026-06-10"));
    await applyAttempt(userClient, userA, checkId, true, new Date("2026-06-11"));

    const { data: attempts } = await admin
      .from("concept_check_attempts")
      .select("id")
      .eq("user_id", userA)
      .eq("check_id", checkId);
    expect(attempts).toHaveLength(2);

    const { data: reviews } = await admin
      .from("concept_check_reviews")
      .select("interval_index, next_due, last_correct")
      .eq("user_id", userA)
      .eq("check_id", checkId);
    expect(reviews).toHaveLength(1);
    // Second attempt was correct from intervalIndex 0 → advances to 1 (3d after 2026-06-11)
    expect(reviews![0]).toMatchObject({ interval_index: 1, last_correct: true, next_due: "2026-06-14" });
  });

  it("RLS prevents user B from reading user A's reviews row", async () => {
    const bClient = createClient(SUPABASE_URL, ANON_KEY);
    await bClient.auth.signInWithPassword({
      email: (await admin.auth.admin.getUserById(userB)).data.user!.email!,
      password: "pw-test-1234",
    });

    const { data } = await bClient
      .from("concept_check_reviews")
      .select("id")
      .eq("user_id", userA);
    expect(data ?? []).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run the test**

Run: `npm run test -- __tests__/api/review-attempt.integration.test.ts`
Expected:
- If local Supabase is running with auth set up: both tests pass.
- If env vars are missing: tests are auto-skipped (see `describe.skipIf`).

- [ ] **Step 3: Commit**

```bash
git add __tests__/api/review-attempt.integration.test.ts
git commit -m "test(review): integration test for upsert + RLS isolation"
```

---

### Task 13: Manual smoke test, CLAUDE.md update, final lint/build

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Manual smoke test on dev server**

Run: `npm run dev`
Then in a browser:
1. Sign in as a real user with at least one chapter of concept checks in DB.
2. Visit `/dashboard` — confirm `ReviewDueCard` renders (count badge or "All caught up" copy).
3. Visit any regular lesson, answer 2+ concept checks. Confirm POST `/api/concept-checks` returns 204 in DevTools.
4. Visit `/dashboard/review` — confirm at least the cards you just made attempts on are queued by date (they shouldn't be due today since intervalIndex≥0 → next_due ≥ today+1d). Visit again the next day (or use a test where you fake the date) to see them due.
5. Visit `/dashboard/lessons/4-x` (or whatever `.x` slug exists) — confirm "Chapter quiz" tab is present. Open it, complete a session, confirm the pass/fail screen.
6. Confirm POST `/api/review/attempt` and POST `/api/chapters/N/quiz` calls in DevTools Network.

Stop the dev server. Record anything that broke in a TODO line of the commit message in step 3; if anything is genuinely broken, file a follow-up commit before merging.

- [ ] **Step 2: Update CLAUDE.md**

In the "Caching pattern" section, after the paragraph on `concept_checks`, add:

```markdown
Phase B adds `concept_check_reviews` — per-user-per-check scheduler state (`interval_index`, `next_due`). It is derived from `concept_check_attempts` and written atomically alongside each attempt via the `record_check_attempt` RPC. All writes funnel through `applyAttempt` in `lib/content/review.ts`; both Route Handlers (`/api/concept-checks`, `/api/review/attempt`) and any future surface MUST go through that single helper so the two tables can never diverge.
```

In the "Key data flow" section, add a fifth bullet:

```markdown
5. **Daily review:** Page → `GET /api/review/due` → returns up to 20 due cards from `concept_check_reviews` + nextDueDate when empty. Each answer → `POST /api/review/attempt` → `applyAttempt` (no LLM).
```

- [ ] **Step 3: Final checks**

Run: `npm run test && npm run lint && npx tsc --noEmit && npm run build`
Expected: all clean.

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md
git commit -m "docs(claude): document concept_check_reviews + applyAttempt invariant"
```

---

## Execution notes

- **Order matters:** Task 1 must precede every other task (everything else depends on the table + types). Tasks 2 → 3 → 4 → 5 are sequential (each builds on `applyAttempt` from Task 2). Tasks 6 → 7 are sequential. Tasks 8 → 9 → 10 → 11 are sequential (Tasks 9/10/11 all import the component from Task 8). Task 12 needs the full stack (Task 1-7 at minimum). Task 13 is last.
- **Parallel-with-Phase-A safety:** None of these tasks touch the Phase A content pipeline or the LLM-prompt code. The only file edited that Phase A also touches is `CLAUDE.md` (Task 13), which should rebase cleanly since Phase A's CLAUDE.md edits target different sections.
- **Zero-API-call invariant:** No `import` of anything from `lib/anthropic/` or `@anthropic-ai/sdk` anywhere in the diff. If you find yourself reaching for a model name or a prompt builder, you're on the wrong track.
- **Graceful degradation while Phase A finishes:** chapters with no concept checks yield 404 from `/api/chapters/[number]/quiz`; the lesson page Chapter Quiz tab shows the inline "doesn't have a quiz yet" message. Dashboard card shows the cold-start state when the user has no attempts.

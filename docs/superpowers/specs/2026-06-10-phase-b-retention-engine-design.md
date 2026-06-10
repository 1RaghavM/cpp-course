# Phase B Retention Engine Design

> **Status:** Approved 2026-06-10. Implementation lives on the existing `feat/phase-a-content-overhaul` branch and ships in parallel with the tail of Phase A.

## Goal

Give the user a daily spaced-repetition review queue over the concept checks Phase A is producing, plus repurpose chapter `.x` lessons as cumulative quizzes that mix the current chapter with the two preceding ones. Zero LLM calls anywhere — content already exists; this phase is pure scheduling and UI.

## Non-goals

- No new content generation. The pipeline established in Phase A continues unchanged.
- No tutor behavior changes.
- No curriculum re-sequencing (that's Phase C).
- No social/leaderboard features.
- No mobile-app surfaces beyond what the web app naturally supports.

## Scope (one branch, all three pieces)

1. SM-2-lite scheduler over `concept_check_attempts`.
2. Daily review page at `/dashboard/review` plus a dashboard card surfacing the due count.
3. Chapter `.x` lessons get a "Chapter quiz" tab that draws 10–15 mixed checks.

## Architecture

### Data model

**New table — `concept_check_reviews`** (one row per user × check):

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | `gen_random_uuid()` |
| `user_id` | uuid | FK to `auth.users` on delete cascade |
| `check_id` | uuid | FK to `concept_checks` on delete cascade |
| `interval_index` | int | 0..4, maps into `[1, 3, 7, 16, 30]` days |
| `next_due` | date | When the card becomes due (date-only; we don't need clock-time precision) |
| `last_correct` | bool | Outcome of the most recent attempt |
| `last_answered_at` | timestamptz | For tie-breaking and analytics |

Unique constraint on `(user_id, check_id)`. Index on `(user_id, next_due)` — every "what's due" query filters on those two columns. RLS: `user_id = auth.uid()` on all operations.

**Existing — `concept_check_attempts`**: unchanged. It is the append-only event log. Reviews are derived from it; if we ever change the scheduling algorithm we can rebuild reviews from attempts.

**No schema change to `lessons`.** Chapter quiz behavior is detected by slug pattern (`N-x`) in the UI layer, not a new lesson kind.

### Module layout

```
lib/content/review.ts                       — pure scheduler + DB wrappers
lib/content/chapter-quiz.ts                 — pure chapter-quiz set picker

app/api/concept-checks/route.ts             — MODIFIED: routes attempt through shared helper
app/api/review/due/route.ts                 — NEW: GET due queue (cap 20)
app/api/review/attempt/route.ts             — NEW: POST attempt (same handler shape as concept-checks)
app/api/chapters/[number]/quiz/route.ts     — NEW: GET 10–15 mixed checks

app/dashboard/review/page.tsx               — NEW: review session page
components/dashboard/ReviewDueCard.tsx      — NEW: dashboard widget
components/lesson/ChapterQuiz.tsx           — NEW: .x-tab content
components/review/ReviewSession.tsx         — NEW: shared session UI for review + chapter quiz
components/lesson/LessonClient.tsx          — MODIFIED: detect .x slug, render Chapter Quiz tab

supabase/migrations/20260610120000_concept_check_reviews.sql  — table + RPC + RLS

lib/supabase/types.ts                       — MODIFIED: add concept_check_reviews types
CLAUDE.md                                   — MODIFIED: note reviews table in caching pattern
```

### Scheduler module — `lib/content/review.ts`

A pure module (functions over plain data) plus two DB-touching wrappers.

```typescript
const INTERVALS_DAYS = [1, 3, 7, 16, 30] as const;

interface ReviewState {
  intervalIndex: number;   // 0..4
  nextDue: string;         // ISO date "YYYY-MM-DD"
  lastCorrect: boolean;
  lastAnsweredAt: string;  // ISO timestamp
}

interface DueCandidate {
  checkId: string;
  nextDue: string;
  intervalIndex: number;
}

// Pure
initialReviewState(correct: boolean, today: Date): ReviewState;
advanceReviewState(prev: ReviewState, correct: boolean, today: Date): ReviewState;
pickDueCards(candidates: DueCandidate[], today: Date, max?: number): string[];
nextDueDate(candidates: DueCandidate[]): string | null;

// DB-touching
loadDueReviewQueue(supabase, userId, today, max?): Promise<DueQueueItem[]>;
applyAttempt(supabase, userId, checkId, correct, today): Promise<void>;
```

**State transitions:**
- First-ever attempt → `initialReviewState`: correct sets `intervalIndex = 1, nextDue = today + 3d`; incorrect sets `intervalIndex = 0, nextDue = today + 1d`.
- Subsequent attempt → `advanceReviewState`: correct → `intervalIndex = min(prev + 1, 4)`; incorrect → `intervalIndex = 0`. `nextDue = today + INTERVALS_DAYS[intervalIndex]`.

**`pickDueCards` ordering:** filter `nextDue ≤ today`, then sort by `nextDue` ascending (oldest overdue first), tie-break by `intervalIndex` ascending (weaker cards first). Cap at `max` (default 20).

**Single write path:** `applyAttempt` is the only function in the codebase that writes `concept_check_reviews`. The lesson page, review page, and chapter quiz tab all route attempts through `/api/concept-checks` or `/api/review/attempt`; both call a shared `recordCheckAttempt` helper that invokes `applyAttempt`.

`applyAttempt` reads the current reviews row (if any), computes the new state in pure TS, then calls the Postgres RPC `record_check_attempt(check_id, interval_index, next_due, last_correct)`. The RPC does both writes — INSERT into `concept_check_attempts` and UPSERT into `concept_check_reviews` — inside one transaction using the already-computed parameters. No business logic in SQL; the RPC is pure transactional plumbing so the two tables can never diverge.

### Chapter-quiz module — `lib/content/chapter-quiz.ts`

```typescript
pickChapterQuizSet(input: {
  currentChapterChecks: ConceptCheck[];
  priorChapterChecks: ConceptCheck[];   // ch N-1 + ch N-2 merged
  attemptHistory: WarmupCandidate[];    // for wrong-first ordering
  seed: string;                         // "${userId}|${chapterNumber}|${YYYY-MM-DD}"
}): ConceptCheck[];
```

- Target size: 12 items. Acceptable range: 10–15.
- Composition: ~60% current chapter (~7 items), ~40% prior chapters (~5 items). Adjust if a bucket runs out — never crash; return what's available.
- Within each bucket: apply `pickWarmupIds`-style ranking (wrong recent first, then unseen, then oldest correct).
- Seeded shuffle by `(userId, chapterNumber, day)` so retakes within the same day are stable; new day produces a new mix.
- Graceful degradation while Phase A still ships:
  - Current chapter empty → 404 from the route.
  - Prior chapters empty → return current-chapter-only set (≤7 items, still playable).

### API contracts

All endpoints require `requireAuth(supabase)`. All return JSON.

**`POST /api/concept-checks`** *(extended)*
```
Request:  { checkId, userAnswer }
Response: { correct, explanationMd }
```
Grades the answer (existing logic), then calls the `record_check_attempt` RPC which inserts into `concept_check_attempts` and upserts `concept_check_reviews` atomically.

**`GET /api/review/due`**
```
Response: {
  count: number,                                // capped at 20
  cards: Array<{ check: ConceptCheck, lessonNumber: string, intervalIndex: number }>,
  nextDueDate: string | null                    // populated only when count === 0
}
```
Called twice in a typical session: once by `ReviewDueCard` (uses `count` only) and once by the review page server component (uses the full payload). One endpoint, two call sites — no premature splitting.

**`POST /api/review/attempt`**
```
Request:  { checkId, userAnswer }
Response: { correct, explanationMd }
```
Same shape and same internal helper as `POST /api/concept-checks`. Kept as a separate route so per-surface analytics ("attempts from review vs. lesson") are trivial to split later.

**`GET /api/chapters/[number]/quiz`**
```
Response: {
  chapterNumber: string,
  checks: ConceptCheck[],                       // 10–15 items
  composition: { currentChapter: number, priorChapters: number }
}
```
404 if the chapter has zero concept checks. Returns degraded set if prior chapters are empty (see graceful degradation above).

**Errors across all endpoints:**
- 401 from `requireAuth`.
- 400 on malformed/unknown `checkId`.
- 500 only on real Supabase failures. No retry logic — client surfaces a `sonner` toast and the user retries.

### UI surfaces

**`ReviewDueCard.tsx`** — server component on the dashboard.
- `Card` containing a `Badge` with the due count, a one-line status, and a primary `Button` linking to `/dashboard/review`.
- States: `count > 0` → "N reviews due today" + active CTA; `count === 0 && nextDueDate` → "All caught up — next review {date}" + disabled CTA; cold-start (`count === 0 && nextDueDate === null`) → "Answer a check on any lesson to start your review queue" + no CTA.
- Slotted into `app/dashboard/page.tsx` alongside `StreakCard` (both are daily-habit signals).

**`/dashboard/review` (`page.tsx`)** — server component fetches due payload, passes to `<ReviewSession />`.

**`ReviewSession.tsx`** — the single client component shared by the review page and the chapter quiz tab.
- One card at a time. Layout: prompt (`react-markdown`, existing helper), `Input` for `predict_output` or `RadioGroup` for `mcq`/`spot_bug`, submit `Button`.
- On submit → POST `/api/review/attempt` → reveal screen with `explanation_md` + Continue button.
- Header `Badge` shows the origin lesson ("From 13.5") so the user has spatial context.
- Final screen: "Session complete — N correct of M." Single CTA back to dashboard. `sonner` toast on completion.
- Empty state on the review page (count = 0 but `nextDueDate` exists): `Card` with the next-due date + a "Practice 5 random reviews" button that calls `GET /api/review/due?practice=1` (returns 5 oldest-known-good checks; practice attempts still flow through `applyAttempt` and update the scheduler normally).

**`ChapterQuiz.tsx`** — the `.x` tab content.
- `LessonClient` detects `slug.endsWith('-x')` and adds a "Chapter quiz" `Tabs` value alongside whatever tabs the lesson already renders (Summary, Exercises if any). Existing tabs are unchanged.
- On tab open: client fetches `/api/chapters/{N}/quiz`, renders `<ReviewSession />` with that payload.
- End of session:
  - Score ≥ 70%: render "Chapter complete" state, mark the `.x` lesson `completed` via the existing `POST /api/progress/[lesson_id]` endpoint with `{ state: "completed" }`.
  - Score < 70%: render "Try again" + a recap listing missed items. No completion ticked. Every attempt is still recorded.

**Cross-cutting:**
- Loading: existing `<Skeleton />` patterns.
- Mobile: `<ReviewSession />` is already a stack of `Card` + `Button` — works as-is on narrow viewports without `Sheet`/`Drawer`.
- Theming: inherits existing tokens.
- All primitives are already installed (`button`, `card`, `badge`, `input`, `radio-group`, `tabs`, `skeleton`, `sonner`, `tooltip`). No new shadcn installs.

## Data flow (cold-start cases)

**A. First attempt on a lesson page.**
1. User answers an MCQ on `/dashboard/lessons/4-3` → client POSTs `/api/concept-checks`.
2. Route: auth → load check → grade → call `record_check_attempt` RPC.
3. RPC inserts an attempts row and upserts a reviews row using `initialReviewState`: correct → `intervalIndex = 1, next_due = today + 3d`; incorrect → `intervalIndex = 0, next_due = today + 1d`.
4. Response surfaces the explanation; client reveals it.

**B. Daily review.**
1. Dashboard loads → `ReviewDueCard` fetches `/api/review/due`.
2. User clicks card → `/dashboard/review` page fetches the same endpoint and passes the payload to `<ReviewSession />`.
3. Per card: client POSTs `/api/review/attempt`. RPC runs `advanceReviewState`. Correct cards graduate up the interval ladder (cap at 4 / 30 days); incorrect cards drop back to `intervalIndex = 0, next_due = today + 1d`.
4. Final screen summarizes; dashboard reflects updated count on next load.

**C. Chapter `.x` quiz.**
1. User opens `/dashboard/lessons/4-x` → `LessonClient` detects `-x` slug → renders Summary + Chapter Quiz tabs.
2. User opens Chapter Quiz tab → client fetches `/api/chapters/4/quiz`. Server runs `pickChapterQuizSet`: 60% ch4 + 40% ch3/ch2, seeded by `(userId, "4", today)`.
3. `<ReviewSession />` runs the session; every answer POSTs `/api/review/attempt` (same scheduler updates as any other surface).
4. End: ≥70% → mark `.x` lesson complete via `POST /api/progress/{lesson_id}` with `{ state: "completed" }`; <70% → "Try again" with recap.

## Testing strategy

Mirroring the project's existing principle ("tests exist only where they prevent silent bugs"):

| File | Why |
|---|---|
| `__tests__/content/review.test.ts` | Scheduler correctness — every `intervalIndex` transition (0→1, 1→2, 2→3, 3→4, 4→4, any→0), `nextDue` arithmetic, `pickDueCards` ordering (overdue oldest-first then weakest), `nextDueDate` on empty pool. |
| `__tests__/content/chapter-quiz.test.ts` | Composition under degraded data (empty current chapter, empty prior chapters, both empty). Determinism of the seeded shuffle (same seed → same order). |
| `__tests__/api/review-attempt.integration.test.ts` | Two attempts on the same card produce one reviews row (upsert) and two attempts rows. RLS denies cross-user reads. |

Skipped: UI components, the dashboard card, the existing-pattern progress hookup. UI gets a manual smoke pass on the dev server before merge.

## Edge cases handled explicitly

- **Phase A still shipping** while Phase B runs: `/api/chapters/[number]/quiz` 404s on a fully empty chapter; degrades to current-chapter-only when prior chapters are empty; `ReviewDueCard` renders the cold-start state when the user has no attempts yet.
- **Two attempts on the same card in one session** (e.g., walked away mid-card and answered later): each attempt is logged, the review row reflects the latest. No special re-learn loop.
- **Card answered today + already overdue**: `nextDue` is computed from today's date, ignoring how overdue it was.
- **Practice attempts** (empty-state "practice 5 random") are still real attempts — they update the scheduler. We don't carve out a separate "practice without learning" mode; if the user engages with a card, the system treats that engagement as data.

## Sequencing with Phase A

Phase A's tail is still merging chapter-by-chapter content. Phase B can be built in parallel because:

- The `concept_check_attempts` table already exists (Phase A Task 1, migration `20260609120000_concept_checks.sql`).
- Phase B introduces no changes to the content generation pipeline.
- Phase B's UI degrades gracefully when chapters lack checks — it won't be incorrect, just sparse, until more chapters land.

Phase B should not be marketed/promoted to users until enough chapters have concept checks that the review queue is non-trivial. The branch can merge whenever it's ready; the UX simply becomes more useful as Phase A finishes.

## Out of scope

- Multi-file or compiled-code review (Judge0 stays out of Phase B; cards are read/answer).
- Configurable interval table or per-user ease factor — start with one global table.
- Notification/email reminders.
- "Suspend this card" UI.
- Reading other users' progress.
- Anything that would require touching the LLM pipeline.

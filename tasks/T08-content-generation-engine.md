# T08: Content Generation Engine

## Wave: 2 (depends on T04, T06)

## Dependencies

- **T04** — Supabase client library (for DB reads/writes)
- **T06** — Anthropic client library (for LLM calls, prompts, cost logging)

## Objective

Build the "generate or cache" orchestration function — the single most important piece of business logic in the app. When a lesson is visited for the first time, this function generates the summary and exercises via the LLM and writes them to Postgres. On every subsequent visit, it returns cached content without touching the LLM.

This function is the implementation of the caching pattern described in design.md section 5. If this function has a bug, the cost model breaks.

## Files to create

```
lib/content/lesson-generation.ts
```

## Implementation

### getOrGenerateLesson(slug: string)

The main exported function. Called by the lesson API route (T10).

```typescript
export async function getOrGenerateLesson(
  supabase: SupabaseClient<Database>,
  slug: string,
): Promise<{
  lesson: Lesson;
  exercises: (Exercise & { testCases: TestCase[] })[];
}>
```

**Flow:**

1. Query the lesson by slug: `SELECT * FROM lessons WHERE slug = $1`
2. If `summary_md IS NOT NULL`:
   - Cache hit — query exercises and test_cases for this lesson
   - Return immediately (zero LLM calls)
3. If `summary_md IS NULL`:
   - Cache miss — first visit
   - Load chapter info and prior lesson titles for context
   - Call `createCompletion()` with the lesson summary prompt (Haiku 4.5)
   - Parse the markdown response
   - Write `summary_md`, `summary_generated_at`, `summary_model` to the lesson row
   - Call `createCompletion()` with the exercise generation prompt (Haiku 4.5), passing the just-generated summary
   - Parse the JSON response into exercises + test cases
   - Insert exercises and test_cases rows
   - Return the complete lesson with exercises

**Critical invariants (from `/project:cache-guard`):**
- A non-NULL `summary_md` ALWAYS short-circuits to the cache-hit path
- The LLM is called ONLY when `summary_md IS NULL`
- Both the summary and exercises are generated and persisted in the same request
- If generation fails partway (e.g., exercise generation fails after summary succeeds), the summary is still persisted — the next visit won't re-generate it, but exercises will be empty. This is acceptable; the user can regenerate.

### regenerateLesson(slug: string)

Called by the regenerate API route (T10). The only path that clears cached content.

```typescript
export async function regenerateLesson(
  supabase: SupabaseClient<Database>,
  slug: string,
): Promise<{ lesson: Lesson; exercises: (Exercise & { testCases: TestCase[] })[] }>
```

**Flow:**

1. Delete all test_cases for exercises of this lesson (cascades from exercise delete)
2. Delete all exercises for this lesson
3. Set `summary_md = NULL`, `summary_generated_at = NULL`, `summary_model = NULL` on the lesson row
4. Call `getOrGenerateLesson()` — which now sees a cache miss and regenerates everything
5. Return the fresh content

### Context building helpers

Private functions within the module:

- `getPriorLessonTitles(supabase, chapterId, sortOrder)` — returns titles of lessons in the same chapter with lower sort_order, used in the summary prompt
- `getChapterContext(supabase, chapterId)` — returns the chapter title and number
- `parseExerciseResponse(raw: string)` — parses the JSON response from the exercise generation LLM call into typed Exercise + TestCase arrays. Validates: at least 1 exercise, each has at least 3 test cases, starter_code is non-empty.

## Error handling

- LLM call fails → throw with a descriptive error. The API route catches it and returns 500 with "Generation failed, try again later."
- JSON parse of exercise response fails → log the raw response, throw. The lesson summary is already saved, so the next visit will have the summary but no exercises — acceptable degradation.
- Supabase write fails → throw. The content is lost but can be regenerated.

## Skills to reference

- `/project:cache-guard` — this function IS the cache. Every invariant in that skill must hold.
- `/project:llm-integration` — model selection (Haiku for both summary and exercises), prompt templates from `lib/anthropic/prompts.ts`, cost logging via `lib/anthropic/cost.ts`

## Acceptance criteria

- [ ] First call to `getOrGenerateLesson('1-1')` triggers LLM calls and persists content
- [ ] Second call to `getOrGenerateLesson('1-1')` returns cached content with zero LLM calls
- [ ] Generated summary is 250-400 words of markdown with one code example
- [ ] Generated exercises have valid JSON structure with test cases
- [ ] `regenerateLesson()` clears all cached content and regenerates from scratch
- [ ] After regeneration, the next call hits cache (not a third generation)
- [ ] Cost is logged to `token_usage` for every LLM call
- [ ] Integration test: call endpoint twice, assert only one LLM call was made

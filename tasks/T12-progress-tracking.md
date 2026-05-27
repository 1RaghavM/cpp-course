# T12: Progress Tracking

## Wave: 3 (depends on T04, T05)

## Dependencies

- **T04** — Supabase client library (for DB operations)
- **T05** — Auth system (middleware protects the route)

## Objective

Build the progress tracking API that manages per-lesson state transitions. Other features (T10 lesson page, T11 code execution) call this to update progress, and T09 (roadmap) reads it for display.

## Files to create

```
app/api/progress/[lesson_id]/route.ts
```

## Implementation

### app/api/progress/[lesson_id]/route.ts

**POST /api/progress/[lesson_id]**

Request body:
```typescript
{
  state: 'in_progress' | 'completed' | 'skipped';
}
```

Response: `204 No Content` on success.

Logic:
1. Validate the lesson_id exists in the lessons table
2. Validate the state is one of the allowed values
3. Upsert into the `progress` table:
   - If no row exists: insert with `state`, `first_visit_at = now()`, `last_visit_at = now()`
   - If row exists: update `state`, `last_visit_at = now()`
   - If transitioning to `completed`: set `completed_at = now()`
   - If transitioning to `in_progress` and `first_visit_at` is null: set `first_visit_at = now()`
4. Return 204

**State transitions (from requirements):**
- `not_started` → `in_progress`: auto on first lesson page open (called by T10)
- `in_progress` → `completed`: auto when at least one exercise passes all tests (called by T11)
- Any state → `skipped`: manual via user action (P1)
- `completed` → `in_progress`: should NOT happen (don't downgrade completion)

**GET /api/progress/[lesson_id]** (optional, for convenience)

Returns the current progress state for a single lesson:
```typescript
{
  lessonId: string;
  state: 'not_started' | 'in_progress' | 'completed' | 'skipped';
  firstVisitAt: string | null;
  completedAt: string | null;
  lastVisitAt: string | null;
}
```

Returns `{ state: 'not_started' }` if no progress row exists.

## Integration points

This route is called by:
- **T10 (Lesson page):** POST with `state: 'in_progress'` when a lesson is opened for the first time
- **T11 (Code execution):** POST with `state: 'completed'` when all test cases pass on a submit

It is read by:
- **T09 (Roadmap):** progress state is joined in the roadmap query

## Skills to reference

- `/project:new-route` — follow the standard route handler pattern

## Acceptance criteria

- [ ] POST updates progress state correctly
- [ ] First visit sets `first_visit_at`
- [ ] Completion sets `completed_at`
- [ ] Upsert is idempotent — multiple POSTs with the same state don't create duplicates
- [ ] Completed lessons cannot be downgraded to `in_progress`
- [ ] Invalid lesson_id returns 400
- [ ] Invalid state returns 400
- [ ] Returns 204 on success

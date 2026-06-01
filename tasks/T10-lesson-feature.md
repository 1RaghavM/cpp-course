# T10: Lesson Feature

## Wave: 3 (depends on T05, T08, T09)

## Dependencies

- **T05** — Auth system (middleware protects routes)
- **T08** — Content generation engine (`getOrGenerateLesson`, `regenerateLesson`)
- **T09** — Roadmap feature (app layout exists, navigation established)

## Objective

Build the lesson page — the core learning experience. When a user clicks a lesson on the roadmap, this page shows the LLM-generated summary, the exercises for that lesson, and a "Further reading" link. On first visit, content is generated on the fly; on revisits, it loads from cache.

## Files to create

```
app/api/lessons/[slug]/route.ts                   # GET lesson content
app/api/lessons/[slug]/regenerate/route.ts        # POST regenerate lesson
app/(app)/lessons/[slug]/page.tsx                  # lesson page
components/lesson/SummaryView.tsx                  # renders markdown summary
components/lesson/ExerciseCard.tsx                 # exercise preview card
```

## Implementation

### app/api/lessons/[slug]/route.ts

**GET /api/lessons/[slug]**

Response shape:
```typescript
{
  id: string;
  number: string;
  title: string;                      // my_title ?? learncpp_title
  slug: string;
  learncppUrl: string;
  summaryMd: string;                  // the markdown summary
  summaryGeneratedAt: string | null;
  exercises: Array<{
    id: string;
    title: string;
    promptMd: string;
    difficulty: string;
    sortOrder: number;
  }>;
  conversations: Array<{             // existing tutor conversations
    id: string;
    title: string | null;
    createdAt: string;
  }>;
}
```

Logic:
1. Call `getOrGenerateLesson(supabase, slug)` from T08
   - This handles the cache-hit/miss logic internally
   - On first visit: generates content (may take 5-15s)
   - On revisit: returns cached content instantly
2. Query existing conversations for this lesson
3. Return the combined response

**First-visit latency:** This is synchronous and may take 5-15 seconds on cache miss. This is acceptable per design.md section 9 tradeoffs.

### app/api/lessons/[slug]/regenerate/route.ts

**POST /api/lessons/[slug]/regenerate**

Admin-only endpoint for regenerating lesson content.

Logic:
1. Call `regenerateLesson(supabase, slug)` from T08
2. Return the freshly generated content (same shape as GET)

### app/(app)/lessons/[slug]/page.tsx

Server component that:
1. Extracts `slug` from params
2. Fetches lesson data (either via API call or direct DB access as server component)
3. Updates progress to `in_progress` if currently `not_started` (FR-081)
4. Renders:
   - Lesson number + title at the top
   - `<SummaryView markdown={lesson.summaryMd} />`
   - Exercise cards: `<ExerciseCard>` for each exercise, linking to `/exercises/{id}`
   - "Further reading: learncpp.com" link at the bottom (FR-007)
   - "Regenerate this lesson" button (P1, calls POST regenerate endpoint)
   - Loading state while content is being generated on first visit

### components/lesson/SummaryView.tsx

Renders the lesson markdown summary.

- Parse markdown to HTML (use a library like `react-markdown` or `next-mdx-remote`)
- Syntax highlight code blocks with C++ language support
- Style with Tailwind prose classes (`prose prose-invert` for dark mode)
- Server component if possible (no interactivity needed for display)

### components/lesson/ExerciseCard.tsx

A card that previews an exercise and links to the exercise page.

- Shows: exercise title, difficulty badge, first few lines of the problem statement
- Clicking navigates to `/exercises/{exercise.id}`
- Shows a "completed" indicator if the user has a passing submission (query from submissions table)
- Client component if it needs to fetch completion status dynamically, otherwise server component

## Skills to reference

- `/project:cache-guard` — the GET route calls `getOrGenerateLesson()` which implements the cache. Verify the invariant: a second request for the same slug makes zero LLM calls.
- `/project:llm-integration` — content quality: summary must be 250-400 words, one code example, modern C++20, no AI tells
- `/project:new-route` — follow the route handler pattern for both endpoints

## Acceptance criteria

- [ ] `GET /api/lessons/1-1` returns lesson content (generates on first call)
- [ ] Second `GET /api/lessons/1-1` returns cached content without LLM call
- [ ] `POST /api/lessons/1-1/regenerate` clears and regenerates content
- [ ] Lesson page renders the markdown summary with syntax-highlighted code
- [ ] Exercise cards display and link to `/exercises/{id}`
- [ ] "Further reading" link points to the correct learncpp.com URL
- [ ] Progress auto-updates to `in_progress` on first visit
- [ ] Loading state shown during first-visit generation
- [ ] Page works on mobile viewports (>= 360px) for reading

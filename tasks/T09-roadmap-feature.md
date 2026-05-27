# T09: Roadmap Feature

## Wave: 2 (depends on T04, T05)

## Dependencies

- **T04** — Supabase client library (for DB queries)
- **T05** — Auth system (middleware protects the route)

## Objective

Build the roadmap — the home page of the app. Shows all 34 chapters with their lessons in canonical order, with completion state per lesson and per-chapter progress percentage. This is the primary navigation hub.

## Files to create

```
app/api/roadmap/route.ts                  # GET /api/roadmap
app/(app)/layout.tsx                      # owner-only layout wrapper
app/(app)/page.tsx                        # roadmap home page
components/roadmap/RoadmapTree.tsx        # the chapter/lesson tree component
```

## Implementation

### app/api/roadmap/route.ts

**GET /api/roadmap**

Response shape:
```typescript
{
  chapters: Array<{
    id: number;
    number: string;
    title: string;                    // my_title ?? learncpp_title
    completionPercent: number;        // 0-100, based on lesson states
    lessons: Array<{
      id: string;
      number: string;
      slug: string;
      title: string;                  // my_title ?? learncpp_title
      state: 'not_started' | 'in_progress' | 'completed' | 'skipped';
    }>;
  }>;
}
```

Logic:
1. Query all chapters ordered by sort_order
2. For each chapter, query lessons ordered by sort_order
3. Left join with progress table to get per-lesson state (default to `not_started` if no progress row)
4. Compute per-chapter completion: `(completed + skipped) / total * 100`
5. Return the nested structure

This should be a single efficient query with joins, not N+1 queries.

### app/(app)/layout.tsx

The layout for all authenticated app pages. This is where the owner-only protection applies via the middleware (T05). Contains:

- A minimal shell/wrapper (no complex nav in v1)
- Maybe a simple top bar with "cpproad" title and a link back to home
- Children rendered inside
- Server component

### app/(app)/page.tsx

The roadmap home page. Server component that:
1. Fetches `/api/roadmap` (or calls the DB directly as a server component)
2. Renders `<RoadmapTree chapters={data.chapters} />`
3. Optionally shows "Continue where I left off" CTA (P1 — if progress data exists, link to the most recent in_progress lesson)

### components/roadmap/RoadmapTree.tsx

Client component (`'use client'`) that renders the chapter/lesson tree.

For each chapter:
- Chapter header: number + title + completion percentage
- Expandable/collapsible lesson list (default: collapsed, except the first in-progress chapter)
- Each lesson row: number, title, state indicator (icon or color: gray=not_started, blue=in_progress, green=completed, yellow=skipped)
- Clicking a lesson navigates to `/lessons/{slug}`

Styling:
- Tailwind only
- Clean, minimal tree structure
- State indicators should be glanceable without reading labels
- Works on viewports >= 360px wide (P1 mobile requirement)

## Skills to reference

- `/project:new-route` — follow the route handler pattern (auth, error responses, response shape)
- `/project:scope-check` — no filtering by tags (P2), no search, no fancy animations

## Acceptance criteria

- [ ] `GET /api/roadmap` returns all 34 chapters with 345 lessons in correct order
- [ ] Each lesson has a state (defaults to `not_started`)
- [ ] Per-chapter completion percentage is calculated correctly
- [ ] Roadmap page renders the full tree
- [ ] Clicking a lesson navigates to `/lessons/{slug}`
- [ ] Chapters are collapsible
- [ ] State indicators are visually distinct
- [ ] Page works on mobile viewports (>= 360px)
- [ ] Unauthenticated users are redirected to login (middleware)

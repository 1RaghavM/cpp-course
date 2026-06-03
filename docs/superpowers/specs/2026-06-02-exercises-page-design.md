# Exercises Page Design

## Summary

Add an exercises listing page at `/dashboard/exercises` and rework the standalone exercise page at `/exercises/[id]` to render the full IDE experience instead of redirecting to the lesson page.

## Requirements

1. Exercises listing page lives inside the dashboard layout (sidebar + header), consistent with lessons and stats pages
2. Exercises grouped by curriculum module (16 modules from `CURRICULUM` in `lib/dashboard/curriculum.ts`)
3. Only shows exercises that have already been LLM-generated (no on-demand generation from this page)
4. Completion derived from existing `submissions` table: an exercise is complete if the user has at least one submission with `mode='submit'` AND `status='passed'`
5. Clicking an exercise opens `/exercises/[id]` which renders the full IDE + tutor experience
6. When a user completes an exercise from a lesson page, it also shows as complete on the exercises listing page (same data source)

## Architecture

### Exercises Listing Page (`app/dashboard/exercises/page.tsx`)

Server component. Data flow:

1. `requireServerSession()` for `userId` + authenticated supabase client
2. `createServiceClient()` to fetch all exercises with lesson join:
   ```
   exercises.select("id, title, difficulty, sort_order, lesson_id, lessons(chapter_id, learncpp_title, my_title)")
   ```
3. Fetch passing submissions:
   ```
   submissions.select("exercise_id")
     .eq("user_id", userId)
     .eq("mode", "submit")
     .eq("status", "passed")
   ```
   Deduplicate into `Set<string>` of completed exercise IDs
4. Map exercises to modules using `CURRICULUM` chapter ID arrays
5. Build flat table data array and pass to `ExercisesDataTable` client component

### ExercisesDataTable (`components/exercises-data-table.tsx`)

Client component modeled after existing `DataTable` from `components/data-table.tsx`.

**Tab filters:** "All Exercises", "Completed", "Not Completed"

**Table columns:**

| Column | Content |
|--------|---------|
| Exercise | Title as clickable link to `/exercises/[id]` |
| Module | Badge with curriculum module name (e.g. "Variables & Types") |
| Difficulty | Badge — practice or challenge |
| Status | Badge — Done (green) or Not Completed (outline) |

**Differences from lessons DataTable:**
- No checkbox select column (no bulk actions needed)
- No drag-and-drop (fixed exercise order)
- No actions dropdown (completion is automatic from submissions)
- No "Continue Learning" button
- Empty state: "Complete some lessons to unlock exercises"

**Shared features with lessons DataTable:**
- Tab filtering with count badges
- Column visibility dropdown
- Pagination with rows-per-page selector
- Responsive: select dropdown on small screens, tabs on wide screens

### Standalone Exercise Page (`app/(app)/exercises/[id]/page.tsx`)

Rewrite the current redirect-only page to render the full IDE experience.

1. Fetch exercise by ID, then fetch lesson via `exercise.lesson_id`
2. Call `getOrGenerateLesson(serviceClient, slug, userId)` to get full lesson + exercises data
3. Find the exercise's index in the exercises array
4. Render `LessonClient` with a new `exerciseOnly` prop set to `true`

### LessonClient Changes

Add optional `exerciseOnly?: boolean` prop (default `false`):

- When `true`: the left panel's tab bar (which normally shows "Summary" and exercise tabs) is replaced with just the exercise prompt content — no tab switcher, no summary tab
- The top breadcrumb/nav bar shows "Exercises" as the back link (href `/dashboard/exercises`) instead of prev/next lesson navigation
- The lesson number/title in the header is replaced with the exercise title
- Everything else (editor, output panel, tutor, keyboard shortcuts, run/submit) works identically

### Sidebar Update

In `components/app-sidebar.tsx`, change the "Exercises" nav item URL from `/exercises` to `/dashboard/exercises`.

## Files to Create/Modify

| File | Action |
|------|--------|
| `app/dashboard/exercises/page.tsx` | Create — server component, data fetching |
| `components/exercises-data-table.tsx` | Create — client component, table UI |
| `app/(app)/exercises/[id]/page.tsx` | Rewrite — render LessonClient instead of redirect |
| `app/(app)/lessons/[slug]/LessonClient.tsx` | Modify — add `exerciseOnly` prop |
| `components/app-sidebar.tsx` | Modify — update Exercises URL |

## No Schema Changes

Completion is derived from existing `submissions` table. No new tables or migrations needed.

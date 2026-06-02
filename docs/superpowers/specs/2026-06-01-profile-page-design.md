# Profile Page Design

## Overview

A full profile page at `/profile` within the authenticated app layout. Accessed via the avatar dropdown in the TopBar. Displays user identity, learning preferences, stats, and account management actions.

## Route & Layout

- **Route:** `app/(app)/profile/page.tsx` (server component)
- **Client component:** `components/profile/ProfilePage.tsx`
- **Layout:** Single column, `max-w-[800px]` centered, stacked `Card` components with `space-y-6` — matches the dashboard pattern
- **Page header:** `Breadcrumb` linking back to dashboard, page title "Profile"

## Navigation Entry Point

Add a "Profile" link to the existing avatar dropdown in `components/layout/TopBar.tsx`:
- Placed between the email display and "Sign out"
- Uses the existing hand-rolled dropdown (consistent with current TopBar code)
- Links to `/profile`

## Data Fetching

Server component (`page.tsx`) fetches:
- `session.user.email` — from `requireServerSession()`
- `user_stats` row — `display_name`, `streak_days`, `weekly_goal`, `last_active_date`
- `onboarding` row — `background`, `motivation`
- `progress` count — total lessons with state `completed` or `skipped`
- Weekly completed count — via `computeWeeklyCompleted` (reuse from dashboard)

All passed as props to the client component.

## Section 1: Identity Card

Top card on the page.

| Element | Component | Behavior |
|---|---|---|
| Avatar | `Avatar` + `AvatarFallback` (shadcn) | Large size, shows user initial. No upload. |
| Display name | `Label` + `Input` | Pre-filled, editable. Placeholder "Add a display name" if empty. |
| Email | `Label` + muted text | Read-only. Not an input — tied to auth. |
| Save | `Button` | Appears when display name is dirty. PATCH to update `user_stats.display_name`. Toast via `sonner`. |

## Section 2: Learning Preferences Card

| Element | Component | Behavior |
|---|---|---|
| Weekly goal | `Label` + `Select` | Dropdown: 2, 3, 5, 7 lessons/week. Pre-filled from `user_stats.weekly_goal`. Editable. |
| Background | `Label` + `Badge` | Read-only. From `onboarding.background`. |
| Motivation | `Label` + `Badge` | Read-only. From `onboarding.motivation`. |
| Note | Muted paragraph | "Set during onboarding" under background/motivation. |
| Save | `Button` | Appears when weekly goal changes. Updates `user_stats.weekly_goal`. Toast via `sonner`. |

## Section 3: Stats Overview Card

Read-only learning stats. Horizontal row on desktop (3 across), vertical stack on mobile.

| Stat | Display |
|---|---|
| Streak | Flame icon + days count (reuse TopBar/dashboard icon pattern) |
| Total completed | "X / 345 lessons" with `Progress` bar |
| Weekly progress | "X / Y this week" with `Progress` bar (Y = weekly goal) |

Uses `Card` with muted `Label` elements and prominent values.

## Section 4: Account Actions Card

Two sub-sections separated by `Separator`.

### Password

- `CardHeader` with `CardTitle` "Password" + `CardDescription`
- `Button` variant `outline` — navigates to existing `/update-password` page

### Danger Zone

- `CardTitle` with `text-destructive` class, heading "Delete account"
- `CardDescription`: "Permanently delete your account and all your learning data. This cannot be undone."
- `Button` variant `destructive` — triggers `AlertDialog`
- `AlertDialog` content:
  - `AlertDialogTitle`: "Are you sure?"
  - `AlertDialogDescription`: Reiterates permanence
  - `AlertDialogCancel`: "Cancel"
  - `AlertDialogAction` (destructive styling): "Delete my account"
- On confirm: `DELETE /api/account` — deletes user data from all tables, calls `supabase.auth.admin.deleteUser()`, signs out, redirects to `/login`. Toast on error.

## New API Route

### `DELETE /api/account`

- Auth: `requireServerSession()`
- Uses service client to delete in FK-safe order: `messages` -> `conversations` -> `submissions` -> `progress` -> `token_usage` -> `onboarding` -> `user_stats` (all where `user_id` matches)
- Then `supabase.auth.admin.deleteUser(userId)` via service role client
- Returns `200` on success, `500` on error

## shadcn Components Used

**Already installed:** `avatar`, `badge`, `breadcrumb`, `button`, `card`, `dropdown-menu`, `input`, `label`, `progress`, `select`, `separator`, `skeleton`, `sonner`

**To install:** `alert-dialog`

No custom primitives. All UI from `@/components/ui/*`.

## Files to Create/Modify

| File | Action |
|---|---|
| `app/(app)/profile/page.tsx` | Create — server component, data fetching |
| `components/profile/ProfilePage.tsx` | Create — client component, all sections |
| `app/api/account/route.ts` | Create — DELETE handler for account deletion |
| `components/layout/TopBar.tsx` | Modify — add "Profile" link to avatar dropdown |
| `components/ui/alert-dialog.tsx` | Install via `npx shadcn@latest add alert-dialog` |

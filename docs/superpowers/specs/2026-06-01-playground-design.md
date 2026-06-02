# Playground — Design Spec

A free-form C++ IDE accessible from the app sidebar. Users write, compile, and run arbitrary C++ code against the existing Judge0 sandbox without being tied to a lesson or exercise. Includes stdin support, localStorage + DB persistence, a C++ standard picker, and the AI tutor in free-form mode.

## 1. Routing & Layout

**Route:** `app/(app)/playground/page.tsx` inside the authenticated route group.

The page renders a full-screen IDE layout:

- `AppShell` hides its TopBar when `pathname.startsWith("/playground")` (extends the existing `/lessons/` pattern).
- A slim collapsible header bar (~40px) contains: back arrow (navigates to dashboard), "Playground" title, and the C++ standard picker.
- The rest of the viewport is filled by the editor, stdin, output, and tutor panels.
- The sidebar entry in `app-sidebar.tsx` updates its `url` from `/dashboard` to `/playground`.

## 2. Panel Layout

### Desktop (>=768px)

```
+--------------------------------------------------------------+
|  [<-]  Playground                        [C++20 v]           |  <- slim header
+--------------------------------------------------------------+
|  [ Run ]  [ Reset ]                    running indicator      |  <- toolbar
+-------------------------------+------------------------------+
|                               |  stdin (collapsible, ~20%)   |
|                               +------------------------------+
|     Monaco Editor (~60%)      |  Output (~50%)               |
|                               +------------------------------+
|                               |  Tutor (~30%, resizable)     |
+-------------------------------+------------------------------+
```

- `VerticalDivider` (existing component) separates left/right.
- Right-side panels separated by horizontal dividers.

### Mobile (<768px)

- Full-width editor with a bottom tab bar: **Code** | **Input** | **Output** | **Tutor**.
- Only one panel visible at a time.

### Editor Toolbar

- **Run** button (primary CTA)
- **C++ standard picker** — C++17 / C++20 / C++23, default C++20
- **Reset** button — clears editor to default starter code
- **Running state** indicator (spinner while Judge0 executes)

### Default Starter Code

```cpp
#include <iostream>

int main() {
    std::cout << "Hello, World!" << std::endl;
    return 0;
}
```

## 3. API & Code Execution

### `POST /api/playground/run`

Thin route handler:

1. Authenticate via `requireAuth`.
2. Validate `source_code` (required, max 50 KB), `stdin` (optional string), `language_std` (optional, one of `c++17 | c++20 | c++23`, default `c++20`).
3. Call `submitCode()` from `lib/judge0/client.ts`.
4. Return result directly.

No exercise lookup. No test cases. No submission logging.

**Request:**

```ts
{ source_code: string; stdin?: string; language_std?: "c++17" | "c++20" | "c++23" }
```

**Response:**

```ts
{ status: JudgeStatus; stdout: string | null; stderr: string | null;
  compileOutput: string | null; exitCode: number | null; wallTimeMs: number }
```

### Rate Limiting

In-memory `Map<userId, timestamps[]>` — max 10 runs per minute per user. Returns 429 if exceeded. No Redis needed for single-instance serverless.

## 4. Persistence

### localStorage (primary)

Auto-saves on every change (debounced 500ms):

| Key | Value |
|---|---|
| `cpproad:playground:code` | Editor content |
| `cpproad:playground:stdin` | Stdin content |
| `cpproad:playground:std` | Selected C++ standard |

On page load: restore from localStorage, or fall back to default Hello World.

### Database backup (secondary)

New table:

```sql
create table playground_state (
  user_id uuid primary key references auth.users(id),
  source_code text not null,
  stdin text not null default '',
  language_std text not null default 'c++20',
  updated_at timestamptz not null default now()
);

alter table playground_state enable row level security;
create policy "Users can read/write own state"
  on playground_state for all using (auth.uid() = user_id);
```

### Sync Behavior

- **Load:** localStorage first. If empty (new device), `GET /api/playground/state` (returns 404 if no saved state, triggering default starter code).
- **Save:** Debounced localStorage write (500ms). Slower debounce (5s of inactivity) fires `PUT /api/playground/state` as fire-and-forget.

### API Endpoints

- `GET /api/playground/state` — returns saved playground state or 404.
- `PUT /api/playground/state` — upserts `source_code`, `stdin`, `language_std`.

## 5. Tutor Integration

### Conversation Context

The `POST /api/chat` endpoint accepts `context: "playground"` instead of a `lesson_id`. This signals:

- No lesson material is injected into the system prompt.
- The system prompt shifts to: general C++ help for a learner experimenting in a free-form playground.
- The user's current editor content is sent as context with each message.

### Conversation Persistence

- Playground conversations store in existing `conversations` / `messages` tables with `lesson_id = NULL` and a `context = 'playground'` marker.
- One active playground conversation per user. Reopening the playground resumes the thread.
- A "New conversation" button clears the thread and starts fresh.

### Hint Tier Policy

The 4-tier progressive hint policy does not apply in the playground. When `context === "playground"`, the tutor skips tier computation and responds directly.

## 6. Component Reuse & Changes

| Component | Change |
|---|---|
| `MonacoEditor` | Generalize: make `exerciseId` optional. When absent, use a fixed `"playground"` key for localStorage. |
| `EditorToolbar` | Reuse or create a playground-specific variant that drops Submit button and adds Reset. |
| `OutputPanel` | Reuse as-is — it already displays stdout/stderr/compile output. |
| `TutorPanel` | Pass `context="playground"` instead of `lessonId`. |
| `VerticalDivider` | Reuse as-is. |
| `AppShell` | Extend `hideHeader` check to include `/playground`. |
| `app-sidebar.tsx` | Update Playground URL from `/dashboard` to `/playground`. |

## 7. Migration

One migration file covering both changes:

1. `create table playground_state` with RLS policy (see Section 4).
2. `alter table conversations add column context text` — nullable, defaults to NULL. Playground conversations set `context = 'playground'` with `lesson_id = NULL`. Existing lesson conversations keep `context = NULL` with their `lesson_id` set. Add index: `create index idx_conversations_context on conversations(user_id, context) where context is not null`.

## 8. Files to Create

- `app/(app)/playground/page.tsx` — server component, auth + fetch saved state
- `app/(app)/playground/PlaygroundClient.tsx` — client component, full IDE layout
- `app/api/playground/run/route.ts` — code execution endpoint
- `app/api/playground/state/route.ts` — GET/PUT persistence endpoint
- `infra/supabase/migrations/XXX_playground.sql` — DB migration (playground_state table + conversations.context column). Sequence number assigned at creation time.

# Notes Feature — Design Spec

**Date:** 2026-06-01
**Status:** Approved
**Author:** Raghav + Claude

## Overview

A per-lesson notepad that lets users take Markdown notes while studying. Notes are accessible via a floating overlay on each lesson page, a full overview organized by chapter in the dashboard, and a dedicated full-page editor per note.

## Requirements

- One note per user per lesson (max ~345 notes)
- Floating draggable/resizable notepad overlay on lesson pages
- Full Markdown editing with toolbar (bold, italic, code, code block, lists, headings)
- Edit/preview toggle
- Auto-save with 1.5s debounce after last keystroke
- Dashboard overview page at `/notes` — notes grouped by chapter via accordion
- Dedicated note view at `/notes/[slug]` — full-page Markdown editor
- Hidden on mobile (lesson page is read-only on mobile; notes accessible via overview)

## Data Model

### New `notes` table

```sql
CREATE TABLE notes (
    user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lesson_id  UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    content    TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, lesson_id)
);

CREATE INDEX idx_notes_user ON notes(user_id, updated_at DESC);
```

### RLS Policy

```sql
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY own_notes ON notes FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

Content is stored as raw Markdown text. No word count or metadata columns.

## API Routes

### `PATCH /api/notes/[lessonId]`

- **Purpose:** Upsert a note (create on first save, update on subsequent)
- **Auth:** `require-auth.ts` — 401 if unauthenticated
- **Request body:** `{ content: string }`
- **Logic:** `INSERT ... ON CONFLICT (user_id, lesson_id) DO UPDATE SET content = $content, updated_at = now()`
- **Response:** `{ updated_at: string }`

### `GET /api/notes`

- **Purpose:** Fetch all notes for the current user (overview page)
- **Auth:** `require-auth.ts`
- **Logic:** Select all notes joined with `lessons` and `chapters` for grouping
- **Response:** `{ notes: [{ lessonId, lessonSlug, lessonTitle, lessonNumber, chapterTitle, chapterSortOrder, lessonSortOrder, content, updatedAt }] }`
- **No pagination** — max ~345 notes per user, metadata is lightweight

The floating notepad fetches its note directly via the Supabase client (RLS handles scoping), avoiding an extra API route.

## Components

### Floating Notepad (`components/notes/FloatingNotepad.tsx`)

**Trigger:** "Notes" button in the lesson nav bar, same visual pattern as the Tutor toggle (icon + label, highlighted when open).

**Panel behavior:**
- Draggable overlay, default position: bottom-right of viewport
- Default size: ~400px wide, ~350px tall
- Resizable via corner drag handle
- Header bar: "Notes" title, save status indicator, minimize button, close button
- Minimizes to a small pill in the corner
- Z-index above lesson content, below modals/dialogs
- Position and open/minimized state remembered in localStorage per session

**Editor:**
- Markdown textarea with toolbar: bold, italic, inline code, code block, bullet list, heading
- Edit/preview toggle (split or switch)
- Lightweight: `textarea` for editing + `react-markdown` for preview
- Syntax highlighting in code block previews via `rehype-highlight`

**Auto-save:**
- 1.5s debounce after last keystroke
- Upserts via `PATCH /api/notes/[lessonId]`
- On open: fetch via Supabase client (`supabase.from('notes').select().eq('lesson_id', lessonId).single()`)
- Status indicator: "Saving..." during flush, "Saved" with checkmark after

**Mobile:** Hidden — lesson page already shows read-only layout on mobile.

### Notes Overview Page (`app/(app)/notes/page.tsx`)

- Server component — fetches all user notes joined with lessons/chapters
- Grouped by chapter using shadcn `accordion`
- Each chapter section lists lessons with notes, sorted by `lesson.sort_order`
- Each lesson row: lesson number, title, content preview (~80 chars stripped), relative "last edited" time
- Empty state: "No notes yet. Open the notepad on any lesson to start."
- Search bar at top for client-side content filtering
- Entry point: "Notes" link in TopBar/navigation

### Dedicated Note View (`app/(app)/notes/[slug]/page.tsx`)

- Full-width Markdown editor (same editor component as floating notepad, but larger)
- Breadcrumb: Notes > Chapter Title > Lesson Title
- "Open lesson" link to `/lessons/[slug]`
- Same auto-save behavior as floating notepad
- Same DB row — editing here or in the notepad is the same note

## shadcn Components

### Already installed — using directly

| Component | Usage |
|---|---|
| `button` | Nav toggle, toolbar buttons, close/minimize, "Open lesson" link |
| `toggle` | Formatting toolbar items (bold, italic, code) with pressed state |
| `toggle-group` | Edit/Preview mode switcher |
| `tooltip` | Toolbar button labels, save status, minimize/close |
| `accordion` | Overview page — chapters as accordion items |
| `breadcrumb` | Dedicated view: Notes > Chapter > Lesson |
| `scroll-area` | Notepad content area, overview page list |
| `separator` | Toolbar/editor divider, note entry dividers |
| `badge` | "Last edited" timestamps in overview |
| `skeleton` | Loading states for note fetch and overview |
| `card` | Note entries in overview list |
| `input` | Search/filter bar in overview |

### Need to install

| Component | Usage |
|---|---|
| `textarea` | Core Markdown editing surface |
| `resizable` | Floating notepad resize handle |

### Custom (no shadcn equivalent)

| Element | Reason |
|---|---|
| Drag handle | Pointer events for repositioning floating panel |
| Markdown preview | `react-markdown` + `rehype-highlight` for content rendering |
| Save status indicator | Inline text, simpler than toast for every auto-save |

## New Dependencies

| Package | Purpose |
|---|---|
| `react-markdown` | Render Markdown preview in notepad and dedicated view |
| `rehype-highlight` | Syntax highlighting for code blocks in preview |
| `remark-gfm` | GitHub-flavored Markdown support (tables, strikethrough, task lists) |

## File Structure

```
app/
  (app)/
    notes/
      page.tsx                    # Overview page (server component)
      [slug]/
        page.tsx                  # Dedicated note view
        NoteEditor.tsx            # Client component for full-page editor
  api/
    notes/
      route.ts                   # GET all user notes
      [lessonId]/
        route.ts                 # PATCH upsert note
components/
  notes/
    FloatingNotepad.tsx          # Draggable overlay notepad
    NotepadToggle.tsx            # Nav bar button to open/close notepad
    MarkdownEditor.tsx           # Shared editor (toolbar + textarea + preview)
    MarkdownPreview.tsx          # Shared preview renderer
    NoteCard.tsx                 # Note entry in overview list
    SaveStatus.tsx               # "Saving..." / "Saved" indicator
lib/
  notes/
    use-note.ts                  # Hook: fetch, auto-save, debounce logic
    use-notepad-position.ts      # Hook: drag/resize position in localStorage
infra/
  supabase/
    migrations/
      008_notes.sql              # Table + index + RLS
```

## Navigation Flow

1. **Dashboard** → click "Notes" in nav → `/notes` (accordion overview)
2. **Overview** → click a lesson's note → `/notes/[slug]` (dedicated editor)
3. **Lesson page** → click "Notes" in nav bar → floating notepad opens
4. All three surfaces read/write the same `notes` DB row

## Non-Goals

- No collaborative/shared notes
- No note export (PDF, etc.)
- No AI-assisted note features (summarize, etc.)
- No rich media embeds (images, files)
- No note versioning or history

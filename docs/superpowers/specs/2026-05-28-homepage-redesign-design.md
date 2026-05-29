# Homepage Redesign: IDE-Style Split-Pane Layout

## Problem

The current homepage renders all 34 chapters as a vertical accordion, causing excessive scrolling. The layout feels plain, has too much whitespace, and lacks clear visual hierarchy.

## Solution

Replace the single-column scrollable page with a split-pane layout: a collapsible chapter sidebar on the left and a chapter detail view on the right.

## Layout Structure

```
┌──────────────────────────────────────────────────────┐
│  AppHeader (unchanged — logo, progress bar, logout)  │
├─────────────┬────────────────────────────────────────┤
│  Sidebar    │  Main Content                          │
│  (280px)    │  (fills remaining width)               │
│  scrolls    │  scrolls independently                 │
│  independently│                                      │
├─────────────┴────────────────────────────────────────┤
```

- AppHeader: unchanged.
- Below header: horizontal split. Both panes get `overflow-y: auto`. Outer container is `h-screen` minus header height (56px).
- No page-level scrolling.

## Sidebar

Width: 280px fixed. Collapsible.

### Chapter rows (~48px each)

Each row contains:
- Colored chapter number badge (reuses existing `chapterHues` color system)
- Chapter title (truncated with `truncate`)
- Completion percentage (mono, right-aligned)
- Thin progress bar below text (chapter hue color)

Active/selected chapter: subtle left border accent + slightly brighter background.

### Scroll behavior

34 chapters x ~48px = ~1632px. Sidebar scrolls independently. On load, auto-scrolls to the active chapter (the one containing the current/next lesson).

### Responsive behavior

- Desktop (>=1024px): visible by default, collapsible via toggle button at top of sidebar.
- Mobile (<1024px): hidden by default. A hamburger/menu button appears at the top-left of the main content area (above the continue card). Sidebar slides in as an overlay from the left with a semi-transparent backdrop. Tapping backdrop or the X button in the sidebar header closes it.

### Collapse behavior

Fully hides (no icon rail). Main content expands to fill the width.

## Main Content Area

### Compact continue card

Single-row strip at the top:
- Left: lesson number + title + chapter context
- Right: "Continue" / "Begin lesson" button
- If curriculum complete: small "All done" message
- No decorative elements, no large headings

### Chapter detail

When a chapter is selected (from sidebar or default):

**Chapter header:**
- Chapter number badge + title (large)
- Lesson count + completion percentage
- Full-width progress bar (chapter hue color)

**Lesson list:**
Each lesson is a clickable row linking to `/lessons/[slug]`:
- State indicator dot: filled (completed), half-filled or accent-colored (in-progress), hollow (not started), dashed (skipped)
- Lesson number (mono)
- Lesson title
- Current/in-progress lesson gets a subtle highlight background

### Default selection

On load, show the chapter containing the user's current or next lesson (first in-progress, then first not-started). If all complete, show chapter 0.

## Components

### New

- `components/home/ChapterSidebar.tsx` — client component. Manages open/close state. Renders chapter list. Calls `onSelectChapter(id)` callback. Receives chapters array with completion data.
- `components/home/ChapterDetail.tsx` — server-compatible component. Receives a single chapter's lessons array. Renders chapter header + lesson list.
- `components/home/ContinueLearning.tsx` — rewritten to compact single-row format.

### Modified

- `app/(app)/page.tsx` — new split-pane layout. Server component still fetches all data. Wraps sidebar + detail in a client component that manages selected chapter state.
- Need a client wrapper (e.g., `components/home/HomeLayout.tsx`) to hold the `selectedChapter` state and coordinate sidebar selection with chapter detail rendering.

### Removed (no longer used on homepage)

- `components/home/HeroSection.tsx` — progress info now in sidebar per-chapter
- `components/home/RecentActivity.tsx` — not needed for single-user tool
- `components/home/FeatureStrip.tsx` — already unused on current homepage
- `components/home/PathSection.tsx` — replaced by sidebar
- `components/roadmap/RoadmapTree.tsx` — replaced by sidebar + chapter detail

Note: files are deleted, not kept around with unused exports.

### Unchanged

- `components/layout/AppHeader.tsx`
- `components/layout/AppShell.tsx`
- All auth, lesson, exercise, editor, tutor components

## State Management

Selected chapter: `useState<number>` in a client wrapper component (`HomeLayout`). No URL changes when switching chapters. Initial value derived from the "active chapter" (chapter containing current/next lesson), passed as a prop from the server component.

Sidebar open/close: `useState<boolean>` in `ChapterSidebar` or `HomeLayout`. Default: `true` on desktop, `false` on mobile (detected via media query or window width check on mount).

## Data Flow

No changes to data fetching. `page.tsx` still fetches chapters, lessons, progress via Supabase in parallel. It computes the same `roadmapChapters` array and `continueLesson`. Passes everything to `HomeLayout` (client boundary), which manages selected chapter state.

## Animations

- Sidebar open/close: CSS transition on width (desktop) or transform translateX (mobile overlay).
- Reveal animations: keep existing `reveal` keyframe for initial page load on main content.
- Chapter switch: no animation, instant swap.

## Styling

- Reuses existing color system (CSS variables, Tailwind config) — no new colors.
- Reuses existing `chapterHues` color system for chapter badges and progress bars.
- Tighter spacing throughout: smaller padding, less vertical gaps.
- `font-display` for chapter titles, `font-mono` for numbers/percentages.

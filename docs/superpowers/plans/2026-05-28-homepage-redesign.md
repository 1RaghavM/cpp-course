# Homepage Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the vertically-scrolling homepage with an IDE-style split-pane layout: collapsible chapter sidebar + chapter detail view.

**Architecture:** Server component (`page.tsx`) fetches all data, passes it to a client wrapper (`HomeLayout`) that manages selected-chapter and sidebar-open state. HomeLayout renders ChapterSidebar and ChapterDetail side by side. No new API routes, no data-fetching changes.

**Tech Stack:** Next.js 14 App Router, React, Tailwind CSS, TypeScript strict mode.

---

## File Structure

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `components/home/HomeLayout.tsx` | Client wrapper — holds `selectedChapterIndex` and `sidebarOpen` state, renders the split-pane shell |
| Create | `components/home/ChapterSidebar.tsx` | Sidebar chapter list with progress bars, collapse/overlay behavior |
| Create | `components/home/ChapterDetail.tsx` | Chapter header + lesson list for the selected chapter |
| Rewrite | `components/home/ContinueLearning.tsx` | Compact single-row continue/resume strip |
| Rewrite | `app/(app)/page.tsx` | Simplified — data fetch + render `<HomeLayout>` |
| Delete | `components/home/HeroSection.tsx` | Replaced by per-chapter progress in sidebar + detail |
| Delete | `components/home/RecentActivity.tsx` | Cut — not needed for current design |
| Delete | `components/home/FeatureStrip.tsx` | Already unused on homepage |
| Delete | `components/home/PathSection.tsx` | Replaced by sidebar |
| Delete | `components/roadmap/RoadmapTree.tsx` | Replaced by sidebar + detail |

---

### Task 1: Create ContinueLearning compact rewrite

**Files:**
- Rewrite: `components/home/ContinueLearning.tsx`

- [ ] **Step 1: Rewrite ContinueLearning.tsx**

Replace the entire file with a compact single-row strip:

```tsx
import Link from "next/link";

export interface ContinueLesson {
  slug: string;
  title: string;
  number: string;
  chapterNumber: string;
  chapterTitle: string;
  state: "in_progress" | "not_started";
}

interface ContinueLearningProps {
  lesson: ContinueLesson | null;
  hasAnyProgress: boolean;
}

export function ContinueLearning({ lesson, hasAnyProgress }: ContinueLearningProps) {
  if (!lesson) {
    return (
      <div className="rounded-lg border border-success/20 bg-success/[0.04] px-4 py-3">
        <p className="text-sm font-medium text-primary">
          Curriculum complete
          <span className="ml-2 text-xs font-normal text-secondary">
            Every lesson is marked done or skipped.
          </span>
        </p>
      </div>
    );
  }

  const isResume = lesson.state === "in_progress";

  return (
    <div className="flex items-center gap-4 rounded-lg border border-border/60 bg-surface/50 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-primary">
          <span className="font-mono text-xs text-muted">{lesson.number}</span>
          <span className="mx-2 opacity-30">·</span>
          {lesson.title}
        </p>
        <p className="mt-0.5 truncate text-xs text-muted">
          Ch {lesson.chapterNumber} · {lesson.chapterTitle}
        </p>
      </div>
      <Link
        href={`/lessons/${lesson.slug}`}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-accent px-4 py-1.5 text-xs font-semibold text-accent-fg transition-colors hover:bg-accent-hover"
      >
        {isResume ? "Continue" : hasAnyProgress ? "Next" : "Start"}
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </Link>
    </div>
  );
}
```

- [ ] **Step 2: Verify no type errors**

Run: `npx tsc --noEmit 2>&1 | head -30`

This will have errors because `page.tsx` still imports old components. That's expected — we'll fix `page.tsx` in Task 5.

- [ ] **Step 3: Commit**

```bash
git add components/home/ContinueLearning.tsx
git commit -m "feat: rewrite ContinueLearning as compact single-row strip"
```

---

### Task 2: Create ChapterSidebar

**Files:**
- Create: `components/home/ChapterSidebar.tsx`

- [ ] **Step 1: Create ChapterSidebar.tsx**

```tsx
"use client";

import { useEffect, useRef } from "react";

export interface SidebarChapter {
  id: number;
  number: string;
  title: string;
  completionPercent: number;
}

interface ChapterSidebarProps {
  chapters: SidebarChapter[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  open: boolean;
  onClose: () => void;
}

const chapterHues = [10, 220, 38, 155, 280, 190, 350, 45, 120, 260];

function getChapterColors(index: number) {
  const hue = chapterHues[index % chapterHues.length]!;
  return {
    badge: `hsl(${hue} 30% 20%)`,
    badgeText: `hsl(${hue} 40% 68%)`,
    bar: `hsl(${hue} 35% 42%)`,
  };
}

export function ChapterSidebar({
  chapters,
  selectedIndex,
  onSelect,
  open,
  onClose,
}: ChapterSidebarProps) {
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      activeRef.current?.scrollIntoView({ block: "center", behavior: "instant" });
    }
  }, [open]);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed inset-y-14 left-0 z-40 flex w-[280px] flex-col border-r border-border/50 bg-base
          transition-transform duration-200
          lg:relative lg:inset-y-0 lg:z-0
          ${open ? "translate-x-0" : "-translate-x-full lg:-translate-x-full"}
        `}
      >
        <div className="flex h-10 shrink-0 items-center justify-between border-b border-border/30 px-3">
          <span className="text-xs font-medium uppercase tracking-wider text-muted">
            Chapters
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-muted transition-colors hover:bg-hover hover:text-primary"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-1">
          {chapters.map((chapter, idx) => {
            const colors = getChapterColors(idx);
            const isSelected = idx === selectedIndex;

            return (
              <button
                key={chapter.id}
                ref={isSelected ? activeRef : undefined}
                type="button"
                onClick={() => {
                  onSelect(idx);
                  if (window.innerWidth < 1024) onClose();
                }}
                className={`
                  flex w-full flex-col gap-1 border-l-2 px-3 py-2.5 text-left transition-colors
                  ${isSelected ? "border-accent bg-hover/60" : "border-transparent hover:bg-hover/30"}
                `}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex h-5 min-w-[2rem] shrink-0 items-center justify-center rounded px-1.5 font-mono text-[10px] font-medium"
                    style={{ backgroundColor: colors.badge, color: colors.badgeText }}
                  >
                    {chapter.number}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-xs text-secondary">
                    {chapter.title}
                  </span>
                  <span className="shrink-0 font-mono text-[10px] tabular-nums text-muted">
                    {chapter.completionPercent}%
                  </span>
                </div>
                <div className="h-0.5 w-full overflow-hidden rounded-full bg-elevated">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${chapter.completionPercent}%`,
                      backgroundColor: colors.bar,
                    }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </aside>
    </>
  );
}
```

- [ ] **Step 2: Verify no type errors in the new file**

Run: `npx tsc --noEmit 2>&1 | grep ChapterSidebar`

Expected: no errors from this file specifically (other files may still error).

- [ ] **Step 3: Commit**

```bash
git add components/home/ChapterSidebar.tsx
git commit -m "feat: add ChapterSidebar with collapsible split-pane support"
```

---

### Task 3: Create ChapterDetail

**Files:**
- Create: `components/home/ChapterDetail.tsx`

- [ ] **Step 1: Create ChapterDetail.tsx**

```tsx
import Link from "next/link";

export interface DetailLesson {
  id: string;
  number: string;
  slug: string;
  title: string;
  state: "not_started" | "in_progress" | "completed" | "skipped";
}

export interface DetailChapter {
  id: number;
  number: string;
  title: string;
  completionPercent: number;
  lessons: DetailLesson[];
}

interface ChapterDetailProps {
  chapter: DetailChapter;
  chapterIndex: number;
}

const chapterHues = [10, 220, 38, 155, 280, 190, 350, 45, 120, 260];

function getChapterColors(index: number) {
  const hue = chapterHues[index % chapterHues.length]!;
  return {
    badge: `hsl(${hue} 30% 20%)`,
    badgeText: `hsl(${hue} 40% 68%)`,
    bar: `hsl(${hue} 35% 42%)`,
  };
}

const stateIndicator: Record<DetailLesson["state"], { label: string; color: string }> = {
  completed: { label: "●", color: "hsl(var(--success))" },
  in_progress: { label: "◐", color: "hsl(var(--accent))" },
  not_started: { label: "○", color: "hsl(var(--text-muted))" },
  skipped: { label: "–", color: "hsl(var(--warning))" },
};

export function ChapterDetail({ chapter, chapterIndex }: ChapterDetailProps) {
  const colors = getChapterColors(chapterIndex);
  const totalLessons = chapter.lessons.length;
  const completedCount = chapter.lessons.filter(
    (l) => l.state === "completed" || l.state === "skipped",
  ).length;

  return (
    <div className="reveal">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <span
            className="inline-flex h-7 min-w-[2.5rem] items-center justify-center rounded-md px-2 font-mono text-xs font-medium"
            style={{ backgroundColor: colors.badge, color: colors.badgeText }}
          >
            {chapter.number}
          </span>
          <h2 className="font-display text-xl text-primary">{chapter.title}</h2>
        </div>
        <p className="mt-2 text-xs text-muted">
          <span className="font-mono tabular-nums text-secondary">{completedCount}</span>
          {" of "}
          <span className="font-mono tabular-nums">{totalLessons}</span>
          {" lessons"}
          <span className="mx-2 opacity-30">·</span>
          <span className="font-mono tabular-nums text-secondary">{chapter.completionPercent}%</span>
        </p>
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-elevated">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${chapter.completionPercent}%`,
              backgroundColor: colors.bar,
            }}
          />
        </div>
      </div>

      <div className="space-y-0.5">
        {chapter.lessons.map((lesson) => {
          const indicator = stateIndicator[lesson.state];
          const isActive = lesson.state === "in_progress";

          return (
            <Link
              key={lesson.id}
              href={`/lessons/${lesson.slug}`}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-hover/50 ${
                isActive ? "bg-accent/[0.06]" : ""
              }`}
            >
              <span
                className="shrink-0 text-sm leading-none"
                style={{ color: indicator.color }}
              >
                {indicator.label}
              </span>
              <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted">
                {lesson.number}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm text-secondary transition-colors group-hover:text-primary">
                {lesson.title}
              </span>
              {isActive && (
                <span className="shrink-0 font-mono text-[10px] text-accent">current</span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify no type errors**

Run: `npx tsc --noEmit 2>&1 | grep ChapterDetail`

Expected: no errors from this file.

- [ ] **Step 3: Commit**

```bash
git add components/home/ChapterDetail.tsx
git commit -m "feat: add ChapterDetail with lesson list and progress header"
```

---

### Task 4: Create HomeLayout

**Files:**
- Create: `components/home/HomeLayout.tsx`

- [ ] **Step 1: Create HomeLayout.tsx**

This is the client wrapper that holds selected-chapter and sidebar state, and composes all the pieces:

```tsx
"use client";

import { useState, useEffect } from "react";
import { ChapterSidebar, type SidebarChapter } from "@/components/home/ChapterSidebar";
import { ChapterDetail, type DetailChapter } from "@/components/home/ChapterDetail";
import { ContinueLearning, type ContinueLesson } from "@/components/home/ContinueLearning";

export interface HomeChapter {
  id: number;
  number: string;
  title: string;
  completionPercent: number;
  lessons: {
    id: string;
    number: string;
    slug: string;
    title: string;
    state: "not_started" | "in_progress" | "completed" | "skipped";
  }[];
}

interface HomeLayoutProps {
  chapters: HomeChapter[];
  continueLesson: ContinueLesson | null;
  hasAnyProgress: boolean;
  activeChapterIndex: number;
}

export function HomeLayout({
  chapters,
  continueLesson,
  hasAnyProgress,
  activeChapterIndex,
}: HomeLayoutProps) {
  const [selectedIndex, setSelectedIndex] = useState(activeChapterIndex);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const isDesktop = window.innerWidth >= 1024;
    setSidebarOpen(isDesktop);
  }, []);

  const selectedChapter = chapters[selectedIndex];

  const sidebarChapters: SidebarChapter[] = chapters.map((ch) => ({
    id: ch.id,
    number: ch.number,
    title: ch.title,
    completionPercent: ch.completionPercent,
  }));

  return (
    <div className="flex min-h-0 flex-1">
      <ChapterSidebar
        chapters={sidebarChapters}
        selectedIndex={selectedIndex}
        onSelect={setSelectedIndex}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-6 py-6">
          <div className="mb-6 flex items-center gap-3">
            {!sidebarOpen && (
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="rounded-md p-1.5 text-muted transition-colors hover:bg-hover hover:text-primary"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              </button>
            )}
            <div className="flex-1">
              <ContinueLearning lesson={continueLesson} hasAnyProgress={hasAnyProgress} />
            </div>
          </div>

          {selectedChapter && (
            <ChapterDetail chapter={selectedChapter} chapterIndex={selectedIndex} />
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify no type errors**

Run: `npx tsc --noEmit 2>&1 | grep HomeLayout`

Expected: no errors from this file.

- [ ] **Step 3: Commit**

```bash
git add components/home/HomeLayout.tsx
git commit -m "feat: add HomeLayout client wrapper for split-pane homepage"
```

---

### Task 5: Rewrite page.tsx

**Files:**
- Rewrite: `app/(app)/page.tsx`

- [ ] **Step 1: Rewrite page.tsx**

Keep the data fetching logic, remove old component imports, render `HomeLayout`:

```tsx
import { createServiceClient } from "@/lib/supabase/server";
import { requireServerSession } from "@/lib/auth/require-auth";
import { HomeLayout, type HomeChapter } from "@/components/home/HomeLayout";
import type { ContinueLesson } from "@/components/home/ContinueLearning";
import type { Chapter, Lesson, Progress } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

type LessonState = "not_started" | "in_progress" | "completed" | "skipped";

interface RawLesson {
  id: string;
  chapter_id: number;
  number: string;
  slug: string;
  learncpp_title: string;
  my_title: string | null;
  sort_order: number;
}

interface RawChapter {
  id: number;
  number: string;
  learncpp_title: string;
  my_title: string | null;
  sort_order: number;
}

interface RawProgress {
  lesson_id: string;
  state: LessonState;
  last_visit_at: string | null;
}

function findContinueLesson(
  lessons: RawLesson[],
  chapters: RawChapter[],
  progressMap: Map<string, LessonState>,
): ContinueLesson | null {
  const chapterById = new Map(chapters.map((ch) => [ch.id, ch]));

  const inProgress = lessons.find((l) => progressMap.get(l.id) === "in_progress");
  if (inProgress) {
    const ch = chapterById.get(inProgress.chapter_id);
    if (!ch) return null;
    return {
      slug: inProgress.slug,
      title: inProgress.my_title ?? inProgress.learncpp_title,
      number: inProgress.number,
      chapterNumber: ch.number,
      chapterTitle: ch.my_title ?? ch.learncpp_title,
      state: "in_progress",
    };
  }

  const nextNotStarted = lessons.find(
    (l) => (progressMap.get(l.id) ?? "not_started") === "not_started",
  );
  if (nextNotStarted) {
    const ch = chapterById.get(nextNotStarted.chapter_id);
    if (!ch) return null;
    return {
      slug: nextNotStarted.slug,
      title: nextNotStarted.my_title ?? nextNotStarted.learncpp_title,
      number: nextNotStarted.number,
      chapterNumber: ch.number,
      chapterTitle: ch.my_title ?? ch.learncpp_title,
      state: "not_started",
    };
  }

  return null;
}

function findActiveChapterIndex(
  chapters: HomeChapter[],
): number {
  const inProgressIdx = chapters.findIndex((ch) =>
    ch.lessons.some((l) => l.state === "in_progress"),
  );
  if (inProgressIdx >= 0) return inProgressIdx;

  const notStartedIdx = chapters.findIndex((ch) =>
    ch.lessons.some((l) => l.state === "not_started"),
  );
  if (notStartedIdx >= 0) return notStartedIdx;

  return 0;
}

export default async function HomePage() {
  const { supabase } = await requireServerSession();
  const serviceClient = createServiceClient();

  const [chaptersResult, lessonsResult, progressResult] = await Promise.all([
    serviceClient
      .from("chapters")
      .select("id, number, learncpp_title, my_title, sort_order")
      .order("sort_order", { ascending: true }) as unknown as {
      data: Pick<Chapter, "id" | "number" | "learncpp_title" | "my_title" | "sort_order">[] | null;
      error: unknown;
    },
    serviceClient
      .from("lessons")
      .select(
        "id, chapter_id, number, slug, learncpp_title, my_title, sort_order",
      )
      .order("sort_order", { ascending: true }) as unknown as {
      data: Pick<
        Lesson,
        "id" | "chapter_id" | "number" | "slug" | "learncpp_title" | "my_title" | "sort_order"
      >[] | null;
      error: unknown;
    },
    supabase
      .from("progress")
      .select("lesson_id, state, last_visit_at") as unknown as {
      data: Pick<Progress, "lesson_id" | "state" | "last_visit_at">[] | null;
      error: unknown;
    },
  ]);

  const rawChapters: RawChapter[] = chaptersResult.data ?? [];
  const rawLessons: RawLesson[] = lessonsResult.data ?? [];
  const rawProgress: RawProgress[] = (progressResult.data ?? []).map((row) => ({
    lesson_id: row.lesson_id,
    state: row.state as LessonState,
    last_visit_at: row.last_visit_at,
  }));

  const progressMap = new Map<string, LessonState>();
  for (const row of rawProgress) {
    progressMap.set(row.lesson_id, row.state);
  }

  const lessonsByChapter = new Map<number, HomeChapter["lessons"]>();
  for (const lesson of rawLessons) {
    if (!lessonsByChapter.has(lesson.chapter_id)) {
      lessonsByChapter.set(lesson.chapter_id, []);
    }
    lessonsByChapter.get(lesson.chapter_id)!.push({
      id: lesson.id,
      number: lesson.number,
      slug: lesson.slug,
      title: lesson.my_title ?? lesson.learncpp_title,
      state: progressMap.get(lesson.id) ?? "not_started",
    });
  }

  const chapters: HomeChapter[] = rawChapters.map((ch) => {
    const chapterLessons = lessonsByChapter.get(ch.id) ?? [];
    const total = chapterLessons.length;
    const done = chapterLessons.filter(
      (l) => l.state === "completed" || l.state === "skipped",
    ).length;

    return {
      id: ch.id,
      number: ch.number,
      title: ch.my_title ?? ch.learncpp_title,
      completionPercent: total > 0 ? Math.round((done / total) * 100) : 0,
      lessons: chapterLessons,
    };
  });

  const continueLesson = findContinueLesson(rawLessons, rawChapters, progressMap);
  const hasAnyProgress = rawProgress.length > 0;
  const activeChapterIndex = findActiveChapterIndex(chapters);

  return (
    <HomeLayout
      chapters={chapters}
      continueLesson={continueLesson}
      hasAnyProgress={hasAnyProgress}
      activeChapterIndex={activeChapterIndex}
    />
  );
}
```

- [ ] **Step 2: Verify full build**

Run: `npx tsc --noEmit`

Expected: clean — no errors. All old imports are gone, all new components are wired up.

- [ ] **Step 3: Commit**

```bash
git add app/\(app\)/page.tsx
git commit -m "feat: rewire homepage to use split-pane HomeLayout"
```

---

### Task 6: Delete old components

**Files:**
- Delete: `components/home/HeroSection.tsx`
- Delete: `components/home/RecentActivity.tsx`
- Delete: `components/home/FeatureStrip.tsx`
- Delete: `components/home/PathSection.tsx`
- Delete: `components/roadmap/RoadmapTree.tsx`

- [ ] **Step 1: Delete all unused component files**

```bash
rm components/home/HeroSection.tsx
rm components/home/RecentActivity.tsx
rm components/home/FeatureStrip.tsx
rm components/home/PathSection.tsx
rm components/roadmap/RoadmapTree.tsx
```

- [ ] **Step 2: Verify no broken imports remain**

Run: `npx tsc --noEmit`

Expected: clean. If any file still imports a deleted component, fix that import.

- [ ] **Step 3: Run lint**

Run: `npm run lint`

Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add -u
git commit -m "chore: remove old homepage components replaced by split-pane layout"
```

---

### Task 7: Visual verification in browser

- [ ] **Step 1: Start dev server**

Run: `npm run dev`

- [ ] **Step 2: Test golden path**

Open `http://localhost:3000` in a browser. Verify:
1. Split-pane layout renders: sidebar on left, chapter detail on right
2. Sidebar shows all 34 chapters with colored badges, titles, and progress bars
3. The active chapter (containing current/next lesson) is selected and scrolled into view
4. Clicking a different chapter in the sidebar updates the main content
5. Continue card shows at top of main area with correct lesson info and working link
6. Lesson rows in chapter detail link to `/lessons/[slug]`
7. State indicators show correct colors (● green for completed, ◐ accent for in-progress, ○ gray for not started, – yellow for skipped)
8. Sidebar collapse button hides the sidebar; hamburger button shows to reopen it

- [ ] **Step 3: Test responsive behavior**

1. Resize browser below 1024px — sidebar should be hidden
2. Hamburger button appears — click it to open sidebar as overlay with backdrop
3. Select a chapter — sidebar closes automatically on mobile
4. Click backdrop — sidebar closes

- [ ] **Step 4: Test edge cases**

1. If all lessons are complete: continue card shows "Curriculum complete" message, chapter 0 is selected
2. Page loads without errors when no progress exists (fresh user)

- [ ] **Step 5: Fix any issues found during visual testing**

If layout, spacing, or behavior issues are found, fix them and commit:

```bash
git add -u
git commit -m "fix: homepage layout adjustments from visual testing"
```

# Dashboard & Editor Visual Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify the dashboard and code editor with the homepage's Vercel/GitHub-inspired design system — visual changes only, no functional modifications.

**Architecture:** Replace the current warm-neutral HSL token system with hex-based homepage tokens at `:root` level, switch fonts to Geist, collapse multi-color chapter accents to a single blue, and define a custom Monaco editor theme matching the GitHub-dark syntax palette.

**Tech Stack:** Next.js 14, Tailwind CSS 3, Geist fonts (already installed), Monaco Editor, CSS custom properties.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `app/globals.css` | Modify | Replace `:root` CSS variables with hex tokens |
| `app/layout.tsx` | Modify | Switch to Geist Sans + Geist Mono fonts |
| `tailwind.config.ts` | Modify | Update color references from `hsl(var(--x))` to `var(--x)` |
| `components/layout/AppHeader.tsx` | Modify | Monospace wordmark |
| `components/home/ChapterSidebar.tsx` | Modify | Remove multi-hue, single blue accent |
| `components/home/ChapterDetail.tsx` | Modify | Remove multi-hue, single blue accent |
| `components/home/ContinueLearning.tsx` | Modify | White primary CTA button |
| `components/lesson/OutputPanel.tsx` | Modify | Submit button to white primary |
| `components/lesson/SummaryView.tsx` | Modify | Update hardcoded HSL values in syntax theme |
| `components/editor/MonacoEditor.tsx` | Modify | Define + apply custom GitHub-dark theme |

---

### Task 1: Replace Global CSS Tokens

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Replace `:root` variables**

Replace the entire `:root` block in `globals.css` with hex-based tokens:

```css
@layer base {
  :root {
    --bg-base: #0a0a0a;
    --bg-surface: #0f1115;
    --bg-elevated: #161b22;
    --bg-hover: #1c2128;
    --border: #23262d;
    --border-subtle: #30363d;
    --text-primary: #ededed;
    --text-secondary: #8b949e;
    --text-muted: #6e7681;
    --accent: #2f81f7;
    --accent-hover: #58a6ff;
    --accent-fg: #ffffff;
    --success: #3fb950;
    --error: #f85149;
    --warning: #d29922;
    --slate: #8b949e;
  }

  body {
    @apply bg-base text-primary antialiased;
  }

  * {
    @apply border-border;
  }

  * {
    scrollbar-width: thin;
    scrollbar-color: var(--border) var(--bg-base);
  }

  *::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  *::-webkit-scrollbar-track {
    background: var(--bg-base);
  }

  *::-webkit-scrollbar-thumb {
    background-color: var(--border);
    border-radius: 999px;
  }

  *::-webkit-scrollbar-thumb:hover {
    background-color: var(--bg-hover);
  }
}
```

Keep the `@layer utilities` block (grain, reveal animations) unchanged.

- [ ] **Step 2: Verify the dev server still compiles**

Run: `npm run dev`
Expected: No build errors. The page renders (colors will look wrong until Tailwind config is updated).

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "style: replace global CSS tokens with homepage hex values"
```

---

### Task 2: Update Tailwind Config

**Files:**
- Modify: `tailwind.config.ts`

- [ ] **Step 1: Update color mappings from `hsl()` to `var()`**

Replace the entire `theme.extend` section:

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: "var(--bg-base)",
        surface: "var(--bg-surface)",
        elevated: "var(--bg-elevated)",
        hover: "var(--bg-hover)",
        border: "var(--border)",
        "border-subtle": "var(--border-subtle)",
        primary: "var(--text-primary)",
        secondary: "var(--text-secondary)",
        muted: "var(--text-muted)",
        accent: "var(--accent)",
        "accent-hover": "var(--accent-hover)",
        "accent-fg": "var(--accent-fg)",
        success: "var(--success)",
        error: "var(--error)",
        warning: "var(--warning)",
        steel: "var(--slate)",
      },
      backgroundColor: {
        base: "var(--bg-base)",
        surface: "var(--bg-surface)",
        elevated: "var(--bg-elevated)",
        hover: "var(--bg-hover)",
      },
      textColor: {
        primary: "var(--text-primary)",
        secondary: "var(--text-secondary)",
        muted: "var(--text-muted)",
      },
      borderColor: {
        DEFAULT: "var(--border)",
        subtle: "var(--border-subtle)",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-geist-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
```

Key changes: `hsl(var(--x))` → `var(--x)`, font families → Geist variables, `font-display` now maps to Geist Sans (same as `font-sans`).

- [ ] **Step 2: Verify build compiles**

Run: `npm run build`
Expected: Build succeeds. No Tailwind class resolution errors.

- [ ] **Step 3: Commit**

```bash
git add tailwind.config.ts
git commit -m "style: update tailwind config to use hex token vars and Geist fonts"
```

---

### Task 3: Switch Fonts to Geist

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: Replace font imports and configuration**

```tsx
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "cpproad",
  description: "A single-user C++ learning tool",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`dark ${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="grain min-h-screen bg-base font-sans text-primary">{children}</body>
    </html>
  );
}
```

Removed: `Fraunces`, `Plus_Jakarta_Sans`, `JetBrains_Mono` imports and their `variable` CSS variable names.
Added: `GeistSans` and `GeistMono` which expose `--font-geist-sans` and `--font-geist-mono` automatically.

- [ ] **Step 2: Verify fonts load**

Run: `npm run dev`
Expected: Pages render with Geist Sans for body text and Geist Mono for code/monospace. No FOUT.

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx
git commit -m "style: switch to Geist Sans and Geist Mono fonts"
```

---

### Task 4: Update AppHeader Wordmark

**Files:**
- Modify: `components/layout/AppHeader.tsx`

- [ ] **Step 1: Change wordmark to monospace**

Replace the wordmark Link content:

```tsx
<Link href="/dashboard" className="flex items-center gap-0">
  <span className="font-mono text-lg font-semibold tracking-tight text-primary">cpproad</span>
</Link>
```

This replaces the italic display+body split (`<span class="font-display italic text-accent">cpp</span><span class="font-display text-primary">road</span>`) with a single monospace wordmark matching the homepage nav.

- [ ] **Step 2: Commit**

```bash
git add components/layout/AppHeader.tsx
git commit -m "style: update AppHeader wordmark to monospace"
```

---

### Task 5: Update ChapterSidebar to Single Blue Accent

**Files:**
- Modify: `components/home/ChapterSidebar.tsx`

- [ ] **Step 1: Remove multi-hue system and replace with single accent**

Remove the `chapterHues` array and `getChapterColors` function. Replace the component body where colors are used:

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
          fixed inset-y-14 left-0 z-40 flex w-[280px] flex-col border-r border-border bg-base
          transition-transform duration-200
          lg:relative lg:inset-y-0 lg:z-0
          ${open ? "translate-x-0" : "-translate-x-full lg:-translate-x-full"}
        `}
      >
        <div className="flex h-10 shrink-0 items-center justify-between border-b border-border px-3">
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
                    className="inline-flex h-5 min-w-[2rem] shrink-0 items-center justify-center rounded px-1.5 font-mono text-[10px] font-medium bg-accent/10 text-accent-hover"
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
                    className="h-full rounded-full bg-accent transition-all duration-300"
                    style={{ width: `${chapter.completionPercent}%` }}
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

Key changes: removed `chapterHues`, `getChapterColors`, inline style objects. Badge uses `bg-accent/10 text-accent-hover`. Progress bar uses `bg-accent`. Border uses `border-border` instead of `border-border/50`.

- [ ] **Step 2: Commit**

```bash
git add components/home/ChapterSidebar.tsx
git commit -m "style: simplify chapter sidebar to single blue accent"
```

---

### Task 6: Update ChapterDetail to Single Blue Accent

**Files:**
- Modify: `components/home/ChapterDetail.tsx`

- [ ] **Step 1: Remove multi-hue and use accent classes**

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

const stateIndicator: Record<DetailLesson["state"], { label: string; className: string }> = {
  completed: { label: "●", className: "text-success" },
  in_progress: { label: "◐", className: "text-accent" },
  not_started: { label: "○", className: "text-muted" },
  skipped: { label: "–", className: "text-warning" },
};

export function ChapterDetail({ chapter }: ChapterDetailProps) {
  const totalLessons = chapter.lessons.length;
  const completedCount = chapter.lessons.filter(
    (l) => l.state === "completed" || l.state === "skipped",
  ).length;

  return (
    <div className="reveal">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-7 min-w-[2.5rem] items-center justify-center rounded-md px-2 font-mono text-xs font-medium bg-accent/10 text-accent-hover">
            {chapter.number}
          </span>
          <h2 className="text-xl font-semibold tracking-tight text-primary">{chapter.title}</h2>
        </div>
        <p className="mt-2 text-xs text-muted">
          <span className="font-mono tabular-nums text-secondary">{completedCount}</span>
          {" of "}
          <span className="font-mono tabular-nums">{totalLessons}</span>
          {" lessons"}
          <span className="mx-2 opacity-30">&middot;</span>
          <span className="font-mono tabular-nums text-secondary">{chapter.completionPercent}%</span>
        </p>
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-elevated">
          <div
            className="h-full rounded-full bg-accent transition-all duration-300"
            style={{ width: `${chapter.completionPercent}%` }}
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
              <span className={`shrink-0 text-sm leading-none ${indicator.className}`}>
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

Key changes: removed `chapterHues`, `getChapterColors`, all inline `style` objects. Changed `stateIndicator` from `{ color: string }` to `{ className: string }` using Tailwind classes. Badge uses `bg-accent/10 text-accent-hover`. Progress bar uses `bg-accent`. Heading uses `font-semibold tracking-tight` instead of `font-display`. Removed unused `chapterIndex` param usage (kept in props for interface compatibility).

- [ ] **Step 2: Commit**

```bash
git add components/home/ChapterDetail.tsx
git commit -m "style: simplify chapter detail to single blue accent"
```

---

### Task 7: Update ContinueLearning CTA to White Primary

**Files:**
- Modify: `components/home/ContinueLearning.tsx`

- [ ] **Step 1: Change CTA button to solid white primary style**

Replace the CTA Link className:

```tsx
<Link
  href={`/lessons/${lesson.slug}`}
  className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-white px-4 py-1.5 text-xs font-semibold text-black border border-white transition-colors hover:bg-white/90"
>
```

This matches the homepage's primary button pattern: solid white fill, black text, slight opacity on hover.

- [ ] **Step 2: Commit**

```bash
git add components/home/ContinueLearning.tsx
git commit -m "style: update ContinueLearning CTA to white primary button"
```

---

### Task 8: Update OutputPanel Submit Button

**Files:**
- Modify: `components/lesson/OutputPanel.tsx`

- [ ] **Step 1: Change Submit button to white primary style**

Replace the Submit button className:

```tsx
<button
  type="button"
  onClick={onSubmit}
  disabled={busy}
  className="inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-xs font-medium text-black border border-white transition hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed"
>
  {isSubmitting && <Spinner />}
  Submit
</button>
```

The "Run" button stays as ghost/secondary (already correct with `bg-surface` + border).

- [ ] **Step 2: Commit**

```bash
git add components/lesson/OutputPanel.tsx
git commit -m "style: update Submit button to white primary style"
```

---

### Task 9: Update SummaryView Syntax Highlight Colors

**Files:**
- Modify: `components/lesson/SummaryView.tsx`

- [ ] **Step 1: Update hardcoded HSL values to match new tokens**

Replace the `customOneDark` override:

```tsx
const customOneDark = {
  ...oneDark,
  'pre[class*="language-"]': {
    ...oneDark['pre[class*="language-"]'],
    background: "#0f1115",
    borderRadius: "0.5rem",
    border: "1px solid #23262d",
  },
  'code[class*="language-"]': {
    ...oneDark['code[class*="language-"]'],
    background: "transparent",
  },
};
```

Changed: `hsl(0 0% 14%)` → `#0f1115`, `hsl(0 0% 22%)` → `#23262d`.

- [ ] **Step 2: Commit**

```bash
git add components/lesson/SummaryView.tsx
git commit -m "style: update SummaryView code block colors to match new tokens"
```

---

### Task 10: Create Custom Monaco Editor Theme

**Files:**
- Modify: `components/editor/MonacoEditor.tsx`

- [ ] **Step 1: Define and apply custom theme**

Add the theme definition in the `handleMount` callback and switch from `vs-dark` to the custom theme:

```tsx
"use client";

import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  forwardRef,
} from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import type { editor } from "monaco-editor";

export interface MonacoEditorProps {
  defaultValue: string;
  onChange: (value: string) => void;
  language?: string;
  readOnly?: boolean;
  exerciseId: string;
}

export interface MonacoEditorHandle {
  getValue: () => string;
  resetToDefault: () => void;
}

function storageKey(exerciseId: string): string {
  return `cpproad:editor:${exerciseId}`;
}

function loadFromStorage(exerciseId: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(storageKey(exerciseId));
  } catch {
    return null;
  }
}

function saveToStorage(exerciseId: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(exerciseId), value);
  } catch {
    // localStorage full or unavailable
  }
}

const MonacoEditor = forwardRef<MonacoEditorHandle, MonacoEditorProps>(
  function MonacoEditor(
    { defaultValue, onChange, language = "cpp", readOnly = false, exerciseId },
    ref,
  ) {
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const initialValue = loadFromStorage(exerciseId) ?? defaultValue;

    useImperativeHandle(ref, () => ({
      getValue() {
        return editorRef.current?.getValue() ?? initialValue;
      },
      resetToDefault() {
        editorRef.current?.setValue(defaultValue);
        saveToStorage(exerciseId, defaultValue);
        onChange(defaultValue);
      },
    }));

    const handleChange = useCallback(
      (value: string | undefined) => {
        const v = value ?? "";
        onChange(v);

        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
          saveToStorage(exerciseId, v);
        }, 500);
      },
      [exerciseId, onChange],
    );

    useEffect(() => {
      return () => {
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
      };
    }, []);

    const handleMount: OnMount = useCallback((monacoEditor, monaco) => {
      editorRef.current = monacoEditor;

      monaco.editor.defineTheme("cpproad-dark", {
        base: "vs-dark",
        inherit: false,
        rules: [
          { token: "", foreground: "e6edf3" },
          { token: "comment", foreground: "8b949e", fontStyle: "italic" },
          { token: "keyword", foreground: "ff7b72" },
          { token: "keyword.control", foreground: "ff7b72" },
          { token: "keyword.operator", foreground: "ff7b72" },
          { token: "storage.type", foreground: "ff7b72" },
          { token: "type", foreground: "ff7b72" },
          { token: "string", foreground: "a5d6ff" },
          { token: "string.escape", foreground: "79c0ff" },
          { token: "number", foreground: "79c0ff" },
          { token: "constant", foreground: "79c0ff" },
          { token: "entity.name.function", foreground: "d2a8ff" },
          { token: "support.function", foreground: "d2a8ff" },
          { token: "identifier", foreground: "e6edf3" },
          { token: "variable", foreground: "ffa657" },
          { token: "tag", foreground: "7ee787" },
          { token: "attribute.name", foreground: "79c0ff" },
          { token: "delimiter", foreground: "e6edf3" },
          { token: "delimiter.bracket", foreground: "e6edf3" },
          { token: "operator", foreground: "ff7b72" },
          { token: "namespace", foreground: "ffa657" },
          { token: "annotation", foreground: "d2a8ff" },
          { token: "predefined", foreground: "79c0ff" },
          { token: "invalid", foreground: "f85149" },
        ],
        colors: {
          "editor.background": "#0f1115",
          "editor.foreground": "#e6edf3",
          "editor.lineHighlightBackground": "#161b22",
          "editor.selectionBackground": "#2f81f733",
          "editor.inactiveSelectionBackground": "#2f81f722",
          "editorLineNumber.foreground": "#6e7681",
          "editorLineNumber.activeForeground": "#8b949e",
          "editorCursor.foreground": "#58a6ff",
          "editor.selectionHighlightBackground": "#2f81f722",
          "editorIndentGuide.background": "#23262d",
          "editorIndentGuide.activeBackground": "#30363d",
          "editorBracketMatch.background": "#2f81f733",
          "editorBracketMatch.border": "#2f81f7",
          "editorWidget.background": "#161b22",
          "editorWidget.border": "#30363d",
          "editorSuggestWidget.background": "#161b22",
          "editorSuggestWidget.border": "#30363d",
          "editorSuggestWidget.selectedBackground": "#1c2128",
          "input.background": "#0f1115",
          "input.border": "#30363d",
          "input.foreground": "#e6edf3",
          "scrollbarSlider.background": "#23262d80",
          "scrollbarSlider.hoverBackground": "#30363d80",
          "scrollbarSlider.activeBackground": "#8b949e40",
        },
      });

      monaco.editor.setTheme("cpproad-dark");
    }, []);

    return (
      <Editor
        height="100%"
        defaultLanguage={language}
        defaultValue={initialValue}
        onMount={handleMount}
        onChange={handleChange}
        theme="vs-dark"
        options={{
          fontSize: 14,
          minimap: { enabled: false },
          lineNumbers: "on",
          readOnly,
          scrollBeyondLastLine: false,
          wordWrap: "on",
          automaticLayout: true,
          padding: { top: 12, bottom: 12 },
          tabSize: 4,
          insertSpaces: true,
          renderWhitespace: "selection",
          bracketPairColorization: { enabled: true },
        }}
        loading={
          <div className="flex h-full items-center justify-center text-muted">
            Loading editor...
          </div>
        }
      />
    );
  },
);

export default MonacoEditor;
```

Key changes:
- `handleMount` now accepts `(monacoEditor, monaco)` to access the monaco namespace
- Defines `cpproad-dark` theme with GitHub-dark token colors and surface colors
- Calls `monaco.editor.setTheme("cpproad-dark")` after definition
- Initial `theme="vs-dark"` prop is the fallback before mount; the custom theme overrides it
- Loading state uses `text-muted` instead of `text-neutral-500`

- [ ] **Step 2: Verify editor renders with new theme**

Run: `npm run dev`, navigate to any lesson page.
Expected: Editor shows with dark blue-tinted background, red keywords, purple functions, blue strings.

- [ ] **Step 3: Commit**

```bash
git add components/editor/MonacoEditor.tsx
git commit -m "style: add custom GitHub-dark Monaco theme"
```

---

### Task 11: Final Build Verification

- [ ] **Step 1: Run lint**

Run: `npm run lint`
Expected: No errors (warnings acceptable if pre-existing).

- [ ] **Step 2: Run production build**

Run: `npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 3: Visual verification via dev server**

Run: `npm run dev`

Check these pages:
1. `/dashboard` — sidebar uses blue badges/bars, header has monospace wordmark, continue learning card has white CTA
2. Any lesson page — editor has custom dark theme with colored syntax, toolbar and output panel use new surfaces, submit button is white
3. Colors are cohesive with homepage (`/`)

- [ ] **Step 4: Final commit if any adjustments were needed**

```bash
git add -A
git commit -m "style: final visual adjustments for dashboard/editor refresh"
```

(Skip this step if no adjustments were needed.)

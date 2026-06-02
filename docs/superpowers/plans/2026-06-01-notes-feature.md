# Notes Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add per-lesson user notes with a floating notepad on lesson pages, a chapter-grouped overview at `/notes`, and a dedicated full-page editor at `/notes/[slug]`.

**Architecture:** New `notes` table in Supabase with `(user_id, lesson_id)` composite PK and RLS. Two API routes (PATCH upsert, GET all). A shared `MarkdownEditor` component used by both the floating notepad overlay and the dedicated view. The floating notepad is a draggable/resizable panel toggled from the lesson nav bar. The overview page is a server component using shadcn accordion.

**Tech Stack:** Next.js 14 App Router, Supabase (Postgres + RLS), shadcn/ui (accordion, textarea, toggle-group, breadcrumb, tooltip, badge, card, button, input, scroll-area, separator, skeleton), react-markdown (already installed), react-syntax-highlighter (already installed via SummaryView), remark-gfm (new), lucide-react (already installed — project icon library).

**Spec:** `docs/superpowers/specs/2026-06-01-notes-feature-design.md`

---

## File Structure

```
infra/supabase/migrations/008_notes.sql        # CREATE TABLE + index + RLS
lib/supabase/types.ts                           # MODIFY: add notes table types
lib/notes/use-note.ts                           # Hook: fetch + auto-save + debounce
lib/notes/use-notepad-position.ts               # Hook: drag/resize localStorage
app/api/notes/route.ts                          # GET all user notes
app/api/notes/[lessonId]/route.ts               # PATCH upsert note
components/notes/MarkdownPreview.tsx             # Shared markdown renderer for notes
components/notes/MarkdownEditor.tsx              # Shared editor: toolbar + textarea + preview
components/notes/SaveStatus.tsx                  # "Saving..." / "Saved" indicator
components/notes/FloatingNotepad.tsx             # Draggable overlay notepad
components/notes/NoteCard.tsx                    # Note entry row in overview
app/(app)/notes/page.tsx                        # Notes overview (server component)
app/(app)/notes/[slug]/page.tsx                 # Dedicated note view (server component)
app/(app)/notes/[slug]/NoteEditor.tsx           # Client component for full-page editor
app/(app)/lessons/[slug]/LessonClient.tsx       # MODIFY: add Notes toggle to nav bar
components/layout/TopBar.tsx                    # MODIFY: add Notes link
```

---

### Task 1: Database Migration & Types

**Files:**
- Create: `infra/supabase/migrations/008_notes.sql`
- Modify: `lib/supabase/types.ts`

- [ ] **Step 1: Create the migration file**

```sql
-- 008_notes.sql — Per-lesson user notes with Markdown content

CREATE TABLE notes (
    user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lesson_id  UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    content    TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, lesson_id)
);

CREATE INDEX idx_notes_user ON notes(user_id, updated_at DESC);

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY own_notes ON notes FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

Write this to `infra/supabase/migrations/008_notes.sql`.

- [ ] **Step 2: Add notes types to `lib/supabase/types.ts`**

Add the `notes` table definition inside `Database["public"]["Tables"]`, after the `user_stats` entry (before the closing `};` of `Tables`):

```typescript
      notes: {
        Row: {
          user_id: string;
          lesson_id: string;
          content: string;
          updated_at: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          lesson_id: string;
          content?: string;
          updated_at?: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          lesson_id?: string;
          content?: string;
          updated_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
```

Also add the convenience alias at the bottom of the file with the other aliases:

```typescript
export type Note = Database["public"]["Tables"]["notes"]["Row"];
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors related to notes types.

- [ ] **Step 4: Commit**

```bash
git add infra/supabase/migrations/008_notes.sql lib/supabase/types.ts
git commit -m "feat(notes): add notes table migration and TypeScript types"
```

---

### Task 2: Install Dependencies & shadcn Components

**Files:**
- Modify: `package.json`, `package-lock.json`
- Create: `components/ui/textarea.tsx`, `components/ui/accordion.tsx`

- [ ] **Step 1: Install npm packages**

Run: `npm install remark-gfm`

`react-markdown` and `react-syntax-highlighter` are already installed. `remark-gfm` adds GFM support (tables, strikethrough, task lists).

- [ ] **Step 2: Install shadcn textarea component**

Run: `npx shadcn@latest add textarea`

- [ ] **Step 3: Install shadcn accordion component**

Run: `npx shadcn@latest add accordion`

- [ ] **Step 4: Install shadcn scroll-area component (if not present)**

Run: `ls components/ui/scroll-area.tsx 2>/dev/null || npx shadcn@latest add scroll-area`

- [ ] **Step 5: Verify build**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No new errors.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json components/ui/textarea.tsx components/ui/accordion.tsx components/ui/scroll-area.tsx
git commit -m "chore(notes): install remark-gfm, shadcn textarea and accordion"
```

---

### Task 3: API Route — PATCH Upsert Note

**Files:**
- Create: `app/api/notes/[lessonId]/route.ts`

- [ ] **Step 1: Create the PATCH route handler**

Create `app/api/notes/[lessonId]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/require-auth";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { lessonId: string } },
) {
  const supabase = createRouteClient();

  const authResult = await requireAuth(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const userId = authResult.session.user.id;

  const { lessonId } = params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const content = (body as Record<string, unknown>)?.content;
  if (typeof content !== "string") {
    return NextResponse.json(
      { error: "content must be a string" },
      { status: 400 },
    );
  }

  const now = new Date().toISOString();

  const { error } = await supabase.from("notes").upsert(
    {
      user_id: userId,
      lesson_id: lessonId,
      content,
      updated_at: now,
    },
    { onConflict: "user_id,lesson_id" },
  );

  if (error) {
    return NextResponse.json({ error: "Failed to save note" }, { status: 500 });
  }

  return NextResponse.json({ updatedAt: now });
}
```

- [ ] **Step 2: Manually test with curl (dev server running)**

Run: `curl -s -X PATCH http://localhost:3000/api/notes/SOME_LESSON_ID -H 'Content-Type: application/json' -d '{"content":"test"}' | head -5`

Expected: `{"error":"Unauthorized"}` with status 401 (no auth cookie = correct rejection).

- [ ] **Step 3: Commit**

```bash
git add app/api/notes/\[lessonId\]/route.ts
git commit -m "feat(notes): add PATCH /api/notes/[lessonId] upsert route"
```

---

### Task 4: API Route — GET All Notes

**Files:**
- Create: `app/api/notes/route.ts`

- [ ] **Step 1: Create the GET route handler**

Create `app/api/notes/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/require-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createRouteClient();

  const authResult = await requireAuth(supabase);
  if (authResult instanceof NextResponse) return authResult;

  const { data, error } = await supabase
    .from("notes")
    .select(
      "lesson_id, content, updated_at, lessons!inner(slug, learncpp_title, my_title, number, sort_order, chapter_id, chapters!inner(learncpp_title, sort_order))",
    )
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 });
  }

  const notes = (data ?? []).map((row: Record<string, unknown>) => {
    const lesson = row.lessons as Record<string, unknown>;
    const chapter = lesson.chapters as Record<string, unknown>;
    return {
      lessonId: row.lesson_id,
      lessonSlug: lesson.slug,
      lessonTitle: (lesson.my_title as string) ?? (lesson.learncpp_title as string),
      lessonNumber: lesson.number,
      chapterTitle: chapter.learncpp_title,
      chapterSortOrder: chapter.sort_order,
      lessonSortOrder: lesson.sort_order,
      content: row.content,
      updatedAt: row.updated_at,
    };
  });

  return NextResponse.json({ notes });
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No new errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/notes/route.ts
git commit -m "feat(notes): add GET /api/notes route for overview"
```

---

### Task 5: `use-note` Hook — Fetch, Auto-Save, Debounce

**Files:**
- Create: `lib/notes/use-note.ts`

- [ ] **Step 1: Create the hook**

Create `lib/notes/use-note.ts`:

```typescript
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createBrowserClient } from "@/lib/supabase/client";

const DEBOUNCE_MS = 1500;

interface UseNoteReturn {
  content: string;
  setContent: (value: string) => void;
  saveStatus: "idle" | "saving" | "saved" | "error";
  isLoading: boolean;
}

export function useNote(lessonId: string): UseNoteReturn {
  const [content, setContentState] = useState("");
  const [saveStatus, setSaveStatus] = useState<UseNoteReturn["saveStatus"]>("idle");
  const [isLoading, setIsLoading] = useState(true);
  const contentRef = useRef(content);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    async function fetchNote() {
      const supabase = createBrowserClient();
      const { data } = await supabase
        .from("notes")
        .select("content")
        .eq("lesson_id", lessonId)
        .maybeSingle();

      if (cancelled) return;
      setContentState(data?.content ?? "");
      contentRef.current = data?.content ?? "";
      setIsLoading(false);
      setSaveStatus("idle");
    }

    fetchNote();
    return () => {
      cancelled = true;
    };
  }, [lessonId]);

  const save = useCallback(
    async (value: string) => {
      setSaveStatus("saving");
      try {
        const res = await fetch(`/api/notes/${lessonId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: value }),
        });
        if (!isMountedRef.current) return;
        setSaveStatus(res.ok ? "saved" : "error");
      } catch {
        if (!isMountedRef.current) return;
        setSaveStatus("error");
      }
    },
    [lessonId],
  );

  const setContent = useCallback(
    (value: string) => {
      setContentState(value);
      contentRef.current = value;
      setSaveStatus("idle");

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        save(contentRef.current);
      }, DEBOUNCE_MS);
    },
    [save],
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        if (contentRef.current !== "") {
          save(contentRef.current);
        }
      }
    };
  }, [save]);

  return { content, setContent, saveStatus, isLoading };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | grep "use-note" | head -5`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add lib/notes/use-note.ts
git commit -m "feat(notes): add use-note hook with fetch and debounced auto-save"
```

---

### Task 6: `use-notepad-position` Hook — Drag/Resize in localStorage

**Files:**
- Create: `lib/notes/use-notepad-position.ts`

- [ ] **Step 1: Create the hook**

Create `lib/notes/use-notepad-position.ts`:

```typescript
"use client";

import { useState, useCallback } from "react";

const STORAGE_KEY = "cpproad:notepad:position";

interface NotepadPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  minimized: boolean;
}

const DEFAULT_POSITION: NotepadPosition = {
  x: -1,
  y: -1,
  width: 400,
  height: 350,
  minimized: false,
};

function loadPosition(): NotepadPosition {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_POSITION;
    const parsed = JSON.parse(raw) as Partial<NotepadPosition>;
    return { ...DEFAULT_POSITION, ...parsed };
  } catch {
    return DEFAULT_POSITION;
  }
}

function persistPosition(pos: NotepadPosition) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pos));
  } catch {
    // localStorage unavailable
  }
}

export function useNotepadPosition() {
  const [position, setPositionState] = useState<NotepadPosition>(loadPosition);

  const setPosition = useCallback((update: Partial<NotepadPosition>) => {
    setPositionState((prev) => {
      const next = { ...prev, ...update };
      persistPosition(next);
      return next;
    });
  }, []);

  const toggleMinimized = useCallback(() => {
    setPositionState((prev) => {
      const next = { ...prev, minimized: !prev.minimized };
      persistPosition(next);
      return next;
    });
  }, []);

  return { position, setPosition, toggleMinimized };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | grep "use-notepad-position" | head -5`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add lib/notes/use-notepad-position.ts
git commit -m "feat(notes): add use-notepad-position hook for drag/resize persistence"
```

---

### Task 7: MarkdownPreview Component

**Files:**
- Create: `components/notes/MarkdownPreview.tsx`

- [ ] **Step 1: Create the preview component**

This reuses the same pattern as `components/lesson/SummaryView.tsx` but adds `remark-gfm` support:

Create `components/notes/MarkdownPreview.tsx`:

```typescript
"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import type { Components } from "react-markdown";

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

const components: Components = {
  code({ className, children, ...rest }) {
    const match = /language-(\w+)/.exec(className || "");
    const codeString = String(children).replace(/\n$/, "");

    if (match) {
      return (
        <SyntaxHighlighter
          style={customOneDark}
          language={match[1]}
          PreTag="div"
          customStyle={{ margin: 0, fontSize: "0.8125rem", lineHeight: "1.6" }}
        >
          {codeString}
        </SyntaxHighlighter>
      );
    }

    return (
      <code
        className="rounded-md bg-elevated px-1.5 py-0.5 text-sm font-mono text-accent"
        {...rest}
      >
        {children}
      </code>
    );
  },
};

interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

export function MarkdownPreview({ content, className }: MarkdownPreviewProps) {
  return (
    <div
      className={`prose prose-invert prose-sm max-w-none prose-pre:bg-transparent prose-pre:p-0 prose-headings:text-primary prose-p:text-secondary prose-strong:text-primary prose-a:text-accent prose-a:no-underline hover:prose-a:underline prose-li:text-secondary prose-code:before:content-none prose-code:after:content-none ${className ?? ""}`}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | grep "MarkdownPreview" | head -5`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add components/notes/MarkdownPreview.tsx
git commit -m "feat(notes): add MarkdownPreview component with GFM and syntax highlighting"
```

---

### Task 8: SaveStatus Component

**Files:**
- Create: `components/notes/SaveStatus.tsx`

- [ ] **Step 1: Create the status indicator**

Create `components/notes/SaveStatus.tsx`:

```typescript
"use client";

import { Check, Loader2, AlertCircle } from "lucide-react";

interface SaveStatusProps {
  status: "idle" | "saving" | "saved" | "error";
}

export function SaveStatus({ status }: SaveStatusProps) {
  if (status === "idle") return null;

  return (
    <span className="flex items-center gap-1 text-xs text-muted">
      {status === "saving" && (
        <>
          <Loader2 className="h-3 w-3 animate-spin" />
          Saving…
        </>
      )}
      {status === "saved" && (
        <>
          <Check className="h-3 w-3 text-success" />
          Saved
        </>
      )}
      {status === "error" && (
        <>
          <AlertCircle className="h-3 w-3 text-error" />
          Error
        </>
      )}
    </span>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/notes/SaveStatus.tsx
git commit -m "feat(notes): add SaveStatus indicator component"
```

---

### Task 9: MarkdownEditor Component (Shared)

**Files:**
- Create: `components/notes/MarkdownEditor.tsx`

- [ ] **Step 1: Create the shared editor**

This is the core editing component used by both the floating notepad and the dedicated view. It contains the formatting toolbar, textarea, and preview toggle.

Create `components/notes/MarkdownEditor.tsx`:

```typescript
"use client";

import { useCallback, useRef } from "react";
import { Bold, Italic, Code, List, Heading2, CodeSquare } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MarkdownPreview } from "@/components/notes/MarkdownPreview";

interface MarkdownEditorProps {
  content: string;
  onChange: (value: string) => void;
  mode: "edit" | "preview";
  onModeChange: (mode: "edit" | "preview") => void;
  className?: string;
  textareaClassName?: string;
}

type FormatAction = "bold" | "italic" | "code" | "codeBlock" | "list" | "heading";

const FORMAT_CONFIG: { action: FormatAction; icon: typeof Bold; label: string }[] = [
  { action: "bold", icon: Bold, label: "Bold" },
  { action: "italic", icon: Italic, label: "Italic" },
  { action: "code", icon: Code, label: "Inline code" },
  { action: "codeBlock", icon: CodeSquare, label: "Code block" },
  { action: "list", icon: List, label: "Bullet list" },
  { action: "heading", icon: Heading2, label: "Heading" },
];

function applyFormat(
  textarea: HTMLTextAreaElement,
  action: FormatAction,
  content: string,
  onChange: (v: string) => void,
) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = content.slice(start, end);
  let replacement: string;
  let cursorOffset: number;

  switch (action) {
    case "bold":
      replacement = `**${selected || "bold text"}**`;
      cursorOffset = selected ? replacement.length : 2;
      break;
    case "italic":
      replacement = `*${selected || "italic text"}*`;
      cursorOffset = selected ? replacement.length : 1;
      break;
    case "code":
      replacement = `\`${selected || "code"}\``;
      cursorOffset = selected ? replacement.length : 1;
      break;
    case "codeBlock":
      replacement = `\n\`\`\`cpp\n${selected || "// code here"}\n\`\`\`\n`;
      cursorOffset = 8;
      break;
    case "list":
      replacement = selected
        ? selected.split("\n").map((line) => `- ${line}`).join("\n")
        : "- ";
      cursorOffset = replacement.length;
      break;
    case "heading":
      replacement = `## ${selected || "Heading"}`;
      cursorOffset = selected ? replacement.length : 3;
      break;
  }

  const newContent = content.slice(0, start) + replacement + content.slice(end);
  onChange(newContent);

  requestAnimationFrame(() => {
    textarea.focus();
    const pos = start + cursorOffset;
    textarea.setSelectionRange(pos, pos);
  });
}

export function MarkdownEditor({
  content,
  onChange,
  mode,
  onModeChange,
  className,
  textareaClassName,
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleFormat = useCallback(
    (action: FormatAction) => {
      if (!textareaRef.current) return;
      applyFormat(textareaRef.current, action, content, onChange);
    },
    [content, onChange],
  );

  return (
    <div className={`flex flex-col ${className ?? ""}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-2 py-1.5">
        <TooltipProvider delayDuration={300}>
          {FORMAT_CONFIG.map(({ action, icon: Icon, label }) => (
            <Tooltip key={action}>
              <TooltipTrigger asChild>
                <Toggle
                  size="sm"
                  aria-label={label}
                  disabled={mode === "preview"}
                  onPressedChange={() => handleFormat(action)}
                  className="h-7 w-7 p-0"
                >
                  <Icon className="h-3.5 w-3.5" />
                </Toggle>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {label}
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>

        <Separator orientation="vertical" className="mx-1 h-5" />

        <ToggleGroup
          type="single"
          value={mode}
          onValueChange={(v) => {
            if (v === "edit" || v === "preview") onModeChange(v);
          }}
          size="sm"
        >
          <ToggleGroupItem value="edit" className="h-7 px-2 text-xs">
            Edit
          </ToggleGroupItem>
          <ToggleGroupItem value="preview" className="h-7 px-2 text-xs">
            Preview
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <Separator />

      {/* Content area */}
      {mode === "edit" ? (
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Start writing notes…"
          className={`flex-1 resize-none rounded-none border-0 bg-transparent font-mono text-sm focus-visible:ring-0 ${textareaClassName ?? ""}`}
        />
      ) : (
        <ScrollArea className={`flex-1 p-3 ${textareaClassName ?? ""}`}>
          {content ? (
            <MarkdownPreview content={content} />
          ) : (
            <p className="text-sm text-muted">Nothing to preview</p>
          )}
        </ScrollArea>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | grep -i "markdown\|editor" | head -10`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add components/notes/MarkdownEditor.tsx
git commit -m "feat(notes): add shared MarkdownEditor with toolbar and preview toggle"
```

---

### Task 10: FloatingNotepad Component

**Files:**
- Create: `components/notes/FloatingNotepad.tsx`

- [ ] **Step 1: Create the floating notepad**

Create `components/notes/FloatingNotepad.tsx`:

```typescript
"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { X, Minus, GripVertical, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MarkdownEditor } from "@/components/notes/MarkdownEditor";
import { SaveStatus } from "@/components/notes/SaveStatus";
import { useNote } from "@/lib/notes/use-note";
import { useNotepadPosition } from "@/lib/notes/use-notepad-position";

interface FloatingNotepadProps {
  lessonId: string;
  onClose: () => void;
}

export function FloatingNotepad({ lessonId, onClose }: FloatingNotepadProps) {
  const { content, setContent, saveStatus, isLoading } = useNote(lessonId);
  const { position, setPosition, toggleMinimized } = useNotepadPosition();
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const panelRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const isResizing = useRef(false);

  useEffect(() => {
    if (position.x === -1 && position.y === -1) {
      setPosition({
        x: window.innerWidth - position.width - 24,
        y: window.innerHeight - position.height - 24,
      });
    }
  }, [position.x, position.y, position.width, position.height, setPosition]);

  const handleDragStart = useCallback(
    (e: React.PointerEvent) => {
      isDragging.current = true;
      dragOffset.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [position.x, position.y],
  );

  const handleDragMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging.current) return;
      setPosition({
        x: Math.max(0, e.clientX - dragOffset.current.x),
        y: Math.max(0, e.clientY - dragOffset.current.y),
      });
    },
    [setPosition],
  );

  const handleDragEnd = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleResizeStart = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      isResizing.current = true;
      const startX = e.clientX;
      const startY = e.clientY;
      const startW = position.width;
      const startH = position.height;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);

      const onMove = (ev: PointerEvent) => {
        if (!isResizing.current) return;
        setPosition({
          width: Math.max(300, startW + (ev.clientX - startX)),
          height: Math.max(250, startH + (ev.clientY - startY)),
        });
      };

      const onUp = () => {
        isResizing.current = false;
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [position.width, position.height, setPosition],
  );

  if (position.minimized) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={toggleMinimized}
              className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-white shadow-lg transition hover:bg-accent/90"
            >
              <Maximize2 className="h-4 w-4" />
              Notes
            </button>
          </TooltipTrigger>
          <TooltipContent>Expand notepad</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div
      ref={panelRef}
      className="fixed z-40 flex flex-col rounded-lg border border-border bg-surface shadow-2xl"
      style={{
        left: position.x,
        top: position.y,
        width: position.width,
        height: position.height,
      }}
    >
      {/* Header — draggable */}
      <div
        className="flex items-center gap-2 border-b border-border px-3 py-2 select-none"
        onPointerDown={handleDragStart}
        onPointerMove={handleDragMove}
        onPointerUp={handleDragEnd}
        style={{ cursor: "grab" }}
      >
        <GripVertical className="h-4 w-4 text-muted" />
        <span className="text-sm font-medium text-primary">Notes</span>
        <SaveStatus status={saveStatus} />

        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={toggleMinimized}
            aria-label="Minimize"
          >
            <Minus className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Editor */}
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center text-sm text-muted">
          Loading note…
        </div>
      ) : (
        <MarkdownEditor
          content={content}
          onChange={setContent}
          mode={mode}
          onModeChange={setMode}
          className="flex-1 min-h-0"
          textareaClassName="min-h-0 flex-1"
        />
      )}

      {/* Resize handle */}
      <div
        onPointerDown={handleResizeStart}
        className="absolute bottom-0 right-0 h-4 w-4 cursor-se-resize"
        aria-hidden
      >
        <svg viewBox="0 0 16 16" className="h-4 w-4 text-muted/50">
          <path d="M14 14L8 14L14 8Z" fill="currentColor" />
        </svg>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | grep -i "floating\|notepad" | head -10`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add components/notes/FloatingNotepad.tsx
git commit -m "feat(notes): add FloatingNotepad draggable overlay component"
```

---

### Task 11: Integrate Notepad Toggle into Lesson Nav Bar

**Files:**
- Modify: `app/(app)/lessons/[slug]/LessonClient.tsx`

- [ ] **Step 1: Add notepad state and toggle to LessonClient**

In `LessonClient.tsx`, make these changes:

1. Add imports at the top:

```typescript
import dynamic from "next/dynamic";
// ... existing dynamic imports ...

const FloatingNotepad = dynamic(() =>
  import("@/components/notes/FloatingNotepad").then((m) => ({ default: m.FloatingNotepad })),
  { ssr: false },
);
```

2. Add state inside the `LessonClient` component function, near the other state declarations:

```typescript
const [notepadOpen, setNotepadOpen] = useState(false);
```

3. In the desktop return JSX, pass `notepadOpen` and `onToggleNotepad` to `LessonNav`:

Update the `<LessonNav>` call to include:
```typescript
notepadOpen={notepadOpen}
onToggleNotepad={() => setNotepadOpen((prev) => !prev)}
```

4. Add the `FloatingNotepad` render right before the closing `</div>` of the main container (after the tutor panel section):

```typescript
{notepadOpen && !isMobile && (
  <FloatingNotepad lessonId={lesson.id} onClose={() => setNotepadOpen(false)} />
)}
```

5. Update the `LessonNav` function signature and body — add `notepadOpen?: boolean` and `onToggleNotepad?: () => void` to the props interface, and add a "Notes" button in the nav bar, right before the Tutor button:

```typescript
{onToggleNotepad && (
  <>
    <div className="h-4 w-px bg-border mx-1" />
    <button
      onClick={onToggleNotepad}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
        notepadOpen
          ? "bg-accent/15 text-accent"
          : "text-secondary hover:text-primary hover:bg-hover"
      }`}
      title={notepadOpen ? "Hide notes" : "Show notes"}
    >
      <NotesIcon />
      Notes
    </button>
  </>
)}
```

6. Add the `NotesIcon` function at the bottom of the file with the other icon functions:

```typescript
function NotesIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-4 w-4"
    >
      <path
        fillRule="evenodd"
        d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm2.25 8.5a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zm0 3a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5z"
        clipRule="evenodd"
      />
    </svg>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles and dev server renders**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors.

Start the dev server and navigate to a lesson page. Verify the "Notes" button appears in the nav bar next to Tutor. Click it — the floating notepad should appear.

- [ ] **Step 3: Commit**

```bash
git add app/\(app\)/lessons/\[slug\]/LessonClient.tsx
git commit -m "feat(notes): integrate floating notepad toggle into lesson nav bar"
```

---

### Task 12: NoteCard Component for Overview

**Files:**
- Create: `components/notes/NoteCard.tsx`

- [ ] **Step 1: Create the note card**

Create `components/notes/NoteCard.tsx`:

```typescript
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface NoteCardProps {
  lessonSlug: string;
  lessonNumber: string;
  lessonTitle: string;
  contentPreview: string;
  updatedAt: string;
}

function stripMarkdown(md: string): string {
  return md
    .replace(/[#*`~>\-\[\]()!]/g, "")
    .replace(/\n+/g, " ")
    .trim();
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function NoteCard({
  lessonSlug,
  lessonNumber,
  lessonTitle,
  contentPreview,
  updatedAt,
}: NoteCardProps) {
  const snippet = stripMarkdown(contentPreview).slice(0, 80);

  return (
    <Link
      href={`/notes/${lessonSlug}`}
      className="flex items-start gap-3 rounded-lg border border-border bg-surface px-4 py-3 transition hover:bg-hover group"
    >
      <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded bg-accent/10 text-[10px] font-bold text-accent">
        {lessonNumber}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-primary group-hover:text-accent transition-colors truncate">
          {lessonTitle}
        </p>
        {snippet && (
          <p className="mt-0.5 text-xs text-muted truncate">{snippet}…</p>
        )}
      </div>
      <Badge variant="secondary" className="shrink-0 text-[10px]">
        {relativeTime(updatedAt)}
      </Badge>
    </Link>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/notes/NoteCard.tsx
git commit -m "feat(notes): add NoteCard component for overview list"
```

---

### Task 13: Notes Overview Page (`/notes`)

**Files:**
- Create: `app/(app)/notes/page.tsx`

- [ ] **Step 1: Create the overview page**

Create `app/(app)/notes/page.tsx`:

```typescript
import { requireServerSession } from "@/lib/auth/require-auth";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { NoteCard } from "@/components/notes/NoteCard";
import { NotesSearch } from "./NotesSearch";

interface NoteRow {
  lessonId: string;
  lessonSlug: string;
  lessonTitle: string;
  lessonNumber: string;
  chapterTitle: string;
  chapterSortOrder: number;
  lessonSortOrder: number;
  content: string;
  updatedAt: string;
}

interface ChapterGroup {
  title: string;
  sortOrder: number;
  notes: NoteRow[];
}

export default async function NotesOverviewPage() {
  const { supabase } = await requireServerSession();

  const { data, error } = await supabase
    .from("notes")
    .select(
      "lesson_id, content, updated_at, lessons!inner(slug, learncpp_title, my_title, number, sort_order, chapter_id, chapters!inner(learncpp_title, sort_order))",
    )
    .order("updated_at", { ascending: false });

  if (error) {
    return (
      <div className="mx-auto max-w-[800px] px-6 py-8">
        <p className="text-sm text-error">Failed to load notes.</p>
      </div>
    );
  }

  const notes: NoteRow[] = (data ?? []).map((row: Record<string, unknown>) => {
    const lesson = row.lessons as Record<string, unknown>;
    const chapter = lesson.chapters as Record<string, unknown>;
    return {
      lessonId: row.lesson_id as string,
      lessonSlug: lesson.slug as string,
      lessonTitle: ((lesson.my_title as string) ?? (lesson.learncpp_title as string)),
      lessonNumber: lesson.number as string,
      chapterTitle: chapter.learncpp_title as string,
      chapterSortOrder: chapter.sort_order as number,
      lessonSortOrder: lesson.sort_order as number,
      content: row.content as string,
      updatedAt: row.updated_at as string,
    };
  });

  if (notes.length === 0) {
    return (
      <div className="mx-auto max-w-[800px] px-6 py-8">
        <h1 className="text-2xl font-bold text-primary mb-2">Notes</h1>
        <p className="text-sm text-muted">
          No notes yet. Open the notepad on any lesson to start.
        </p>
      </div>
    );
  }

  const chapterMap = new Map<string, ChapterGroup>();
  for (const note of notes) {
    const existing = chapterMap.get(note.chapterTitle);
    if (existing) {
      existing.notes.push(note);
    } else {
      chapterMap.set(note.chapterTitle, {
        title: note.chapterTitle,
        sortOrder: note.chapterSortOrder,
        notes: [note],
      });
    }
  }

  const chapters = Array.from(chapterMap.values()).sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );

  for (const ch of chapters) {
    ch.notes.sort((a, b) => a.lessonSortOrder - b.lessonSortOrder);
  }

  return (
    <div className="mx-auto max-w-[800px] px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary">Notes</h1>
        <p className="mt-1 text-sm text-muted">
          {notes.length} note{notes.length !== 1 ? "s" : ""} across{" "}
          {chapters.length} chapter{chapters.length !== 1 ? "s" : ""}
        </p>
      </div>

      <NotesSearch notes={notes} chapters={chapters} />
    </div>
  );
}
```

- [ ] **Step 2: Create the client search wrapper**

Create `app/(app)/notes/NotesSearch.tsx`:

```typescript
"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { NoteCard } from "@/components/notes/NoteCard";

interface NoteRow {
  lessonId: string;
  lessonSlug: string;
  lessonTitle: string;
  lessonNumber: string;
  chapterTitle: string;
  chapterSortOrder: number;
  lessonSortOrder: number;
  content: string;
  updatedAt: string;
}

interface ChapterGroup {
  title: string;
  sortOrder: number;
  notes: NoteRow[];
}

interface NotesSearchProps {
  notes: NoteRow[];
  chapters: ChapterGroup[];
}

export function NotesSearch({ notes, chapters }: NotesSearchProps) {
  const [query, setQuery] = useState("");

  const lowerQuery = query.toLowerCase().trim();

  const filteredChapters = lowerQuery
    ? chapters
        .map((ch) => ({
          ...ch,
          notes: ch.notes.filter(
            (n) =>
              n.lessonTitle.toLowerCase().includes(lowerQuery) ||
              n.content.toLowerCase().includes(lowerQuery),
          ),
        }))
        .filter((ch) => ch.notes.length > 0)
    : chapters;

  return (
    <>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search notes…"
          className="pl-9"
        />
      </div>

      {filteredChapters.length === 0 ? (
        <p className="text-sm text-muted py-4">No notes match your search.</p>
      ) : (
        <Accordion type="multiple" defaultValue={filteredChapters.map((ch) => ch.title)}>
          {filteredChapters.map((chapter) => (
            <AccordionItem key={chapter.title} value={chapter.title}>
              <AccordionTrigger className="text-sm font-semibold text-primary">
                {chapter.title}
                <span className="ml-2 text-xs font-normal text-muted">
                  ({chapter.notes.length})
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 py-1">
                  {chapter.notes.map((note) => (
                    <NoteCard
                      key={note.lessonId}
                      lessonSlug={note.lessonSlug}
                      lessonNumber={note.lessonNumber}
                      lessonTitle={note.lessonTitle}
                      contentPreview={note.content}
                      updatedAt={note.updatedAt}
                    />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add app/\(app\)/notes/page.tsx app/\(app\)/notes/NotesSearch.tsx
git commit -m "feat(notes): add notes overview page with search and chapter accordion"
```

---

### Task 14: Dedicated Note View (`/notes/[slug]`)

**Files:**
- Create: `app/(app)/notes/[slug]/page.tsx`
- Create: `app/(app)/notes/[slug]/NoteEditor.tsx`

- [ ] **Step 1: Create the server page**

Create `app/(app)/notes/[slug]/page.tsx`:

```typescript
import { notFound } from "next/navigation";
import { requireServerSession } from "@/lib/auth/require-auth";
import { createServiceClient } from "@/lib/supabase/server";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { NoteEditor } from "./NoteEditor";

interface Props {
  params: { slug: string };
}

export default async function DedicatedNotePage({ params }: Props) {
  const { supabase } = await requireServerSession();
  const serviceClient = createServiceClient();

  const { data: lesson } = await serviceClient
    .from("lessons")
    .select("id, slug, learncpp_title, my_title, number, chapters!inner(learncpp_title)")
    .eq("slug", params.slug)
    .single();

  if (!lesson) notFound();

  const chapter = lesson.chapters as unknown as { learncpp_title: string };
  const lessonTitle = (lesson.my_title ?? lesson.learncpp_title) as string;

  const { data: note } = await supabase
    .from("notes")
    .select("content, updated_at")
    .eq("lesson_id", lesson.id)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-[800px] px-6 py-8">
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/notes">Notes</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <span className="text-muted">{chapter.learncpp_title}</span>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{lessonTitle}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-primary">
            {lesson.number} — {lessonTitle}
          </h1>
        </div>
        <a
          href={`/lessons/${lesson.slug}`}
          className="text-xs font-medium text-accent hover:underline"
        >
          Open lesson →
        </a>
      </div>

      <NoteEditor
        lessonId={lesson.id}
        initialContent={note?.content ?? ""}
      />
    </div>
  );
}
```

- [ ] **Step 2: Create the client editor component**

Create `app/(app)/notes/[slug]/NoteEditor.tsx`:

```typescript
"use client";

import { useState } from "react";
import { MarkdownEditor } from "@/components/notes/MarkdownEditor";
import { SaveStatus } from "@/components/notes/SaveStatus";
import { useNote } from "@/lib/notes/use-note";

interface NoteEditorProps {
  lessonId: string;
  initialContent: string;
}

export function NoteEditor({ lessonId }: NoteEditorProps) {
  const { content, setContent, saveStatus, isLoading } = useNote(lessonId);
  const [mode, setMode] = useState<"edit" | "preview">("edit");

  if (isLoading) {
    return (
      <div className="flex h-[500px] items-center justify-center rounded-lg border border-border bg-surface text-sm text-muted">
        Loading note…
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-surface overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="text-sm font-medium text-primary">Note</span>
        <SaveStatus status={saveStatus} />
      </div>
      <MarkdownEditor
        content={content}
        onChange={setContent}
        mode={mode}
        onModeChange={setMode}
        className="h-[500px]"
        textareaClassName="h-full"
      />
    </div>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add app/\(app\)/notes/\[slug\]/page.tsx app/\(app\)/notes/\[slug\]/NoteEditor.tsx
git commit -m "feat(notes): add dedicated note view at /notes/[slug]"
```

---

### Task 15: Add Notes Link to TopBar

**Files:**
- Modify: `components/layout/TopBar.tsx`

- [ ] **Step 1: Add Notes link to TopBar**

In `components/layout/TopBar.tsx`, add a "Notes" link in the nav area between the Tutor link and the avatar menu. Add it right after the `resumeLessonSlug` link block:

```typescript
<Link
  href="/notes"
  className="rounded-md px-2.5 py-1.5 text-xs font-medium text-secondary transition-colors hover:bg-hover hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
  aria-label="View notes"
>
  Notes
</Link>
```

This link is unconditional — it always shows in the TopBar.

- [ ] **Step 2: Test in dev server**

Start dev server. Navigate to dashboard. Verify "Notes" link appears in the TopBar. Click it — should navigate to `/notes`.

- [ ] **Step 3: Commit**

```bash
git add components/layout/TopBar.tsx
git commit -m "feat(notes): add Notes link to TopBar navigation"
```

---

### Task 16: End-to-End Verification

- [ ] **Step 1: Apply database migration**

Run: `npx supabase db push`

If not running Supabase locally, verify the migration SQL is correct by reviewing `infra/supabase/migrations/008_notes.sql`.

- [ ] **Step 2: Start dev server and test the full flow**

Run: `npm run dev`

Test the complete flow:
1. Navigate to dashboard — verify "Notes" link in TopBar
2. Click "Notes" — should see empty state: "No notes yet…"
3. Navigate to any lesson page — verify "Notes" button in lesson nav bar
4. Click "Notes" — floating notepad appears in bottom-right
5. Type some Markdown content (e.g., `# Hello\n\nSome **bold** and \`code\``)
6. Wait ~2 seconds — save indicator should show "Saving…" then "Saved"
7. Toggle to Preview mode — rendered Markdown should appear
8. Drag the notepad by its header — position should update
9. Minimize — should collapse to a pill. Click pill — should restore
10. Close and reopen — content should persist
11. Navigate to `/notes` — should see the note in the chapter accordion
12. Click the note — should open at `/notes/[slug]` with the same content
13. Edit in the dedicated view — save should work
14. Return to the lesson — notepad should show the updated content

- [ ] **Step 3: Verify build compiles**

Run: `npm run build 2>&1 | tail -20`
Expected: Build succeeds with no errors.

- [ ] **Step 4: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix(notes): address integration issues from end-to-end testing"
```

Only commit this step if fixes were needed.

---

### Task 17: Update CLAUDE.md Component Table

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Add new shadcn components to CLAUDE.md table**

Add these rows to the "Installed components" table in CLAUDE.md:

```markdown
| `accordion` | Notes overview — chapters as expandable sections |
| `textarea` | Note editor writing surface (floating notepad + dedicated view) |
| `scroll-area` | Notes preview scrollable area |
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add accordion, textarea, scroll-area to shadcn component table"
```

Now let me run the self-review.

**Self-review:**

1. **Spec coverage check:**
   - New `notes` table with RLS: Task 1 ✓
   - `PATCH /api/notes/[lessonId]`: Task 3 ✓
   - `GET /api/notes`: Task 4 ✓
   - Floating draggable/resizable notepad: Tasks 10, 11 ✓
   - Full Markdown editor with toolbar: Tasks 7, 8, 9 ✓
   - Edit/preview toggle: Task 9 ✓
   - Auto-save with debounce: Task 5 ✓
   - Overview at `/notes` grouped by chapter accordion: Tasks 12, 13 ✓
   - Dedicated view at `/notes/[slug]`: Task 14 ✓
   - Notes link in TopBar: Task 15 ✓
   - Hidden on mobile: Task 11 (conditional `!isMobile` render) ✓
   - Search bar in overview: Task 13 (NotesSearch component) ✓
   - Install deps (remark-gfm, textarea, accordion): Task 2 ✓
   - Non-goals respected: no export, no AI, no collaboration ✓

2. **Placeholder scan:** No TBDs, TODOs, or vague "add appropriate handling" language. All steps have code.

3. **Type consistency:**
   - `NoteRow` interface: consistent between `NotesSearch.tsx` and `page.tsx` (both define same shape) ✓
   - `useNote` return type: `{ content, setContent, saveStatus, isLoading }` — used consistently in FloatingNotepad (Task 10) and NoteEditor (Task 14) ✓
   - `MarkdownEditorProps`: `content`, `onChange`, `mode`, `onModeChange` — used consistently ✓
   - `SaveStatus` prop: `status: "idle" | "saving" | "saved" | "error"` — matches `useNote` return ✓
   - `FormatAction` type: used internally in MarkdownEditor only ✓
   - `useNotepadPosition` return: `{ position, setPosition, toggleMinimized }` — used in FloatingNotepad ✓

All clean. Plan is complete.

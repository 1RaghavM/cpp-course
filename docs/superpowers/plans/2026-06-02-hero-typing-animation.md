# Hero Typing Animation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a looping live-typing animation to the marketing homepage CodeCard that simulates a real coding session — typing, editing, and restarting.

**Architecture:** Convert `CodeCard` from a server component to a `"use client"` component with a custom `useTypingAnimation` hook. Shiki is dynamically imported on mount for client-side syntax highlighting. A state-machine in the hook drives the typing/editing/fading cycle using `setTimeout`. Cursor is injected into Shiki's HTML output at the correct character offset.

**Tech Stack:** React (hooks, useEffect), Shiki (dynamic import, `createHighlighter`), CSS transitions/keyframes

---

### Task 1: Add CSS for typing cursor and fade transitions

**Files:**
- Modify: `app/(marketing)/homepage.css` (append after line ~927, the heroGlow keyframes block)

- [ ] **Step 1: Add cursor blink keyframe and typing-cursor class**

Append to `app/(marketing)/homepage.css`, inside the code-card section (after the existing `.code-card-body code` rule around line 358):

```css
/* --- Typing animation --- */

.typing-cursor {
  display: inline-block;
  width: 2px;
  height: 1.1em;
  background: var(--color-fg);
  margin-left: 1px;
  vertical-align: text-bottom;
  animation: cursor-blink 1060ms steps(2) infinite;
}

@keyframes cursor-blink {
  0% { opacity: 1; }
  50% { opacity: 0; }
}

.code-card-body {
  min-height: 340px;
  transition: opacity 300ms ease-in;
}

.code-card-fading .code-card-body {
  opacity: 0;
  transition: opacity 500ms ease-out;
}
```

- [ ] **Step 2: Verify CSS parses correctly**

Run: `npm run build 2>&1 | head -20`
Expected: No CSS parse errors. Build may fail for other reasons (that's fine at this step).

- [ ] **Step 3: Commit**

```bash
git add "app/(marketing)/homepage.css"
git commit -m "feat(hero): add typing cursor blink and fade transition CSS"
```

---

### Task 2: Create the useTypingAnimation hook

**Files:**
- Create: `app/(marketing)/components/useTypingAnimation.ts`

- [ ] **Step 1: Create the hook file with all animation logic**

Create `app/(marketing)/components/useTypingAnimation.ts`:

```typescript
"use client";

import { useEffect, useState } from "react";

const INITIAL_CODE = `#include <iostream>
#include <vector>
#include <string>

int main() {
    std::vector<std::string> topics = {
        "variables", "functions",
        "pointers",  "templates"
    };

    for (const auto& topic : topics) {
        std::cout << "Learning: " << topic << "\\n";
    }

    return 0;
}`;

const EDIT_SEARCH = "Learning";
const EDIT_REPLACE = "Mastered";
const EDIT_START = INITIAL_CODE.indexOf(EDIT_SEARCH);
const EDIT_END = EDIT_START + EDIT_SEARCH.length;

const TYPING_MS = 22;
const DELETE_MS = 28;
const PAUSE_MS = 1800;
const FADE_MS = 500;
const RESET_MS = 400;

type Phase =
  | "typing"
  | "pause1"
  | "deleting"
  | "typing_edit"
  | "pause2"
  | "fading"
  | "resetting";

const CURSOR_HTML = '<span class="typing-cursor"></span>';

function injectCursor(html: string, charOffset: number): string {
  let count = 0;
  let i = 0;
  while (i < html.length && count < charOffset) {
    if (html[i] === "<") {
      const end = html.indexOf(">", i);
      if (end === -1) break;
      i = end + 1;
    } else if (html[i] === "&") {
      const semi = html.indexOf(";", i);
      i = (semi !== -1 ? semi : i) + 1;
      count++;
    } else {
      count++;
      i++;
    }
  }
  return html.slice(0, i) + CURSOR_HTML + html.slice(i);
}

export function useTypingAnimation() {
  const [html, setHtml] = useState("");
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let disposed = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let highlighter: { dispose?: () => void } | null = null;

    function schedule(fn: () => void, ms: number) {
      if (disposed) return;
      timer = setTimeout(fn, ms);
    }

    import("shiki").then(async (shiki) => {
      if (disposed) return;
      const hl = await shiki.createHighlighter({
        themes: ["github-dark"],
        langs: ["cpp"],
      });
      if (disposed) {
        hl.dispose();
        return;
      }
      highlighter = hl;

      function render(code: string, cursorAt: number): string {
        if (!code) return CURSOR_HTML;
        const raw = hl.codeToHtml(code, {
          lang: "cpp",
          theme: "github-dark",
        });
        return injectCursor(raw, cursorAt);
      }

      if (reducedMotion) {
        setHtml(
          hl.codeToHtml(INITIAL_CODE, { lang: "cpp", theme: "github-dark" }),
        );
        return;
      }

      let phase: Phase = "typing";
      let idx = 0;

      function tick() {
        if (disposed) return;

        switch (phase) {
          case "typing": {
            if (idx >= INITIAL_CODE.length) {
              phase = "pause1";
              setHtml(render(INITIAL_CODE, INITIAL_CODE.length));
              schedule(tick, PAUSE_MS);
              return;
            }
            let next = idx + 1;
            if (INITIAL_CODE[idx] === "\n") {
              while (
                next < INITIAL_CODE.length &&
                INITIAL_CODE[next] === " "
              ) {
                next++;
              }
            }
            idx = next;
            setHtml(render(INITIAL_CODE.slice(0, next), next));
            schedule(tick, TYPING_MS);
            break;
          }

          case "pause1": {
            phase = "deleting";
            idx = 0;
            tick();
            break;
          }

          case "deleting": {
            if (idx >= EDIT_SEARCH.length) {
              phase = "typing_edit";
              idx = 0;
              tick();
              return;
            }
            idx++;
            const remaining = EDIT_SEARCH.length - idx;
            const text =
              INITIAL_CODE.slice(0, EDIT_START + remaining) +
              INITIAL_CODE.slice(EDIT_END);
            setHtml(render(text, EDIT_START + remaining));
            schedule(tick, DELETE_MS);
            break;
          }

          case "typing_edit": {
            if (idx >= EDIT_REPLACE.length) {
              phase = "pause2";
              const text =
                INITIAL_CODE.slice(0, EDIT_START) +
                EDIT_REPLACE +
                INITIAL_CODE.slice(EDIT_END);
              setHtml(render(text, EDIT_START + EDIT_REPLACE.length));
              schedule(tick, PAUSE_MS);
              return;
            }
            idx++;
            const typed = EDIT_REPLACE.slice(0, idx);
            const text =
              INITIAL_CODE.slice(0, EDIT_START) +
              typed +
              INITIAL_CODE.slice(EDIT_END);
            setHtml(render(text, EDIT_START + idx));
            schedule(tick, TYPING_MS);
            break;
          }

          case "pause2": {
            phase = "fading";
            setIsFading(true);
            schedule(tick, FADE_MS);
            break;
          }

          case "fading": {
            phase = "resetting";
            setHtml("");
            schedule(tick, RESET_MS);
            break;
          }

          case "resetting": {
            setIsFading(false);
            phase = "typing";
            idx = 0;
            schedule(tick, RESET_MS);
            break;
          }
        }
      }

      tick();
    });

    return () => {
      disposed = true;
      if (timer) clearTimeout(timer);
      highlighter?.dispose?.();
    };
  }, []);

  return { html, isFading };
}
```

Key details:
- **Dynamic `import("shiki")`** — Shiki is lazy-loaded on mount so it doesn't block initial page load.
- **`createHighlighter`** is called once; the instance is reused for all frames.
- **`injectCursor`** walks the Shiki HTML output, counting text characters (skipping tags and decoding HTML entities as single chars), and inserts a cursor `<span>` at the target offset.
- **Whitespace batching** — when a newline is encountered during the typing phase, all leading spaces on the next line appear in the same frame (simulates instant indentation after hitting Enter).
- **`disposed` flag** — guards against setState calls after unmount.
- **`prefers-reduced-motion`** — renders static fully-highlighted code with no animation.

- [ ] **Step 2: Type-check the hook**

Run: `npx tsc --noEmit 2>&1 | grep useTypingAnimation || echo "No errors"`
Expected: No errors related to useTypingAnimation.ts

- [ ] **Step 3: Commit**

```bash
git add "app/(marketing)/components/useTypingAnimation.ts"
git commit -m "feat(hero): add useTypingAnimation hook with state machine and cursor injection"
```

---

### Task 3: Rewrite CodeCard as a client component

**Files:**
- Modify: `app/(marketing)/components/CodeCard.tsx` (full rewrite)

- [ ] **Step 1: Replace CodeCard with client component using the hook**

Replace the entire contents of `app/(marketing)/components/CodeCard.tsx` with:

```tsx
"use client";

import { useTypingAnimation } from "./useTypingAnimation";

export function CodeCard() {
  const { html, isFading } = useTypingAnimation();

  return (
    <div className={`code-card editor-card${isFading ? " code-card-fading" : ""}`}>
      <div className="code-card-header">
        <span className="code-card-tab">main.cpp</span>
      </div>
      <div
        className="code-card-body"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
```

Notes:
- Removed the `async` keyword and the server-side `codeToHtml` import.
- `Hero.tsx` (server component) does NOT need changes — it already renders `<CodeCard />` and Next.js handles server-to-client component boundaries automatically.
- The `code-card-fading` class triggers the CSS opacity transition from Task 1.

- [ ] **Step 2: Verify the build passes**

Run: `npm run build 2>&1 | tail -20`
Expected: Build succeeds. No type errors or missing imports.

- [ ] **Step 3: Commit**

```bash
git add "app/(marketing)/components/CodeCard.tsx"
git commit -m "feat(hero): convert CodeCard to client component with live typing animation"
```

---

### Task 4: Visual verification

- [ ] **Step 1: Start dev server and test the animation**

Run: `npm run dev`

Open `http://localhost:3000` (the marketing homepage) in a browser. Verify:

1. The code card is visible in the hero section.
2. Characters appear one at a time with C++ syntax highlighting (colored keywords, strings, etc.).
3. After the code finishes typing, the cursor blinks for ~1.8s.
4. The word "Learning" is deleted character by character (backspace effect).
5. "Mastered" is typed in its place.
6. After another ~1.8s pause, the code card fades out.
7. After a brief reset, the animation restarts from empty.
8. The cycle repeats continuously.

- [ ] **Step 2: Test reduced motion**

In browser DevTools → Rendering panel → check "Emulate CSS media feature prefers-reduced-motion: reduce".

Verify: The code card shows the full, statically-highlighted code with no animation and no cursor.

- [ ] **Step 3: Test mobile viewport**

Resize browser to ~375px width. Verify:
- The code card doesn't overflow horizontally (existing `overflow-x: auto` on `.code-card-body` handles this).
- The animation still runs smoothly.
- The min-height keeps the card from collapsing during reset.

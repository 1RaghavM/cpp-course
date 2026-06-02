# Hero Typing Animation Design

## Overview

Convert the marketing landing page CodeCard from a static server-rendered code block into a looping live-typing animation that simulates a real coding session. Characters appear one at a time with syntax highlighting, then the code is edited (line deleted + replacement typed), creating a continuous loop.

## Target component

`app/(marketing)/components/CodeCard.tsx` — currently a server component using Shiki to render a static C++ snippet inside the marketing Hero section.

## Animation sequence (one cycle)

1. **Type phase (~3s):** Characters appear one at a time at ~30ms/char. Syntax highlighting (Shiki) is applied to the visible substring on each frame.
2. **Pause (~2s):** Full code visible, blinking cursor at end.
3. **Edit phase (~2s):** Backspace-delete a target line character by character, then type a replacement line.
4. **Pause (~2s):** Modified code visible, blinking cursor.
5. **Fade out (~0.5s):** Opacity transitions to 0.
6. **Reset & restart:** Clear state, fade back in, begin typing from empty.

Total cycle: ~10s.

## Technical approach

### Client component with Shiki browser bundle

- Convert CodeCard from server component to `"use client"`.
- Use `shiki/bundle/web` (browser WASM bundle) to highlight code client-side.
- Call `createHighlighter()` once on mount; cache the instance in a ref.
- On each animation frame, highlight the visible substring of code and render via `dangerouslySetInnerHTML`.

### Animation state machine

A `useTypingAnimation` hook manages the sequence via a state machine:

```
TYPING -> PAUSE_AFTER_TYPE -> DELETING -> TYPING_EDIT -> PAUSE_AFTER_EDIT -> FADING_OUT -> RESETTING -> TYPING
```

- `useRef` for the highlighter instance, current char index, and timer ID.
- `useState` for the current HTML string and cursor position.
- `setInterval` at ~30ms drives the typing; `setTimeout` handles pauses and fade.
- Cleanup on unmount clears all timers.

### Code content

Initial code (typed out):
```cpp
#include <iostream>
#include <vector>
#include <string>

int main() {
    std::vector<std::string> topics = {
        "variables", "functions",
        "pointers",  "templates"
    };

    for (const auto& topic : topics) {
        std::cout << "Learning: " << topic << "\n";
    }

    return 0;
}
```

Edit operation: delete `"Learning: " <<` portion and replace with `"Mastered: " <<` (a small, visible change that demonstrates editing).

### Cursor

A blinking `|` character appended after the last visible character, styled with CSS `@keyframes blink` animation (opacity toggle at 530ms interval). The cursor is injected into the highlighted HTML as an inline `<span>`.

### Reduced motion

Respect `prefers-reduced-motion: reduce`:
- Detect via `window.matchMedia('(prefers-reduced-motion: reduce)')`.
- When active, render the full static code block immediately (current behavior). No animation runs.

### Server-side rendering / fallback

- The component renders the full static code block on the server (SSR) and on first paint.
- The animation starts only after the Shiki highlighter has loaded client-side.
- This means no layout shift and no blank state during hydration.

## Files changed

| File | Change |
|------|--------|
| `app/(marketing)/components/CodeCard.tsx` | Rewrite: server component to client component with typing animation |
| `app/(marketing)/components/Hero.tsx` | No changes needed (already renders `<CodeCard />`) |
| `app/(marketing)/homepage.css` | Add cursor blink keyframes, fade-out transition class |

## Performance considerations

- Shiki WASM bundle loads asynchronously; animation starts only after it's ready.
- `setInterval` at 30ms is well within frame budget and does not trigger layout — only innerHTML swap inside a fixed-size container.
- The highlighter instance is created once and reused for all frames.
- No additional dependencies required (Shiki is already installed).

## Out of scope

- Dashboard Hero typing animation (separate component, different data flow).
- Sound effects or keystroke audio.
- User-configurable typing speed.

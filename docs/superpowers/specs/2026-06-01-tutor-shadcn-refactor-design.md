# Tutor UI shadcn Refactor

Refactor the tutor UI components and parent layouts to replace hand-rolled HTML elements with shadcn/ui primitives and eliminate custom resize logic.

## Scope

### Part 1: Tutor component swaps (`components/tutor/`)

| Component | Current | Target |
|---|---|---|
| **TutorPanel.tsx** | Raw `<button>` for "New chat", raw `<div>` error/quota banners | `<Button variant="outline" size="sm">`, `<Alert>` with custom variant styling |
| **TierBadge.tsx** | Raw `<span>` with manual color classes | `<Badge variant="outline">` with tier-colored className |
| **QuotaIndicator.tsx** | Raw `<span>` styled as pill | `<Badge variant="secondary">` or `<Badge variant="destructive">` based on atCap |
| **MessageList.tsx** | `<div overflow-y-auto>` scroll container | `<ScrollArea>` wrapping messages |
| **FeedbackButtons.tsx** | Raw `<button>` with inline SVG thumbs-up/down | `<ToggleGroup type="single">` + `<ToggleGroupItem>` with lucide `ThumbsUp`/`ThumbsDown` |
| **Composer.tsx** | Raw `<textarea>` + raw `<button>` send/stop | shadcn `<Textarea>` + `<Button>` for send/stop |
| **ExplainErrorButton.tsx** | Raw `<button>` styled as pill | `<Button variant="outline" size="sm" className="rounded-full">` |
| **TutorCoachmark.tsx** | Inline `style={{}}` tooltip popup + raw dismiss button | `<Popover>` with auto-dismiss timer, `<Button variant="ghost" size="icon">` for dismiss |

### Part 2: Layout rewrite (ResizableDivider + VerticalDivider elimination)

**Install:** `npx shadcn@latest add resizable`

**Delete:** `components/tutor/ResizableDivider.tsx` and `components/lesson/VerticalDivider.tsx`

**LessonClient.tsx** changes:
- Replace the 3-panel percentage-width layout with `<ResizablePanelGroup direction="horizontal">` containing 2-3 `<ResizablePanel>` children (lesson / IDE / optional tutor)
- Replace the editor/output vertical split with nested `<ResizablePanelGroup direction="vertical">`
- Remove `divider1`, `divider2`, `editorPercent` state variables
- Remove `handleToggleTutor` logic that manually adjusts percentages — tutor panel toggling is handled by conditionally rendering the `<ResizablePanel>` + `<ResizableHandle>`
- Set `defaultSize`, `minSize`, `maxSize` props on each panel to match current min/max constraints

**PlaygroundClient.tsx** changes:
- Replace 2-panel percentage-width layout with `<ResizablePanelGroup direction="horizontal">` (editor / tutor)
- Replace editor/output vertical split with nested `<ResizablePanelGroup direction="vertical">`
- Remove `dividerLeft`, `editorPercent` state variables
- Same toggle pattern: conditionally render tutor `<ResizablePanel>`

### What stays untouched
- `MarkdownMessage.tsx` — no shadcn equivalent for ReactMarkdown + Prism
- `tutor-store.ts` — state management, no UI
- All API routes (`/api/chat/*`)
- Mobile layouts in both LessonClient and PlaygroundClient (no resize needed on mobile)

## Components needed

| Component | Status |
|---|---|
| `button` | Already installed |
| `badge` | Already installed |
| `alert` | Already installed |
| `scroll-area` | Already installed |
| `textarea` | Already installed |
| `toggle` | Already installed |
| `toggle-group` | Already installed |
| `popover` | Already installed |
| `resizable` | **Needs install** |

## Key decisions

1. **FeedbackButtons**: Using `<ToggleGroup>` but keeping the controlled state + API call pattern — `ToggleGroup` manages visual toggle state, but `send()` still fires the feedback API call
2. **TutorCoachmark**: Using `<Popover>` with `open` controlled by state + timer, rather than sonner (toast), because the coachmark is anchored to a position, not a notification
3. **Alert styling**: The existing error/quota banners use custom colors (`bg-error/10`, `bg-warning/10`) that don't match shadcn's `destructive` variant. Will use Alert's className prop to apply these custom colors rather than fighting the default variant styles
4. **Resizable panels with conditional rendering**: When tutor is toggled off, its `<ResizablePanel>` and adjacent `<ResizableHandle>` are removed from the DOM. The remaining panels auto-fill. This is simpler than hiding/collapsing.
5. **Composer auto-resize**: Keep the `useEffect` that sets textarea height based on scroll height — shadcn's `<Textarea>` has `field-sizing-content` but the max-height cap at 120px is custom logic we need to preserve via className override

## Files modified

- `components/tutor/TutorPanel.tsx`
- `components/tutor/TierBadge.tsx`
- `components/tutor/QuotaIndicator.tsx`
- `components/tutor/MessageList.tsx`
- `components/tutor/FeedbackButtons.tsx`
- `components/tutor/Composer.tsx`
- `components/tutor/ExplainErrorButton.tsx`
- `components/tutor/TutorCoachmark.tsx`
- `app/(app)/lessons/[slug]/LessonClient.tsx`
- `app/(app)/playground/PlaygroundClient.tsx`

## Files deleted

- `components/tutor/ResizableDivider.tsx`
- `components/lesson/VerticalDivider.tsx`

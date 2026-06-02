# Curriculum Map — React Flow

## Summary

A new `/curriculum` page displaying the 16 curriculum modules as interactive nodes on a React Flow canvas. Nodes are grouped by stage (Basics, Memory & OOP, STL & Templates, Advanced) in a top-to-bottom flow. Clicking a module node opens a popover listing its lessons with completion status and navigation links.

## Route

`app/(app)/curriculum/page.tsx` — server component inside the authenticated layout. Accessible from the sidebar navigation.

## Data Flow

1. Server component fetches all lessons and user progress from Supabase (same queries as `app/dashboard/page.tsx`).
2. Calls `buildCurriculum(dbLessons)` from `lib/dashboard/curriculum.ts` to produce the 16-module structure.
3. Passes `curriculum: Module[]` and `lessonProgress: Record<string, string>` as props to the client component.

No new API routes. No new database tables. Reuses existing `buildCurriculum` and progress queries.

## Package

`@xyflow/react` (React Flow v12) — the current package name for React Flow. Installed via npm. No additional plugins needed.

## Layout

Top-to-bottom flow with 4 horizontal rows, one per stage:

```
Row 1 (Basics):          6 modules, left-to-right
Row 2 (Memory & OOP):    4 modules, left-to-right
Row 3 (STL & Templates): 3 modules, left-to-right
Row 4 (Advanced):        3 modules, left-to-right
```

Each row has a stage label rendered as a non-interactive annotation or group node. Modules within a row are connected by horizontal edges. A single vertical edge connects the last module of each row to the first module of the next row.

Node positions are computed statically from the curriculum data (no auto-layout library needed — 16 nodes with known groupings).

## Module Node (`ModuleNode`)

Custom React Flow node component. Renders as a shadcn Card with:

- **Title**: module name (e.g. "Variables & Types")
- **Progress bar**: shadcn Progress component, filled = completed lessons / total lessons
- **Count label**: "8/12 lessons" text below the progress bar
- **Visual state** based on completion:
  - `completed` — brand color border/accent, checkmark icon
  - `active` — blue glow/ring, pulsing dot or subtle animation
  - `not_started` — neutral/muted border, no special treatment
  - `locked` — dimmed opacity (~50%), lock icon, no click interaction

### State derivation

A module's state is derived from its lessons' progress:
- `completed`: all lessons are `completed` or `skipped`
- `active`: at least one lesson is `in_progress`, OR the module is the first module with any `not_started` lessons (i.e. the user's current frontier)
- `locked`: all preceding modules are not yet completed AND this module has zero progress
- `not_started`: not locked, but no lessons started yet

Locked logic: a module is locked if the previous module (by order) is not completed, UNLESS it's the very first module. This enforces sequential progression at the module level.

## Edges

- **Horizontal edges** (within a stage): connect module N to module N+1. Styled as step edges (`type: 'smoothstep'`).
- **Vertical edges** (between stages): connect last module of stage K to first module of stage K+1. Same edge type.
- **Edge styling**:
  - Completed path: solid, brand color, animated flow dots
  - Active/current: solid, blue
  - Locked/future: dashed, muted color

## Click Interaction — Lesson Popover

Clicking a non-locked module node opens a popover panel positioned relative to the node. Implementation options (in order of preference):

1. **React Flow `NodeToolbar`** from `@xyflow/react` — appears anchored to the node, disappears on click-away.
2. **Positioned absolute div** triggered by node click state.

Popover contents:
- Module title as header
- Scrollable list of lessons in order
- Each lesson row: status icon (checkmark / spinner / circle / lock) + lesson title
- Clicking a lesson row navigates to `/lessons/[slug]`
- Clicking outside or pressing Escape closes the popover

## Canvas Configuration

```tsx
<ReactFlow
  nodes={nodes}
  edges={edges}
  nodeTypes={nodeTypes}
  fitView
  fitViewOptions={{ padding: 0.2 }}
  nodesDraggable={false}
  nodesConnectable={false}
  elementsSelectable={false}
  panOnScroll
  zoomOnScroll
  minZoom={0.3}
  maxZoom={1.5}
  proOptions={{ hideAttribution: false }}
>
  <Background variant="dots" />
  <Controls showInteractive={false} />
</ReactFlow>
```

Read-only canvas: no drag, no connect, no select. Pan and zoom only.

## Component Structure

```
app/(app)/curriculum/
  page.tsx              — server component, data fetching
  CurriculumClient.tsx  — 'use client', receives data, renders ReactFlow

components/curriculum/
  ModuleNode.tsx        — custom node component (Card + progress)
  LessonPopover.tsx     — popover shown on node click
  curriculum-utils.ts   — node/edge position calculation from Module[]
```

## Sidebar Integration

Add a "Curriculum" link to the app sidebar (`components/app-sidebar.tsx` or equivalent) pointing to `/curriculum`. Use a `Map` or `GitBranch` lucide icon.

## Styling

- Node cards use the existing shadcn Card component with custom border colors per state.
- Progress bar uses shadcn Progress.
- Colors follow the existing CSS custom properties (`--brand`, `--accent-cyan`, `--node-locked` from `globals.css`).
- React Flow's default styles are imported and themed to match the dark/light mode via CSS variables.
- The canvas background uses React Flow's `<Background>` with dots pattern, colored to match the app background.

## Responsive Behavior

- Desktop: full canvas with pan/zoom, fitView on load.
- Mobile: same canvas, but `fitView` starts slightly more zoomed in via `fitViewOptions`. Pan and pinch-zoom work natively on touch devices.
- No separate mobile layout — React Flow handles touch interactions.

## What This Does NOT Include

- Lesson-level nodes (only modules).
- Auto-layout algorithms (positions are computed from known structure).
- Drag-and-drop or editing capabilities.
- New API routes or database changes.
- Animations beyond edge flow dots and active node glow.

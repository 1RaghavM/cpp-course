# Curriculum Map Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an interactive React Flow curriculum map at `/curriculum` showing 16 module nodes grouped by stage, with lesson popovers on click.

**Architecture:** Server component fetches lessons + progress from Supabase, passes data to a client component that renders a read-only React Flow canvas. Custom `ModuleNode` component renders each module as a shadcn Card with progress bar. `NodeToolbar` shows lesson list on click.

**Tech Stack:** `@xyflow/react` (React Flow v12), Next.js App Router, shadcn/ui (Card, Progress, ScrollArea), Tailwind CSS, Supabase

---

## File Structure

| File | Responsibility |
|------|---------------|
| `components/curriculum/curriculum-utils.ts` | Converts `Module[]` + progress into React Flow nodes/edges with positions |
| `components/curriculum/ModuleNode.tsx` | Custom React Flow node — Card with title, progress bar, lesson count, status styling |
| `components/curriculum/LessonPopover.tsx` | NodeToolbar content — scrollable lesson list with status icons and navigation links |
| `components/curriculum/CurriculumMap.tsx` | Client component wrapping `<ReactFlow>` with all config, state for selected node |
| `app/(app)/curriculum/page.tsx` | Server component — data fetching, passes props to CurriculumMap |

Existing files modified:
| File | Change |
|------|--------|
| `components/app-sidebar.tsx` | Update "Curriculum" link in `documents` array to point to `/curriculum` |

---

### Task 1: Install `@xyflow/react`

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install the package**

```bash
npm install @xyflow/react
```

- [ ] **Step 2: Verify installation**

```bash
grep @xyflow/react package.json
```

Expected: `"@xyflow/react": "^12.x.x"` in dependencies.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install @xyflow/react for curriculum map"
```

---

### Task 2: Create `curriculum-utils.ts` — node/edge position calculator

**Files:**
- Create: `components/curriculum/curriculum-utils.ts`

This is the pure-logic file. It takes the curriculum data and progress, and returns React Flow nodes and edges. No React, no UI — just data transformation.

- [ ] **Step 1: Create the utility file**

```ts
import type { Node, Edge } from "@xyflow/react";
import type { Module, Stage } from "@/lib/dashboard/types";
import { STAGES } from "@/lib/dashboard/curriculum";

export type ModuleStatus = "completed" | "active" | "not_started" | "locked";

export interface ModuleNodeData {
  title: string;
  completed: number;
  total: number;
  status: ModuleStatus;
  stage: Stage;
  moduleId: string;
  lessons: { id: string; title: string; slug: string; status: string }[];
  [key: string]: unknown;
}

const NODE_WIDTH = 200;
const NODE_HEIGHT = 100;
const H_GAP = 60;
const V_GAP = 120;
const STAGE_LABEL_HEIGHT = 40;

function deriveModuleStatus(
  module: Module,
  lessonProgress: Record<string, string>,
  previousCompleted: boolean,
): ModuleStatus {
  const lessons = module.lessons;
  if (lessons.length === 0) return "not_started";

  const completedCount = lessons.filter((l) => {
    const s = lessonProgress[l.id];
    return s === "completed" || s === "skipped";
  }).length;

  if (completedCount === lessons.length) return "completed";

  const hasAnyProgress = lessons.some((l) => {
    const s = lessonProgress[l.id];
    return s === "in_progress" || s === "completed" || s === "skipped";
  });

  if (hasAnyProgress) return "active";
  if (!previousCompleted) return "locked";
  return "not_started";
}

export function buildFlowData(
  curriculum: Module[],
  lessonProgress: Record<string, string>,
): { nodes: Node<ModuleNodeData>[]; edges: Edge[] } {
  const nodes: Node<ModuleNodeData>[] = [];
  const edges: Edge[] = [];

  const stageGroups = STAGES.map((stage) => ({
    ...stage,
    modules: curriculum
      .filter((m) => m.stage === stage.id)
      .sort((a, b) => a.order - b.order),
  }));

  let yOffset = 0;
  let previousModuleCompleted = true;

  for (const stageGroup of stageGroups) {
    const stageModules = stageGroup.modules;
    const totalRowWidth =
      stageModules.length * NODE_WIDTH + (stageModules.length - 1) * H_GAP;
    const startX = -totalRowWidth / 2 + NODE_WIDTH / 2;

    yOffset += STAGE_LABEL_HEIGHT;

    for (let i = 0; i < stageModules.length; i++) {
      const mod = stageModules[i];
      const status = deriveModuleStatus(mod, lessonProgress, previousModuleCompleted);

      const completedCount = mod.lessons.filter((l) => {
        const s = lessonProgress[l.id];
        return s === "completed" || s === "skipped";
      }).length;

      const lessonList = mod.lessons
        .sort((a, b) => a.order - b.order)
        .map((l) => ({
          id: l.id,
          title: l.title,
          slug: l.slug,
          status: lessonProgress[l.id] ?? "not_started",
        }));

      nodes.push({
        id: mod.id,
        type: "module",
        position: { x: startX + i * (NODE_WIDTH + H_GAP), y: yOffset },
        data: {
          title: mod.title,
          completed: completedCount,
          total: mod.lessons.length,
          status,
          stage: mod.stage,
          moduleId: mod.id,
          lessons: lessonList,
        },
      });

      if (i > 0) {
        const prevMod = stageModules[i - 1];
        edges.push({
          id: `${prevMod.id}->${mod.id}`,
          source: prevMod.id,
          target: mod.id,
          type: "smoothstep",
          animated: status === "completed" || status === "active",
          style: {
            stroke:
              status === "completed" || status === "active"
                ? "var(--color-brand-bright)"
                : "var(--node-locked)",
            strokeDasharray: status === "locked" ? "6 3" : undefined,
          },
        });
      }

      previousModuleCompleted = status === "completed";
    }

    yOffset += NODE_HEIGHT + V_GAP;
  }

  // Vertical edges between stages
  for (let s = 0; s < stageGroups.length - 1; s++) {
    const currentStageModules = stageGroups[s].modules;
    const nextStageModules = stageGroups[s + 1].modules;
    if (currentStageModules.length === 0 || nextStageModules.length === 0) continue;

    const lastMod = currentStageModules[currentStageModules.length - 1];
    const firstMod = nextStageModules[0];
    const firstModStatus = nodes.find((n) => n.id === firstMod.id)?.data.status;

    edges.push({
      id: `${lastMod.id}->${firstMod.id}`,
      source: lastMod.id,
      target: firstMod.id,
      type: "smoothstep",
      animated: firstModStatus === "completed" || firstModStatus === "active",
      style: {
        stroke:
          firstModStatus === "completed" || firstModStatus === "active"
            ? "var(--color-brand-bright)"
            : "var(--node-locked)",
        strokeDasharray: firstModStatus === "locked" ? "6 3" : undefined,
      },
    });
  }

  return { nodes, edges };
}
```

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit components/curriculum/curriculum-utils.ts 2>&1 | head -20
```

If there are import resolution issues with `--noEmit` on a single file, run the full build check instead:

```bash
npm run build 2>&1 | tail -20
```

Expected: no type errors in `curriculum-utils.ts`.

- [ ] **Step 3: Commit**

```bash
git add components/curriculum/curriculum-utils.ts
git commit -m "feat(curriculum): add node/edge position calculator"
```

---

### Task 3: Create `ModuleNode.tsx` — custom React Flow node

**Files:**
- Create: `components/curriculum/ModuleNode.tsx`

This is the visual card for each module on the canvas. It must use the `Handle` component from `@xyflow/react` for edge connections, and shadcn Card + Progress for styling.

- [ ] **Step 1: Create the custom node component**

```tsx
"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress, ProgressIndicator, ProgressTrack } from "@/components/ui/progress";
import { CheckCircle2, Lock, Circle } from "lucide-react";
import type { ModuleNodeData } from "./curriculum-utils";

const statusStyles: Record<
  string,
  { border: string; glow: string; icon: React.ReactNode }
> = {
  completed: {
    border: "border-[var(--color-brand)] ring-1 ring-[var(--color-brand)]/30",
    glow: "",
    icon: <CheckCircle2 className="h-4 w-4 text-[var(--color-brand)]" />,
  },
  active: {
    border: "border-[var(--node-active)] ring-2 ring-[var(--glow-blue)]",
    glow: "shadow-[0_0_16px_var(--glow-blue)]",
    icon: <Circle className="h-4 w-4 fill-[var(--node-active)] text-[var(--node-active)]" />,
  },
  not_started: {
    border: "border-border",
    glow: "",
    icon: <Circle className="h-4 w-4 text-muted-foreground" />,
  },
  locked: {
    border: "border-[var(--node-locked)] opacity-50",
    glow: "",
    icon: <Lock className="h-4 w-4 text-muted-foreground" />,
  },
};

function ModuleNodeComponent({ data }: NodeProps) {
  const nodeData = data as unknown as ModuleNodeData;
  const style = statusStyles[nodeData.status] ?? statusStyles.not_started;
  const percent = nodeData.total > 0 ? Math.round((nodeData.completed / nodeData.total) * 100) : 0;

  return (
    <>
      <Handle type="target" position={Position.Left} className="!bg-transparent !border-0 !w-0 !h-0" />
      <Handle type="target" position={Position.Top} id="top" className="!bg-transparent !border-0 !w-0 !h-0" />
      <Card
        size="sm"
        className={`w-[200px] cursor-pointer border-2 transition-all duration-200 select-none ${style.border} ${style.glow}`}
      >
        <CardContent className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-xs font-semibold">{nodeData.title}</span>
            {style.icon}
          </div>
          <Progress value={percent}>
            <ProgressTrack className="h-1">
              <ProgressIndicator
                className={
                  nodeData.status === "completed"
                    ? "bg-[var(--color-brand)]"
                    : nodeData.status === "active"
                      ? "bg-[var(--node-active)]"
                      : "bg-muted-foreground"
                }
              />
            </ProgressTrack>
          </Progress>
          <span className="text-[10px] tabular-nums text-muted-foreground">
            {nodeData.completed}/{nodeData.total} lessons
          </span>
        </CardContent>
      </Card>
      <Handle type="source" position={Position.Right} className="!bg-transparent !border-0 !w-0 !h-0" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!bg-transparent !border-0 !w-0 !h-0" />
    </>
  );
}

export const ModuleNode = memo(ModuleNodeComponent);
```

- [ ] **Step 2: Commit**

```bash
git add components/curriculum/ModuleNode.tsx
git commit -m "feat(curriculum): add ModuleNode custom React Flow node"
```

---

### Task 4: Create `LessonPopover.tsx` — NodeToolbar lesson list

**Files:**
- Create: `components/curriculum/LessonPopover.tsx`

Shows when a module node is clicked. Uses `NodeToolbar` from `@xyflow/react` and shadcn ScrollArea.

- [ ] **Step 1: Create the popover component**

```tsx
"use client";

import { NodeToolbar, Position } from "@xyflow/react";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";
import { CheckCircle2, Circle, Loader2, Lock } from "lucide-react";

interface LessonItem {
  id: string;
  title: string;
  slug: string;
  status: string;
}

interface LessonPopoverProps {
  lessons: LessonItem[];
  moduleTitle: string;
  nodeId: string;
  isVisible: boolean;
}

const statusIcon: Record<string, React.ReactNode> = {
  completed: <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[var(--color-brand)]" />,
  skipped: <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />,
  in_progress: <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-[var(--node-active)]" />,
  not_started: <Circle className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />,
  locked: <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />,
};

export function LessonPopover({ lessons, moduleTitle, nodeId, isVisible }: LessonPopoverProps) {
  return (
    <NodeToolbar
      nodeId={nodeId}
      isVisible={isVisible}
      position={Position.Right}
      offset={12}
      className="z-50"
    >
      <div className="w-64 rounded-xl border bg-card p-3 shadow-lg">
        <h4 className="mb-2 text-xs font-semibold text-card-foreground">{moduleTitle}</h4>
        <ScrollArea className="max-h-56">
          <ul className="flex flex-col gap-0.5">
            {lessons.map((lesson) => (
              <li key={lesson.id}>
                <Link
                  href={`/lessons/${lesson.slug}`}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-card-foreground transition-colors hover:bg-accent"
                >
                  {statusIcon[lesson.status] ?? statusIcon.not_started}
                  <span className="truncate">{lesson.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </ScrollArea>
      </div>
    </NodeToolbar>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/curriculum/LessonPopover.tsx
git commit -m "feat(curriculum): add LessonPopover with NodeToolbar"
```

---

### Task 5: Create `CurriculumMap.tsx` — main client component

**Files:**
- Create: `components/curriculum/CurriculumMap.tsx`

This wraps `<ReactFlow>`, holds selected-node state, and composes `ModuleNode` + `LessonPopover`.

- [ ] **Step 1: Create the client component**

```tsx
"use client";

import { useCallback, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import type { Module } from "@/lib/dashboard/types";
import { buildFlowData, type ModuleNodeData } from "./curriculum-utils";
import { ModuleNode } from "./ModuleNode";
import { LessonPopover } from "./LessonPopover";

interface CurriculumMapProps {
  curriculum: Module[];
  lessonProgress: Record<string, string>;
}

const nodeTypes = { module: ModuleNode };

export function CurriculumMap({ curriculum, lessonProgress }: CurriculumMapProps) {
  const { nodes, edges } = useMemo(
    () => buildFlowData(curriculum, lessonProgress),
    [curriculum, lessonProgress],
  );

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const onNodeClick: NodeMouseHandler = useCallback((_event, node) => {
    const data = node.data as unknown as ModuleNodeData;
    if (data.status === "locked") return;
    setSelectedNodeId((prev) => (prev === node.id ? null : node.id));
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const selectedData = selectedNode?.data as ModuleNodeData | undefined;

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnScroll
        zoomOnScroll
        minZoom={0.3}
        maxZoom={1.5}
        proOptions={{ hideAttribution: false }}
      >
        <Background gap={20} size={1} className="!bg-background" />
        <Controls showInteractive={false} className="!bg-card !border-border !shadow-md" />
        {selectedData && selectedNodeId && (
          <LessonPopover
            nodeId={selectedNodeId}
            isVisible
            lessons={selectedData.lessons}
            moduleTitle={selectedData.title}
          />
        )}
      </ReactFlow>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/curriculum/CurriculumMap.tsx
git commit -m "feat(curriculum): add CurriculumMap client component with ReactFlow"
```

---

### Task 6: Create `app/(app)/curriculum/page.tsx` — server component + route

**Files:**
- Create: `app/(app)/curriculum/page.tsx`

Server component that fetches data from Supabase and renders the map. Pattern matches `app/dashboard/page.tsx` for data fetching.

- [ ] **Step 1: Create the page**

```tsx
import { requireServerSession } from "@/lib/auth/require-auth";
import { createServiceClient } from "@/lib/supabase/server";
import { buildCurriculum } from "@/lib/dashboard/curriculum";
import { CurriculumMap } from "@/components/curriculum/CurriculumMap";

export const dynamic = "force-dynamic";

export default async function CurriculumPage() {
  const { supabase } = await requireServerSession();
  const serviceClient = createServiceClient();

  const [lessonsResult, progressResult] = await Promise.all([
    serviceClient
      .from("lessons")
      .select("id, chapter_id, slug, learncpp_title, my_title, sort_order")
      .order("sort_order", { ascending: true }),
    supabase
      .from("progress")
      .select("lesson_id, state"),
  ]);

  const dbLessons = (lessonsResult.data ?? []) as {
    id: string;
    chapter_id: number;
    slug: string;
    learncpp_title: string;
    my_title: string | null;
    sort_order: number;
  }[];

  const progressRows = (progressResult.data ?? []) as {
    lesson_id: string;
    state: string;
  }[];

  const curriculum = buildCurriculum(dbLessons);

  const lessonProgress: Record<string, string> = {};
  for (const row of progressRows) {
    lessonProgress[row.lesson_id] = row.state;
  }

  return (
    <div className="flex h-[calc(100vh-var(--header-height))] flex-col">
      <div className="flex items-center justify-between border-b px-4 py-3 lg:px-6">
        <h1 className="text-lg font-semibold">Curriculum Map</h1>
      </div>
      <div className="flex-1">
        <CurriculumMap curriculum={curriculum} lessonProgress={lessonProgress} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/\(app\)/curriculum/page.tsx
git commit -m "feat(curriculum): add /curriculum server page with data fetching"
```

---

### Task 7: Update sidebar navigation

**Files:**
- Modify: `components/app-sidebar.tsx:61-65`

Update the existing "Curriculum" entry in the `documents` array to point to `/curriculum` instead of `/lessons`, and use the `MapIcon`.

- [ ] **Step 1: Update the sidebar**

In `components/app-sidebar.tsx`, add `MapIcon` to the lucide imports:

```ts
import {
  LayoutDashboardIcon,
  BookOpenIcon,
  CodeIcon,
  BarChart3Icon,
  Settings2Icon,
  CircleHelpIcon,
  SearchIcon,
  BookMarkedIcon,
  NotebookPenIcon,
  TerminalSquareIcon,
  MapIcon,
} from "lucide-react"
```

Then update the "Curriculum" entry in the `documents` array:

```ts
  documents: [
    {
      name: "Curriculum",
      url: "/curriculum",
      icon: <MapIcon />,
    },
```

- [ ] **Step 2: Verify the dev server renders the sidebar correctly**

```bash
npm run dev
```

Open `http://localhost:3000/dashboard` in a browser. Confirm the sidebar shows "Curriculum" with a map icon. Click it — should navigate to `/curriculum`.

- [ ] **Step 3: Commit**

```bash
git add components/app-sidebar.tsx
git commit -m "feat(curriculum): update sidebar Curriculum link to /curriculum with MapIcon"
```

---

### Task 8: Add React Flow CSS overrides for theme integration

**Files:**
- Modify: `app/globals.css` (append at end)

React Flow ships its own styles. We need minimal overrides to make the controls and attribution match our dark theme.

- [ ] **Step 1: Add CSS overrides**

Append to `app/globals.css`:

```css
/* React Flow theme integration */
.react-flow__controls button {
  background-color: var(--card);
  border-color: var(--border);
  color: var(--foreground);
}
.react-flow__controls button:hover {
  background-color: var(--accent);
}
.react-flow__attribution {
  background: transparent !important;
}
.react-flow__attribution a {
  color: var(--muted-foreground) !important;
}
```

- [ ] **Step 2: Commit**

```bash
git add app/globals.css
git commit -m "style(curriculum): add React Flow CSS overrides for theme"
```

---

### Task 9: Build verification and manual test

**Files:** None (verification only)

- [ ] **Step 1: Run the build**

```bash
npm run build 2>&1 | tail -30
```

Expected: build succeeds with no type errors.

- [ ] **Step 2: Run lint**

```bash
npm run lint 2>&1 | tail -20
```

Expected: no lint errors in new files.

- [ ] **Step 3: Manual test in browser**

```bash
npm run dev
```

Open `http://localhost:3000/curriculum` in a browser. Verify:

1. The React Flow canvas renders with 16 module nodes arranged in 4 rows.
2. Nodes show correct titles, progress bars, and lesson counts.
3. Edges connect modules sequentially within stages and between stages.
4. Clicking a node opens the lesson list popover to the right.
5. Clicking a lesson in the popover navigates to `/lessons/[slug]`.
6. Clicking the canvas background closes the popover.
7. Locked nodes (dimmed, with lock icon) do not open popovers on click.
8. Pan and zoom work. FitView centers the map on load.
9. Controls (zoom in/out/fit) appear in the bottom-left corner and are styled to match the theme.

- [ ] **Step 4: Commit all remaining changes (if any fixups were needed)**

```bash
git add -A
git commit -m "feat(curriculum): finalize curriculum map page"
```

# Exercises Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an exercises listing page in the dashboard and a standalone exercise page that renders the full IDE experience.

**Architecture:** The exercises listing page lives at `/dashboard/exercises` inside the existing dashboard layout (sidebar + header). It fetches all generated exercises, groups them by curriculum module, and renders an `ExercisesDataTable` with tab filtering and completion badges derived from submissions. Clicking an exercise navigates to `/exercises/[id]`, which reuses `LessonClient` with an `exerciseOnly` prop to show only the challenge + IDE + tutor.

**Tech Stack:** Next.js App Router, Supabase, TanStack Table, shadcn/ui (Table, Badge, Tabs, Button, Select), existing `LessonClient` component.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `components/exercises-data-table.tsx` | Create | Client component: data table with tab filters, columns, pagination |
| `app/dashboard/exercises/page.tsx` | Create | Server component: fetch exercises + submissions, group by module, pass to table |
| `app/(app)/exercises/[id]/page.tsx` | Rewrite | Render LessonClient with `exerciseOnly` instead of redirecting |
| `app/(app)/lessons/[slug]/LessonClient.tsx` | Modify | Add `exerciseOnly` prop: hide summary, adjust header/nav |
| `components/app-sidebar.tsx` | Modify | Update Exercises URL from `/exercises` to `/dashboard/exercises` |

---

### Task 1: Create ExercisesDataTable Component

**Files:**
- Create: `components/exercises-data-table.tsx`

- [ ] **Step 1: Create the exercises data table component**

Create `components/exercises-data-table.tsx` with the following content. This is modeled after the existing `components/data-table.tsx` but simplified: no checkbox column, no drag-and-drop, no actions dropdown.

```tsx
"use client"

import * as React from "react"
import Link from "next/link"
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table"
import { z } from "zod"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  CircleCheckIcon,
  Columns3Icon,
  ChevronDownIcon,
  ChevronsLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsRightIcon,
} from "lucide-react"

export const exerciseSchema = z.object({
  id: z.number(),
  exerciseId: z.string(),
  header: z.string(),
  module: z.string(),
  difficulty: z.string(),
  status: z.string(),
})

type ExerciseRow = z.infer<typeof exerciseSchema>

const columns: ColumnDef<ExerciseRow>[] = [
  {
    accessorKey: "header",
    header: "Exercise",
    cell: ({ row }) => (
      <Link
        href={`/exercises/${row.original.exerciseId}`}
        className="text-foreground hover:underline"
      >
        {row.original.header}
      </Link>
    ),
    enableHiding: false,
  },
  {
    accessorKey: "module",
    header: "Module",
    cell: ({ row }) => (
      <div className="w-40">
        <Badge variant="outline" className="px-1.5 text-muted-foreground">
          {row.original.module}
        </Badge>
      </div>
    ),
  },
  {
    accessorKey: "difficulty",
    header: "Difficulty",
    cell: ({ row }) => {
      const d = row.original.difficulty
      if (d === "challenge") {
        return (
          <Badge variant="secondary" className="bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
            Challenge
          </Badge>
        )
      }
      return (
        <Badge variant="outline" className="text-muted-foreground">
          Practice
        </Badge>
      )
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      if (row.original.status === "Done") {
        return (
          <Badge variant="secondary" className="bg-green-500/15 text-green-600 dark:bg-green-500/20 dark:text-green-400">
            <CircleCheckIcon className="size-3" />
            Done
          </Badge>
        )
      }
      return (
        <Badge variant="outline" className="text-muted-foreground">
          Not Completed
        </Badge>
      )
    },
  },
]

export function ExercisesDataTable({ data }: { data: ExerciseRow[] }) {
  const [activeTab, setActiveTab] = React.useState("all")
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 })

  const completedCount = data.filter((d) => d.status === "Done").length
  const notCompletedCount = data.filter((d) => d.status !== "Done").length

  const filteredByTab = React.useMemo(() => {
    switch (activeTab) {
      case "completed":
        return data.filter((d) => d.status === "Done")
      case "not-completed":
        return data.filter((d) => d.status !== "Done")
      default:
        return data
    }
  }, [activeTab, data])

  const table = useReactTable({
    data: filteredByTab,
    columns,
    state: { sorting, columnVisibility, columnFilters, pagination },
    getRowId: (row) => row.id.toString(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => {
        setActiveTab(value as string)
        setPagination((prev) => ({ ...prev, pageIndex: 0 }))
      }}
      className="w-full flex-col justify-start gap-6"
    >
      <div className="flex items-center justify-between px-4 lg:px-6">
        <Label htmlFor="exercise-view-selector" className="sr-only">View</Label>
        <Select
          value={activeTab}
          onValueChange={(value) => {
            setActiveTab(value as string)
            setPagination((prev) => ({ ...prev, pageIndex: 0 }))
          }}
          items={[
            { label: "All Exercises", value: "all" },
            { label: "Completed", value: "completed" },
            { label: "Not Completed", value: "not-completed" },
          ]}
        >
          <SelectTrigger className="flex w-fit @4xl/main:hidden" size="sm" id="exercise-view-selector">
            <SelectValue placeholder="Select a view" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All Exercises</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="not-completed">Not Completed</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <TabsList className="hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:bg-muted-foreground/30 **:data-[slot=badge]:px-1 @4xl/main:flex">
          <TabsTrigger value="all">All Exercises</TabsTrigger>
          <TabsTrigger value="completed">
            Completed <Badge variant="secondary">{completedCount}</Badge>
          </TabsTrigger>
          <TabsTrigger value="not-completed">
            Not Completed <Badge variant="secondary">{notCompletedCount}</Badge>
          </TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
              <Columns3Icon data-icon="inline-start" />
              Columns
              <ChevronDownIcon data-icon="inline-end" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32">
              {table
                .getAllColumns()
                .filter((column) => typeof column.accessorFn !== "undefined" && column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-muted">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    {data.length === 0
                      ? "Complete some lessons to unlock exercises."
                      : "No results."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between px-4">
          <div className="hidden flex-1 text-sm text-muted-foreground lg:flex">
            {table.getFilteredRowModel().rows.length} exercise(s)
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="ex-rows-per-page" className="text-sm font-medium">Rows per page</Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => table.setPageSize(Number(value))}
                items={[10, 20, 30, 40, 50].map((s) => ({ label: `${s}`, value: `${s}` }))}
              >
                <SelectTrigger size="sm" className="w-20" id="ex-rows-per-page">
                  <SelectValue placeholder={table.getState().pagination.pageSize} />
                </SelectTrigger>
                <SelectContent side="top">
                  <SelectGroup>
                    {[10, 20, 30, 40, 50].map((s) => (
                      <SelectItem key={s} value={`${s}`}>{s}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button variant="outline" className="hidden h-8 w-8 p-0 lg:flex" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>
                <span className="sr-only">Go to first page</span>
                <ChevronsLeftIcon />
              </Button>
              <Button variant="outline" className="size-8" size="icon" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                <span className="sr-only">Go to previous page</span>
                <ChevronLeftIcon />
              </Button>
              <Button variant="outline" className="size-8" size="icon" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                <span className="sr-only">Go to next page</span>
                <ChevronRightIcon />
              </Button>
              <Button variant="outline" className="hidden size-8 lg:flex" size="icon" onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}>
                <span className="sr-only">Go to last page</span>
                <ChevronsRightIcon />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Tabs>
  )
}
```

- [ ] **Step 2: Verify the file was created and has no syntax errors**

Run: `npx tsc --noEmit --pretty 2>&1 | grep -i "exercises-data-table" | head -20`
Expected: No errors related to this file (other project errors may appear).

- [ ] **Step 3: Commit**

```bash
git add components/exercises-data-table.tsx
git commit -m "feat(exercises): add ExercisesDataTable client component"
```

---

### Task 2: Create Dashboard Exercises Page

**Files:**
- Create: `app/dashboard/exercises/page.tsx`

- [ ] **Step 1: Create the exercises listing page**

This server component fetches all exercises with their lesson data, fetches passing submissions, maps exercises to curriculum modules, and passes flat table data to `ExercisesDataTable`.

```tsx
import { requireServerSession } from "@/lib/auth/require-auth"
import { createServiceClient } from "@/lib/supabase/server"
import { CURRICULUM } from "@/lib/dashboard/curriculum"
import { ExercisesDataTable } from "@/components/exercises-data-table"

export const dynamic = "force-dynamic"

export default async function ExercisesPage() {
  const { supabase, userId } = await requireServerSession()
  const serviceClient = createServiceClient()

  const [exercisesResult, submissionsResult] = await Promise.all([
    serviceClient
      .from("exercises")
      .select("id, title, difficulty, sort_order, lesson_id, lessons(chapter_id)")
      .order("sort_order", { ascending: true }),
    supabase
      .from("submissions")
      .select("exercise_id")
      .eq("user_id", userId)
      .eq("mode", "submit")
      .eq("status", "passed"),
  ])

  const exercises = (exercisesResult.data ?? []) as {
    id: string
    title: string
    difficulty: string
    sort_order: number
    lesson_id: string
    lessons: { chapter_id: number } | null
  }[]

  const passedIds = new Set(
    (submissionsResult.data ?? []).map((s: { exercise_id: string }) => s.exercise_id)
  )

  const chapterToModule = new Map<number, string>()
  for (const mod of CURRICULUM) {
    for (const chId of mod.chapterIds) {
      chapterToModule.set(chId, mod.title)
    }
  }

  const tableData = exercises.map((ex, idx) => ({
    id: idx + 1,
    exerciseId: ex.id,
    header: ex.title,
    module: chapterToModule.get(ex.lessons?.chapter_id ?? -1) ?? "Other",
    difficulty: ex.difficulty,
    status: passedIds.has(ex.id) ? "Done" : "Not Completed",
  }))

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <ExercisesDataTable data={tableData} />
    </div>
  )
}
```

- [ ] **Step 2: Verify the page loads without type errors**

Run: `npx tsc --noEmit --pretty 2>&1 | grep -i "exercises" | head -20`
Expected: No errors related to the exercises page files.

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/exercises/page.tsx
git commit -m "feat(exercises): add dashboard exercises listing page"
```

---

### Task 3: Update Sidebar Exercises URL

**Files:**
- Modify: `components/app-sidebar.tsx`

- [ ] **Step 1: Change the Exercises nav item URL**

In `components/app-sidebar.tsx`, find:
```tsx
    {
      title: "Exercises",
      url: "/exercises",
      icon: <CodeIcon />,
    },
```

Replace with:
```tsx
    {
      title: "Exercises",
      url: "/dashboard/exercises",
      icon: <CodeIcon />,
    },
```

- [ ] **Step 2: Commit**

```bash
git add components/app-sidebar.tsx
git commit -m "fix(nav): update exercises sidebar link to dashboard/exercises"
```

---

### Task 4: Add exerciseOnly Prop to LessonClient

**Files:**
- Modify: `app/(app)/lessons/[slug]/LessonClient.tsx`

- [ ] **Step 1: Add exerciseOnly to Props interface**

In `app/(app)/lessons/[slug]/LessonClient.tsx`, find:
```tsx
interface Props {
  lesson: LessonData;
  exercises: ExerciseData[];
  initialExerciseIndex?: number;
  nav: NavData | null;
}
```

Replace with:
```tsx
interface Props {
  lesson: LessonData;
  exercises: ExerciseData[];
  initialExerciseIndex?: number;
  nav: NavData | null;
  exerciseOnly?: boolean;
}
```

- [ ] **Step 2: Destructure exerciseOnly in component signature**

Find:
```tsx
export default function LessonClient({ lesson, exercises, initialExerciseIndex = 0, nav }: Props) {
```

Replace with:
```tsx
export default function LessonClient({ lesson, exercises, initialExerciseIndex = 0, nav, exerciseOnly = false }: Props) {
```

- [ ] **Step 3: Modify the header to show exercise title when exerciseOnly**

Find:
```tsx
            {/* Header */}
            <div className="px-4 py-4 border-b border-border">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-brand-bright/15 text-brand-bright text-xs font-bold">
                  {lesson.number}
                </span>
                <div>
                  <h1 className="text-lg font-semibold text-primary">{lesson.title}</h1>
                  {exercises.length > 0 && activeExercise && (
                    <p className="text-xs text-muted mt-0.5">
                      {exercises.length} challenge{exercises.length > 1 ? "s" : ""} available
                    </p>
                  )}
                </div>
              </div>
            </div>
```

Replace with:
```tsx
            {/* Header */}
            <div className="px-4 py-4 border-b border-border">
              <div className="flex items-center gap-3">
                {!exerciseOnly && (
                  <span className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-brand-bright/15 text-brand-bright text-xs font-bold">
                    {lesson.number}
                  </span>
                )}
                <div>
                  <h1 className="text-lg font-semibold text-primary">
                    {exerciseOnly && activeExercise ? activeExercise.title : lesson.title}
                  </h1>
                  {!exerciseOnly && exercises.length > 0 && activeExercise && (
                    <p className="text-xs text-muted mt-0.5">
                      {exercises.length} challenge{exercises.length > 1 ? "s" : ""} available
                    </p>
                  )}
                </div>
              </div>
            </div>
```

- [ ] **Step 4: Modify the content tabs to skip lesson summary when exerciseOnly**

Find the entire `{/* Content Tabs */}` section starting at:
```tsx
            {/* Content Tabs */}
            <Tabs defaultValue="lesson" className="flex-1 flex flex-col min-h-0">
              <TabsList variant="line" className="h-11 gap-4 px-4 border-b border-border">
                <TabsTrigger value="lesson" className="px-1 py-2.5 text-sm">Lesson</TabsTrigger>
                {activeExercise?.solutionCode && <TabsTrigger value="solution" className="px-1 py-2.5 text-sm">Solution</TabsTrigger>}
                <TabsTrigger value="resources" className="px-1 py-2.5 text-sm">Resources</TabsTrigger>
              </TabsList>
```

Replace the TabsList with:
```tsx
            {/* Content Tabs */}
            <Tabs defaultValue={exerciseOnly ? "challenge" : "lesson"} className="flex-1 flex flex-col min-h-0">
              {exerciseOnly ? (
                <TabsList variant="line" className="h-11 gap-4 px-4 border-b border-border">
                  <TabsTrigger value="challenge" className="px-1 py-2.5 text-sm">Challenge</TabsTrigger>
                  {activeExercise?.solutionCode && <TabsTrigger value="solution" className="px-1 py-2.5 text-sm">Solution</TabsTrigger>}
                </TabsList>
              ) : (
                <TabsList variant="line" className="h-11 gap-4 px-4 border-b border-border">
                  <TabsTrigger value="lesson" className="px-1 py-2.5 text-sm">Lesson</TabsTrigger>
                  {activeExercise?.solutionCode && <TabsTrigger value="solution" className="px-1 py-2.5 text-sm">Solution</TabsTrigger>}
                  <TabsTrigger value="resources" className="px-1 py-2.5 text-sm">Resources</TabsTrigger>
                </TabsList>
              )}
```

Then, right before the existing `<TabsContent value="lesson"` block, add a new tab content for the challenge-only view:

```tsx
              {exerciseOnly && (
                <TabsContent value="challenge" className="flex-1 overflow-y-auto p-4">
                  {activeExercise ? (
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <h2 className="text-lg font-semibold text-primary">Challenge</h2>
                        <DifficultyBadge difficulty={activeExercise.difficulty} />
                      </div>
                      <div className="prose prose-base prose-invert max-w-none mb-6">
                        <SummaryView markdown={activeExercise.promptMd} />
                      </div>
                      {activeExercise.sampleTestCases.length > 0 && (
                        <div>
                          <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
                            Sample Test Cases
                          </h3>
                          <div className="space-y-2">
                            {activeExercise.sampleTestCases.map((tc) => (
                              <TestCaseCard key={tc.label} testCase={tc} />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted text-sm">
                      No exercise found.
                    </div>
                  )}
                </TabsContent>
              )}
```

- [ ] **Step 5: Modify LessonNav to show back-to-exercises link when exerciseOnly**

Find the `LessonNav` component's return statement. Replace the first `<Link>` (the menu/back button):

Find:
```tsx
      <Link
        href="/dashboard"
        className="p-1.5 hover:bg-hover rounded-md transition-colors text-secondary hover:text-primary"
        title="Back to roadmap"
      >
        <MenuIcon />
      </Link>
```

Replace with:
```tsx
      <Link
        href={exerciseOnly ? "/dashboard/exercises" : "/dashboard"}
        className="p-1.5 hover:bg-hover rounded-md transition-colors text-secondary hover:text-primary"
        title={exerciseOnly ? "Back to exercises" : "Back to roadmap"}
      >
        <MenuIcon />
      </Link>
```

Add `exerciseOnly` to the `LessonNav` props interface and component parameters:

Find:
```tsx
function LessonNav({
  nav,
  lessonTitle,
  lessonId,
  hasExercises,
  tutorOpen,
  onToggleTutor,
  notepadOpen,
  onToggleNotepad,
}: {
  nav: NavData;
  lessonTitle: string;
  lessonId: string;
  hasExercises: boolean;
  tutorOpen?: boolean;
  onToggleTutor?: () => void;
  notepadOpen?: boolean;
  onToggleNotepad?: () => void;
}) {
```

Replace with:
```tsx
function LessonNav({
  nav,
  lessonTitle,
  lessonId,
  hasExercises,
  tutorOpen,
  onToggleTutor,
  notepadOpen,
  onToggleNotepad,
  exerciseOnly,
}: {
  nav: NavData;
  lessonTitle: string;
  lessonId: string;
  hasExercises: boolean;
  tutorOpen?: boolean;
  onToggleTutor?: () => void;
  notepadOpen?: boolean;
  onToggleNotepad?: () => void;
  exerciseOnly?: boolean;
}) {
```

Then pass it from the main component. Find where `LessonNav` is rendered in the desktop layout:
```tsx
        <LessonNav
          nav={nav}
          lessonTitle={lesson.title}
          lessonId={lesson.id}
          hasExercises={exercises.length > 0}
          tutorOpen={tutorOpen}
          onToggleTutor={toggleTutor}
          notepadOpen={notepadOpen}
          onToggleNotepad={() => setNotepadOpen((prev) => !prev)}
        />
```

Replace with:
```tsx
        <LessonNav
          nav={nav}
          lessonTitle={exerciseOnly && activeExercise ? activeExercise.title : lesson.title}
          lessonId={lesson.id}
          hasExercises={exercises.length > 0}
          tutorOpen={tutorOpen}
          onToggleTutor={toggleTutor}
          notepadOpen={notepadOpen}
          onToggleNotepad={() => setNotepadOpen((prev) => !prev)}
          exerciseOnly={exerciseOnly}
        />
```

- [ ] **Step 6: Hide prev/next nav arrows when exerciseOnly**

In the `LessonNav` function, find the prev/next arrow links (immediately after the menu icon link). Wrap them in a conditional:

Find:
```tsx
      <Link
        href={nav.prevSlug ? `/lessons/${nav.prevSlug}` : "#"}
        className={`p-1.5 rounded-md transition-colors ${
          nav.prevSlug
            ? "hover:bg-hover text-secondary hover:text-primary"
            : "text-muted cursor-not-allowed"
        }`}
        aria-disabled={!nav.prevSlug}
        onClick={(e) => !nav.prevSlug && e.preventDefault()}
      >
        <ChevronLeftIcon />
      </Link>

      <Link
        href={nav.nextSlug ? `/lessons/${nav.nextSlug}` : "#"}
        className={`p-1.5 rounded-md transition-colors ${
          nav.nextSlug
            ? "hover:bg-hover text-secondary hover:text-primary"
            : "text-muted cursor-not-allowed"
        }`}
        aria-disabled={!nav.nextSlug}
        onClick={handleNextClick}
      >
        <ChevronRightIcon />
      </Link>
```

Replace with:
```tsx
      {!exerciseOnly && (
        <>
          <Link
            href={nav.prevSlug ? `/lessons/${nav.prevSlug}` : "#"}
            className={`p-1.5 rounded-md transition-colors ${
              nav.prevSlug
                ? "hover:bg-hover text-secondary hover:text-primary"
                : "text-muted cursor-not-allowed"
            }`}
            aria-disabled={!nav.prevSlug}
            onClick={(e) => !nav.prevSlug && e.preventDefault()}
          >
            <ChevronLeftIcon />
          </Link>

          <Link
            href={nav.nextSlug ? `/lessons/${nav.nextSlug}` : "#"}
            className={`p-1.5 rounded-md transition-colors ${
              nav.nextSlug
                ? "hover:bg-hover text-secondary hover:text-primary"
                : "text-muted cursor-not-allowed"
            }`}
            aria-disabled={!nav.nextSlug}
            onClick={handleNextClick}
          >
            <ChevronRightIcon />
          </Link>
        </>
      )}
```

- [ ] **Step 7: Verify no type errors**

Run: `npx tsc --noEmit --pretty 2>&1 | grep -i "LessonClient\|exercises" | head -20`
Expected: No errors.

- [ ] **Step 8: Commit**

```bash
git add app/(app)/lessons/[slug]/LessonClient.tsx
git commit -m "feat(exercises): add exerciseOnly prop to LessonClient"
```

---

### Task 5: Rewrite Standalone Exercise Page

**Files:**
- Rewrite: `app/(app)/exercises/[id]/page.tsx`

- [ ] **Step 1: Rewrite the exercise page to render LessonClient**

Replace the entire contents of `app/(app)/exercises/[id]/page.tsx` with:

```tsx
import { notFound } from "next/navigation"
import { unstable_noStore as noStore } from "next/cache"
import { createServiceClient } from "@/lib/supabase/server"
import { requireServerSession } from "@/lib/auth/require-auth"
import { getOrGenerateLesson, type ExerciseWithTestCases } from "@/lib/content/lesson-generation"
import LessonClient from "@/app/(app)/lessons/[slug]/LessonClient"
import type { Lesson } from "@/lib/supabase/types"

export const dynamic = "force-dynamic"
export const revalidate = 0

interface Props {
  params: { id: string }
}

export default async function ExercisePage({ params }: Props) {
  noStore()

  const { supabase, userId } = await requireServerSession()
  const serviceClient = createServiceClient()
  const { id } = params

  const { data: exercise, error } = await serviceClient
    .from("exercises")
    .select("id, lesson_id, sort_order")
    .eq("id", id)
    .single()

  if (error || !exercise) notFound()

  const { data: lessonRow } = await serviceClient
    .from("lessons")
    .select("slug, chapter_id")
    .eq("id", exercise.lesson_id)
    .single()

  if (!lessonRow) notFound()

  let lesson: Lesson
  let exercises: ExerciseWithTestCases[]

  try {
    const result = await getOrGenerateLesson(serviceClient, lessonRow.slug, userId)
    lesson = result.lesson
    exercises = result.exercises
  } catch (err) {
    const message = err instanceof Error ? err.message : ""
    if (message.includes("not found")) notFound()
    throw err
  }

  const exerciseIds = exercises.map((ex) => ex.id)

  const { data: passingSubmissions } = exerciseIds.length > 0
    ? await supabase
        .from("submissions")
        .select("exercise_id, source_code")
        .eq("user_id", userId)
        .in("exercise_id", exerciseIds)
        .eq("mode", "submit")
        .eq("status", "passed")
        .order("created_at", { ascending: false })
    : { data: [] as Array<{ exercise_id: string; source_code: string }> }

  const lastPassingMap = new Map<string, string>()
  for (const sub of passingSubmissions ?? []) {
    if (!lastPassingMap.has(sub.exercise_id) && sub.source_code) {
      lastPassingMap.set(sub.exercise_id, sub.source_code)
    }
  }

  const exercisesForClient = exercises.map((ex) => {
    const sampleTestCases = ex.testCases
      .filter((tc) => tc.is_sample)
      .sort((a, b) => a.sort_order - b.sort_order)

    return {
      id: ex.id,
      title: ex.title,
      promptMd: ex.prompt_md,
      starterCode: ex.starter_code,
      solutionCode: ex.solution_code ?? null,
      difficulty: ex.difficulty,
      sampleTestCases: sampleTestCases.map((tc) => ({
        label: tc.label,
        stdin: tc.stdin ?? "",
        expectedStdout: tc.expected_stdout,
      })),
      lastPassingCode: lastPassingMap.get(ex.id) ?? null,
    }
  })

  const exerciseIndex = exercises.findIndex((ex) => ex.id === id)
  const targetIndex = exerciseIndex >= 0 ? exerciseIndex : 0

  const { data: chapter } = await serviceClient
    .from("chapters")
    .select("id, learncpp_title, my_title")
    .eq("id", lessonRow.chapter_id)
    .single()

  const navInfo = chapter
    ? {
        chapter: { title: chapter.my_title ?? chapter.learncpp_title },
        currentIndex: 0,
        totalInChapter: 0,
        prevSlug: null,
        nextSlug: null,
      }
    : null

  const title = lesson.my_title ?? lesson.learncpp_title

  return (
    <LessonClient
      lesson={{
        id: lesson.id,
        number: lesson.number,
        title,
        summaryMd: lesson.summary_md,
        learncppUrl: lesson.learncpp_url,
      }}
      exercises={exercisesForClient}
      initialExerciseIndex={targetIndex}
      nav={navInfo}
      exerciseOnly
    />
  )
}
```

- [ ] **Step 2: Verify no type errors**

Run: `npx tsc --noEmit --pretty 2>&1 | grep -i "exercises/\[id\]" | head -20`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add app/\(app\)/exercises/\[id\]/page.tsx
git commit -m "feat(exercises): rewrite exercise page to render full IDE via LessonClient"
```

---

### Task 6: Manual Verification

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`

- [ ] **Step 2: Verify the exercises listing page**

Navigate to `/dashboard/exercises` in the browser. Confirm:
- Page renders inside the dashboard layout with sidebar
- Table shows exercises grouped by module
- Tab filtering works (All / Completed / Not Completed)
- Clicking an exercise title navigates to `/exercises/[id]`
- If no exercises have been generated yet, the empty state message appears

- [ ] **Step 3: Verify the standalone exercise page**

Click an exercise from the listing. Confirm:
- Full IDE loads (Monaco editor + output panel)
- Left panel shows "Challenge" tab with exercise prompt (no "Lesson" tab)
- Header shows exercise title, not lesson title
- Back button (menu icon) navigates to `/dashboard/exercises`
- No prev/next lesson arrows
- Tutor panel works
- Run/Submit buttons work

- [ ] **Step 4: Verify the sidebar link**

Click "Exercises" in the sidebar. Confirm it navigates to `/dashboard/exercises`.

- [ ] **Step 5: Verify cross-completion**

Complete an exercise from a lesson page, then navigate to `/dashboard/exercises`. Confirm the exercise shows as "Done".

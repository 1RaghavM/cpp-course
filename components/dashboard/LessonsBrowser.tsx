"use client"

import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  CircleCheckIcon,
  LoaderIcon,
  PlayIcon,
  SearchIcon,
  EllipsisVerticalIcon,
  ArrowRightIcon,
} from "lucide-react"

import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion"
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
} from "@/components/ui/accordion"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export type LessonStatus = "Done" | "In Progress" | "Not Started"

export interface LessonRow {
  id: string
  slug: string
  title: string
  status: LessonStatus
}

export interface ChapterGroup {
  id: string
  title: string
  lessons: LessonRow[]
}

interface LessonsBrowserProps {
  chapters: ChapterGroup[]
  resumeLessonSlug: string | null
}

type TabValue = "all" | "in-progress" | "completed" | "not-started"

function lessonMatchesTab(status: LessonStatus, tab: TabValue): boolean {
  if (tab === "all") return true
  if (tab === "in-progress") return status === "In Progress"
  if (tab === "completed") return status === "Done"
  return status === "Not Started"
}

function StatusBadge({ status }: { status: LessonStatus }) {
  if (status === "Done") {
    return (
      <Badge
        variant="secondary"
        noAnimate
        className="bg-green-500/15 text-green-700 dark:bg-green-500/20 dark:text-green-400"
      >
        <CircleCheckIcon className="size-3" />
        Done
      </Badge>
    )
  }
  if (status === "In Progress") {
    return (
      <Badge
        variant="secondary"
        noAnimate
        className="bg-blue-500/15 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400"
      >
        <LoaderIcon className="size-3" />
        In Progress
      </Badge>
    )
  }
  return (
    <Badge variant="outline" noAnimate className="text-muted-foreground">
      Not Started
    </Badge>
  )
}

function actionLabel(status: LessonStatus): string {
  if (status === "Done") return "Review"
  if (status === "In Progress") return "Continue"
  return "Start"
}

function LessonActions({
  lesson,
  onStatusChange,
}: {
  lesson: LessonRow
  onStatusChange: (id: string, status: LessonStatus) => void
}) {
  const isDone = lesson.status === "Done"

  async function toggleComplete() {
    const newState = isDone ? "in_progress" : "completed"
    const res = await fetch(`/api/progress/${lesson.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state: newState }),
    })
    if (!res.ok) return
    onStatusChange(lesson.id, isDone ? "Not Started" : "Done")
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label="Lesson actions"
            className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          />
        }
      >
        <EllipsisVerticalIcon className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={toggleComplete}>
          {isDone ? "Mark as incomplete" : "Mark as complete"}
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href={`/lessons/${lesson.slug}`} />}>
          Open lesson
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function LessonRowView({
  lesson,
  chapterTitle,
  onStatusChange,
}: {
  lesson: LessonRow
  chapterTitle?: string
  onStatusChange: (id: string, status: LessonStatus) => void
}) {
  return (
    <div className="group/lesson flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/50">
      <Link
        href={`/lessons/${lesson.slug}`}
        className="flex-1 min-w-0 truncate text-base text-foreground !no-underline hover:text-foreground/80"
      >
        {lesson.title}
      </Link>
      {chapterTitle ? (
        <Badge variant="outline" noAnimate className="hidden md:inline-flex text-muted-foreground">
          {chapterTitle}
        </Badge>
      ) : null}
      <StatusBadge status={lesson.status} />
      <Button
        size="sm"
        variant={lesson.status === "Done" ? "secondary" : "default"}
        className="!no-underline"
        render={<Link href={`/lessons/${lesson.slug}`} />}
      >
        {actionLabel(lesson.status)}
      </Button>
      <LessonActions lesson={lesson} onStatusChange={onStatusChange} />
    </div>
  )
}

export function LessonsBrowser({ chapters, resumeLessonSlug }: LessonsBrowserProps) {
  const searchParams = useSearchParams()
  const chapterParam = searchParams.get("chapter")

  const [activeTab, setActiveTab] = React.useState<TabValue>("all")
  const [search, setSearch] = React.useState("")
  const [chapterFilter, setChapterFilter] = React.useState<string>("all")

  // Local override map so toggling completion updates the UI without a refetch.
  const [overrides, setOverrides] = React.useState<Record<string, LessonStatus>>({})

  const chaptersWithOverrides = React.useMemo<ChapterGroup[]>(
    () =>
      chapters.map((c) => ({
        ...c,
        lessons: c.lessons.map((l) => ({
          ...l,
          status: overrides[l.id] ?? l.status,
        })),
      })),
    [chapters, overrides],
  )

  const onStatusChange = React.useCallback((id: string, status: LessonStatus) => {
    setOverrides((prev) => ({ ...prev, [id]: status }))
  }, [])

  const onBulkStatusChange = React.useCallback(
    (ids: string[], status: LessonStatus) => {
      setOverrides((prev) => {
        const next = { ...prev }
        for (const id of ids) next[id] = status
        return next
      })
    },
    [],
  )

  const allLessons = React.useMemo(
    () => chaptersWithOverrides.flatMap((c) => c.lessons),
    [chaptersWithOverrides],
  )

  const counts = React.useMemo(() => {
    let done = 0
    let inProg = 0
    let notStarted = 0
    for (const l of allLessons) {
      if (l.status === "Done") done++
      else if (l.status === "In Progress") inProg++
      else notStarted++
    }
    return { done, inProg, notStarted, total: allLessons.length }
  }, [allLessons])

  const normalizedSearch = search.trim().toLowerCase()
  const isFlatMode = normalizedSearch.length > 0

  const filteredChapters = React.useMemo<ChapterGroup[]>(() => {
    return chaptersWithOverrides
      .filter((c) => chapterFilter === "all" || c.id === chapterFilter)
      .map((c) => ({
        ...c,
        lessons: c.lessons.filter((l) => {
          if (!lessonMatchesTab(l.status, activeTab)) return false
          if (normalizedSearch && !l.title.toLowerCase().includes(normalizedSearch))
            return false
          return true
        }),
      }))
      .filter((c) => c.lessons.length > 0)
  }, [chaptersWithOverrides, chapterFilter, activeTab, normalizedSearch])

  // Auto-open: first chapter that isn't fully complete (using all lessons, not filtered).
  const firstUnfinishedId = React.useMemo(() => {
    for (const c of chaptersWithOverrides) {
      const done = c.lessons.every((l) => l.status === "Done")
      if (!done && c.lessons.length > 0) return c.id
    }
    return chaptersWithOverrides[0]?.id ?? ""
  }, [chaptersWithOverrides])

  // Compute which chapters should be open for a given filter combination.
  // When filters are active we open every chapter that has matching lessons,
  // otherwise we auto-open only the first unfinished chapter.
  const computeOpen = React.useCallback(
    (tab: TabValue, chap: string): string[] => {
      if (tab !== "all" || chap !== "all") {
        return chaptersWithOverrides
          .filter((c) => chap === "all" || c.id === chap)
          .filter((c) => c.lessons.some((l) => lessonMatchesTab(l.status, tab)))
          .map((c) => c.id)
      }
      return firstUnfinishedId ? [firstUnfinishedId] : []
    },
    [chaptersWithOverrides, firstUnfinishedId],
  )

  const [openChapters, setOpenChapters] = React.useState<string[]>(() => {
    if (chapterParam && chapters.some((c) => c.id === chapterParam)) {
      return [chapterParam]
    }
    return computeOpen("all", "all")
  })

  const handleTabChange = (v: TabValue) => {
    setActiveTab(v)
    setOpenChapters(computeOpen(v, chapterFilter))
  }

  const handleChapterFilterChange = (v: string) => {
    setChapterFilter(v)
    setOpenChapters(computeOpen(activeTab, v))
  }

  const chapterItems = React.useMemo(
    () => [
      { label: "All chapters", value: "all" },
      ...chapters.map((c) => ({ label: c.title, value: c.id })),
    ],
    [chapters],
  )

  const flatLessons = React.useMemo(() => {
    if (!isFlatMode) return []
    const chapterTitleById = new Map(chapters.map((c) => [c.id, c.title]))
    return filteredChapters.flatMap((c) =>
      c.lessons.map((l) => ({ lesson: l, chapterTitle: chapterTitleById.get(c.id) ?? "" })),
    )
  }, [isFlatMode, filteredChapters, chapters])

  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      <Card>
        <CardHeader className="gap-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <CardTitle className="text-lg font-semibold">Lessons</CardTitle>
              <CardDescription>
                {counts.done} of {counts.total} complete · {chapters.length} chapters
              </CardDescription>
            </div>
            {resumeLessonSlug ? (
              <Button size="sm" render={<Link href={`/lessons/${resumeLessonSlug}`} />}>
                <PlayIcon data-icon="inline-start" />
                Continue Learning
              </Button>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <Tabs
              value={activeTab}
              onValueChange={(v) => handleTabChange(v as TabValue)}
            >
              <TabsList className="**:data-[slot=badge]:min-w-5 **:data-[slot=badge]:h-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:bg-muted-foreground/30 **:data-[slot=badge]:px-1.5">
                <TabsTrigger value="all">
                  All <Badge variant="secondary" noAnimate>{counts.total}</Badge>
                </TabsTrigger>
                <TabsTrigger value="in-progress">
                  In Progress <Badge variant="secondary" noAnimate>{counts.inProg}</Badge>
                </TabsTrigger>
                <TabsTrigger value="completed">
                  Completed <Badge variant="secondary" noAnimate>{counts.done}</Badge>
                </TabsTrigger>
                <TabsTrigger value="not-started">
                  Not Started <Badge variant="secondary" noAnimate>{counts.notStarted}</Badge>
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex items-center gap-2">
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search lessons…"
                  className="h-8 w-[200px] pl-8"
                />
              </div>
              <Select
                value={chapterFilter}
                onValueChange={(v) => handleChapterFilterChange(v as string)}
                items={chapterItems}
              >
                <SelectTrigger size="sm" className="w-[180px]">
                  <SelectValue placeholder="All chapters" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {chapterItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {filteredChapters.length === 0 ? (
            <EmptyState />
          ) : isFlatMode ? (
            <FlatList
              rows={flatLessons}
              onStatusChange={onStatusChange}
            />
          ) : (
            <ChapterAccordion
              chapters={filteredChapters}
              openValue={openChapters}
              onOpenChange={setOpenChapters}
              onStatusChange={onStatusChange}
              onBulkStatusChange={onBulkStatusChange}
              onStatusRollback={onStatusChange}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function ChapterAccordion({
  chapters,
  openValue,
  onOpenChange,
  onStatusChange,
  onBulkStatusChange,
  onStatusRollback,
}: {
  chapters: ChapterGroup[]
  openValue: string[]
  onOpenChange: (next: string[]) => void
  onStatusChange: (id: string, status: LessonStatus) => void
  onBulkStatusChange: (ids: string[], status: LessonStatus) => void
  onStatusRollback: (id: string, status: LessonStatus) => void
}) {
  return (
    <Accordion
      multiple
      value={openValue}
      onValueChange={(v) => onOpenChange(v as string[])}
      className="divide-y divide-border"
    >
      {chapters.map((chapter) => {
        const total = chapter.lessons.length
        const completed = chapter.lessons.filter((l) => l.status === "Done").length
        const pct = total > 0 ? Math.round((completed / total) * 100) : 0
        return (
          <AccordionItem key={chapter.id} value={chapter.id}>
            <ChapterHeader
              chapter={chapter}
              completed={completed}
              total={total}
              pct={pct}
              onBulkStatusChange={onBulkStatusChange}
              onStatusRollback={onStatusRollback}
            />
            <AccordionContent>
              <div className="flex flex-col gap-1 pb-2">
                {chapter.lessons.map((lesson) => (
                  <LessonRowView
                    key={lesson.id}
                    lesson={lesson}
                    onStatusChange={onStatusChange}
                  />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )
      })}
    </Accordion>
  )
}

function ChapterHeader({
  chapter,
  completed,
  total,
  pct,
  onBulkStatusChange,
  onStatusRollback,
}: {
  chapter: ChapterGroup
  completed: number
  total: number
  pct: number
  onBulkStatusChange: (ids: string[], status: LessonStatus) => void
  onStatusRollback: (id: string, status: LessonStatus) => void
}) {
  const [marking, setMarking] = React.useState(false)
  const isAllDone = completed === total && total > 0

  async function toggleChapter() {
    const targets = isAllDone
      ? chapter.lessons.filter((l) => l.status === "Done")
      : chapter.lessons.filter((l) => l.status !== "Done")
    if (targets.length === 0) return

    const apiState = isAllDone ? "in_progress" : "completed"
    const nextStatus: LessonStatus = isAllDone ? "Not Started" : "Done"

    // Snapshot original status per lesson so we can roll back precisely if
    // the request fails. The optimistic flip is bulk, but rollback may need
    // to restore mixed statuses (e.g. some "In Progress", some "Not Started").
    const originals = targets.map((l) => ({ id: l.id, status: l.status }))
    const ids = originals.map((o) => o.id)

    // Optimistic: flip UI immediately, fire one batched request in the background.
    onBulkStatusChange(ids, nextStatus)
    setMarking(true)

    try {
      const res = await fetch(`/api/progress/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lesson_ids: ids, state: apiState }),
      })
      if (!res.ok) {
        for (const o of originals) onStatusRollback(o.id, o.status)
      }
    } catch {
      for (const o of originals) onStatusRollback(o.id, o.status)
    } finally {
      setMarking(false)
    }
  }

  return (
    <AccordionPrimitive.Header className="flex items-center gap-2">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className="group/accordion-trigger flex flex-1 items-center gap-4 py-4 pr-2 text-left text-base font-medium outline-none transition-all focus-visible:ring-3 focus-visible:ring-ring/50 [&[data-disabled]]:pointer-events-none [&[data-disabled]]:opacity-50"
      >
        <span className="flex-1 text-left text-foreground">{chapter.title}</span>
        <span className="text-sm text-muted-foreground tabular-nums shrink-0">
          {completed} / {total}
        </span>
        <div className="w-28 shrink-0">
          <Progress value={pct} />
        </div>
        <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground group-aria-expanded/accordion-trigger:hidden" />
        <ChevronUpIcon className="hidden size-4 shrink-0 text-muted-foreground group-aria-expanded/accordion-trigger:inline" />
      </AccordionPrimitive.Trigger>
      {total > 0 ? (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                aria-label="Chapter actions"
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              />
            }
          >
            <EllipsisVerticalIcon className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem disabled={marking} onClick={toggleChapter}>
              {isAllDone ? "Mark chapter as incomplete" : "Mark chapter as complete"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </AccordionPrimitive.Header>
  )
}

function FlatList({
  rows,
  onStatusChange,
}: {
  rows: { lesson: LessonRow; chapterTitle: string }[]
  onStatusChange: (id: string, status: LessonStatus) => void
}) {
  return (
    <div className="flex flex-col gap-1 py-2">
      <p className="px-2 pb-1 text-xs text-muted-foreground">
        {rows.length} matching {rows.length === 1 ? "lesson" : "lessons"}
      </p>
      {rows.map(({ lesson, chapterTitle }) => (
        <LessonRowView
          key={lesson.id}
          lesson={lesson}
          chapterTitle={chapterTitle}
          onStatusChange={onStatusChange}
        />
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      <ArrowRightIcon className="size-5 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">No lessons match your filters.</p>
    </div>
  )
}

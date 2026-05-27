"use client";

import { useState } from "react";
import Link from "next/link";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface RoadmapLesson {
  id: string;
  number: string;
  slug: string;
  title: string;
  state: "not_started" | "in_progress" | "completed" | "skipped";
}

interface RoadmapChapter {
  id: number;
  number: string;
  title: string;
  completionPercent: number;
  lessons: RoadmapLesson[];
}

/* ------------------------------------------------------------------ */
/*  State indicator                                                    */
/* ------------------------------------------------------------------ */

const stateConfig: Record<
  RoadmapLesson["state"],
  { bg: string; ring: string; label: string }
> = {
  not_started: {
    bg: "bg-muted",
    ring: "ring-muted",
    label: "Not started",
  },
  in_progress: {
    bg: "bg-accent",
    ring: "ring-accent",
    label: "In progress",
  },
  completed: {
    bg: "bg-success",
    ring: "ring-success",
    label: "Completed",
  },
  skipped: {
    bg: "bg-warning",
    ring: "ring-warning",
    label: "Skipped",
  },
};

function StateIndicator({ state }: { state: RoadmapLesson["state"] }) {
  const cfg = stateConfig[state];
  return (
    <span
      className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${cfg.bg} ring-2 ring-offset-1 ring-offset-base ${cfg.ring}`}
      title={cfg.label}
      aria-label={cfg.label}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Chevron icon                                                       */
/* ------------------------------------------------------------------ */

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-4 w-4 shrink-0 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Chapter section                                                    */
/* ------------------------------------------------------------------ */

function ChapterSection({
  chapter,
  defaultOpen,
}: {
  chapter: RoadmapChapter;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-border last:border-b-0">
      {/* Chapter header */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center gap-3 px-3 py-3 text-left hover:bg-hover transition-colors"
      >
        <ChevronIcon open={open} />

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="shrink-0 text-xs font-medium text-muted">
              {chapter.number}
            </span>
            <span className="truncate font-medium text-primary">{chapter.title}</span>
          </div>

          {/* Progress bar */}
          <div className="mt-1.5 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-elevated">
              <div
                className="h-full rounded-full bg-success transition-all duration-300"
                style={{ width: `${chapter.completionPercent}%` }}
              />
            </div>
            <span className="shrink-0 text-xs tabular-nums text-muted">
              {chapter.completionPercent}%
            </span>
          </div>
        </div>
      </button>

      {/* Lesson list */}
      {open && (
        <ul className="pb-2 pl-8 pr-2 sm:pl-10 sm:pr-3">
          {chapter.lessons.map((lesson) => (
            <li key={lesson.id}>
              <Link
                href={`/lessons/${lesson.slug}`}
                className="group flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-hover transition-colors"
              >
                <StateIndicator state={lesson.state} />
                <span className="shrink-0 text-xs tabular-nums text-muted">
                  {lesson.number}
                </span>
                <span className="min-w-0 truncate text-sm text-secondary group-hover:text-accent transition-colors">
                  {lesson.title}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  RoadmapTree                                                        */
/* ------------------------------------------------------------------ */

export function RoadmapTree({ chapters }: { chapters: RoadmapChapter[] }) {
  const firstInProgressIdx = chapters.findIndex((ch) =>
    ch.lessons.some((l) => l.state === "in_progress"),
  );

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      {chapters.map((chapter, idx) => (
        <ChapterSection
          key={chapter.id}
          chapter={chapter}
          defaultOpen={
            firstInProgressIdx >= 0
              ? idx === firstInProgressIdx
              : idx === 0
          }
        />
      ))}

      {chapters.length === 0 && (
        <p className="px-4 py-8 text-center text-muted">
          No chapters found. Run the seed script to populate the curriculum.
        </p>
      )}
    </div>
  );
}

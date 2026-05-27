"use client";

import { useState } from "react";
import Link from "next/link";

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

const stateColors: Record<RoadmapLesson["state"], string> = {
  not_started: "hsl(var(--text-muted))",
  in_progress: "hsl(var(--slate))",
  completed: "hsl(var(--success))",
  skipped: "hsl(var(--warning))",
};

const chapterHues = [10, 220, 38, 155, 280, 190, 350, 45, 120, 260];

function getChapterStyle(index: number) {
  const hue = chapterHues[index % chapterHues.length]!;
  return {
    badge: `hsl(${hue} 30% 20%)`,
    badgeText: `hsl(${hue} 40% 68%)`,
    bar: `hsl(${hue} 35% 42%)`,
  };
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-3.5 w-3.5 shrink-0 text-muted transition-transform duration-200 ${open ? "rotate-90" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

function ChapterSection({
  chapter,
  index,
  defaultOpen,
}: {
  chapter: RoadmapChapter;
  index: number;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const colors = getChapterStyle(index);

  return (
    <div className="border-b border-border/60 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-hover/50"
      >
        <ChevronIcon open={open} />

        <span
          className="inline-flex h-6 min-w-[2.5rem] shrink-0 items-center justify-center rounded-md px-2 font-mono text-[11px] font-medium"
          style={{ backgroundColor: colors.badge, color: colors.badgeText }}
        >
          {chapter.number}
        </span>

        <div className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-primary">
            {chapter.title}
          </span>
          <div className="mt-1 flex items-center gap-2">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-elevated">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${chapter.completionPercent}%`,
                  backgroundColor: colors.bar,
                }}
              />
            </div>
            <span className="shrink-0 font-mono text-[10px] tabular-nums text-muted">
              {chapter.completionPercent}%
            </span>
          </div>
        </div>
      </button>

      {open && (
        <ul className="pb-2 pl-10 pr-3 sm:pl-14">
          {chapter.lessons.map((lesson) => (
            <li key={lesson.id}>
              <Link
                href={`/lessons/${lesson.slug}`}
                className="group flex items-center gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-hover/40"
              >
                <span
                  className="inline-block h-[7px] w-[7px] shrink-0 rounded-full"
                  style={{ backgroundColor: stateColors[lesson.state] }}
                />
                <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted">
                  {lesson.number}
                </span>
                <span className="min-w-0 truncate text-sm text-secondary transition-colors group-hover:text-primary">
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

export function RoadmapTree({ chapters }: { chapters: RoadmapChapter[] }) {
  const firstInProgressIdx = chapters.findIndex((ch) =>
    ch.lessons.some((l) => l.state === "in_progress"),
  );

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-surface/50">
      {chapters.map((chapter, idx) => (
        <ChapterSection
          key={chapter.id}
          chapter={chapter}
          index={idx}
          defaultOpen={firstInProgressIdx >= 0 ? idx === firstInProgressIdx : idx === 0}
        />
      ))}

      {chapters.length === 0 && (
        <p className="px-4 py-8 text-center text-sm text-muted">
          No chapters found. Run the seed script to populate the curriculum.
        </p>
      )}
    </div>
  );
}

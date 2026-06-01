"use client";

import { useEffect, useRef } from "react";

export interface SidebarChapter {
  id: number;
  number: string;
  title: string;
  completionPercent: number;
}

interface ChapterSidebarProps {
  chapters: SidebarChapter[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  open: boolean;
  onClose: () => void;
}

export function ChapterSidebar({
  chapters,
  selectedIndex,
  onSelect,
  open,
  onClose,
}: ChapterSidebarProps) {
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      activeRef.current?.scrollIntoView({ block: "center", behavior: "instant" });
    }
  }, [open]);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed inset-y-14 left-0 z-40 flex w-[280px] flex-col border-r border-border bg-base
          transition-transform duration-200
          lg:relative lg:inset-y-0 lg:z-0
          ${open ? "translate-x-0" : "-translate-x-full lg:-translate-x-full"}
        `}
      >
        <div className="flex h-10 shrink-0 items-center justify-between border-b border-border px-3">
          <span className="text-xs font-medium uppercase tracking-wider text-muted">
            Chapters
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-muted transition-colors hover:bg-hover hover:text-primary"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-1">
          {chapters.map((chapter, idx) => {
            const isSelected = idx === selectedIndex;

            return (
              <button
                key={chapter.id}
                ref={isSelected ? activeRef : undefined}
                type="button"
                onClick={() => {
                  onSelect(idx);
                  if (window.innerWidth < 1024) onClose();
                }}
                className={`
                  flex w-full flex-col gap-1 border-l-2 px-3 py-2.5 text-left transition-colors
                  ${isSelected ? "border-accent bg-hover/60" : "border-transparent hover:bg-hover/30"}
                `}
              >
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-5 min-w-[2rem] shrink-0 items-center justify-center rounded px-1.5 font-mono text-[10px] font-medium bg-accent/10 text-accent-hover">
                    {chapter.number}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-xs text-secondary">
                    {chapter.title}
                  </span>
                  <span className="shrink-0 font-mono text-[10px] tabular-nums text-muted">
                    {chapter.completionPercent}%
                  </span>
                </div>
                <div className="h-0.5 w-full overflow-hidden rounded-full bg-elevated">
                  <div
                    className="h-full rounded-full bg-accent transition-all duration-300"
                    style={{ width: `${chapter.completionPercent}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </aside>
    </>
  );
}

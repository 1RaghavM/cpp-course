"use client";

import { useState, useEffect } from "react";
import { ChapterSidebar, type SidebarChapter } from "@/components/home/ChapterSidebar";
import { ChapterDetail } from "@/components/home/ChapterDetail";
import { ContinueLearning, type ContinueLesson } from "@/components/home/ContinueLearning";

export interface HomeChapter {
  id: number;
  number: string;
  title: string;
  completionPercent: number;
  lessons: {
    id: string;
    number: string;
    slug: string;
    title: string;
    state: "not_started" | "in_progress" | "completed" | "skipped";
  }[];
}

interface HomeLayoutProps {
  chapters: HomeChapter[];
  continueLesson: ContinueLesson | null;
  hasAnyProgress: boolean;
  activeChapterIndex: number;
}

export function HomeLayout({
  chapters,
  continueLesson,
  hasAnyProgress,
  activeChapterIndex,
}: HomeLayoutProps) {
  const [selectedIndex, setSelectedIndex] = useState(activeChapterIndex);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const isDesktop = window.innerWidth >= 1024;
    setSidebarOpen(isDesktop);
  }, []);

  const selectedChapter = chapters[selectedIndex];

  const sidebarChapters: SidebarChapter[] = chapters.map((ch) => ({
    id: ch.id,
    number: ch.number,
    title: ch.title,
    completionPercent: ch.completionPercent,
  }));

  return (
    <div className="flex min-h-0 flex-1">
      <ChapterSidebar
        chapters={sidebarChapters}
        selectedIndex={selectedIndex}
        onSelect={setSelectedIndex}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-6 py-6">
          <div className="mb-6 flex items-center gap-3">
            {!sidebarOpen && (
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="rounded-md p-1.5 text-muted transition-colors hover:bg-hover hover:text-primary"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              </button>
            )}
            <div className="flex-1">
              <ContinueLearning lesson={continueLesson} hasAnyProgress={hasAnyProgress} />
            </div>
          </div>

          {selectedChapter && (
            <ChapterDetail chapter={selectedChapter} chapterIndex={selectedIndex} />
          )}
        </div>
      </div>
    </div>
  );
}

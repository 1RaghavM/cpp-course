"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Hero } from "@/components/dashboard/Hero";
import { PathMap } from "@/components/dashboard/PathMap";
import { StatsStrip } from "@/components/dashboard/StatsStrip";
import { trackDashboardEvent } from "@/lib/dashboard/analytics";
import type { Module, Lesson, DashboardProgress, ResumeVariant, Stage } from "@/lib/dashboard/types";

interface DashboardProps {
  curriculum: Module[];
  progress: DashboardProgress;
  resumeTarget: Lesson;
  resumeVariant: ResumeVariant;
  pathPercent: number;
  stageTargetSlugs: Record<Stage, string>;
  statsError?: boolean;
}

export function Dashboard({
  curriculum,
  progress,
  resumeTarget,
  resumeVariant,
  pathPercent,
  stageTargetSlugs,
  statsError,
}: DashboardProps) {
  const router = useRouter();

  useEffect(() => {
    router.prefetch(`/lessons/${resumeTarget.slug}`);
    trackDashboardEvent("dashboard_viewed", { state: resumeVariant });
  }, [router, resumeTarget.slug, resumeVariant]);

  const resumeModule = curriculum.find((m) => m.id === resumeTarget.moduleId)!;
  const snippet = progress.lessonProgress[resumeTarget.id]?.lastCodeSnippet;

  return (
    <div className="mx-auto max-w-[720px] px-6 py-8">
      <div className="space-y-8">
        <div className="reveal">
          <Hero
            lesson={resumeTarget}
            module={resumeModule}
            variant={resumeVariant}
            snippet={snippet}
          />
        </div>

        <div className="reveal reveal-d1">
          <PathMap
            curriculum={curriculum}
            progress={progress}
            pathPercent={pathPercent}
            resumeTargetId={resumeTarget.id}
            stageTargetSlugs={stageTargetSlugs}
          />
        </div>

        <div className="reveal reveal-d2">
          {statsError ? (
            <div className="grid grid-cols-3 gap-3 max-[480px]:grid-cols-1">
              {["This week", "Lessons done", "Day streak"].map((label) => (
                <div key={label} className="rounded-lg bg-elevated p-4">
                  <p className="text-xs text-muted">{label}</p>
                  <p className="mt-1 font-mono text-lg text-muted">&mdash;</p>
                </div>
              ))}
            </div>
          ) : (
            <StatsStrip
              lessonsCompletedThisWeek={progress.lessonsCompletedThisWeek}
              weeklyGoal={progress.weeklyGoal}
              totalLessonsCompleted={progress.totalLessonsCompleted}
              streakDays={progress.streakDays}
            />
          )}
        </div>
      </div>
    </div>
  );
}

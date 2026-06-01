"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { Greeting } from "@/components/dashboard/Greeting";
import { Hero } from "@/components/dashboard/Hero";
import { Road } from "@/components/dashboard/Road";
import { StatsStrip } from "@/components/dashboard/StatsStrip";
import { ActivityHeatmap } from "@/components/dashboard/ActivityHeatmap";
import { trackDashboardEvent } from "@/lib/dashboard/analytics";
import { deriveStageStates } from "@/lib/path";
import type { Module, Lesson, DashboardProgress, ResumeVariant, Stage } from "@/lib/dashboard/types";

interface DashboardProps {
  curriculum: Module[];
  progress: DashboardProgress;
  resumeTarget: Lesson;
  resumeVariant: ResumeVariant;
  pathPercent: number;
  stageTargetSlugs: Record<Stage, string>;
  lastVisitedLessonId: string | null;
  statsError?: boolean;
  displayName: string | null;
  currentHour: number;
  activityData: Record<string, number>;
}

export function Dashboard({
  curriculum,
  progress,
  resumeTarget,
  resumeVariant,
  pathPercent,
  stageTargetSlugs,
  lastVisitedLessonId,
  statsError,
  displayName,
  currentHour,
  activityData,
}: DashboardProps) {
  const router = useRouter();
  const reducedMotion = useReducedMotion();

  const containerVariants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.07 },
    },
  };

  const itemVariants = reducedMotion
    ? { hidden: {}, visible: {} }
    : {
        hidden: { opacity: 0, y: 12 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
        },
      };

  useEffect(() => {
    router.prefetch(`/lessons/${resumeTarget.slug}`);
    trackDashboardEvent("dashboard_viewed", { state: resumeVariant });
  }, [router, resumeTarget.slug, resumeVariant]);

  const resumeModule = curriculum.find((m) => m.id === resumeTarget.moduleId)!;
  const snippet = progress.lessonProgress[resumeTarget.id]?.lastCodeSnippet;
  const stageStates = deriveStageStates(curriculum, progress, lastVisitedLessonId);

  return (
    <div className="mx-auto max-w-[720px] px-6 py-8">
      <motion.div className="space-y-8" variants={containerVariants} initial="hidden" animate="visible">
        <motion.div variants={itemVariants}>
          <Greeting displayName={displayName} hour={currentHour} />
        </motion.div>

        <motion.div variants={itemVariants}>
          <Hero
            lesson={resumeTarget}
            module={resumeModule}
            variant={resumeVariant}
            snippet={snippet}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <Road
            stageStates={stageStates}
            pathPercent={pathPercent}
            stageTargetSlugs={stageTargetSlugs}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          {statsError ? (
            <div className="grid grid-cols-3 gap-3 max-[480px]:grid-cols-1">
              {["This week", "Lessons done", "Day streak"].map((label) => (
                <div key={label} className="rounded-card border border-glass-border bg-[var(--glass-fill)] p-4">
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
        </motion.div>

        <motion.div variants={itemVariants}>
          <ActivityHeatmap activityData={activityData} />
        </motion.div>
      </motion.div>
    </div>
  );
}

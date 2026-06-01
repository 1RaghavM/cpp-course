import type { Module, DashboardProgress, Stage, StageState } from "@/lib/dashboard/types";
import { STAGES } from "@/lib/dashboard/curriculum";

export function deriveStageStates(
  curriculum: Module[],
  progress: DashboardProgress,
  lastVisitedLessonId: string | null,
): StageState[] {
  let activeStageId: Stage | null = null;

  if (lastVisitedLessonId) {
    for (const mod of curriculum) {
      if (mod.lessons.some((l) => l.id === lastVisitedLessonId)) {
        activeStageId = mod.stage;
        break;
      }
    }
  }

  const stageStats = STAGES.map((stage) => {
    const stageLessons = curriculum
      .filter((m) => m.stage === stage.id)
      .flatMap((m) => m.lessons);
    const total = stageLessons.length;
    const completed = stageLessons.filter((l) => {
      const status = progress.lessonProgress[l.id]?.status;
      return status === "completed" || status === "skipped";
    }).length;

    return { stageId: stage.id, completed, total };
  });

  if (!activeStageId) {
    activeStageId = STAGES[0]!.id;
  }

  return stageStats.map((stat, index) => {
    if (stat.completed === stat.total && stat.total > 0) {
      return { ...stat, status: "completed" as const };
    }

    if (stat.stageId === activeStageId) {
      return { ...stat, status: "active" as const };
    }

    if (index > 0) {
      const prevStat = stageStats[index - 1]!;
      if (prevStat.completed === 0) {
        return { ...stat, status: "locked" as const };
      }
    }

    return { ...stat, status: "unlocked" as const };
  });
}

const PREREQ_HINTS: Record<Stage, string> = {
  basics: "",
  "memory-oop": "This section builds on variables, control flow, and functions from Basics.",
  "stl-templates": "You'll want to be comfortable with classes, pointers, and references first.",
  advanced: "Assumes familiarity with OOP, templates, and the standard library.",
};

export function getPrereqHint(stageId: Stage): string {
  return PREREQ_HINTS[stageId];
}

import type {
  Module,
  Lesson,
  DashboardProgress,
  StageProgressResult,
  Stage,
  ResumeVariant,
} from "@/lib/dashboard/types";
import { flattenLessons } from "@/lib/dashboard/curriculum";

export function computeResumeTarget(
  curriculum: Module[],
  progress: DashboardProgress,
  lastActiveLessonId: string | null,
): Lesson {
  const ordered = flattenLessons(curriculum);

  if (lastActiveLessonId) {
    const last = ordered.find((l) => l.id === lastActiveLessonId);
    if (last && progress.lessonProgress[last.id]?.status === "in_progress") {
      return last;
    }
  }

  const next = ordered.find((l) => {
    const status = progress.lessonProgress[l.id]?.status;
    return status !== "completed" && status !== "skipped";
  });

  return next ?? ordered[ordered.length - 1]!;
}

export function computeResumeVariant(
  curriculum: Module[],
  progress: DashboardProgress,
): ResumeVariant {
  if (progress.totalLessonsCompleted === 0) return "start";
  if (isPathComplete(curriculum, progress)) return "complete";
  return "resume";
}

export function computePathPercent(curriculum: Module[], progress: DashboardProgress): number {
  const total = curriculum.reduce((sum, m) => sum + m.lessons.length, 0);
  if (total === 0) return 0;
  return Math.round((progress.totalLessonsCompleted / total) * 100);
}

export function computeStageProgress(
  curriculum: Module[],
  progress: DashboardProgress,
  stage: Stage,
  resumeTargetId: string,
): StageProgressResult {
  const stageModules = curriculum.filter((m) => m.stage === stage);
  const stageLessons = stageModules.flatMap((m) => m.lessons);
  const total = stageLessons.length;
  const completed = stageLessons.filter((l) => {
    const status = progress.lessonProgress[l.id]?.status;
    return status === "completed" || status === "skipped";
  }).length;

  if (completed === total && total > 0) return { completed, total, status: "done" };

  const containsResume = stageLessons.some((l) => l.id === resumeTargetId);
  if (containsResume) return { completed, total, status: "active" };

  return { completed, total, status: "locked" };
}

export function isPathComplete(curriculum: Module[], progress: DashboardProgress): boolean {
  const allLessons = curriculum.flatMap((m) => m.lessons);
  return allLessons.every((l) => {
    const status = progress.lessonProgress[l.id]?.status;
    return status === "completed" || status === "skipped";
  });
}

export function computeStreakDays(
  lastActiveDate: string | null,
  storedStreak: number,
  today: string,
): number {
  if (!lastActiveDate) return 0;
  if (lastActiveDate === today) return storedStreak;

  const lastDate = new Date(lastActiveDate + "T00:00:00Z");
  const todayDate = new Date(today + "T00:00:00Z");
  const diffMs = todayDate.getTime() - lastDate.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return storedStreak;
  return 0;
}

export function computeWeeklyCompleted(
  records: { completedAt: string }[],
  today: string,
): number {
  const todayDate = new Date(today + "T00:00:00Z");
  const dayOfWeek = todayDate.getUTCDay();
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const mondayMs = todayDate.getTime() - daysSinceMonday * 24 * 60 * 60 * 1000;
  const monday = new Date(mondayMs);
  monday.setUTCHours(0, 0, 0, 0);

  const sundayEnd = new Date(monday.getTime() + 7 * 24 * 60 * 60 * 1000);

  return records.filter((r) => {
    const d = new Date(r.completedAt);
    return d >= monday && d < sundayEnd;
  }).length;
}

import type { ModuleId } from "@/lib/onboarding/types";

export type Stage = "basics" | "memory-oop" | "stl-templates" | "advanced";

export type LessonStatus = "not_started" | "in_progress" | "completed" | "skipped";

export type StageStatus = "done" | "active" | "locked";

export type ResumeVariant = "resume" | "start" | "complete" | "next-chapter";

export interface Lesson {
  id: string;
  moduleId: ModuleId;
  title: string;
  slug: string;
  order: number;
}

export interface Module {
  id: ModuleId;
  stage: Stage;
  title: string;
  order: number;
  lessons: Lesson[];
}

export interface LessonProgressEntry {
  status: LessonStatus;
  lastCodeSnippet?: string;
  lastVisitAt: string;
}

export interface DashboardProgress {
  lessonProgress: Record<string, LessonProgressEntry>;
  streakDays: number;
  lastActiveDate: string | null;
  weeklyGoal: number | null;
  totalLessonsCompleted: number;
  lessonsCompletedThisWeek: number;
}

export interface StageProgressResult {
  completed: number;
  total: number;
  status: StageStatus;
}

export interface ModuleDefinition {
  id: ModuleId;
  stage: Stage;
  title: string;
  order: number;
  chapterIds: number[];
}

export type StageState = {
  stageId: Stage;
  status: "completed" | "active" | "locked" | "unlocked";
  completed: number;
  total: number;
};

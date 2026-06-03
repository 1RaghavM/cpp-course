import { describe, it, expect } from "vitest";
import {
  computeResumeTarget,
  computeResumeVariant,
  computePathPercent,
  computeStageProgress,
  isPathComplete,
  computeStreakDays,
  computeWeeklyCompleted,
} from "@/lib/dashboard/resume";
import type { Module, Lesson, DashboardProgress } from "@/lib/dashboard/types";

function makeLessons(count: number, moduleId: string = "variables"): Lesson[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `lesson-${i}`,
    moduleId: moduleId as any,
    title: `Lesson ${i}`,
    slug: `lesson-${i}`,
    order: i,
  }));
}

function makeCurriculum(): Module[] {
  return [
    { id: "variables", stage: "basics", title: "Variables", order: 1, lessons: makeLessons(3, "variables") },
    { id: "control-flow", stage: "basics", title: "Control Flow", order: 2, lessons: makeLessons(2, "control-flow").map((l, i) => ({ ...l, id: `cf-${i}`, slug: `cf-${i}` })) },
    { id: "pointers", stage: "memory-oop", title: "Pointers", order: 3, lessons: makeLessons(2, "pointers").map((l, i) => ({ ...l, id: `ptr-${i}`, slug: `ptr-${i}` })) },
    { id: "templates", stage: "stl-templates", title: "Templates", order: 4, lessons: makeLessons(2, "templates").map((l, i) => ({ ...l, id: `tpl-${i}`, slug: `tpl-${i}` })) },
    { id: "concurrency", stage: "advanced", title: "Concurrency", order: 5, lessons: makeLessons(1, "concurrency").map((l, i) => ({ ...l, id: `conc-${i}`, slug: `conc-${i}` })) },
  ];
}

function emptyProgress(): DashboardProgress {
  return {
    lessonProgress: {},
    streakDays: 0,
    lastActiveDate: null,
    weeklyGoal: null,
    totalLessonsCompleted: 0,
    lessonsCompletedThisWeek: 0,
  };
}

describe("computeResumeTarget", () => {
  const curriculum = makeCurriculum();

  it("returns first lesson when progress is empty", () => {
    const result = computeResumeTarget(curriculum, emptyProgress(), null);
    expect(result.id).toBe("lesson-0");
  });

  it("returns in-progress lesson matching lastActiveLessonId", () => {
    const progress = emptyProgress();
    progress.lessonProgress["cf-1"] = { status: "in_progress", lastVisitAt: "2026-01-02T00:00:00Z" };
    progress.lessonProgress["lesson-0"] = { status: "in_progress", lastVisitAt: "2026-01-01T00:00:00Z" };
    const result = computeResumeTarget(curriculum, progress, "cf-1");
    expect(result.id).toBe("cf-1");
  });

  it("returns first non-completed lesson when no in-progress", () => {
    const progress = emptyProgress();
    progress.lessonProgress["lesson-0"] = { status: "completed", lastVisitAt: "2026-01-01T00:00:00Z" };
    progress.lessonProgress["lesson-1"] = { status: "completed", lastVisitAt: "2026-01-01T00:00:00Z" };
    progress.totalLessonsCompleted = 2;
    const result = computeResumeTarget(curriculum, progress, null);
    expect(result.id).toBe("lesson-2");
  });

  it("returns last lesson when all completed", () => {
    const progress = emptyProgress();
    const allLessons = curriculum.flatMap((m) => m.lessons);
    for (const l of allLessons) {
      progress.lessonProgress[l.id] = { status: "completed", lastVisitAt: "2026-01-01T00:00:00Z" };
    }
    progress.totalLessonsCompleted = allLessons.length;
    const result = computeResumeTarget(curriculum, progress, null);
    expect(result.id).toBe("conc-0");
  });

  it("skips lastActiveLessonId if that lesson is completed", () => {
    const progress = emptyProgress();
    progress.lessonProgress["lesson-0"] = { status: "completed", lastVisitAt: "2026-01-02T00:00:00Z" };
    const result = computeResumeTarget(curriculum, progress, "lesson-0");
    expect(result.id).toBe("lesson-1");
  });
});

describe("computeResumeVariant", () => {
  const curriculum = makeCurriculum();
  const firstLesson = curriculum[0]!.lessons[0]!;

  it("returns 'start' when no lessons completed", () => {
    expect(computeResumeVariant(curriculum, emptyProgress(), firstLesson)).toBe("start");
  });

  it("returns 'resume' when partially completed", () => {
    const progress = emptyProgress();
    progress.lessonProgress["lesson-0"] = { status: "completed", lastVisitAt: "2026-01-01T00:00:00Z" };
    progress.totalLessonsCompleted = 1;
    const target = curriculum[0]!.lessons[1]!;
    expect(computeResumeVariant(curriculum, progress, target)).toBe("resume");
  });

  it("returns 'complete' when all done", () => {
    const progress = emptyProgress();
    const allLessons = curriculum.flatMap((m) => m.lessons);
    for (const l of allLessons) {
      progress.lessonProgress[l.id] = { status: "completed", lastVisitAt: "2026-01-01T00:00:00Z" };
    }
    progress.totalLessonsCompleted = allLessons.length;
    const lastLesson = allLessons[allLessons.length - 1]!;
    expect(computeResumeVariant(curriculum, progress, lastLesson)).toBe("complete");
  });

  it("returns 'next-chapter' when previous module is fully completed and target is first lesson of next module", () => {
    const progress = emptyProgress();
    for (const l of curriculum[0]!.lessons) {
      progress.lessonProgress[l.id] = { status: "completed", lastVisitAt: "2026-01-01T00:00:00Z" };
    }
    progress.totalLessonsCompleted = curriculum[0]!.lessons.length;
    const nextModuleFirstLesson = curriculum[1]!.lessons[0]!;
    expect(computeResumeVariant(curriculum, progress, nextModuleFirstLesson)).toBe("next-chapter");
  });

  it("returns 'resume' when target is first lesson of next module but already in-progress", () => {
    const progress = emptyProgress();
    for (const l of curriculum[0]!.lessons) {
      progress.lessonProgress[l.id] = { status: "completed", lastVisitAt: "2026-01-01T00:00:00Z" };
    }
    progress.totalLessonsCompleted = curriculum[0]!.lessons.length;
    const nextModuleFirstLesson = curriculum[1]!.lessons[0]!;
    progress.lessonProgress[nextModuleFirstLesson.id] = { status: "in_progress", lastVisitAt: "2026-01-02T00:00:00Z" };
    expect(computeResumeVariant(curriculum, progress, nextModuleFirstLesson)).toBe("resume");
  });
});

describe("computePathPercent", () => {
  const curriculum = makeCurriculum();
  const totalLessons = curriculum.reduce((s, m) => s + m.lessons.length, 0);

  it("returns 0 for empty progress", () => {
    expect(computePathPercent(curriculum, emptyProgress())).toBe(0);
  });

  it("returns 100 when all complete", () => {
    const progress = emptyProgress();
    progress.totalLessonsCompleted = totalLessons;
    expect(computePathPercent(curriculum, progress)).toBe(100);
  });

  it("rounds correctly", () => {
    const progress = emptyProgress();
    progress.totalLessonsCompleted = 1;
    expect(computePathPercent(curriculum, progress)).toBe(Math.round((1 / totalLessons) * 100));
  });
});

describe("computeStageProgress", () => {
  const curriculum = makeCurriculum();

  it("returns locked for a stage with no progress and no resume target", () => {
    const result = computeStageProgress(curriculum, emptyProgress(), "memory-oop", "lesson-0");
    expect(result.status).toBe("locked");
  });

  it("returns active for the stage containing the resume target", () => {
    const result = computeStageProgress(curriculum, emptyProgress(), "basics", "lesson-0");
    expect(result.status).toBe("active");
  });

  it("returns done when all lessons in stage are completed", () => {
    const progress = emptyProgress();
    progress.lessonProgress["lesson-0"] = { status: "completed", lastVisitAt: "" };
    progress.lessonProgress["lesson-1"] = { status: "completed", lastVisitAt: "" };
    progress.lessonProgress["lesson-2"] = { status: "completed", lastVisitAt: "" };
    progress.lessonProgress["cf-0"] = { status: "completed", lastVisitAt: "" };
    progress.lessonProgress["cf-1"] = { status: "completed", lastVisitAt: "" };
    const result = computeStageProgress(curriculum, progress, "basics", "ptr-0");
    expect(result.status).toBe("done");
    expect(result.completed).toBe(5);
    expect(result.total).toBe(5);
  });

  it("ensures exactly one stage is active", () => {
    const progress = emptyProgress();
    const resumeTargetId = "lesson-0";
    const stages = ["basics", "memory-oop", "stl-templates", "advanced"] as const;
    const results = stages.map((s) => computeStageProgress(curriculum, progress, s, resumeTargetId));
    const activeCount = results.filter((r) => r.status === "active").length;
    expect(activeCount).toBe(1);
  });
});

describe("isPathComplete", () => {
  const curriculum = makeCurriculum();

  it("returns false for empty progress", () => {
    expect(isPathComplete(curriculum, emptyProgress())).toBe(false);
  });

  it("returns true when all lessons completed", () => {
    const progress = emptyProgress();
    const allLessons = curriculum.flatMap((m) => m.lessons);
    for (const l of allLessons) {
      progress.lessonProgress[l.id] = { status: "completed", lastVisitAt: "" };
    }
    progress.totalLessonsCompleted = allLessons.length;
    expect(isPathComplete(curriculum, progress)).toBe(true);
  });
});

describe("computeStreakDays", () => {
  it("returns stored streak when lastActiveDate is today", () => {
    expect(computeStreakDays("2026-05-31", 5, "2026-05-31")).toBe(5);
  });

  it("returns stored streak when lastActiveDate is yesterday", () => {
    expect(computeStreakDays("2026-05-30", 5, "2026-05-31")).toBe(5);
  });

  it("returns 0 when gap is more than 1 day", () => {
    expect(computeStreakDays("2026-05-28", 5, "2026-05-31")).toBe(0);
  });

  it("returns 0 when lastActiveDate is null", () => {
    expect(computeStreakDays(null, 0, "2026-05-31")).toBe(0);
  });
});

describe("computeWeeklyCompleted", () => {
  it("returns 0 when no completions", () => {
    expect(computeWeeklyCompleted([], "2026-05-31")).toBe(0);
  });

  it("counts completions in current week (Mon-Sun)", () => {
    const records = [
      { completedAt: "2026-05-25T10:00:00Z" },
      { completedAt: "2026-05-31T23:59:59Z" },
      { completedAt: "2026-05-24T23:59:59Z" },
    ];
    expect(computeWeeklyCompleted(records, "2026-05-31")).toBe(2);
  });
});

import { describe, it, expect } from "vitest";
import { deriveStageStates, getPrereqHint } from "@/lib/path";
import type { Module, Lesson, DashboardProgress } from "@/lib/dashboard/types";

function makeLessons(count: number, moduleId: string): Lesson[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${moduleId}-${i}`,
    moduleId: moduleId as any,
    title: `Lesson ${i}`,
    slug: `${moduleId}-${i}`,
    order: i,
  }));
}

function makeCurriculum(): Module[] {
  return [
    { id: "variables", stage: "basics", title: "Variables", order: 1, lessons: makeLessons(3, "variables") },
    { id: "control-flow", stage: "basics", title: "Control Flow", order: 2, lessons: makeLessons(2, "control-flow") },
    { id: "pointers", stage: "memory-oop", title: "Pointers", order: 3, lessons: makeLessons(2, "pointers") },
    { id: "templates", stage: "stl-templates", title: "Templates", order: 4, lessons: makeLessons(2, "templates") },
    { id: "concurrency", stage: "advanced", title: "Concurrency", order: 5, lessons: makeLessons(1, "concurrency") },
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

describe("deriveStageStates", () => {
  const curriculum = makeCurriculum();

  it("marks first stage active and others locked for zero-progress user", () => {
    const states = deriveStageStates(curriculum, emptyProgress(), null);
    expect(states[0]!.status).toBe("active");
    expect(states[1]!.status).toBe("locked");
    expect(states[2]!.status).toBe("locked");
    expect(states[3]!.status).toBe("locked");
  });

  it("marks the stage containing lastVisitedLessonId as active", () => {
    const progress = emptyProgress();
    progress.lessonProgress["pointers-0"] = { status: "in_progress", lastVisitAt: "2026-01-02T00:00:00Z" };
    const states = deriveStageStates(curriculum, progress, "pointers-0");
    expect(states.find((s) => s.stageId === "memory-oop")!.status).toBe("active");
  });

  it("active overrides locked even if prior stage has 0 completions", () => {
    const progress = emptyProgress();
    progress.lessonProgress["templates-0"] = { status: "in_progress", lastVisitAt: "2026-01-02T00:00:00Z" };
    const states = deriveStageStates(curriculum, progress, "templates-0");
    expect(states.find((s) => s.stageId === "stl-templates")!.status).toBe("active");
  });

  it("marks a completed stage as completed regardless of active", () => {
    const progress = emptyProgress();
    ["variables-0", "variables-1", "variables-2", "control-flow-0", "control-flow-1"].forEach((id) => {
      progress.lessonProgress[id] = { status: "completed", lastVisitAt: "2026-01-01T00:00:00Z" };
    });
    progress.totalLessonsCompleted = 5;
    const states = deriveStageStates(curriculum, progress, "variables-0");
    expect(states.find((s) => s.stageId === "basics")!.status).toBe("completed");
  });

  it("marks a stage as unlocked when prior stage has some completions", () => {
    const progress = emptyProgress();
    progress.lessonProgress["variables-0"] = { status: "completed", lastVisitAt: "2026-01-01T00:00:00Z" };
    progress.totalLessonsCompleted = 1;
    const states = deriveStageStates(curriculum, progress, "variables-0");
    expect(states.find((s) => s.stageId === "basics")!.status).toBe("active");
    expect(states.find((s) => s.stageId === "memory-oop")!.status).toBe("unlocked");
  });

  it("returns correct completed/total counts per stage", () => {
    const progress = emptyProgress();
    progress.lessonProgress["variables-0"] = { status: "completed", lastVisitAt: "" };
    progress.lessonProgress["variables-1"] = { status: "skipped", lastVisitAt: "" };
    const states = deriveStageStates(curriculum, progress, "variables-2");
    const basics = states.find((s) => s.stageId === "basics")!;
    expect(basics.completed).toBe(2);
    expect(basics.total).toBe(5);
  });

  it("has exactly one active stage", () => {
    const progress = emptyProgress();
    progress.lessonProgress["pointers-0"] = { status: "in_progress", lastVisitAt: "2026-01-02T00:00:00Z" };
    const states = deriveStageStates(curriculum, progress, "pointers-0");
    const activeCount = states.filter((s) => s.status === "active").length;
    expect(activeCount).toBe(1);
  });
});

describe("getPrereqHint", () => {
  it("returns empty string for basics", () => {
    expect(getPrereqHint("basics")).toBe("");
  });

  it("returns a non-empty hint for non-basics stages", () => {
    expect(getPrereqHint("memory-oop").length).toBeGreaterThan(0);
    expect(getPrereqHint("stl-templates").length).toBeGreaterThan(0);
    expect(getPrereqHint("advanced").length).toBeGreaterThan(0);
  });
});

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
    { id: "intro-basics", stage: "basics", title: "Intro & Basics", order: 1, lessons: makeLessons(3, "intro-basics") },
    { id: "functions-debugging", stage: "basics", title: "Functions & Debugging", order: 2, lessons: makeLessons(2, "functions-debugging") },
    { id: "refs-pointers", stage: "memory-oop", title: "References & Pointers", order: 3, lessons: makeLessons(2, "refs-pointers") },
    { id: "vectors-arrays", stage: "stl-templates", title: "Vectors & Arrays", order: 4, lessons: makeLessons(2, "vectors-arrays") },
    { id: "templates-exceptions-io", stage: "advanced", title: "Templates, Exceptions & I/O", order: 5, lessons: makeLessons(1, "templates-exceptions-io") },
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
    progress.lessonProgress["refs-pointers-0"] = { status: "in_progress", lastVisitAt: "2026-01-02T00:00:00Z" };
    const states = deriveStageStates(curriculum, progress, "refs-pointers-0");
    expect(states.find((s) => s.stageId === "memory-oop")!.status).toBe("active");
  });

  it("active overrides locked even if prior stage has 0 completions", () => {
    const progress = emptyProgress();
    progress.lessonProgress["vectors-arrays-0"] = { status: "in_progress", lastVisitAt: "2026-01-02T00:00:00Z" };
    const states = deriveStageStates(curriculum, progress, "vectors-arrays-0");
    expect(states.find((s) => s.stageId === "stl-templates")!.status).toBe("active");
  });

  it("marks a completed stage as completed regardless of active", () => {
    const progress = emptyProgress();
    ["intro-basics-0", "intro-basics-1", "intro-basics-2", "functions-debugging-0", "functions-debugging-1"].forEach((id) => {
      progress.lessonProgress[id] = { status: "completed", lastVisitAt: "2026-01-01T00:00:00Z" };
    });
    progress.totalLessonsCompleted = 5;
    const states = deriveStageStates(curriculum, progress, "intro-basics-0");
    expect(states.find((s) => s.stageId === "basics")!.status).toBe("completed");
  });

  it("marks a stage as unlocked when prior stage has some completions", () => {
    const progress = emptyProgress();
    progress.lessonProgress["intro-basics-0"] = { status: "completed", lastVisitAt: "2026-01-01T00:00:00Z" };
    progress.totalLessonsCompleted = 1;
    const states = deriveStageStates(curriculum, progress, "intro-basics-0");
    expect(states.find((s) => s.stageId === "basics")!.status).toBe("active");
    expect(states.find((s) => s.stageId === "memory-oop")!.status).toBe("unlocked");
  });

  it("returns correct completed/total counts per stage", () => {
    const progress = emptyProgress();
    progress.lessonProgress["intro-basics-0"] = { status: "completed", lastVisitAt: "" };
    progress.lessonProgress["intro-basics-1"] = { status: "skipped", lastVisitAt: "" };
    const states = deriveStageStates(curriculum, progress, "intro-basics-2");
    const basics = states.find((s) => s.stageId === "basics")!;
    expect(basics.completed).toBe(2);
    expect(basics.total).toBe(5);
  });

  it("has exactly one active stage", () => {
    const progress = emptyProgress();
    progress.lessonProgress["refs-pointers-0"] = { status: "in_progress", lastVisitAt: "2026-01-02T00:00:00Z" };
    const states = deriveStageStates(curriculum, progress, "refs-pointers-0");
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

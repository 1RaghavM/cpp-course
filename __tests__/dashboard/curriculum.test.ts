import { describe, it, expect } from "vitest";
import { CURRICULUM, buildCurriculum, flattenLessons } from "@/lib/dashboard/curriculum";

const FAKE_LESSONS = CURRICULUM.flatMap((mod) =>
  mod.chapterIds.flatMap((chId, chIdx) =>
    Array.from({ length: 3 }, (_, i) => ({
      id: `${mod.id}-${chId}-${i}`,
      chapter_id: chId,
      slug: `${mod.id}-${chId}-${i}`,
      learncpp_title: `Lesson ${i}`,
      my_title: null,
      sort_order: mod.order * 1000 + chIdx * 100 + i,
    }))
  )
);

describe("CURRICULUM", () => {
  it("has 16 modules", () => {
    expect(CURRICULUM).toHaveLength(16);
  });

  it("covers all four stages", () => {
    const stages = new Set(CURRICULUM.map((m) => m.stage));
    expect(stages).toEqual(new Set(["basics", "memory-oop", "stl-templates", "advanced"]));
  });

  it("has unique module orders", () => {
    const orders = CURRICULUM.map((m) => m.order);
    expect(new Set(orders).size).toBe(orders.length);
  });

  it("has no duplicate chapter IDs across modules", () => {
    const allChapterIds = CURRICULUM.flatMap((m) => m.chapterIds);
    expect(new Set(allChapterIds).size).toBe(allChapterIds.length);
  });
});

describe("buildCurriculum", () => {
  const modules = buildCurriculum(FAKE_LESSONS);

  it("produces 16 modules", () => {
    expect(modules).toHaveLength(16);
  });

  it("assigns every lesson to exactly one module", () => {
    const allLessonIds = modules.flatMap((m) => m.lessons.map((l) => l.id));
    expect(new Set(allLessonIds).size).toBe(allLessonIds.length);
    expect(allLessonIds.length).toBe(FAKE_LESSONS.length);
  });

  it("preserves module order", () => {
    const orders = modules.map((m) => m.order);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });

  it("sets correct moduleId on each lesson", () => {
    for (const mod of modules) {
      for (const lesson of mod.lessons) {
        expect(lesson.moduleId).toBe(mod.id);
      }
    }
  });
});

describe("flattenLessons", () => {
  const modules = buildCurriculum(FAKE_LESSONS);
  const flat = flattenLessons(modules);

  it("returns all lessons", () => {
    const totalLessons = modules.reduce((sum, m) => sum + m.lessons.length, 0);
    expect(flat).toHaveLength(totalLessons);
  });

  it("is ordered by module order then lesson order", () => {
    for (let i = 1; i < flat.length; i++) {
      const prev = flat[i - 1]!;
      const curr = flat[i]!;
      const prevMod = modules.find((m) => m.id === prev.moduleId)!;
      const currMod = modules.find((m) => m.id === curr.moduleId)!;
      if (prevMod.order === currMod.order) {
        expect(prev.order).toBeLessThanOrEqual(curr.order);
      } else {
        expect(prevMod.order).toBeLessThan(currMod.order);
      }
    }
  });
});

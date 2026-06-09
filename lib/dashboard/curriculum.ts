import type { ModuleDefinition, Module, Lesson, Stage } from "@/lib/dashboard/types";

export const CURRICULUM: ModuleDefinition[] = [
  // Stage: basics (chapters 0–10, following curriculum_seed.json order)
  { id: "intro-basics",       stage: "basics",        title: "Introduction & C++ Basics",          order: 1,  chapterIds: [0, 1] },
  { id: "functions-debugging", stage: "basics",        title: "Functions, Files & Debugging",       order: 2,  chapterIds: [2, 3] },
  { id: "types-constants",    stage: "basics",        title: "Data Types, Constants & Strings",    order: 3,  chapterIds: [4, 5] },
  { id: "operators",          stage: "basics",        title: "Operators & Bit Manipulation",       order: 4,  chapterIds: [6, 7] },
  { id: "scope-control-flow", stage: "basics",        title: "Scope, Linkage & Control Flow",      order: 5,  chapterIds: [8, 9] },
  { id: "errors-type-conv",   stage: "basics",        title: "Error Handling & Type Conversion",   order: 6,  chapterIds: [10, 11] },
  // Stage: memory-oop (chapters 12–17)
  { id: "overloading-constexpr", stage: "memory-oop", title: "Overloading, Templates & Constexpr", order: 7,  chapterIds: [12, 13] },
  { id: "refs-pointers",      stage: "memory-oop",    title: "References & Pointers",              order: 8,  chapterIds: [14] },
  { id: "enums-structs",      stage: "memory-oop",    title: "Enums & Structs",                    order: 9,  chapterIds: [15] },
  { id: "classes",            stage: "memory-oop",    title: "Classes",                            order: 10, chapterIds: [16, 17] },
  // Stage: stl-templates (chapters 18–23)
  { id: "vectors-arrays",     stage: "stl-templates", title: "Vectors & Arrays",                   order: 11, chapterIds: [18, 19] },
  { id: "algorithms-memory",  stage: "stl-templates", title: "Iterators, Algorithms & Memory",     order: 12, chapterIds: [20, 21] },
  { id: "adv-functions",      stage: "stl-templates", title: "Functions & Operator Overloading",    order: 13, chapterIds: [22, 23] },
  // Stage: advanced (chapters 24–33)
  { id: "move-semantics",     stage: "advanced",      title: "Move Semantics & Smart Pointers",    order: 14, chapterIds: [24] },
  { id: "inheritance-poly",   stage: "advanced",      title: "Inheritance & Polymorphism",          order: 15, chapterIds: [25, 26, 27] },
  { id: "templates-exceptions-io", stage: "advanced", title: "Templates, Exceptions & I/O",        order: 16, chapterIds: [28, 29, 30, 31, 32, 33] },
];

export const STAGES: { id: Stage; title: string; order: number }[] = [
  { id: "basics", title: "Basics", order: 0 },
  { id: "memory-oop", title: "Memory & OOP", order: 1 },
  { id: "stl-templates", title: "STL & Templates", order: 2 },
  { id: "advanced", title: "Advanced", order: 3 },
];

interface DbLesson {
  id: string;
  chapter_id: number;
  number: string;
  slug: string;
  learncpp_title: string;
  my_title: string | null;
  sort_order: number;
}

export function buildCurriculum(dbLessons: DbLesson[]): Module[] {
  const lessonsByChapter = new Map<number, DbLesson[]>();
  for (const lesson of dbLessons) {
    const arr = lessonsByChapter.get(lesson.chapter_id) ?? [];
    arr.push(lesson);
    lessonsByChapter.set(lesson.chapter_id, arr);
  }

  return CURRICULUM.map((def) => {
    const lessons: Lesson[] = def.chapterIds
      .flatMap((chId) => lessonsByChapter.get(chId) ?? [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((db) => ({
        id: db.id,
        moduleId: def.id,
        number: db.number,
        title: db.my_title ?? db.learncpp_title,
        slug: db.slug,
        order: db.sort_order,
      }));

    return {
      id: def.id,
      stage: def.stage,
      title: def.title,
      order: def.order,
      lessons,
    };
  }).sort((a, b) => a.order - b.order);
}

export function flattenLessons(curriculum: Module[]): Lesson[] {
  return curriculum
    .sort((a, b) => a.order - b.order)
    .flatMap((m) => [...m.lessons].sort((a, b) => a.order - b.order));
}

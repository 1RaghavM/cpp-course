import type { ModuleDefinition, Module, Lesson, Stage } from "@/lib/dashboard/types";

export const CURRICULUM: ModuleDefinition[] = [
  // Stage: basics
  { id: "variables",      stage: "basics",        title: "Variables & Types",           order: 1,  chapterIds: [0, 1, 4, 5] },
  { id: "control-flow",   stage: "basics",        title: "Control Flow",               order: 2,  chapterIds: [9, 10] },
  { id: "functions",      stage: "basics",        title: "Functions & Files",          order: 3,  chapterIds: [2, 8] },
  { id: "arrays-strings", stage: "basics",        title: "Arrays & Strings",           order: 4,  chapterIds: [19] },
  { id: "io-streams",     stage: "basics",        title: "I/O Streams",                order: 5,  chapterIds: [30] },
  { id: "operators",      stage: "basics",        title: "Operators & Types",          order: 6,  chapterIds: [3, 6, 7, 11] },
  // Stage: memory-oop
  { id: "pointers",       stage: "memory-oop",    title: "Pointers & References",      order: 7,  chapterIds: [14] },
  { id: "references",     stage: "memory-oop",    title: "Enums & Structs",            order: 8,  chapterIds: [15] },
  { id: "classes",        stage: "memory-oop",    title: "Classes & OOP",              order: 9,  chapterIds: [16, 17] },
  { id: "raii",           stage: "memory-oop",    title: "Scope & Dynamic Allocation", order: 10, chapterIds: [21, 22] },
  // Stage: stl-templates
  { id: "vectors-maps",   stage: "stl-templates", title: "Vectors & Containers",       order: 11, chapterIds: [18, 20] },
  { id: "algorithms",     stage: "stl-templates", title: "Overloading & Functions",    order: 12, chapterIds: [12, 13, 23] },
  { id: "templates",      stage: "stl-templates", title: "Templates",                  order: 13, chapterIds: [28] },
  // Stage: advanced
  { id: "move-semantics", stage: "advanced",      title: "Move Semantics & Smart Ptrs", order: 14, chapterIds: [24] },
  { id: "smart-pointers", stage: "advanced",      title: "Inheritance & Polymorphism",  order: 15, chapterIds: [25, 26, 27] },
  { id: "concurrency",    stage: "advanced",      title: "Exceptions & Advanced",       order: 16, chapterIds: [29, 31, 32, 33] },
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

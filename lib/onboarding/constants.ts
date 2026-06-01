import type { Motivation } from "./types";

export const MODULE_TITLES: Record<string, string> = {
  variables: "Variables & Basics",
  pointers: "Memory & Pointers",
  classes: "Classes & RAII",
  "vectors-maps": "STL & Containers",
  templates: "Templates & Generics",
};

export const MOTIVATION_LINES: Record<Motivation, string> = {
  interviews: "Examples will lean toward the patterns that show up in interviews.",
  gamedev: "Examples will lean toward the kind of code games actually run.",
  systems: "Examples will lean toward low-level, close-to-the-metal code.",
  competitive: "Examples will lean toward fast, tight, contest-style code.",
  school: "Examples will track what most courses cover, in order.",
  curious: "We'll keep it concrete — real code, real output, every step.",
};

export const MODULE_FIRST_LESSON: Record<string, string> = {
  variables: "1-1",
  pointers: "12-1",
  classes: "14-1",
  "vectors-maps": "16-1",
  templates: "19-1",
};

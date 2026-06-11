import { describe, it, expect } from "vitest";
import { pickChapterQuizSet, type ChapterQuizInput } from "@/lib/content/chapter-quiz";
import type { ConceptCheck } from "@/lib/supabase/types";

const makeCheck = (id: string): ConceptCheck => ({
  id,
  lesson_id: `lesson-${id}`,
  kind: "mcq",
  prompt_md: "?",
  options: { a: "a", b: "b" },
  answer: "a",
  explanation_md: "because",
  position: 1,
  generated_at: "2026-06-01T00:00:00Z",
  generated_model: null,
});

const range = (prefix: string, n: number): ConceptCheck[] =>
  Array.from({ length: n }, (_, i) => makeCheck(`${prefix}${i}`));

const baseInput = (overrides: Partial<ChapterQuizInput> = {}): ChapterQuizInput => ({
  currentChapterChecks: range("cur", 20),
  priorChapterChecks: range("pri", 20),
  attemptHistory: [],
  seed: "user|4|2026-06-10",
  ...overrides,
});

describe("pickChapterQuizSet", () => {
  it("returns 10-15 items in the happy case", () => {
    const result = pickChapterQuizSet(baseInput());
    expect(result.length).toBeGreaterThanOrEqual(10);
    expect(result.length).toBeLessThanOrEqual(15);
  });

  it("mixes ~60% current chapter / ~40% prior chapters when both pools are large", () => {
    const result = pickChapterQuizSet(baseInput());
    const fromCurrent = result.filter((c) => c.id.startsWith("cur")).length;
    const fromPrior = result.filter((c) => c.id.startsWith("pri")).length;
    expect(fromCurrent).toBeGreaterThanOrEqual(6);
    expect(fromPrior).toBeGreaterThanOrEqual(4);
    expect(fromCurrent + fromPrior).toBe(result.length);
  });

  it("returns current-only when prior chapters are empty", () => {
    const result = pickChapterQuizSet(baseInput({ priorChapterChecks: [] }));
    expect(result.every((c) => c.id.startsWith("cur"))).toBe(true);
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  it("returns prior-only when current chapter is empty (degraded but playable)", () => {
    const result = pickChapterQuizSet(baseInput({ currentChapterChecks: [] }));
    expect(result.every((c) => c.id.startsWith("pri"))).toBe(true);
  });

  it("returns [] when both pools are empty", () => {
    expect(pickChapterQuizSet(baseInput({ currentChapterChecks: [], priorChapterChecks: [] }))).toEqual([]);
  });

  it("is deterministic for the same seed", () => {
    const a = pickChapterQuizSet(baseInput());
    const b = pickChapterQuizSet(baseInput());
    expect(a.map((c) => c.id)).toEqual(b.map((c) => c.id));
  });

  it("differs across seeds (likely)", () => {
    const a = pickChapterQuizSet(baseInput({ seed: "user|4|2026-06-10" }));
    const b = pickChapterQuizSet(baseInput({ seed: "user|4|2026-06-11" }));
    expect(a.map((c) => c.id)).not.toEqual(b.map((c) => c.id));
  });
});

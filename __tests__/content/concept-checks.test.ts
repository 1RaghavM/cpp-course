import { describe, it, expect } from "vitest";
import { pickWarmupIds, type WarmupCandidate } from "@/lib/content/concept-checks";

const c = (
  checkId: string,
  lastCorrect: boolean | null,
  lastAnsweredAt: string | null = null,
): WarmupCandidate => ({ checkId, lastCorrect, lastAnsweredAt });

describe("pickWarmupIds", () => {
  it("returns empty for no candidates", () => {
    expect(pickWarmupIds([])).toEqual([]);
  });

  it("prefers wrong answers over unseen and correct", () => {
    const ids = pickWarmupIds([
      c("seen-right", true, "2026-06-01T00:00:00Z"),
      c("unseen", null),
      c("seen-wrong", false, "2026-06-01T00:00:00Z"),
    ]);
    expect(ids[0]).toBe("seen-wrong");
  });

  it("fills with unseen before correctly-answered", () => {
    const ids = pickWarmupIds([
      c("right", true, "2026-06-01T00:00:00Z"),
      c("unseen-1", null),
      c("unseen-2", null),
      c("wrong", false, "2026-06-02T00:00:00Z"),
    ]);
    expect(ids).toEqual(["wrong", "unseen-1", "unseen-2"]);
  });

  it("orders wrong answers oldest-first", () => {
    const ids = pickWarmupIds([
      c("wrong-recent", false, "2026-06-05T00:00:00Z"),
      c("wrong-old", false, "2026-06-01T00:00:00Z"),
    ]);
    expect(ids).toEqual(["wrong-old", "wrong-recent"]);
  });

  it("orders correct answers least-recently-answered first", () => {
    const ids = pickWarmupIds([
      c("right-recent", true, "2026-06-05T00:00:00Z"),
      c("right-old", true, "2026-06-01T00:00:00Z"),
    ]);
    expect(ids).toEqual(["right-old", "right-recent"]);
  });

  it("respects the max parameter", () => {
    const ids = pickWarmupIds(
      [c("a", false, "2026-06-01T00:00:00Z"), c("b", null), c("c", null), c("d", null)],
      2,
    );
    expect(ids).toHaveLength(2);
  });
});

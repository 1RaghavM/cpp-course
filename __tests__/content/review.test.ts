import { describe, it, expect } from "vitest";
import {
  INTERVALS_DAYS,
  initialReviewState,
  advanceReviewState,
  pickDueCards,
  nextDueDate,
  type DueCandidate,
} from "@/lib/content/review";

const day = (iso: string) => new Date(`${iso}T00:00:00Z`);
const candidate = (
  checkId: string,
  nextDue: string,
  intervalIndex = 0,
): DueCandidate => ({ checkId, nextDue, intervalIndex });

describe("INTERVALS_DAYS", () => {
  it("is 1, 3, 7, 16, 30", () => {
    expect(INTERVALS_DAYS).toEqual([1, 3, 7, 16, 30]);
  });
});

describe("initialReviewState", () => {
  it("first correct → interval 1 (3 days)", () => {
    const s = initialReviewState(true, day("2026-06-10"));
    expect(s.intervalIndex).toBe(1);
    expect(s.nextDue).toBe("2026-06-13");
    expect(s.lastCorrect).toBe(true);
  });

  it("first incorrect → interval 0 (1 day)", () => {
    const s = initialReviewState(false, day("2026-06-10"));
    expect(s.intervalIndex).toBe(0);
    expect(s.nextDue).toBe("2026-06-11");
    expect(s.lastCorrect).toBe(false);
  });
});

describe("advanceReviewState", () => {
  const today = day("2026-06-10");

  it("correct bumps intervalIndex by 1", () => {
    const prev = initialReviewState(true, day("2026-06-07"));
    const next = advanceReviewState(prev, true, today);
    expect(next.intervalIndex).toBe(2);
    expect(next.nextDue).toBe("2026-06-17");
  });

  it("correct caps at intervalIndex 4 (30 days)", () => {
    const prev = { intervalIndex: 4, nextDue: "2026-06-01", lastCorrect: true, lastAnsweredAt: "2026-05-01T00:00:00Z" };
    const next = advanceReviewState(prev, true, today);
    expect(next.intervalIndex).toBe(4);
    expect(next.nextDue).toBe("2026-07-10");
  });

  it("incorrect resets intervalIndex to 0", () => {
    const prev = { intervalIndex: 3, nextDue: "2026-06-20", lastCorrect: true, lastAnsweredAt: "2026-05-15T00:00:00Z" };
    const next = advanceReviewState(prev, false, today);
    expect(next.intervalIndex).toBe(0);
    expect(next.nextDue).toBe("2026-06-11");
    expect(next.lastCorrect).toBe(false);
  });

  it("ignores how overdue the card was (uses today, not prev nextDue)", () => {
    const prev = { intervalIndex: 1, nextDue: "2026-06-01", lastCorrect: true, lastAnsweredAt: "2026-05-29T00:00:00Z" };
    const next = advanceReviewState(prev, true, today);
    expect(next.nextDue).toBe("2026-06-17");
  });
});

describe("pickDueCards", () => {
  const today = day("2026-06-10");

  it("returns empty when nothing is due", () => {
    expect(pickDueCards([candidate("a", "2026-06-15", 1)], today)).toEqual([]);
  });

  it("includes cards due today", () => {
    expect(pickDueCards([candidate("a", "2026-06-10", 1)], today)).toEqual(["a"]);
  });

  it("orders by nextDue ascending (most overdue first)", () => {
    expect(
      pickDueCards(
        [candidate("recent", "2026-06-09", 1), candidate("ancient", "2026-06-01", 1)],
        today,
      ),
    ).toEqual(["ancient", "recent"]);
  });

  it("tie-breaks by intervalIndex ascending (weaker cards first)", () => {
    expect(
      pickDueCards(
        [candidate("strong", "2026-06-09", 3), candidate("weak", "2026-06-09", 0)],
        today,
      ),
    ).toEqual(["weak", "strong"]);
  });

  it("caps at max (default 20)", () => {
    const cands = Array.from({ length: 30 }, (_, i) => candidate(`c${i}`, "2026-06-01", 0));
    expect(pickDueCards(cands, today)).toHaveLength(20);
  });

  it("respects custom max", () => {
    const cands = Array.from({ length: 30 }, (_, i) => candidate(`c${i}`, "2026-06-01", 0));
    expect(pickDueCards(cands, today, 5)).toHaveLength(5);
  });
});

describe("nextDueDate", () => {
  it("returns null on empty pool", () => {
    expect(nextDueDate([])).toBeNull();
  });

  it("returns the earliest nextDue", () => {
    expect(
      nextDueDate([
        candidate("a", "2026-06-15"),
        candidate("b", "2026-06-12"),
        candidate("c", "2026-06-20"),
      ]),
    ).toBe("2026-06-12");
  });
});

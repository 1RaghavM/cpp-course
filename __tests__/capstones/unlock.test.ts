import { describe, it, expect } from "vitest";
import { isCapstoneUnlocked, UNLOCK_THRESHOLD } from "@/lib/capstones/unlock";

describe("UNLOCK_THRESHOLD", () => {
  it("is 0.8", () => {
    expect(UNLOCK_THRESHOLD).toBe(0.8);
  });
});

describe("isCapstoneUnlocked", () => {
  it("returns false when no lessons in the stage", () => {
    expect(isCapstoneUnlocked(0, 0)).toBe(false);
  });
  it("returns false at 0%", () => {
    expect(isCapstoneUnlocked(0, 10)).toBe(false);
  });
  it("returns false at 79%", () => {
    expect(isCapstoneUnlocked(79, 100)).toBe(false);
  });
  it("returns true at exactly 80%", () => {
    expect(isCapstoneUnlocked(80, 100)).toBe(true);
  });
  it("returns true at 100%", () => {
    expect(isCapstoneUnlocked(100, 100)).toBe(true);
  });
  it("treats over-count defensively (clamps to true)", () => {
    expect(isCapstoneUnlocked(150, 100)).toBe(true);
  });
});

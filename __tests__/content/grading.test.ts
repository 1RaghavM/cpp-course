import { describe, it, expect } from "vitest";
import { normalizePredictedOutput } from "@/lib/content/grading";

describe("normalizePredictedOutput", () => {
  it("treats newline-separated and space-separated values as equal", () => {
    expect(normalizePredictedOutput("3\n1")).toBe(normalizePredictedOutput("3 1"));
  });

  it("collapses runs of mixed whitespace", () => {
    expect(normalizePredictedOutput("3  \t \n  1")).toBe("3 1");
  });

  it("trims leading and trailing whitespace", () => {
    expect(normalizePredictedOutput("  3 1\n")).toBe("3 1");
  });

  it("normalizes CRLF endings to spaces", () => {
    expect(normalizePredictedOutput("3\r\n1")).toBe("3 1");
  });

  it("preserves token boundaries — '31' is not the same as '3 1'", () => {
    expect(normalizePredictedOutput("31")).not.toBe(normalizePredictedOutput("3 1"));
  });

  it("is case-sensitive", () => {
    expect(normalizePredictedOutput("Hello")).not.toBe(normalizePredictedOutput("hello"));
  });
});

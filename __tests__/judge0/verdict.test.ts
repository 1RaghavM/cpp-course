import { describe, it, expect } from "vitest";
import { evaluateTestCases } from "@/lib/judge0/verdict";

const accepted = (stdout: string | null) => ({ stdout, status: "accepted" as const });
const tc = (expected: string) => [{ label: "t1", stdin: "", expectedStdout: expected }];

describe("evaluateTestCases output normalisation", () => {
  it("passes when actual output has trailing spaces on lines", () => {
    const verdict = evaluateTestCases(tc("a\nb"), [accepted("a  \nb")]);
    expect(verdict.overallStatus).toBe("passed");
  });

  it("passes when expected has trailing whitespace but actual does not", () => {
    const verdict = evaluateTestCases(tc("a \nb\n"), [accepted("a\nb")]);
    expect(verdict.overallStatus).toBe("passed");
  });

  it("passes when actual output has a trailing newline", () => {
    const verdict = evaluateTestCases(tc("Sum: 42"), [accepted("Sum: 42\n")]);
    expect(verdict.overallStatus).toBe("passed");
  });

  it("fails when line content differs", () => {
    const verdict = evaluateTestCases(tc("a\nb"), [accepted("a\nc")]);
    expect(verdict.overallStatus).toBe("wrong_answer");
    expect(verdict.testResults[0]?.passed).toBe(false);
  });

  it("fails when internal blank lines differ", () => {
    const verdict = evaluateTestCases(tc("a\n\nb"), [accepted("a\nb")]);
    expect(verdict.overallStatus).toBe("wrong_answer");
  });

  it("treats null stdout as empty output", () => {
    const verdict = evaluateTestCases(tc(""), [accepted(null)]);
    expect(verdict.overallStatus).toBe("passed");
  });
});

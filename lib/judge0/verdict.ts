// ---------------------------------------------------------------------------
// Verdict evaluation — compare submission outputs against expected test cases
// ---------------------------------------------------------------------------

import type { JudgeStatus } from "./client";

// ---- Public types ---------------------------------------------------------

export interface TestCase {
  label: string;
  stdin: string;
  expectedStdout: string;
}

export interface TestCaseResult {
  label: string;
  passed: boolean;
  expected: string;
  actual: string;
  /** The status for this individual test case (e.g. "accepted", "tle"). */
  status: JudgeStatus;
}

export type OverallStatus = "passed" | JudgeStatus;

export interface VerdictResult {
  overallStatus: OverallStatus;
  testResults: TestCaseResult[];
}

// ---- Helpers --------------------------------------------------------------

/**
 * Normalise stdout for comparison.
 *
 * - Treats null / undefined as empty string
 * - Trims trailing whitespace on every line (formatting noise, not correctness)
 * - Trims leading and trailing whitespace overall (including trailing newlines)
 */
function normalise(value: string | null | undefined): string {
  if (value === null || value === undefined) return "";
  return value
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .trim();
}

// ---- Main export ----------------------------------------------------------

/**
 * Evaluate a set of test cases against the execution results from Judge0.
 *
 * `testCases` and `results` are expected to be in the same order and have the
 * same length, but the function handles mismatches gracefully:
 *
 * - If there are more test cases than results (partial execution), the
 *   remaining cases are marked as failed with status "error".
 * - Extra results beyond the number of test cases are ignored.
 */
export function evaluateTestCases(
  testCases: ReadonlyArray<TestCase>,
  results: ReadonlyArray<{ stdout: string | null; status: JudgeStatus }>,
): VerdictResult {
  const testResults: TestCaseResult[] = [];
  let allPassed = true;
  let firstFailingStatus: JudgeStatus | null = null;

  for (let i = 0; i < testCases.length; i++) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- bounded by testCases.length
    const tc = testCases[i]!;
    const result: { stdout: string | null; status: JudgeStatus } | undefined = results[i];

    // If this test case has no corresponding result (partial execution)
    if (!result) {
      allPassed = false;
      firstFailingStatus ??= "error";
      testResults.push({
        label: tc.label,
        passed: false,
        expected: normalise(tc.expectedStdout),
        actual: "",
        status: "error",
      });
      continue;
    }

    const expected = normalise(tc.expectedStdout);
    const actual = normalise(result.stdout);

    // If the execution itself failed (non-accepted), mark as failed
    if (result.status !== "accepted") {
      allPassed = false;
      firstFailingStatus ??= result.status;
      testResults.push({
        label: tc.label,
        passed: false,
        expected,
        actual,
        status: result.status,
      });
      continue;
    }

    // Execution was accepted — compare output
    const passed = expected === actual;
    if (!passed) {
      allPassed = false;
      firstFailingStatus ??= "wrong_answer";
    }

    testResults.push({
      label: tc.label,
      passed,
      expected,
      actual,
      status: passed ? "accepted" : "wrong_answer",
    });
  }

  const overallStatus: OverallStatus = allPassed
    ? "passed"
    : (firstFailingStatus ?? "wrong_answer");

  return { overallStatus, testResults };
}

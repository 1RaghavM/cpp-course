import { submitCode, type CppStandard } from "@/lib/judge0/client";
import { evaluateTestCases, type TestCase, type VerdictResult } from "@/lib/judge0/verdict";
import type { MilestoneTest } from "@/lib/capstones/types";

export interface RunMilestoneInput {
  sourceCode: string;
  languageStandard: string;
  tests: MilestoneTest[];
}

/**
 * Submit `sourceCode` once per test case through Judge0 (matching the exercise
 * route's per-case pattern), then evaluate per-test pass/fail.
 */
export async function runMilestoneTests(
  input: RunMilestoneInput,
): Promise<VerdictResult> {
  const standard = (input.languageStandard as CppStandard) ?? "c++20";
  const judge0Results: Array<{ stdout: string | null; status: import("@/lib/judge0/client").JudgeStatus }> = [];

  for (const t of input.tests) {
    const result = await submitCode({
      sourceCode: input.sourceCode,
      stdin: t.stdin,
      languageStd: standard,
      cpuTimeLimit: Math.ceil(t.timeout_ms / 1000) || 2,
    });

    if (result.ok) {
      judge0Results.push({ stdout: result.data.stdout, status: result.data.status });
    } else {
      // Surface submission-level errors as a runtime_error so evaluateTestCases
      // marks this test (and any remaining tests) as failed.
      judge0Results.push({ stdout: null, status: "error" });
    }
  }

  const testCases: TestCase[] = input.tests.map((t) => ({
    label: t.name,
    stdin: t.stdin,
    expectedStdout: t.expected_stdout,
  }));

  return evaluateTestCases(testCases, judge0Results);
}

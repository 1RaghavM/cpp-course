import { submitCode, type CppStandard, type JudgeStatus } from "@/lib/judge0/client";
import { evaluateTestCases, type TestCase, type VerdictResult } from "@/lib/judge0/verdict";
import type { MilestoneTest } from "@/lib/capstones/types";

export type CapstoneRunMode = "run" | "submit";

export interface CapstoneRunInput {
  sourceCode: string;
  languageStandard: string;
  tests: MilestoneTest[];
  mode: CapstoneRunMode;
}

export interface CapstoneTestResult {
  label: string;
  passed: boolean;
  expected: string;
  actual: string;
  status: JudgeStatus;
  wallTimeMs?: number;
  memoryKb?: number | null;
}

export interface CapstoneRunResult {
  /** Overall verdict: "passed", "wrong_answer", "compile_error", etc. */
  status: string;
  /** Run-mode: first-test stdout. Submit-mode: null (per-test results carry it). */
  stdout: string | null;
  stderr: string | null;
  compileOutput: string | null;
  exitCode: number | null;
  wallTimeMs: number;
  memoryKb: number | null;
  /** Submit-mode: peak memory across all tests. */
  peakMemoryKb?: number | null;
  /** Submit-mode: per-test pass/fail results. */
  testResults?: CapstoneTestResult[];
  /** True iff every test passed (submit mode only). */
  passed: boolean;
}

/**
 * Run a milestone in one of two modes:
 * - "run": compile + execute against the FIRST test only, surface raw stdout/stderr.
 *   Quick iteration without grading or persistence.
 * - "submit": run every test, return per-test pass/fail + aggregate metrics. The
 *   route persists the attempt in this mode.
 */
export async function runMilestone(input: CapstoneRunInput): Promise<CapstoneRunResult> {
  const standard = (input.languageStandard as CppStandard) ?? "c++20";

  if (input.tests.length === 0) {
    return {
      status: "error",
      stdout: null,
      stderr: "Milestone has no test cases.",
      compileOutput: null,
      exitCode: null,
      wallTimeMs: 0,
      memoryKb: null,
      passed: false,
    };
  }

  if (input.mode === "run") {
    const t = input.tests[0]!;
    const sub = await submitCode({
      sourceCode: input.sourceCode,
      stdin: t.stdin,
      languageStd: standard,
      cpuTimeLimit: Math.ceil(t.timeout_ms / 1000) || 2,
    });
    if (!sub.ok) {
      return {
        status: "error",
        stdout: null,
        stderr: sub.error,
        compileOutput: null,
        exitCode: null,
        wallTimeMs: 0,
        memoryKb: null,
        passed: false,
      };
    }
    const d = sub.data;
    return {
      status: d.status,
      stdout: d.stdout,
      stderr: d.stderr,
      compileOutput: d.compileOutput,
      exitCode: d.exitCode,
      wallTimeMs: d.wallTimeMs,
      memoryKb: d.memoryKb,
      passed: false,
    };
  }

  // submit mode — run every test
  const judge0Results: Array<{
    stdout: string | null;
    status: JudgeStatus;
    stderr: string | null;
    compileOutput: string | null;
    exitCode: number | null;
    wallTimeMs: number;
    memoryKb: number | null;
  }> = [];

  for (const t of input.tests) {
    const sub = await submitCode({
      sourceCode: input.sourceCode,
      stdin: t.stdin,
      languageStd: standard,
      cpuTimeLimit: Math.ceil(t.timeout_ms / 1000) || 2,
    });
    if (sub.ok) {
      judge0Results.push({
        stdout: sub.data.stdout,
        status: sub.data.status,
        stderr: sub.data.stderr,
        compileOutput: sub.data.compileOutput,
        exitCode: sub.data.exitCode,
        wallTimeMs: sub.data.wallTimeMs,
        memoryKb: sub.data.memoryKb,
      });
    } else {
      judge0Results.push({
        stdout: null,
        status: "error",
        stderr: sub.error,
        compileOutput: null,
        exitCode: null,
        wallTimeMs: 0,
        memoryKb: null,
      });
    }
  }

  const testCases: TestCase[] = input.tests.map((t) => ({
    label: t.name,
    stdin: t.stdin,
    expectedStdout: t.expected_stdout,
  }));

  const verdict: VerdictResult = evaluateTestCases(testCases, judge0Results);

  const testResults: CapstoneTestResult[] = verdict.testResults.map((r, i) => ({
    label: r.label,
    passed: r.passed,
    expected: r.expected,
    actual: r.actual,
    status: r.status,
    wallTimeMs: judge0Results[i]?.wallTimeMs,
    memoryKb: judge0Results[i]?.memoryKb ?? null,
  }));

  const totalWallTime = judge0Results.reduce((s, r) => s + (r.wallTimeMs ?? 0), 0);
  const peakMemory = judge0Results.reduce(
    (max, r) => (r.memoryKb != null && r.memoryKb > max ? r.memoryKb : max),
    0,
  );
  const compileFailure = judge0Results.find((r) => r.compileOutput);

  return {
    status: verdict.overallStatus,
    stdout: null,
    stderr: null,
    compileOutput: compileFailure?.compileOutput ?? null,
    exitCode: null,
    wallTimeMs: totalWallTime,
    memoryKb: null,
    peakMemoryKb: peakMemory > 0 ? peakMemory : null,
    testResults,
    passed: verdict.overallStatus === "passed",
  };
}

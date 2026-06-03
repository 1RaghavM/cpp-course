"use client";

import { ReactNode, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  TestResults,
  TestResultsHeader,
  TestResultsSummary as TestResultsSummaryBar,
  TestResultsDuration,
  TestResultsProgress,
  TestResultsContent,
  TestSuite,
  TestSuiteName,
  TestSuiteContent,
  Test,
  TestError,
  TestErrorMessage,
  TestErrorStack,
} from "@/components/ai-elements/test-results";

interface TestResult {
  label: string;
  passed: boolean;
  expected: string;
  actual: string;
  status: string;
}

interface SubmissionResult {
  status: string;
  stdout: string | null;
  stderr: string | null;
  compileOutput: string | null;
  exitCode: number | null;
  wallTimeMs: number;
  testResults?: TestResult[];
}

interface OutputPanelProps {
  result: SubmissionResult | null;
  error: string | null;
  isRunning: boolean;
  isSubmitting: boolean;
  onRun: () => void;
  onSubmit: () => void;
}

function statusBadgeColor(status: string): string {
  switch (status) {
    case "passed":
    case "accepted":
      return "bg-success/20 text-success";
    case "compile_error":
      return "bg-error/20 text-error";
    case "wrong_answer":
    case "failed":
      return "bg-warning/20 text-warning";
    case "tle":
      return "bg-warning/20 text-warning";
    case "runtime_error":
      return "bg-error/20 text-error";
    default:
      return "bg-muted/20 text-muted-foreground";
  }
}

function toTestStatus(tr: TestResult): "passed" | "failed" {
  return tr.passed ? "passed" : "failed";
}

function statusLabel(status: string): string {
  switch (status) {
    case "wrong_answer":
      return "Wrong Answer";
    case "compile_error":
      return "Compile Error";
    case "runtime_error":
      return "Runtime Error";
    case "tle":
      return "Time Limit Exceeded";
    case "error":
      return "Execution Error";
    default:
      return status.replace(/_/g, " ");
  }
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

export function OutputPanel({
  result,
  error,
  isRunning,
  isSubmitting,
  onRun,
  onSubmit,
}: OutputPanelProps) {
  const busy = isRunning || isSubmitting;

  return (
    <div className="flex flex-col h-full">
      {/* Header with actions */}
      <div className="flex items-center gap-2 px-4 py-2 bg-elevated border-b border-border">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Console</span>

        <div className="flex-1" />

        <Button
          variant="outline"
          size="sm"
          onClick={onRun}
          disabled={busy}
        >
          {isRunning && <Spinner />}
          Run
        </Button>

        <Button
          size="sm"
          onClick={onSubmit}
          disabled={busy}
        >
          {isSubmitting && <Spinner />}
          Submit
        </Button>
      </div>

      {/* Output content */}
      <div className="flex-1 min-h-0 overflow-y-auto bg-base p-4">
        {error && (
          <div className="rounded-md bg-error/10 border border-error/30 p-3 text-sm text-error mb-3">
            {error}
          </div>
        )}

        {result && (
          <div className="space-y-4">
            {/* Status header */}
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${statusBadgeColor(result.status)}`}
              >
                {!result.testResults?.length && result.status === "accepted"
                  ? "compiled successfully"
                  : result.status.replace(/_/g, " ")}
              </span>
              {result.wallTimeMs > 0 && (
                <span className="text-xs text-muted-foreground">{result.wallTimeMs}ms</span>
              )}
            </div>

            {/* Compiler output */}
            {result.compileOutput && (
              <OutputSection title="Compiler Output" variant="error">
                <pre className="whitespace-pre-wrap">{result.compileOutput}</pre>
              </OutputSection>
            )}

            {/* Program output (for run mode — always show when no test results) */}
            {!result.testResults?.length && (
              <OutputSection title="Output" variant={result.stdout ? "success" : "neutral"}>
                <pre className="whitespace-pre-wrap">
                  {result.stdout || <span className="text-muted-foreground italic">(no output)</span>}
                </pre>
              </OutputSection>
            )}

            {/* Stderr */}
            {result.stderr && (
              <OutputSection title="Stderr" variant="warning">
                <pre className="whitespace-pre-wrap">{result.stderr}</pre>
              </OutputSection>
            )}

            {/* Test results (for submit mode) */}
            {result.testResults && result.testResults.length > 0 && (
              <SubmissionTestResults
                testResults={result.testResults}
                wallTimeMs={result.wallTimeMs}
              />
            )}
          </div>
        )}

        {!error && !result && (
          <div className="flex flex-col items-center justify-center h-full min-h-[150px] text-muted-foreground text-sm">
            <p>Press Run to execute your code</p>
            <p className="text-xs mt-1">or Submit to test against all cases</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface OutputSectionProps {
  title: string;
  variant: "success" | "error" | "warning" | "neutral";
  children: ReactNode;
}

function OutputSection({ title, variant, children }: OutputSectionProps) {
  const variantStyles = {
    success: "border-success/30 bg-success/5",
    error: "border-error/30 bg-error/5",
    warning: "border-warning/30 bg-warning/5",
    neutral: "border-border bg-surface",
  };

  const textStyles = {
    success: "text-success",
    error: "text-error",
    warning: "text-warning",
    neutral: "text-foreground",
  };

  return (
    <div>
      <div className="text-xs font-medium text-muted-foreground mb-2">{title}</div>
      <div
        className={`rounded-md border p-3 font-mono text-xs ${variantStyles[variant]} ${textStyles[variant]}`}
      >
        {children}
      </div>
    </div>
  );
}

function SubmissionTestResults({
  testResults,
  wallTimeMs,
}: {
  testResults: TestResult[];
  wallTimeMs: number;
}) {
  const summary = useMemo(() => {
    const passed = testResults.filter((t) => t.passed).length;
    const failed = testResults.length - passed;
    return {
      passed,
      failed,
      skipped: 0,
      total: testResults.length,
      duration: wallTimeMs > 0 ? wallTimeMs : undefined,
    };
  }, [testResults, wallTimeMs]);

  const suiteStatus = summary.failed > 0 ? "failed" : "passed";

  return (
    <TestResults summary={summary}>
      <TestResultsHeader>
        <TestResultsSummaryBar />
        <TestResultsDuration />
      </TestResultsHeader>
      <TestResultsProgress className="px-4 pt-3" />
      <TestResultsContent>
        <TestSuite name="Challenge Tests" status={suiteStatus} defaultOpen>
          <TestSuiteName />
          <TestSuiteContent>
            {testResults.map((tr) => (
              <div key={tr.label}>
                <Test name={tr.label} status={toTestStatus(tr)} />
                {!tr.passed && (
                  <div className="px-4 pb-3">
                    <TestError>
                      <TestErrorMessage>
                        {statusLabel(tr.status)}
                      </TestErrorMessage>
                      <TestErrorStack>
{`Expected: ${tr.expected || "(empty)"}
  Actual: ${tr.actual || "(empty)"}`}
                      </TestErrorStack>
                    </TestError>
                  </div>
                )}
              </div>
            ))}
          </TestSuiteContent>
        </TestSuite>
      </TestResultsContent>
    </TestResults>
  );
}

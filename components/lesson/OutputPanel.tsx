"use client";

import { ReactNode } from "react";

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
      return "bg-muted/20 text-muted";
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
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
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
    <div className="flex flex-col border-t border-border">
      {/* Header with actions */}
      <div className="flex items-center gap-2 px-4 py-2 bg-elevated border-b border-border">
        <span className="text-xs font-medium text-secondary uppercase tracking-wider">
          Console
        </span>

        <div className="flex-1" />

        <button
          type="button"
          onClick={onRun}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-md bg-surface px-3 py-1.5 text-xs font-medium text-primary border border-border transition hover:bg-hover disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRunning && <Spinner />}
          Run
        </button>

        <button
          type="button"
          onClick={onSubmit}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-xs font-medium text-black border border-white transition hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting && <Spinner />}
          Submit
        </button>
      </div>

      {/* Output content */}
      <div className="flex-1 min-h-[200px] max-h-[300px] overflow-y-auto bg-base p-4">
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
                <span className="text-xs text-muted">{result.wallTimeMs}ms</span>
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
              <OutputSection
                title="Output"
                variant={result.stdout ? "success" : "neutral"}
              >
                <pre className="whitespace-pre-wrap">
                  {result.stdout || (
                    <span className="text-muted italic">(no output)</span>
                  )}
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
              <div className="space-y-3">
                {result.testResults.map((tr) => (
                  <TestResultCard key={tr.label} result={tr} />
                ))}
              </div>
            )}
          </div>
        )}

        {!error && !result && (
          <div className="flex flex-col items-center justify-center h-full min-h-[150px] text-muted text-sm">
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
    neutral: "text-primary",
  };

  return (
    <div>
      <div className="text-xs font-medium text-secondary mb-2">{title}</div>
      <div
        className={`rounded-md border p-3 font-mono text-xs ${variantStyles[variant]} ${textStyles[variant]}`}
      >
        {children}
      </div>
    </div>
  );
}

interface TestResultCardProps {
  result: TestResult;
}

function TestResultCard({ result }: TestResultCardProps) {
  const passed = result.passed;

  return (
    <div
      className={`rounded-lg border p-4 ${
        passed ? "border-success/30 bg-success/5" : "border-error/30 bg-error/5"
      }`}
    >
      {/* Test header */}
      <div className="flex items-center gap-2 mb-3">
        <span className={passed ? "text-success" : "text-error"}>
          {passed ? (
            <CheckIcon className="h-4 w-4" />
          ) : (
            <XIcon className="h-4 w-4" />
          )}
        </span>
        <span className="font-medium text-sm text-primary">{result.label}</span>
      </div>

      {/* Output comparison */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs font-medium text-secondary mb-2">Your Output</div>
          <div
            className={`rounded-md p-3 font-mono text-xs whitespace-pre-wrap border-l-2 ${
              passed
                ? "bg-success/10 border-success"
                : "bg-surface border-error"
            }`}
          >
            {result.actual || <span className="text-muted italic">(empty)</span>}
          </div>
        </div>
        <div>
          <div className="text-xs font-medium text-secondary mb-2">Expected Output</div>
          <div className="rounded-md bg-surface border-l-2 border-success p-3 font-mono text-xs whitespace-pre-wrap">
            {result.expected || <span className="text-muted italic">(empty)</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
    >
      <path
        fillRule="evenodd"
        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
    >
      <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
    </svg>
  );
}

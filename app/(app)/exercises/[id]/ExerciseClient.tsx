"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { MonacoEditorHandle } from "@/components/editor/MonacoEditor";
import type { CppStandard } from "@/lib/judge0/client";

// Dynamically import Monaco to avoid SSR issues with the Monaco web worker
const MonacoEditor = dynamic(
  () => import("@/components/editor/MonacoEditor"),
  { ssr: false },
);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ExerciseData {
  id: string;
  title: string;
  promptMd: string;
  starterCode: string;
  difficulty: string;
}

interface SampleTestCase {
  label: string;
  stdin: string;
  expectedStdout: string;
}

interface TestResult {
  label: string;
  passed: boolean;
  expected: string;
  actual: string;
  status: string;
}

interface SubmissionResponse {
  status: string;
  stdout: string | null;
  stderr: string | null;
  compileOutput: string | null;
  exitCode: number | null;
  wallTimeMs: number;
  testResults?: TestResult[];
}

interface Props {
  exercise: ExerciseData;
  sampleTestCases: SampleTestCase[];
  lastPassingCode: string | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STD_OPTIONS: { label: string; value: CppStandard }[] = [
  { label: "C++17", value: "c++17" },
  { label: "C++20", value: "c++20" },
  { label: "C++23", value: "c++23" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ExerciseClient({
  exercise,
  sampleTestCases,
  lastPassingCode,
}: Props) {
  const editorRef = useRef<MonacoEditorHandle>(null);

  const [code, setCode] = useState(exercise.starterCode);
  const [languageStd, setLanguageStd] = useState<CppStandard>("c++20");
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<SubmissionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // ---- Mobile detection -----------------------------------------------------

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // ---- Keyboard shortcuts ---------------------------------------------------

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;

      // Cmd/Ctrl + Shift + Enter = Submit
      if (e.shiftKey && e.key === "Enter") {
        e.preventDefault();
        handleSubmit("submit");
        return;
      }

      // Cmd/Ctrl + Enter = Run
      if (e.key === "Enter") {
        e.preventDefault();
        handleSubmit("run");
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, languageStd, isRunning, isSubmitting]);

  // ---- Submit handler -------------------------------------------------------

  const handleSubmit = useCallback(
    async (mode: "run" | "submit") => {
      if (isRunning || isSubmitting) return;

      const currentCode = editorRef.current?.getValue() ?? code;

      if (!currentCode.trim()) {
        setError("Please write some code before running.");
        return;
      }

      setError(null);
      setResult(null);

      if (mode === "run") setIsRunning(true);
      else setIsSubmitting(true);

      try {
        const res = await fetch("/api/submissions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            exercise_id: exercise.id,
            source_code: currentCode,
            mode,
            language_std: languageStd,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error ?? `Request failed with status ${res.status}`);
          return;
        }

        setResult(data as SubmissionResponse);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unexpected error occurred",
        );
      } finally {
        setIsRunning(false);
        setIsSubmitting(false);
      }
    },
    [code, exercise.id, languageStd, isRunning, isSubmitting],
  );

  // ---- Reset to starter code ------------------------------------------------

  const handleReset = useCallback(() => {
    if (!window.confirm("Reset to starter code? Your changes will be lost.")) {
      return;
    }
    editorRef.current?.resetToDefault();
    setResult(null);
    setError(null);
  }, []);

  // ---- Restore last passing submission --------------------------------------

  const handleRestorePassingSub = useCallback(() => {
    if (!lastPassingCode) return;
    if (
      !window.confirm(
        "Restore your last passing submission? Current changes will be lost.",
      )
    ) {
      return;
    }
    // Save to localStorage so the editor picks it up on reload, then reload
    // to remount the editor with the restored code as its initial value.
    setCode(lastPassingCode);
    try {
      localStorage.setItem(
        `cpproad:editor:${exercise.id}`,
        lastPassingCode,
      );
    } catch {
      // localStorage unavailable -- ignore
    }
    window.location.reload();
  }, [lastPassingCode, exercise.id]);

  // ---- Status helpers -------------------------------------------------------

  const busy = isRunning || isSubmitting;

  function statusBadgeColor(status: string): string {
    switch (status) {
      case "passed":
      case "accepted":
        return "bg-green-600 text-white";
      case "compile_error":
        return "bg-red-600 text-white";
      case "wrong_answer":
      case "failed":
        return "bg-orange-600 text-white";
      case "tle":
        return "bg-yellow-600 text-black";
      case "runtime_error":
        return "bg-red-500 text-white";
      default:
        return "bg-neutral-600 text-white";
    }
  }

  // ---- Render ---------------------------------------------------------------

  return (
    <div className="flex flex-col gap-6">
      {/* Exercise header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{exercise.title}</h1>
          <span className="rounded bg-neutral-200 px-2 py-0.5 text-xs font-medium uppercase dark:bg-neutral-800">
            {exercise.difficulty}
          </span>
        </div>
      </div>

      {/* Exercise prompt */}
      <div className="prose prose-neutral max-w-none dark:prose-invert">
        {/* Render markdown as plain preformatted text for now -- a proper
            markdown renderer can be added later without changing this API. */}
        <div className="whitespace-pre-wrap text-sm leading-relaxed">
          {exercise.promptMd}
        </div>
      </div>

      {/* Sample test cases */}
      {sampleTestCases.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Sample Test Cases
          </h2>
          <div className="space-y-2">
            {sampleTestCases.map((tc) => (
              <div
                key={tc.label}
                className="rounded border border-neutral-200 p-3 text-sm dark:border-neutral-700"
              >
                <div className="font-medium">{tc.label}</div>
                {tc.stdin && (
                  <div className="mt-1">
                    <span className="text-neutral-500">Input: </span>
                    <code className="rounded bg-neutral-100 px-1.5 py-0.5 dark:bg-neutral-800">
                      {tc.stdin}
                    </code>
                  </div>
                )}
                <div className="mt-1">
                  <span className="text-neutral-500">Expected Output: </span>
                  <code className="rounded bg-neutral-100 px-1.5 py-0.5 dark:bg-neutral-800">
                    {tc.expectedStdout}
                  </code>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mobile warning */}
      {isMobile && (
        <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-800 dark:border-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-200">
          The code editor is read-only on mobile devices. Please use a desktop
          browser for the best experience.
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* C++ standard selector */}
        <select
          value={languageStd}
          onChange={(e) => setLanguageStd(e.target.value as CppStandard)}
          disabled={busy}
          className="rounded border border-neutral-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-600 dark:bg-neutral-800"
        >
          {STD_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Run button */}
        <button
          type="button"
          onClick={() => handleSubmit("run")}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded bg-neutral-800 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50 dark:bg-neutral-200 dark:text-neutral-900 dark:hover:bg-neutral-300"
        >
          {isRunning ? (
            <Spinner />
          ) : (
            <span className="text-xs opacity-60">
              {typeof navigator !== "undefined" &&
              /Mac/.test(navigator.userAgent)
                ? "⌘"
                : "Ctrl"}
              +Enter
            </span>
          )}
          Run
        </button>

        {/* Submit button */}
        <button
          type="button"
          onClick={() => handleSubmit("submit")}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded bg-green-700 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-green-600 disabled:opacity-50"
        >
          {isSubmitting ? (
            <Spinner />
          ) : (
            <span className="text-xs opacity-60">
              {typeof navigator !== "undefined" &&
              /Mac/.test(navigator.userAgent)
                ? "⌘"
                : "Ctrl"}
              +Shift+Enter
            </span>
          )}
          Submit
        </button>

        <div className="flex-1" />

        {/* Restore last passing */}
        {lastPassingCode && (
          <button
            type="button"
            onClick={handleRestorePassingSub}
            disabled={busy}
            className="text-sm text-neutral-500 underline hover:text-neutral-700 disabled:opacity-50 dark:hover:text-neutral-300"
          >
            Restore last passing
          </button>
        )}

        {/* Reset button */}
        <button
          type="button"
          onClick={handleReset}
          disabled={busy}
          className="text-sm text-neutral-500 underline hover:text-neutral-700 disabled:opacity-50 dark:hover:text-neutral-300"
        >
          Reset to starter code
        </button>
      </div>

      {/* Monaco Editor */}
      <div className="h-[400px] overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-700">
        <MonacoEditor
          ref={editorRef}
          defaultValue={exercise.starterCode}
          onChange={setCode}
          language="cpp"
          readOnly={isMobile}
          exerciseId={exercise.id}
        />
      </div>

      {/* Error display */}
      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-600 dark:bg-red-900/20 dark:text-red-200">
          {error}
        </div>
      )}

      {/* Output panel */}
      {result && (
        <div className="space-y-4">
          {/* Status banner */}
          <div className="flex items-center gap-3">
            <span
              className={`inline-block rounded px-2 py-1 text-xs font-bold uppercase ${statusBadgeColor(result.status)}`}
            >
              {result.status.replace(/_/g, " ")}
            </span>
            {result.wallTimeMs > 0 && (
              <span className="text-xs text-neutral-500">
                {result.wallTimeMs}ms
              </span>
            )}
          </div>

          {/* Compile error output */}
          {result.compileOutput && (
            <OutputBlock title="Compiler Output" content={result.compileOutput} isError />
          )}

          {/* Stdout */}
          {result.stdout && (
            <OutputBlock title="Standard Output" content={result.stdout} />
          )}

          {/* Stderr */}
          {result.stderr && (
            <OutputBlock title="Standard Error" content={result.stderr} isError />
          )}

          {/* Test results (submit mode) */}
          {result.testResults && result.testResults.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-500">
                Test Results
              </h3>
              <div className="space-y-2">
                {result.testResults.map((tr) => (
                  <div
                    key={tr.label}
                    className={`rounded border p-3 text-sm ${
                      tr.passed
                        ? "border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20"
                        : "border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-bold ${tr.passed ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}
                      >
                        {tr.passed ? "PASS" : "FAIL"}
                      </span>
                      <span className="font-medium">{tr.label}</span>
                    </div>
                    {!tr.passed && (
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <div>
                          <div className="mb-1 text-xs font-medium text-neutral-500">
                            Expected
                          </div>
                          <pre className="whitespace-pre-wrap rounded bg-neutral-100 p-2 text-xs dark:bg-neutral-800">
                            {tr.expected}
                          </pre>
                        </div>
                        <div>
                          <div className="mb-1 text-xs font-medium text-neutral-500">
                            Actual
                          </div>
                          <pre className="whitespace-pre-wrap rounded bg-neutral-100 p-2 text-xs dark:bg-neutral-800">
                            {tr.actual || "(empty)"}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

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

function OutputBlock({
  title,
  content,
  isError = false,
}: {
  title: string;
  content: string;
  isError?: boolean;
}) {
  return (
    <div>
      <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-neutral-500">
        {title}
      </h3>
      <pre
        className={`max-h-60 overflow-auto whitespace-pre-wrap rounded-lg border p-3 font-mono text-xs ${
          isError
            ? "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300"
            : "border-neutral-200 bg-neutral-50 text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
        }`}
      >
        {content}
      </pre>
    </div>
  );
}

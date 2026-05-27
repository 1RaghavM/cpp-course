"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { SummaryView } from "@/components/lesson/SummaryView";
import type { MonacoEditorHandle } from "@/components/editor/MonacoEditor";
import type { CppStandard } from "@/lib/judge0/client";

const MonacoEditor = dynamic(() => import("@/components/editor/MonacoEditor"), {
  ssr: false,
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LessonData {
  id: string;
  number: string;
  title: string;
  summaryMd: string | null;
  learncppUrl: string;
}

interface NavData {
  chapter: { title: string };
  currentIndex: number;
  totalInChapter: number;
  prevSlug: string | null;
  nextSlug: string | null;
}

interface ExerciseData {
  id: string;
  title: string;
  promptMd: string;
  starterCode: string;
  difficulty: string;
  sampleTestCases: SampleTestCase[];
  lastPassingCode: string | null;
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
  lesson: LessonData;
  exercises: ExerciseData[];
  initialExerciseIndex?: number;
  nav: NavData | null;
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

export default function LessonClient({
  lesson,
  exercises,
  initialExerciseIndex = 0,
  nav,
}: Props) {
  const editorRef = useRef<MonacoEditorHandle>(null);

  const [activeExerciseIndex, setActiveExerciseIndex] = useState(initialExerciseIndex);
  const [code, setCode] = useState(exercises[activeExerciseIndex]?.starterCode ?? "");
  const [languageStd, setLanguageStd] = useState<CppStandard>("c++20");
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<SubmissionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const activeExercise = exercises[activeExerciseIndex];

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
      if (!mod || !activeExercise) return;

      if (e.shiftKey && e.key === "Enter") {
        e.preventDefault();
        handleSubmit("submit");
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        handleSubmit("run");
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, languageStd, isRunning, isSubmitting, activeExercise]);

  // ---- Exercise switching ---------------------------------------------------

  const handleExerciseSwitch = useCallback(
    (newIndex: number) => {
      if (newIndex === activeExerciseIndex || !exercises[newIndex]) return;

      // Save current code to localStorage before switching
      if (activeExercise) {
        try {
          localStorage.setItem(
            `cpproad:editor:${activeExercise.id}`,
            editorRef.current?.getValue() ?? code
          );
        } catch {
          // localStorage unavailable
        }
      }

      setActiveExerciseIndex(newIndex);
      setResult(null);
      setError(null);

      // Load code for new exercise (localStorage or starter)
      const newExercise = exercises[newIndex];
      if (newExercise) {
        let savedCode: string | null = null;
        try {
          savedCode = localStorage.getItem(`cpproad:editor:${newExercise.id}`);
        } catch {
          // localStorage unavailable
        }
        setCode(savedCode ?? newExercise.starterCode);
      }
    },
    [activeExerciseIndex, activeExercise, exercises, code]
  );

  // ---- Submit handler -------------------------------------------------------

  const handleSubmit = useCallback(
    async (mode: "run" | "submit") => {
      if (isRunning || isSubmitting || !activeExercise) return;

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
            exercise_id: activeExercise.id,
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
        setError(err instanceof Error ? err.message : "An unexpected error occurred");
      } finally {
        setIsRunning(false);
        setIsSubmitting(false);
      }
    },
    [code, activeExercise, languageStd, isRunning, isSubmitting]
  );

  // ---- Reset to starter code ------------------------------------------------

  const handleReset = useCallback(() => {
    if (!activeExercise) return;
    if (!window.confirm("Reset to starter code? Your changes will be lost.")) return;
    editorRef.current?.resetToDefault();
    setResult(null);
    setError(null);
  }, [activeExercise]);

  // ---- Restore last passing submission --------------------------------------

  const handleRestorePassingSub = useCallback(() => {
    if (!activeExercise?.lastPassingCode) return;
    if (
      !window.confirm(
        "Restore your last passing submission? Current changes will be lost."
      )
    )
      return;

    setCode(activeExercise.lastPassingCode);
    try {
      localStorage.setItem(
        `cpproad:editor:${activeExercise.id}`,
        activeExercise.lastPassingCode
      );
    } catch {
      // localStorage unavailable
    }
    window.location.reload();
  }, [activeExercise]);

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

  // ---- Mobile layout --------------------------------------------------------

  if (isMobile) {
    return (
      <div className="flex flex-col gap-4 pb-6">
        {/* Lesson navigation bar */}
        {nav && <LessonNav nav={nav} lessonTitle={lesson.title} />}

        <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-800 dark:border-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-200">
          The code editor is read-only on mobile devices. Please use a desktop browser
          for the best experience.
        </div>

        {/* Lesson header */}
        <div>
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
            Lesson {lesson.number}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">{lesson.title}</h1>
        </div>

        {/* Summary */}
        {lesson.summaryMd && (
          <section>
            <SummaryView markdown={lesson.summaryMd} />
          </section>
        )}

        {/* Exercise tabs */}
        {exercises.length > 0 && (
          <section>
            <h2 className="mb-3 text-lg font-semibold">Challenge</h2>
            {exercises.length > 1 && (
              <div className="mb-3 flex gap-1 overflow-x-auto">
                {exercises.map((ex, idx) => (
                  <button
                    key={ex.id}
                    onClick={() => handleExerciseSwitch(idx)}
                    className={`shrink-0 rounded px-3 py-1.5 text-sm font-medium transition ${
                      idx === activeExerciseIndex
                        ? "bg-blue-600 text-white"
                        : "bg-neutral-200 text-neutral-700 hover:bg-neutral-300 dark:bg-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-600"
                    }`}
                  >
                    {ex.title}
                  </button>
                ))}
              </div>
            )}

            {activeExercise && (
              <>
                <div className="prose prose-neutral prose-sm max-w-none dark:prose-invert mb-4">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {activeExercise.promptMd}
                  </div>
                </div>

                {activeExercise.sampleTestCases.length > 0 && (
                  <div className="mb-4">
                    <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-500">
                      Sample Test Cases
                    </h3>
                    <div className="space-y-2">
                      {activeExercise.sampleTestCases.map((tc) => (
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

                <div className="h-[300px] overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-700">
                  <MonacoEditor
                    ref={editorRef}
                    defaultValue={activeExercise.starterCode}
                    onChange={setCode}
                    language="cpp"
                    readOnly={true}
                    exerciseId={activeExercise.id}
                  />
                </div>
              </>
            )}
          </section>
        )}

        {/* Further reading */}
        <section>
          <a
            href={lesson.learncppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-blue-600 hover:underline dark:text-blue-400"
          >
            Read the full lesson on learncpp.com
            <ExternalLinkIcon />
          </a>
        </section>
      </div>
    );
  }

  // ---- Desktop: split-pane layout -------------------------------------------

  return (
    <div
      className="flex flex-col h-[calc(100vh-4.5rem)]"
      style={{
        width: "100vw",
        marginLeft: "calc(-50vw + 50%)",
      }}
    >
      {/* Lesson navigation bar */}
      {nav && <LessonNav nav={nav} lessonTitle={lesson.title} />}

      <div className="flex flex-1 min-h-0 gap-0">
        {/* ===== LEFT PANEL: Lesson Content + Exercise ===== */}
        <div className="w-1/2 flex flex-col border-r border-neutral-200 dark:border-neutral-700">
          {/* Lesson header */}
          <div className="flex items-center gap-3 border-b border-neutral-200 px-4 py-3 dark:border-neutral-700">
            <div>
              <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                Lesson {lesson.number}
              </p>
              <h1 className="text-lg font-bold">{lesson.title}</h1>
            </div>
          </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Lesson summary */}
          {lesson.summaryMd && (
            <section className="mb-8">
              <SummaryView markdown={lesson.summaryMd} />
            </section>
          )}

          {/* Challenge section */}
          {exercises.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-lg font-semibold">Challenge</h2>
                {activeExercise && (
                  <span className="rounded bg-neutral-200 px-2 py-0.5 text-xs font-medium uppercase dark:bg-neutral-700">
                    {activeExercise.difficulty}
                  </span>
                )}
              </div>

              {/* Exercise tabs */}
              {exercises.length > 1 && (
                <div className="mb-4 flex gap-1 border-b border-neutral-200 dark:border-neutral-700 pb-2">
                  {exercises.map((ex, idx) => (
                    <button
                      key={ex.id}
                      onClick={() => handleExerciseSwitch(idx)}
                      className={`rounded-t px-3 py-1.5 text-sm font-medium transition ${
                        idx === activeExerciseIndex
                          ? "bg-blue-600 text-white"
                          : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
                      }`}
                    >
                      {ex.title}
                    </button>
                  ))}
                </div>
              )}

              {activeExercise && (
                <>
                  {/* Exercise prompt */}
                  <div className="prose prose-neutral prose-sm max-w-none dark:prose-invert mb-6">
                    <SummaryView markdown={activeExercise.promptMd} />
                  </div>

                  {/* Sample test cases */}
                  {activeExercise.sampleTestCases.length > 0 && (
                    <div>
                      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-500">
                        Sample Test Cases
                      </h3>
                      <div className="space-y-2">
                        {activeExercise.sampleTestCases.map((tc) => (
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
                </>
              )}
            </section>
          )}

          {/* Further reading */}
          <section className="mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-700">
            <a
              href={lesson.learncppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-blue-600 hover:underline dark:text-blue-400"
            >
              Read the full lesson on learncpp.com
              <ExternalLinkIcon />
            </a>
          </section>
        </div>
      </div>

      {/* ===== RIGHT PANEL: Code Editor + Console ===== */}
      <div className="w-1/2 flex flex-col bg-neutral-900">
        {activeExercise ? (
          <>
            {/* Toolbar */}
            <div className="flex items-center gap-2 border-b border-neutral-700 px-3 py-2">
              <select
                value={languageStd}
                onChange={(e) => setLanguageStd(e.target.value as CppStandard)}
                disabled={busy}
                className="rounded border border-neutral-600 bg-neutral-800 px-2 py-1 text-sm text-neutral-200"
              >
                {STD_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <div className="flex-1" />

              {activeExercise.lastPassingCode && (
                <button
                  type="button"
                  onClick={handleRestorePassingSub}
                  disabled={busy}
                  className="text-xs text-neutral-400 hover:text-neutral-200 disabled:opacity-50"
                >
                  Restore passing
                </button>
              )}

              <button
                type="button"
                onClick={handleReset}
                disabled={busy}
                className="text-xs text-neutral-400 hover:text-neutral-200 disabled:opacity-50"
              >
                Reset
              </button>
            </div>

            {/* Monaco Editor */}
            <div className="flex-1 min-h-0">
              <MonacoEditor
                ref={editorRef}
                defaultValue={activeExercise.starterCode}
                onChange={setCode}
                language="cpp"
                readOnly={false}
                exerciseId={activeExercise.id}
              />
            </div>

            {/* Console Panel */}
            <div className="border-t border-neutral-700">
              <div className="flex items-center gap-2 px-3 py-2 bg-neutral-800">
                <span className="text-xs font-medium text-neutral-400 uppercase tracking-wide">
                  Console
                </span>

                <div className="flex-1" />

                <button
                  type="button"
                  onClick={() => handleSubmit("run")}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 rounded bg-neutral-700 px-3 py-1 text-xs font-medium text-neutral-200 transition hover:bg-neutral-600 disabled:opacity-50"
                >
                  {isRunning && <Spinner />}
                  Run
                </button>

                <button
                  type="button"
                  onClick={() => handleSubmit("submit")}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 rounded bg-green-600 px-3 py-1 text-xs font-medium text-white transition hover:bg-green-500 disabled:opacity-50"
                >
                  {isSubmitting && <Spinner />}
                  Submit
                </button>
              </div>

              <div className="h-64 overflow-y-auto bg-neutral-950 p-3 text-xs font-mono text-neutral-300">
                {error && <div className="text-red-400 mb-2">{error}</div>}

                {result && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-block rounded px-1.5 py-0.5 text-xs font-bold uppercase ${statusBadgeColor(result.status)}`}
                      >
                        {result.status.replace(/_/g, " ")}
                      </span>
                      {result.wallTimeMs > 0 && (
                        <span className="text-neutral-500">{result.wallTimeMs}ms</span>
                      )}
                    </div>

                    {result.compileOutput && (
                      <div>
                        <div className="text-neutral-500 mb-1">Compiler Output:</div>
                        <pre className="whitespace-pre-wrap text-red-400">
                          {result.compileOutput}
                        </pre>
                      </div>
                    )}

                    {result.stdout && (
                      <div>
                        <div className="text-neutral-500 mb-1">Output:</div>
                        <pre className="whitespace-pre-wrap text-green-400">
                          {result.stdout}
                        </pre>
                      </div>
                    )}

                    {result.stderr && (
                      <div>
                        <div className="text-neutral-500 mb-1">Stderr:</div>
                        <pre className="whitespace-pre-wrap text-yellow-400">
                          {result.stderr}
                        </pre>
                      </div>
                    )}

                {result.testResults && result.testResults.length > 0 && (
                  <div className="space-y-3 mt-3">
                    {result.testResults.map((tr) => (
                      <div
                        key={tr.label}
                        className={`rounded border p-3 ${
                          tr.passed
                            ? "border-green-600 bg-green-950/30"
                            : "border-red-600 bg-red-950/30"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className={tr.passed ? "text-green-400" : "text-red-400"}>
                            {tr.passed ? "✓" : "✗"}
                          </span>
                          <span className="font-medium text-neutral-200">{tr.label}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <div className="text-neutral-500 mb-1">Your Output:</div>
                            <div
                              className={`rounded p-2 font-mono whitespace-pre-wrap ${
                                tr.passed
                                  ? "bg-green-900/40 border-l-2 border-green-500"
                                  : "bg-neutral-800 border-l-2 border-red-500"
                              }`}
                            >
                              {tr.actual || "(empty)"}
                            </div>
                          </div>
                          <div>
                            <div className="text-neutral-500 mb-1">Expected output:</div>
                            <div className="rounded bg-neutral-800 border-l-2 border-green-500 p-2 font-mono whitespace-pre-wrap">
                              {tr.expected || "(empty)"}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                  </div>
                )}

                {!error && !result && (
                  <div className="text-neutral-500">
                    Press Run to execute your code, or Submit to test against all cases.
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-neutral-500">
            No exercises available for this lesson.
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function LessonNav({ nav, lessonTitle }: { nav: NavData; lessonTitle: string }) {
  return (
    <div className="flex items-center gap-2 bg-neutral-800 px-4 py-2 text-sm text-neutral-200">
      <Link
        href="/"
        className="p-1 hover:bg-neutral-700 rounded transition-colors"
        title="Back to roadmap"
      >
        <MenuIcon />
      </Link>

      <Link
        href={nav.prevSlug ? `/lessons/${nav.prevSlug}` : "#"}
        className={`p-1 rounded transition-colors ${
          nav.prevSlug
            ? "hover:bg-neutral-700 text-neutral-200"
            : "text-neutral-600 cursor-not-allowed"
        }`}
        aria-disabled={!nav.prevSlug}
        onClick={(e) => !nav.prevSlug && e.preventDefault()}
      >
        <ChevronLeftIcon />
      </Link>

      <Link
        href={nav.nextSlug ? `/lessons/${nav.nextSlug}` : "#"}
        className={`p-1 rounded transition-colors ${
          nav.nextSlug
            ? "hover:bg-neutral-700 text-neutral-200"
            : "text-neutral-600 cursor-not-allowed"
        }`}
        aria-disabled={!nav.nextSlug}
        onClick={(e) => !nav.nextSlug && e.preventDefault()}
      >
        <ChevronRightIcon />
      </Link>

      <span className="font-medium">{nav.chapter.title}</span>

      <span className="text-neutral-400 mx-1">&gt;</span>

      <span className="text-neutral-300">
        {lessonTitle}{" "}
        <span className="text-neutral-500">
          ({nav.currentIndex} / {nav.totalInChapter})
        </span>
      </span>
    </div>
  );
}

function MenuIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-5 w-5"
    >
      <path
        fillRule="evenodd"
        d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10zm0 5.25a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-5 w-5"
    >
      <path
        fillRule="evenodd"
        d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-5 w-5"
    >
      <path
        fillRule="evenodd"
        d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
        clipRule="evenodd"
      />
    </svg>
  );
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

function ExternalLinkIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-4 w-4"
    >
      <path
        fillRule="evenodd"
        d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5zm7.25-.75a.75.75 0 01.75-.75h3.5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0V6.31l-5.47 5.47a.75.75 0 01-1.06-1.06l5.47-5.47H12.25a.75.75 0 01-.75-.75z"
        clipRule="evenodd"
      />
    </svg>
  );
}

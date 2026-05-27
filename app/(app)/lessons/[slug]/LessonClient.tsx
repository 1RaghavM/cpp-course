"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SummaryView } from "@/components/lesson/SummaryView";
import { EditorToolbar } from "@/components/lesson/EditorToolbar";
import { OutputPanel } from "@/components/lesson/OutputPanel";
import { Tabs, TabList, Tab, TabPanel } from "@/components/ui/Tabs";
import type { MonacoEditorHandle } from "@/components/editor/MonacoEditor";
import type { CppStandard } from "@/lib/judge0/client";

const MonacoEditor = dynamic(() => import("@/components/editor/MonacoEditor"), {
  ssr: false,
});

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

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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

  const handleExerciseSwitch = useCallback(
    (newIndex: number) => {
      if (newIndex === activeExerciseIndex || !exercises[newIndex]) return;

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

  const handleReset = useCallback(() => {
    if (!activeExercise) return;
    if (!window.confirm("Reset to starter code? Your changes will be lost.")) return;
    editorRef.current?.resetToDefault();
    setResult(null);
    setError(null);
  }, [activeExercise]);

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

  const busy = isRunning || isSubmitting;

  if (isMobile) {
    return <MobileLayout lesson={lesson} nav={nav} hasExercises={exercises.length > 0} />;
  }

  return (
    <div
      className="flex flex-col h-full bg-base"
      style={{
        width: "100vw",
        marginLeft: "calc(-50vw + 50%)",
      }}
    >
      {nav && (
        <LessonNav
          nav={nav}
          lessonTitle={lesson.title}
          lessonId={lesson.id}
          hasExercises={exercises.length > 0}
        />
      )}

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left Panel */}
        <div className="w-1/2 flex flex-col bg-surface border-r border-border">
          {/* Header */}
          <div className="px-4 py-4 border-b border-border">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-accent/10 text-accent text-xs font-bold">
                {lesson.number}
              </span>
              <div>
                <h1 className="text-lg font-semibold text-primary">{lesson.title}</h1>
                {exercises.length > 0 && activeExercise && (
                  <p className="text-xs text-muted mt-0.5">
                    {exercises.length} challenge{exercises.length > 1 ? "s" : ""} available
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Content Tabs */}
          <Tabs defaultTab="lesson" className="flex-1 flex flex-col min-h-0">
            <TabList>
              <Tab value="lesson">Lesson</Tab>
              <Tab value="resources">Resources</Tab>
            </TabList>

            <TabPanel value="lesson" className="flex-1 overflow-y-auto p-4">
              <div className="space-y-6">
                {/* Lesson summary */}
                {lesson.summaryMd ? (
                  <div className="prose prose-sm prose-invert max-w-none">
                    <SummaryView markdown={lesson.summaryMd} />
                  </div>
                ) : (
                  <div className="flex items-center justify-center text-muted text-sm">
                    Lesson summary is being generated...
                  </div>
                )}

                {/* Challenge prompt + samples */}
                {exercises.length > 0 && activeExercise ? (
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <h2 className="text-lg font-semibold text-primary">Challenge</h2>
                      <DifficultyBadge difficulty={activeExercise.difficulty} />
                    </div>

                    {/* Exercise tabs if multiple */}
                    {exercises.length > 1 && (
                      <div className="flex gap-2 mb-4 pb-4 border-b border-border-subtle">
                        {exercises.map((ex, idx) => (
                          <button
                            key={ex.id}
                            onClick={() => handleExerciseSwitch(idx)}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                              idx === activeExerciseIndex
                                ? "bg-accent text-base"
                                : "bg-elevated text-secondary hover:text-primary hover:bg-hover"
                            }`}
                          >
                            {ex.title}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="prose prose-sm prose-invert max-w-none mb-6">
                      <SummaryView markdown={activeExercise.promptMd} />
                    </div>

                    {activeExercise.sampleTestCases.length > 0 && (
                      <div>
                        <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
                          Sample Test Cases
                        </h3>
                        <div className="space-y-2">
                          {activeExercise.sampleTestCases.map((tc) => (
                            <TestCaseCard key={tc.label} testCase={tc} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted text-sm">
                    No exercises available for this lesson.
                  </div>
                )}
              </div>
            </TabPanel>

            <TabPanel value="resources" className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                <ResourceLink
                  href={lesson.learncppUrl}
                  title="Full Lesson on LearnCpp.com"
                  description="Read the complete lesson with detailed explanations"
                />
              </div>
            </TabPanel>
          </Tabs>
        </div>

        {/* Right Panel */}
        <div className="w-1/2 flex flex-col bg-base">
          {activeExercise ? (
            <>
              <EditorToolbar
                languageStd={languageStd}
                onLanguageChange={setLanguageStd}
                disabled={busy}
                hasLastPassingCode={!!activeExercise.lastPassingCode}
                onRestorePassing={handleRestorePassingSub}
                onReset={handleReset}
              />

              <div className="flex-1 min-h-0 border-b border-border">
                <MonacoEditor
                  ref={editorRef}
                  defaultValue={activeExercise.starterCode}
                  onChange={setCode}
                  language="cpp"
                  readOnly={false}
                  exerciseId={activeExercise.id}
                />
              </div>

              <OutputPanel
                result={result}
                error={error}
                isRunning={isRunning}
                isSubmitting={isSubmitting}
                onRun={() => handleSubmit("run")}
                onSubmit={() => handleSubmit("submit")}
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted">
              No exercises available for this lesson.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MobileLayout({
  lesson,
  nav,
  hasExercises,
}: {
  lesson: Props["lesson"];
  nav: Props["nav"];
  hasExercises: boolean;
}) {
  return (
    <div className="flex flex-col gap-4 pb-6 px-4">
      {nav && (
        <LessonNav
          nav={nav}
          lessonTitle={lesson.title}
          lessonId={lesson.id}
          hasExercises={hasExercises}
        />
      )}

      <div className="rounded-lg bg-warning/10 border border-warning/30 p-4 text-sm text-warning">
        The code editor is read-only on mobile devices. Please use a desktop browser
        for the best experience.
      </div>

      <div>
        <p className="text-xs font-medium text-muted">Lesson {lesson.number}</p>
        <h1 className="mt-1 text-2xl font-bold text-primary">{lesson.title}</h1>
      </div>

      {lesson.summaryMd && (
        <section className="prose prose-sm prose-invert max-w-none">
          <SummaryView markdown={lesson.summaryMd} />
        </section>
      )}

      <section className="mt-4">
        <a
          href={lesson.learncppUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-accent hover:underline"
        >
          Read the full lesson on learncpp.com
          <ExternalLinkIcon />
        </a>
      </section>
    </div>
  );
}

function LessonNav({
  nav,
  lessonTitle,
  lessonId,
  hasExercises,
}: {
  nav: NavData;
  lessonTitle: string;
  lessonId: string;
  hasExercises: boolean;
}) {
  const router = useRouter();

  const handleNextClick = useCallback(
    async (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (!nav.nextSlug) {
        e.preventDefault();
        return;
      }
      // Reading-only lessons: mark complete when advancing to the next topic.
      if (hasExercises) return;

      e.preventDefault();
      try {
        await fetch(`/api/progress/${lessonId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ state: "completed" }),
        });
      } catch (err) {
        console.error("Failed to mark lesson complete:", err);
      }
      router.push(`/lessons/${nav.nextSlug}`);
    },
    [hasExercises, lessonId, nav.nextSlug, router],
  );

  return (
    <div className="flex items-center gap-2 bg-elevated px-4 py-2 text-sm border-b border-border">
      <Link
        href="/"
        className="p-1.5 hover:bg-hover rounded-md transition-colors text-secondary hover:text-primary"
        title="Back to roadmap"
      >
        <MenuIcon />
      </Link>

      <Link
        href={nav.prevSlug ? `/lessons/${nav.prevSlug}` : "#"}
        className={`p-1.5 rounded-md transition-colors ${
          nav.prevSlug
            ? "hover:bg-hover text-secondary hover:text-primary"
            : "text-muted cursor-not-allowed"
        }`}
        aria-disabled={!nav.prevSlug}
        onClick={(e) => !nav.prevSlug && e.preventDefault()}
      >
        <ChevronLeftIcon />
      </Link>

      <Link
        href={nav.nextSlug ? `/lessons/${nav.nextSlug}` : "#"}
        className={`p-1.5 rounded-md transition-colors ${
          nav.nextSlug
            ? "hover:bg-hover text-secondary hover:text-primary"
            : "text-muted cursor-not-allowed"
        }`}
        aria-disabled={!nav.nextSlug}
        onClick={handleNextClick}
      >
        <ChevronRightIcon />
      </Link>

      <div className="h-4 w-px bg-border mx-1" />

      <span className="font-medium text-primary">{nav.chapter.title}</span>

      <ChevronRightIcon className="h-3 w-3 text-muted" />

      <span className="text-secondary truncate">
        {lessonTitle}
      </span>

      <span className="text-muted text-xs ml-auto">
        {nav.currentIndex} / {nav.totalInChapter}
      </span>
    </div>
  );
}

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const colors: Record<string, string> = {
    easy: "bg-success/20 text-success",
    medium: "bg-warning/20 text-warning",
    hard: "bg-error/20 text-error",
  };

  return (
    <span
      className={`px-1.5 py-0.5 rounded text-[10px] font-medium uppercase ${
        colors[difficulty.toLowerCase()] ?? "bg-muted/20 text-muted"
      }`}
    >
      {difficulty}
    </span>
  );
}

function TestCaseCard({ testCase }: { testCase: SampleTestCase }) {
  return (
    <div className="rounded-lg bg-elevated border border-border p-3">
      <div className="font-medium text-sm text-primary mb-2">{testCase.label}</div>
      {testCase.stdin && (
        <div className="mb-2">
          <span className="text-xs text-muted">Input: </span>
          <code className="text-xs font-mono bg-base rounded px-1.5 py-0.5 text-accent">
            {testCase.stdin}
          </code>
        </div>
      )}
      <div>
        <span className="text-xs text-muted">Expected Output: </span>
        <code className="text-xs font-mono bg-base rounded px-1.5 py-0.5 text-success">
          {testCase.expectedStdout}
        </code>
      </div>
    </div>
  );
}

function ResourceLink({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-lg bg-elevated border border-border p-4 hover:bg-hover transition group"
    >
      <div className="flex items-center gap-2 text-primary font-medium group-hover:text-accent transition">
        {title}
        <ExternalLinkIcon className="h-4 w-4" />
      </div>
      <p className="text-sm text-muted mt-1">{description}</p>
    </a>
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

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className ?? "h-5 w-5"}
    >
      <path
        fillRule="evenodd"
        d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className ?? "h-4 w-4"}
    >
      <path
        fillRule="evenodd"
        d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5zm7.25-.75a.75.75 0 01.75-.75h3.5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0V6.31l-5.47 5.47a.75.75 0 01-1.06-1.06l5.47-5.47H12.25a.75.75 0 01-.75-.75z"
        clipRule="evenodd"
      />
    </svg>
  );
}

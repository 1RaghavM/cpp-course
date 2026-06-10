"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
const SummaryView = dynamic(
  () => import("@/components/lesson/SummaryView").then((mod) => mod.SummaryView),
  { loading: () => <div className="animate-pulse h-64 rounded-lg bg-muted" /> }
);
import { EditorToolbar } from "@/components/lesson/EditorToolbar";
import {
  ConceptChecksSection,
  WarmupBlock,
  type ConceptCheckClient,
} from "@/components/lesson/ConceptChecks";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import type { MonacoEditorHandle } from "@/components/editor/MonacoEditor";
import type { CppStandard } from "@/lib/judge0/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTutorStore } from "@/lib/store/tutor-store";
import { ReportBugButton } from "@/components/lesson/ReportBugButton";
import { ChapterQuiz } from "@/components/lesson/ChapterQuiz";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  Drawer,
  DrawerPopup,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";

const MonacoEditor = dynamic(() => import("@/components/editor/MonacoEditor"), {
  ssr: false,
});

const TutorPanel = dynamic(() => import("@/components/tutor/TutorPanel"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
      Loading tutor...
    </div>
  ),
});

const FloatingNotepad = dynamic(
  () => import("@/components/notes/FloatingNotepad").then((mod) => mod.FloatingNotepad),
  { ssr: false }
);

interface LessonData {
  id: string;
  number: string;
  title: string;
  summaryMd: string | null;
  learncppUrl: string;
}

interface ChapterLesson {
  slug: string;
  number: string;
  title: string;
  status: string;
}

interface NavData {
  chapter: { title: string };
  currentIndex: number;
  totalInChapter: number;
  prevSlug: string | null;
  nextSlug: string | null;
  chapterLessons: ChapterLesson[];
}

interface ExerciseData {
  id: string;
  title: string;
  promptMd: string;
  starterCode: string;
  solutionCode: string | null;
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
  lessonCompleted?: boolean;
}

interface Props {
  slug: string;
  lesson: LessonData;
  exercises: ExerciseData[];
  initialExerciseIndex?: number;
  nav: NavData | null;
  exerciseOnly?: boolean;
  conceptChecks?: ConceptCheckClient[];
  warmupChecks?: ConceptCheckClient[];
}

export default function LessonClient({
  slug,
  lesson,
  exercises,
  initialExerciseIndex = 0,
  nav,
  exerciseOnly = false,
  conceptChecks = [],
  warmupChecks = [],
}: Props) {
  const router = useRouter();
  const isChapterSummary = slug.endsWith("-x");
  const chapterNumber = isChapterSummary ? slug.slice(0, -2) : null;
  const editorRef = useRef<MonacoEditorHandle>(null);

  const [activeExerciseIndex] = useState(initialExerciseIndex);
  const [code, setCode] = useState(exercises[activeExerciseIndex]?.starterCode ?? "");
  const [languageStd, setLanguageStd] = useState<CppStandard>("c++20");
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<SubmissionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const setStoreCode = useTutorStore((s) => s.setCode);
  const setStoreLessonId = useTutorStore((s) => s.setLessonId);
  const setStoreSubmission = useTutorStore((s) => s.setSubmissionResult);
  const tutorOpen = useTutorStore((s) => s.tutorOpen);
  const toggleTutor = useTutorStore((s) => s.toggleTutor);
  const [notepadOpen, setNotepadOpen] = useState(false);
  const [consoleOpen, setConsoleOpen] = useState(false);

  const activeExercise = exercises[activeExerciseIndex];

  const setTutorOpen = useTutorStore((s) => s.setTutorOpen);

  useEffect(() => {
    setStoreLessonId(lesson.id);
    setStoreCode(exercises[activeExerciseIndex]?.starterCode ?? "");
    setTutorOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.id, setStoreLessonId]);

  useEffect(() => {
    if (result || error) setConsoleOpen(true);
  }, [result, error]);

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

        const submission = data as SubmissionResponse;
        setResult(submission);
        setStoreSubmission("", submission.status);
        if (submission.lessonCompleted) {
          router.refresh();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unexpected error occurred");
      } finally {
        setIsRunning(false);
        setIsSubmitting(false);
      }
    },
    [code, activeExercise, languageStd, isRunning, isSubmitting, setStoreSubmission, router],
  );

  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);

  const handleReset = useCallback(() => {
    if (!activeExercise) return;
    setResetDialogOpen(true);
  }, [activeExercise]);

  const confirmReset = useCallback(() => {
    editorRef.current?.resetToDefault();
    setResult(null);
    setError(null);
    setResetDialogOpen(false);
  }, []);

  const handleRestorePassingSub = useCallback(() => {
    if (!activeExercise?.lastPassingCode) return;
    setRestoreDialogOpen(true);
  }, [activeExercise]);

  const confirmRestore = useCallback(() => {
    if (!activeExercise?.lastPassingCode) return;
    setCode(activeExercise.lastPassingCode);
    try {
      localStorage.setItem(`cpproad:editor:${activeExercise.id}`, activeExercise.lastPassingCode);
    } catch {
      // localStorage unavailable
    }
    setRestoreDialogOpen(false);
    window.location.reload();
  }, [activeExercise]);

  const busy = isRunning || isSubmitting;

  if (isMobile) {
    return (
      <MobileLayout
        lesson={lesson}
        nav={nav}
        hasExercises={exercises.length > 0}
        conceptChecks={conceptChecks}
        warmupChecks={warmupChecks}
      />
    );
  }

  return (
    <div
      className="flex flex-col h-full bg-background"
      style={{
        width: "100vw",
        marginLeft: "calc(-50vw + 50%)",
      }}
    >
      {nav && (
        <LessonNav
          nav={nav}
          lessonTitle={exerciseOnly && activeExercise ? activeExercise.title : lesson.title}
          lessonId={lesson.id}
          hasExercises={exercises.length > 0}
          tutorOpen={tutorOpen}
          onToggleTutor={toggleTutor}
          notepadOpen={notepadOpen}
          onToggleNotepad={() => setNotepadOpen((prev) => !prev)}
        />
      )}

      <div className="flex-1 min-h-0 p-2">
      <ResizablePanelGroup key={String(tutorOpen)} orientation="horizontal" className="h-full gap-2">
        {/* Lesson Panel */}
        <ResizablePanel defaultSize={tutorOpen ? "40" : "50"} minSize="20" maxSize="80">
          <div className="flex flex-col h-full bg-surface rounded-lg border border-border overflow-hidden">
            {/* Content Tabs */}
            <Tabs defaultValue={exerciseOnly ? "challenge" : "lesson"} className="flex-1 flex flex-col min-h-0">
              {exerciseOnly ? (
                <TabsList variant="line" className="h-11 w-full gap-0 px-4 justify-start">
                  <TabsTrigger value="challenge" className="flex-none px-3 py-2.5 text-sm gap-2 border-none!">
                    <TabDocumentIcon />
                    Challenge
                  </TabsTrigger>
                  {activeExercise?.solutionCode && (
                    <>
                      <div className="h-4 w-px bg-border self-center" />
                      <TabsTrigger value="solution" className="flex-none px-3 py-2.5 text-sm gap-2 border-none!">
                        <TabLightbulbIcon />
                        Solution
                      </TabsTrigger>
                    </>
                  )}
                </TabsList>
              ) : (
                <TabsList variant="line" className="h-11 w-full gap-0 px-4 justify-start">
                  <TabsTrigger value="lesson" className="flex-none px-3 py-2.5 text-sm gap-2 border-none!">
                    <TabDocumentIcon />
                    Lesson
                  </TabsTrigger>
                  {activeExercise?.solutionCode && (
                    <>
                      <div className="h-4 w-px bg-border self-center" />
                      <TabsTrigger value="solution" className="flex-none px-3 py-2.5 text-sm gap-2 border-none!">
                        <TabLightbulbIcon />
                        Solution
                      </TabsTrigger>
                    </>
                  )}
                  <div className="h-4 w-px bg-border self-center" />
                  <TabsTrigger value="resources" className="flex-none px-3 py-2.5 text-sm gap-2 border-none!">
                    <TabResourcesIcon />
                    Resources
                  </TabsTrigger>
                  {isChapterSummary && (
                    <TabsTrigger value="chapter-quiz" className="flex-none px-3 py-2.5 text-sm gap-2 border-none!">
                      Chapter quiz
                    </TabsTrigger>
                  )}
                </TabsList>
              )}

              {exerciseOnly && (
                <TabsContent value="challenge" className="flex-1 overflow-y-auto p-4">
                  {activeExercise ? (
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <h2 className="text-lg font-semibold text-foreground">Challenge</h2>
                        <DifficultyBadge difficulty={activeExercise.difficulty} />
                      </div>
                      <div className="prose prose-base prose-invert max-w-none mb-6">
                        <SummaryView markdown={activeExercise.promptMd} />
                      </div>
                      {activeExercise.sampleTestCases.length > 0 && (
                        <div>
                          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
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
                    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                      No exercise found.
                    </div>
                  )}
                </TabsContent>
              )}

              <TabsContent value="lesson" className="flex-1 overflow-y-auto p-4">
                <div className="space-y-6">
                  {/* Warm-up: recall from earlier lessons */}
                  <WarmupBlock checks={warmupChecks} />

                  {/* Lesson summary */}
                  {lesson.summaryMd ? (
                    <div className="prose prose-base prose-invert max-w-none">
                      <SummaryView markdown={lesson.summaryMd} />
                    </div>
                  ) : (
                    <ComingSoon />
                  )}

                  {/* Concept checks for this lesson */}
                  <ConceptChecksSection checks={conceptChecks} />


                  {/* Challenge prompt + samples */}
                  {exercises.length > 0 && activeExercise ? (
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <h2 className="text-lg font-semibold text-foreground">Challenge</h2>
                        <DifficultyBadge difficulty={activeExercise.difficulty} />
                      </div>

                      <div className="prose prose-base prose-invert max-w-none mb-6">
                        <SummaryView markdown={activeExercise.promptMd} />
                      </div>

                      {activeExercise.sampleTestCases.length > 0 && (
                        <div>
                          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
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
                    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                      No exercises available for this lesson.
                    </div>
                  )}
                </div>
              </TabsContent>

              {activeExercise?.solutionCode && (
                <TabsContent value="solution" className="flex-1 overflow-y-auto p-4">
                  <div className="space-y-4">
                    <SolutionReveal code={activeExercise.solutionCode} />
                  </div>
                </TabsContent>
              )}

              <TabsContent value="resources" className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                  <ResourceLink
                    href={lesson.learncppUrl}
                    title="Full Lesson on LearnCpp.com"
                    description="Read the complete lesson with detailed explanations"
                  />
                </div>
              </TabsContent>

              {isChapterSummary && chapterNumber && (
                <TabsContent value="chapter-quiz" className="flex-1 overflow-y-auto p-4">
                  <ChapterQuiz chapterNumber={chapterNumber} lessonId={lesson.id} />
                </TabsContent>
              )}
            </Tabs>
          </div>
        </ResizablePanel>

        <ResizableHandle className="bg-transparent w-0 hover:bg-border" />

        {/* IDE Panel */}
        <ResizablePanel defaultSize={tutorOpen ? "30" : "50"} minSize="20">
          <div className="flex flex-col h-full min-w-0 bg-surface rounded-lg border border-border overflow-hidden">
            {activeExercise ? (
              <div className="flex flex-col h-full">
                <EditorToolbar
                  languageStd={languageStd}
                  onLanguageChange={setLanguageStd}
                  disabled={busy}
                  hasLastPassingCode={!!activeExercise.lastPassingCode}
                  onRestorePassing={handleRestorePassingSub}
                  onReset={handleReset}
                />

                <ResizablePanelGroup orientation="vertical" className="flex-1 min-h-0">
                  <ResizablePanel defaultSize={consoleOpen ? "65" : "100"} minSize="25">
                    <div className="h-full min-h-0">
                      <MonacoEditor
                        handleRef={editorRef}
                        defaultValue={activeExercise.starterCode}
                        onChange={(val) => {
                          setCode(val);
                          setStoreCode(val);
                        }}
                        language="cpp"
                        readOnly={false}
                        exerciseId={activeExercise.id}
                      />
                    </div>
                  </ResizablePanel>

                  {consoleOpen && (
                    <>
                      <ResizableHandle withHandle />
                      <ResizablePanel defaultSize="35" minSize="10" maxSize="70">
                        <div className="h-full overflow-y-auto bg-background p-4">
                          <ConsoleContent result={result} error={error} />
                        </div>
                      </ResizablePanel>
                    </>
                  )}
                </ResizablePanelGroup>

                <div className="flex items-center px-4 py-2 border-t border-border bg-elevated">
                  <button
                    onClick={() => setConsoleOpen((prev) => !prev)}
                    className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Console
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className={`size-4 transition-transform ${consoleOpen ? "rotate-180" : ""}`}
                    >
                      <path fillRule="evenodd" d="M14.77 12.79a.75.75 0 01-1.06-.02L10 8.832 6.29 12.77a.75.75 0 11-1.08-1.04l4.25-4.5a.75.75 0 011.08 0l4.25 4.5a.75.75 0 01-.02 1.06z" clipRule="evenodd" />
                    </svg>
                  </button>

                  <div className="flex-1" />

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleSubmit("run")} disabled={busy}>
                      {isRunning && <ConsoleSpinner />}
                      Run
                    </Button>
                    <Button size="sm" onClick={() => handleSubmit("submit")} disabled={busy}>
                      {isSubmitting && <ConsoleSpinner />}
                      Submit
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                No exercises available for this lesson.
              </div>
            )}
          </div>
        </ResizablePanel>

        {/* Tutor Panel (toggled) */}
        {tutorOpen && (
          <>
            <ResizableHandle className="bg-transparent w-0 hover:bg-border" />
            <ResizablePanel defaultSize="30" minSize="15" maxSize="45">
              <div className="flex flex-col h-full min-w-0 rounded-lg border border-border bg-surface overflow-hidden">
                <TutorPanel />
              </div>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
      </div>
      {notepadOpen && !isMobile && (
        <FloatingNotepad lessonId={lesson.id} onClose={() => setNotepadOpen(false)} />
      )}

      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset to starter code?</AlertDialogTitle>
            <AlertDialogDescription>
              Your current changes will be lost. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmReset}>
              Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore last passing submission?</AlertDialogTitle>
            <AlertDialogDescription>
              Your current changes will be replaced with your last passing code. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRestore}>
              Restore
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function MobileLayout({
  lesson,
  nav,
  hasExercises,
  conceptChecks,
  warmupChecks,
}: {
  lesson: Props["lesson"];
  nav: Props["nav"];
  hasExercises: boolean;
  conceptChecks: ConceptCheckClient[];
  warmupChecks: ConceptCheckClient[];
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
        The code editor is read-only on mobile devices. Please use a desktop browser for the best
        experience.
      </div>

      <div>
        <p className="text-xs font-medium text-muted-foreground">Lesson {lesson.number}</p>
        <h1 className="mt-1 text-2xl font-bold text-foreground">{lesson.title}</h1>
      </div>

      <WarmupBlock checks={warmupChecks} />

      {lesson.summaryMd && (
        <section className="prose prose-base prose-invert max-w-none">
          <SummaryView markdown={lesson.summaryMd} />
        </section>
      )}

      <ConceptChecksSection checks={conceptChecks} />

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

function ChapterLessonStatusIcon({ status }: { status: string }) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="size-4 shrink-0" style={{ color: "var(--color-brand)" }} />;
    case "skipped":
      return <CheckCircle2 className="size-4 shrink-0 text-muted-foreground" />;
    case "in_progress":
      return (
        <Loader2
          className="size-4 shrink-0 animate-spin"
          style={{ color: "var(--node-active)" }}
        />
      );
    case "not_started":
    default:
      return <Circle className="size-4 shrink-0 text-muted-foreground" />;
  }
}

function LessonNav({
  nav,
  lessonTitle,
  lessonId,
  hasExercises,
  tutorOpen,
  onToggleTutor,
  notepadOpen,
  onToggleNotepad,
}: {
  nav: NavData;
  lessonTitle: string;
  lessonId: string;
  hasExercises: boolean;
  tutorOpen?: boolean;
  onToggleTutor?: () => void;
  notepadOpen?: boolean;
  onToggleNotepad?: () => void;
}) {
  const router = useRouter();
  const [chapterDrawerOpen, setChapterDrawerOpen] = useState(false);

  const completed = nav.chapterLessons.filter((l) => l.status === "completed" || l.status === "skipped").length;
  const percent = nav.chapterLessons.length > 0 ? Math.round((completed / nav.chapterLessons.length) * 100) : 0;

  const handleNextClick = useCallback(
    async (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (!nav.nextSlug) {
        e.preventDefault();
        return;
      }
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
      <Link href="/dashboard" className="shrink-0">
        <Image src="/fulllogo-Photoroom.png" alt="cpproad" width={112} height={28} className="h-7 w-auto" />
      </Link>
      <button
        onClick={() => setChapterDrawerOpen(true)}
        className="p-1.5 hover:bg-hover rounded-md transition-colors text-muted-foreground hover:text-primary"
        title="Chapter lessons"
      >
        <MenuIcon />
      </button>

      <Drawer open={chapterDrawerOpen} onOpenChange={(val) => !val && setChapterDrawerOpen(false)} swipeDirection="left">
        <DrawerPopup className="module-drawer-popup module-drawer-popup-left">
          <div className="mb-4 module-drawer-content" style={{ "--stagger": 0 } as React.CSSProperties}>
            <DrawerTitle>{nav.chapter.title}</DrawerTitle>
            <DrawerDescription>
              {completed}/{nav.chapterLessons.length} lessons completed ({percent}%)
            </DrawerDescription>
            <Progress value={percent} className="mt-2" />
          </div>
          <ScrollArea className="flex-1">
            <ul className="flex flex-col gap-0.5 pb-4">
              {nav.chapterLessons.map((lesson, i) => (
                <li
                  key={lesson.slug}
                  className="module-drawer-content"
                  style={{ "--stagger": i + 1 } as React.CSSProperties}
                >
                  <Link
                    href={`/lessons/${lesson.slug}`}
                    className={`flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-accent ${
                      lesson.slug === nav.chapterLessons[nav.currentIndex - 1]?.slug
                        ? "bg-accent/50"
                        : ""
                    }`}
                    onClick={() => setChapterDrawerOpen(false)}
                  >
                    <ChapterLessonStatusIcon status={lesson.status} />
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {lesson.number}
                    </span>
                    <span className="text-card-foreground">{lesson.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </ScrollArea>
        </DrawerPopup>
      </Drawer>

      <Link
        href={nav.prevSlug ? `/lessons/${nav.prevSlug}` : "#"}
        className={`p-1.5 rounded-md transition-colors ${
          nav.prevSlug
            ? "hover:bg-hover text-muted-foreground hover:text-primary"
            : "text-muted-foreground cursor-not-allowed"
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
            ? "hover:bg-hover text-muted-foreground hover:text-primary"
            : "text-muted-foreground cursor-not-allowed"
        }`}
        aria-disabled={!nav.nextSlug}
        onClick={handleNextClick}
      >
        <ChevronRightIcon />
      </Link>

      <div className="h-4 w-px bg-border mx-1" />

      <span className="font-medium text-foreground">{nav.chapter.title}</span>

      <ChevronRightIcon className="h-3 w-3 text-muted-foreground" />

      <span className="text-muted-foreground truncate">{lessonTitle}</span>

      <span className="text-muted-foreground text-xs ml-auto">
        {nav.currentIndex} / {nav.totalInChapter}
      </span>

      {onToggleNotepad && (
        <>
          <div className="h-4 w-px bg-border mx-1" />
          <button
            onClick={onToggleNotepad}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
              notepadOpen
                ? "bg-brand-bright/15 text-brand-bright"
                : "text-muted-foreground hover:text-primary hover:bg-hover"
            }`}
            title={notepadOpen ? "Hide notes" : "Show notes"}
          >
            <NotesIcon />
            Notes
          </button>
        </>
      )}
      {onToggleTutor && (
        <>
          <div className="h-4 w-px bg-border mx-1" />
          <ReportBugButton lessonId={lessonId} />
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleTutor}
            className={
              tutorOpen
                ? "bg-brand-bright/15 text-brand-bright hover:bg-brand-bright/25"
                : "text-muted-foreground"
            }
            title={tutorOpen ? "Hide tutor" : "Show tutor"}
          >
            <TutorIcon />
            Tutor
          </Button>
        </>
      )}
    </div>
  );
}

function ConsoleContent({
  result,
  error,
}: {
  result: SubmissionResponse | null;
  error: string | null;
}) {
  if (error) {
    return (
      <div className="rounded-md bg-error/10 border border-error/30 p-3 text-sm text-error">
        {error}
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        <p>Press Run to execute your code, or Submit to test against all cases.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span
          className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${
            result.status === "passed" || result.status === "accepted"
              ? "bg-success/20 text-success"
              : result.status === "compile_error" || result.status === "runtime_error"
                ? "bg-error/20 text-error"
                : "bg-warning/20 text-warning"
          }`}
        >
          {!result.testResults?.length && result.status === "accepted"
            ? "compiled successfully"
            : result.status.replace(/_/g, " ")}
        </span>
        {result.wallTimeMs > 0 && (
          <span className="text-xs text-muted-foreground">{result.wallTimeMs}ms</span>
        )}
      </div>

      {result.compileOutput && (
        <div>
          <div className="text-xs font-medium text-muted-foreground mb-2">Compiler Output</div>
          <div className="rounded-md border border-error/30 bg-error/5 p-3 font-mono text-xs text-error">
            <pre className="whitespace-pre-wrap">{result.compileOutput}</pre>
          </div>
        </div>
      )}

      {!result.testResults?.length && (
        <div>
          <div className="text-xs font-medium text-muted-foreground mb-2">Output</div>
          <div className={`rounded-md border p-3 font-mono text-xs ${result.stdout ? "border-success/30 bg-success/5 text-success" : "border-border bg-surface text-foreground"}`}>
            <pre className="whitespace-pre-wrap">
              {result.stdout || <span className="text-muted-foreground italic">(no output)</span>}
            </pre>
          </div>
        </div>
      )}

      {result.stderr && (
        <div>
          <div className="text-xs font-medium text-muted-foreground mb-2">Stderr</div>
          <div className="rounded-md border border-warning/30 bg-warning/5 p-3 font-mono text-xs text-warning">
            <pre className="whitespace-pre-wrap">{result.stderr}</pre>
          </div>
        </div>
      )}

      {result.testResults && result.testResults.length > 0 && (
        <div className="space-y-2">
          {result.testResults.map((tr) => (
            <div key={tr.label} className={`rounded-md border p-3 text-sm ${tr.passed ? "border-success/30 bg-success/5" : "border-error/30 bg-error/5"}`}>
              <div className="flex items-center gap-2">
                <span className={tr.passed ? "text-success" : "text-error"}>
                  {tr.passed ? "✓" : "✗"}
                </span>
                <span className="font-medium text-foreground">{tr.label}</span>
              </div>
              {!tr.passed && (
                <div className="mt-2 font-mono text-xs text-muted-foreground">
                  <div>Expected: {tr.expected || "(empty)"}</div>
                  <div>Actual: {tr.actual || "(empty)"}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ConsoleSpinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function SolutionReveal({ code }: { code: string }) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="mt-6">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Solution</h3>
      {!revealed ? (
        <Button
          variant="outline"
          onClick={() => setRevealed(true)}
          className="w-full"
        >
          Reveal Solution
        </Button>
      ) : (
        <div className="rounded-lg border border-border bg-elevated overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border">
            <span className="text-xs text-muted-foreground font-medium">C++</span>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => setRevealed(false)}
            >
              Hide
            </Button>
          </div>
          <pre className="p-3 overflow-x-auto text-xs font-mono text-foreground">
            <code>{code}</code>
          </pre>
        </div>
      )}
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
        colors[difficulty.toLowerCase()] ?? "bg-muted/20 text-muted-foreground"
      }`}
    >
      {difficulty}
    </span>
  );
}

function TestCaseCard({ testCase }: { testCase: SampleTestCase }) {
  return (
    <div className="rounded-lg bg-elevated border border-border p-3">
      <div className="font-medium text-sm text-foreground mb-2">{testCase.label}</div>
      {testCase.stdin && (
        <div className="mb-2">
          <span className="text-xs text-muted-foreground">Input: </span>
          <code className="text-xs font-mono bg-background rounded px-1.5 py-0.5 text-foreground">
            {testCase.stdin}
          </code>
        </div>
      )}
      <div>
        <span className="text-xs text-muted-foreground">Expected Output: </span>
        <code className="text-xs font-mono bg-background rounded px-1.5 py-0.5 text-success">
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
      <div className="flex items-center gap-2 text-foreground font-medium group-hover:text-accent transition">
        {title}
        <ExternalLinkIcon className="h-4 w-4" />
      </div>
      <p className="text-sm text-muted-foreground mt-1">{description}</p>
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

function TutorIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-4 w-4"
    >
      <path
        fillRule="evenodd"
        d="M10 2c-2.236 0-4.43.18-6.57.524C1.993 2.755 1 3.925 1 5.261v2.978c0 1.336.993 2.506 2.43 2.737.236.038.474.072.713.1l2.315 2.316a.75.75 0 001.06 0L9.83 11.08c.055 0 .113.002.17.002s.115-.001.17-.002l2.312 2.312a.75.75 0 001.06 0l2.315-2.316c.24-.028.477-.062.714-.1C18.007 10.745 19 9.575 19 8.239V5.261c0-1.336-.993-2.506-2.43-2.737A48.726 48.726 0 0010 2zm0 7a1 1 0 100-2 1 1 0 000 2zm-4-1a1 1 0 11-2 0 1 1 0 012 0zm9 1a1 1 0 100-2 1 1 0 000 2z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function NotesIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-4 w-4"
    >
      <path
        fillRule="evenodd"
        d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm2.25 8.5a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zm0 3a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function TabDocumentIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4">
      <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm4.75 6.75a.75.75 0 00-1.5 0v2.546l-.943-1.048a.75.75 0 10-1.114 1.004l2.25 2.5a.75.75 0 001.114 0l2.25-2.5a.75.75 0 10-1.114-1.004l-.943 1.048V8.75z" clipRule="evenodd" />
    </svg>
  );
}

function TabLightbulbIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4">
      <path d="M10 1a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 1zM5.05 3.05a.75.75 0 011.06 0l1.062 1.06A.75.75 0 116.11 5.173L5.05 4.11a.75.75 0 010-1.06zm9.9 0a.75.75 0 010 1.06l-1.06 1.062a.75.75 0 01-1.062-1.061l1.061-1.06a.75.75 0 011.06 0zM3 8a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 013 8zm11 0a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 0114 8zm-6.828 2.828a.75.75 0 010 1.061L6.11 12.95a.75.75 0 01-1.06-1.06l1.06-1.06a.75.75 0 011.06 0zm7.778-1.06a.75.75 0 00-1.061 0l-1.06 1.06a.75.75 0 001.06 1.06l1.06-1.06a.75.75 0 000-1.06zM10 5a3 3 0 00-2.867 3.893l.135.503a3.75 3.75 0 01.166 1.094v.188c0 .414.336.75.75.75h3.632a.75.75 0 00.75-.75v-.188a3.75 3.75 0 01.166-1.094l.135-.503A3 3 0 0010 5zm-1.816 9.5a.75.75 0 01.75-.75h2.132a.75.75 0 010 1.5H8.934a.75.75 0 01-.75-.75zM8.75 16a.75.75 0 000 1.5h2.5a.75.75 0 000-1.5h-2.5z" />
    </svg>
  );
}

function TabResourcesIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4">
      <path d="M12.232 4.232a2.5 2.5 0 013.536 3.536l-1.225 1.224a.75.75 0 001.061 1.06l1.224-1.224a4 4 0 00-5.656-5.656l-3 3a4 4 0 00.225 5.865.75.75 0 00.977-1.138 2.5 2.5 0 01-.142-3.667l3-3z" />
      <path d="M11.603 7.963a.75.75 0 00-.977 1.138 2.5 2.5 0 01.142 3.667l-3 3a2.5 2.5 0 01-3.536-3.536l1.225-1.224a.75.75 0 00-1.061-1.06l-1.224 1.224a4 4 0 105.656 5.656l3-3a4 4 0 00-.225-5.865z" />
    </svg>
  );
}

function ComingSoon() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-8 text-muted-foreground">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">Coming Soon</h3>
      <p className="text-sm text-muted-foreground max-w-xs">
        This lesson is not yet available. Check back later!
      </p>
    </div>
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

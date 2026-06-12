"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import {
  Drawer,
  DrawerPopup,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CheckCircle2, Circle, Clock, MemoryStick } from "lucide-react";

import { EditorToolbar } from "@/components/lesson/EditorToolbar";
import type { MonacoEditorHandle } from "@/components/editor/MonacoEditor";
import type { CppStandard } from "@/lib/judge0/client";
import { useTutorStore } from "@/lib/store/tutor-store";

import type { PublicCapstone, CapstoneAttempt } from "@/lib/capstones/types";

const SummaryView = dynamic(
  () => import("@/components/lesson/SummaryView").then((mod) => mod.SummaryView),
  { loading: () => <div className="animate-pulse h-64 rounded-lg bg-muted" /> },
);

const MonacoEditor = dynamic(() => import("@/components/editor/MonacoEditor"), {
  ssr: false,
});

const TutorPanel = dynamic(() => import("@/components/tutor/TutorPanel"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      Loading tutor...
    </div>
  ),
});

const METRIC_DISCLAIMER = "Measured on a shared sandbox; treat as indicative.";

function formatMemory(kb: number | null | undefined): string | null {
  if (kb === null || kb === undefined) return null;
  if (kb < 1024) return `${kb} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

interface TestResult {
  label: string;
  passed: boolean;
  expected: string;
  actual: string;
  status: string;
  wallTimeMs?: number;
  memoryKb?: number | null;
}

interface RunResponse {
  status: string;
  stdout: string | null;
  stderr: string | null;
  compileOutput: string | null;
  exitCode: number | null;
  wallTimeMs: number;
  memoryKb?: number | null;
  peakMemoryKb?: number | null;
  testResults?: TestResult[];
  passed: boolean;
  mode: "run" | "submit";
  milestone_id: string;
}

interface SampleTestCase {
  label: string;
  stdin: string;
  expectedStdout: string;
}

interface Props {
  capstone: PublicCapstone;
  attempts: CapstoneAttempt[];
  stageTitle: string;
}

function extractMilestoneSection(md: string, ordinal: number): string {
  const start = md.search(new RegExp(`^##\\s+Milestone\\s+${ordinal}\\b`, "m"));
  if (start === -1) return "";
  const remainder = md.slice(start);
  const nextH2 = remainder.search(/\n##\s+/);
  return (nextH2 === -1 ? remainder : remainder.slice(0, nextH2)).trim();
}

function extractIntroSection(md: string): string {
  const firstH2 = md.search(/\n##\s+/);
  return (firstH2 === -1 ? md : md.slice(0, firstH2)).trim();
}

export function CapstoneClient({ capstone, attempts: initialAttempts, stageTitle }: Props) {
  const editorRef = useRef<MonacoEditorHandle>(null);

  const [selectedOrdinal, setSelectedOrdinal] = useState<number>(1);
  const [code, setCode] = useState<string>(capstone.starter_code);
  const [languageStd, setLanguageStd] = useState<CppStandard>(
    (capstone.language_standard as CppStandard) ?? "c++20",
  );
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<RunResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [attempts, setAttempts] = useState<CapstoneAttempt[]>(initialAttempts);

  const setStoreCode = useTutorStore((s) => s.setCode);
  const setStoreContext = useTutorStore((s) => s.setContext);
  const tutorOpen = useTutorStore((s) => s.tutorOpen);
  const toggleTutor = useTutorStore((s) => s.toggleTutor);
  const setTutorOpen = useTutorStore((s) => s.setTutorOpen);

  useEffect(() => {
    // Capstones reuse the playground tutor flow — code-only context, no lesson_id.
    setStoreContext("playground");
    setStoreCode(capstone.starter_code);
    setTutorOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [capstone.id]);

  useEffect(() => {
    if (result || error) setConsoleOpen(true);
  }, [result, error]);

  const passedByMilestoneId = useMemo(() => {
    const set = new Set<string>();
    for (const a of attempts) if (a.passed) set.add(a.milestone_id);
    return set;
  }, [attempts]);

  const passedCount = passedByMilestoneId.size;
  const totalMilestones = capstone.milestones.length;

  const currentMilestone = useMemo(
    () =>
      capstone.milestones.find((m) => m.ordinal === selectedOrdinal) ?? capstone.milestones[0]!,
    [capstone.milestones, selectedOrdinal],
  );

  const projectIntroMd = useMemo(
    () => extractIntroSection(capstone.description_md),
    [capstone.description_md],
  );
  const milestoneMd = useMemo(
    () => extractMilestoneSection(capstone.description_md, currentMilestone.ordinal),
    [capstone.description_md, currentMilestone.ordinal],
  );

  // The first 2 milestone tests are surfaced as "sample" cases (same UX as
  // exercises). The full list still runs on Submit.
  const sampleTestCases: SampleTestCase[] = useMemo(
    () =>
      currentMilestone.tests.slice(0, 2).map((t) => ({
        label: t.name,
        stdin: t.stdin,
        expectedStdout: t.expected_stdout,
      })),
    [currentMilestone.tests],
  );

  // One editor per capstone — the user grows a single program across all 5
  // milestones, so we use a single localStorage key for the whole capstone.
  const editorStorageKey = `capstone-${capstone.slug}`;
  const busy = isRunning || isSubmitting;

  const handleSubmit = useCallback(
    async (mode: "run" | "submit") => {
      if (busy) return;
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
        const res = await fetch(`/api/capstones/${capstone.slug}/run`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            milestone_ordinal: currentMilestone.ordinal,
            source_code: currentCode,
            mode,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? `Request failed with status ${res.status}`);
          return;
        }
        const r = data as RunResponse;
        setResult(r);
        if (r.mode === "submit") {
          setAttempts((prev) => {
            const without = prev.filter((a) => a.milestone_id !== r.milestone_id);
            return [
              ...without,
              {
                milestone_id: r.milestone_id,
                passed: r.passed,
                last_attempted_at: new Date().toISOString(),
              },
            ];
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unexpected error occurred");
      } finally {
        setIsRunning(false);
        setIsSubmitting(false);
      }
    },
    [busy, code, capstone.slug, currentMilestone.ordinal],
  );

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
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
  }, [handleSubmit]);

  const handleReset = useCallback(() => {
    setResetDialogOpen(true);
  }, []);

  const confirmReset = useCallback(() => {
    editorRef.current?.resetToDefault();
    setResult(null);
    setError(null);
    setResetDialogOpen(false);
  }, []);

  return (
    <div
      className="flex flex-col h-full bg-background"
      style={{
        width: "100vw",
        marginLeft: "calc(-50vw + 50%)",
      }}
    >
      <CapstoneNav
        capstone={capstone}
        stageTitle={stageTitle}
        currentOrdinal={currentMilestone.ordinal}
        currentTitle={currentMilestone.title}
        onSelectMilestone={setSelectedOrdinal}
        passedByMilestoneId={passedByMilestoneId}
        passedCount={passedCount}
        totalMilestones={totalMilestones}
        tutorOpen={tutorOpen}
        onToggleTutor={toggleTutor}
      />

      <div className="flex-1 min-h-0 p-2">
        <ResizablePanelGroup
          key={String(tutorOpen)}
          orientation="horizontal"
          className="h-full gap-2"
        >
          {/* Content Panel */}
          <ResizablePanel defaultSize={tutorOpen ? "40" : "50"} minSize="20" maxSize="80">
            <div className="flex flex-col h-full bg-surface rounded-lg border border-border overflow-hidden">
              <Tabs defaultValue="milestone" className="flex-1 flex flex-col min-h-0">
                <TabsList variant="line" className="h-11 w-full gap-0 px-4 justify-start">
                  <TabsTrigger
                    value="milestone"
                    className="flex-none px-3 py-2.5 text-sm gap-2 border-none!"
                  >
                    <TabDocumentIcon />
                    Milestone
                  </TabsTrigger>
                  <div className="h-4 w-px bg-border self-center" />
                  <TabsTrigger
                    value="project"
                    className="flex-none px-3 py-2.5 text-sm gap-2 border-none!"
                  >
                    <TabResourcesIcon />
                    Project
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="milestone" className="flex-1 overflow-y-auto p-4">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <h2 className="text-lg font-semibold text-foreground">
                        {currentMilestone.title}
                      </h2>
                      <MilestoneBadge
                        passed={passedByMilestoneId.has(currentMilestone.id)}
                        ordinal={currentMilestone.ordinal}
                      />
                    </div>
                    <div className="prose prose-base prose-invert max-w-none mb-6">
                      <SummaryView markdown={milestoneMd || "_Milestone description unavailable._"} />
                    </div>
                    {sampleTestCases.length > 0 && (
                      <div>
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                          Sample Test Cases
                        </h3>
                        <div className="space-y-2">
                          {sampleTestCases.map((tc) => (
                            <TestCaseCard key={tc.label} testCase={tc} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="project" className="flex-1 overflow-y-auto p-4">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <Badge variant="secondary" noAnimate>
                        {stageTitle}
                      </Badge>
                      <h2 className="text-lg font-semibold text-foreground">{capstone.title}</h2>
                    </div>
                    <div className="prose prose-base prose-invert max-w-none">
                      <SummaryView markdown={projectIntroMd} />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </ResizablePanel>

          <ResizableHandle className="bg-transparent w-0 hover:bg-border" />

          {/* IDE Panel */}
          <ResizablePanel defaultSize={tutorOpen ? "30" : "50"} minSize="20">
            <div className="flex flex-col h-full min-w-0 bg-surface rounded-lg border border-border overflow-hidden">
              <div className="flex flex-col h-full">
                <EditorToolbar
                  languageStd={languageStd}
                  onLanguageChange={setLanguageStd}
                  disabled={busy}
                  onReset={handleReset}
                />

                <ResizablePanelGroup orientation="vertical" className="flex-1 min-h-0">
                  <ResizablePanel defaultSize={consoleOpen ? "65" : "100"} minSize="25">
                    <div className="h-full min-h-0">
                      <MonacoEditor
                        handleRef={editorRef}
                        defaultValue={capstone.starter_code}
                        onChange={(val) => {
                          setCode(val);
                          setStoreCode(val);
                        }}
                        language="cpp"
                        readOnly={false}
                        exerciseId={editorStorageKey}
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
                      <path
                        fillRule="evenodd"
                        d="M14.77 12.79a.75.75 0 01-1.06-.02L10 8.832 6.29 12.77a.75.75 0 11-1.08-1.04l4.25-4.5a.75.75 0 011.08 0l4.25 4.5a.75.75 0 01-.02 1.06z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>

                  <div className="flex-1" />

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSubmit("run")}
                      disabled={busy}
                    >
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
    </div>
  );
}

// ---- Nav -----------------------------------------------------------------

function CapstoneNav({
  capstone,
  stageTitle,
  currentOrdinal,
  currentTitle,
  onSelectMilestone,
  passedByMilestoneId,
  passedCount,
  totalMilestones,
  tutorOpen,
  onToggleTutor,
}: {
  capstone: PublicCapstone;
  stageTitle: string;
  currentOrdinal: number;
  currentTitle: string;
  onSelectMilestone: (ordinal: number) => void;
  passedByMilestoneId: Set<string>;
  passedCount: number;
  totalMilestones: number;
  tutorOpen: boolean;
  onToggleTutor: () => void;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const percent = totalMilestones > 0 ? Math.round((passedCount / totalMilestones) * 100) : 0;

  const prevOrdinal = currentOrdinal > 1 ? currentOrdinal - 1 : null;
  const nextOrdinal = currentOrdinal < totalMilestones ? currentOrdinal + 1 : null;

  return (
    <div className="flex items-center gap-2 bg-elevated px-4 py-2 text-sm border-b border-border">
      <Link href="/dashboard/capstones" className="shrink-0">
        <Image
          src="/fulllogo-Photoroom.png"
          alt="cpproad"
          width={112}
          height={28}
          className="h-7 w-auto"
        />
      </Link>
      <button
        onClick={() => setDrawerOpen(true)}
        className="p-1.5 hover:bg-hover rounded-md transition-colors text-muted-foreground hover:text-primary"
        title="Milestones"
      >
        <MenuIcon />
      </button>

      <Drawer
        open={drawerOpen}
        onOpenChange={(val) => !val && setDrawerOpen(false)}
        swipeDirection="left"
      >
        <DrawerPopup className="module-drawer-popup module-drawer-popup-left">
          <div
            className="mb-4 module-drawer-content"
            style={{ "--stagger": 0 } as React.CSSProperties}
          >
            <DrawerTitle>{capstone.title}</DrawerTitle>
            <DrawerDescription>
              {passedCount}/{totalMilestones} milestones passed ({percent}%)
            </DrawerDescription>
            <Progress value={percent} className="mt-2" />
          </div>
          <ScrollArea className="flex-1">
            <ul className="flex flex-col gap-0.5 pb-4">
              {capstone.milestones.map((m, i) => {
                const passed = passedByMilestoneId.has(m.id);
                const active = m.ordinal === currentOrdinal;
                return (
                  <li
                    key={m.id}
                    className="module-drawer-content"
                    style={{ "--stagger": i + 1 } as React.CSSProperties}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onSelectMilestone(m.ordinal);
                        setDrawerOpen(false);
                      }}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-accent ${
                        active ? "bg-accent/50" : ""
                      }`}
                    >
                      {passed ? (
                        <CheckCircle2 className="size-4 shrink-0 text-green-500" />
                      ) : (
                        <Circle className="size-4 shrink-0 text-muted-foreground" />
                      )}
                      <span className="shrink-0 tabular-nums text-muted-foreground">
                        {m.ordinal}
                      </span>
                      <span className="text-card-foreground text-left">
                        {m.title.replace(/^Milestone\s*\d+:\s*/i, "")}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </ScrollArea>
        </DrawerPopup>
      </Drawer>

      <button
        type="button"
        onClick={() => prevOrdinal && onSelectMilestone(prevOrdinal)}
        disabled={!prevOrdinal}
        className={`p-1.5 rounded-md transition-colors ${
          prevOrdinal
            ? "hover:bg-hover text-muted-foreground hover:text-primary"
            : "text-muted-foreground cursor-not-allowed"
        }`}
        aria-disabled={!prevOrdinal}
      >
        <ChevronLeftIcon />
      </button>

      <button
        type="button"
        onClick={() => nextOrdinal && onSelectMilestone(nextOrdinal)}
        disabled={!nextOrdinal}
        className={`p-1.5 rounded-md transition-colors ${
          nextOrdinal
            ? "hover:bg-hover text-muted-foreground hover:text-primary"
            : "text-muted-foreground cursor-not-allowed"
        }`}
        aria-disabled={!nextOrdinal}
      >
        <ChevronRightIcon />
      </button>

      <div className="h-4 w-px bg-border mx-1" />

      <span className="font-medium text-foreground">{stageTitle}</span>

      <ChevronRightIcon className="h-3 w-3 text-muted-foreground" />

      <span className="text-muted-foreground truncate">{currentTitle}</span>

      <span className="text-muted-foreground text-xs ml-auto">
        {currentOrdinal} / {totalMilestones}
      </span>

      <div className="h-4 w-px bg-border mx-1" />
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
    </div>
  );
}

// ---- ConsoleContent (mirrors LessonClient's ConsoleContent) --------------

function ConsoleContent({
  result,
  error,
}: {
  result: RunResponse | null;
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
        <p>Press Run to execute against the first test, or Submit to grade all milestone tests.</p>
      </div>
    );
  }

  const isSubmitMode = (result.testResults?.length ?? 0) > 0;
  const memoryDisplay = formatMemory(
    isSubmitMode ? result.peakMemoryKb ?? null : result.memoryKb ?? null,
  );
  const timeLabel = isSubmitMode
    ? "Total time across all milestone tests"
    : "Execution wall-clock time";
  const memoryLabel = isSubmitMode
    ? "Peak memory across milestone tests"
    : "Peak resident memory";

  return (
    <TooltipProvider delay={200}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
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
          <Tooltip>
            <TooltipTrigger render={<Badge variant="outline" />}>
              <Clock />
              {result.wallTimeMs > 0 ? `${result.wallTimeMs} ms` : "<1 ms"}
            </TooltipTrigger>
            <TooltipContent>
              {timeLabel}. {METRIC_DISCLAIMER}
            </TooltipContent>
          </Tooltip>
          {memoryDisplay && (
            <Tooltip>
              <TooltipTrigger render={<Badge variant="outline" />}>
                <MemoryStick />
                {memoryDisplay}
              </TooltipTrigger>
              <TooltipContent>
                {memoryLabel}. {METRIC_DISCLAIMER}
              </TooltipContent>
            </Tooltip>
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
            <div
              className={`rounded-md border p-3 font-mono text-xs ${
                result.stdout
                  ? "border-success/30 bg-success/5 text-success"
                  : "border-border bg-surface text-foreground"
              }`}
            >
              <pre className="whitespace-pre-wrap">
                {result.stdout || (
                  <span className="text-muted-foreground italic">(no output)</span>
                )}
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
            {result.testResults.map((tr) => {
              const trMemory = formatMemory(tr.memoryKb);
              const hasMetrics = (tr.wallTimeMs ?? 0) > 0 || trMemory !== null;
              return (
                <div
                  key={tr.label}
                  className={`rounded-md border p-3 text-sm ${
                    tr.passed
                      ? "border-success/30 bg-success/5"
                      : "border-error/30 bg-error/5"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={tr.passed ? "text-success" : "text-error"}>
                      {tr.passed ? "✓" : "✗"}
                    </span>
                    <span className="font-medium text-foreground">{tr.label}</span>
                    {hasMetrics && (
                      <span className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
                        {(tr.wallTimeMs ?? 0) > 0 && (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {tr.wallTimeMs}ms
                          </span>
                        )}
                        {trMemory && (
                          <span className="inline-flex items-center gap-1">
                            <MemoryStick className="h-3 w-3" />
                            {trMemory}
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                  {!tr.passed && (
                    <div className="mt-2 font-mono text-xs text-muted-foreground">
                      <div>Expected: {tr.expected || "(empty)"}</div>
                      <div>Actual: {tr.actual || "(empty)"}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

// ---- Small helpers ------------------------------------------------------

function MilestoneBadge({ passed, ordinal }: { passed: boolean; ordinal: number }) {
  return (
    <span
      className={`px-1.5 py-0.5 rounded text-[10px] font-medium uppercase ${
        passed ? "bg-success/20 text-success" : "bg-muted/20 text-muted-foreground"
      }`}
    >
      Milestone {ordinal}
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

function ConsoleSpinner() {
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

function TabDocumentIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="size-4"
    >
      <path
        fillRule="evenodd"
        d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm4.75 6.75a.75.75 0 00-1.5 0v2.546l-.943-1.048a.75.75 0 10-1.114 1.004l2.25 2.5a.75.75 0 001.114 0l2.25-2.5a.75.75 0 10-1.114-1.004l-.943 1.048V8.75z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function TabResourcesIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="size-4"
    >
      <path d="M10.75 16.82A7.462 7.462 0 0115 15.5c.71 0 1.396.098 2.046.282A.75.75 0 0018 15.06v-11a.75.75 0 00-.546-.721A9.006 9.006 0 0015 3a8.963 8.963 0 00-4.25 1.065V16.82zM9.25 4.065A8.963 8.963 0 005 3c-.85 0-1.673.118-2.454.339A.75.75 0 002 4.06v11a.75.75 0 00.954.721A7.506 7.506 0 015 15.5c1.579 0 3.042.487 4.25 1.32V4.065z" />
    </svg>
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

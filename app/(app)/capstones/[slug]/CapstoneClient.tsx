"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { EditorToolbar } from "@/components/lesson/EditorToolbar";
import type { MonacoEditorHandle } from "@/components/editor/MonacoEditor";
import type { CppStandard } from "@/lib/judge0/client";
import { useTutorStore } from "@/lib/store/tutor-store";
import { CheckCircle2, Circle, Loader2, MenuIcon, MessageSquareIcon } from "lucide-react";

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

interface Props {
  capstone: PublicCapstone;
  attempts: CapstoneAttempt[];
  stageTitle: string;
}

interface TestResultRow {
  label: string;
  passed: boolean;
  expected: string;
  actual: string;
}

function extractMilestoneSection(md: string, ordinal: number): string {
  const start = md.search(new RegExp(`^##\\s+Milestone\\s+${ordinal}\\b`, "m"));
  if (start === -1) return md;
  const remainder = md.slice(start);
  const nextH2 = remainder.search(/\n##\s+/);
  return (nextH2 === -1 ? remainder : remainder.slice(0, nextH2)).trim();
}

function extractIntroSection(md: string): string {
  const firstH2 = md.search(/\n##\s+/);
  return (firstH2 === -1 ? md : md.slice(0, firstH2)).trim();
}

export function CapstoneClient({ capstone, attempts: initialAttempts, stageTitle }: Props) {
  const [selectedOrdinal, setSelectedOrdinal] = useState<number>(1);
  const [languageStd, setLanguageStd] = useState<CppStandard>(
    (capstone.language_standard as CppStandard) ?? "c++20",
  );
  const [busy, setBusy] = useState(false);
  const [consoleOpen, setConsoleOpen] = useState(true);
  const [results, setResults] = useState<TestResultRow[] | null>(null);
  const [overallStatus, setOverallStatus] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<CapstoneAttempt[]>(initialAttempts);
  const [milestoneDrawerOpen, setMilestoneDrawerOpen] = useState(false);

  const editorRef = useRef<MonacoEditorHandle>(null);
  const codeRef = useRef<string>(capstone.starter_code);

  const tutorOpen = useTutorStore((s) => s.tutorOpen);
  const toggleTutor = useTutorStore((s) => s.toggleTutor);
  const setTutorOpen = useTutorStore((s) => s.setTutorOpen);
  const setStoreContext = useTutorStore((s) => s.setContext);
  const setStoreCode = useTutorStore((s) => s.setCode);

  useEffect(() => {
    // Capstones reuse the playground tutor flow — code-only context, no lesson_id.
    setStoreContext("playground");
    setStoreCode(capstone.starter_code);
    return () => setTutorOpen(false);
  }, [capstone.starter_code, setStoreContext, setStoreCode, setTutorOpen]);

  const passedByMilestoneId = useMemo(() => {
    const set = new Set<string>();
    for (const a of attempts) if (a.passed) set.add(a.milestone_id);
    return set;
  }, [attempts]);

  const passedCount = passedByMilestoneId.size;
  const totalMilestones = capstone.milestones.length;
  const percent =
    totalMilestones > 0 ? Math.round((passedCount / totalMilestones) * 100) : 0;

  const currentMilestone = useMemo(
    () => capstone.milestones.find((m) => m.ordinal === selectedOrdinal) ?? capstone.milestones[0],
    [capstone.milestones, selectedOrdinal],
  );

  const projectMd = useMemo(
    () => extractIntroSection(capstone.description_md),
    [capstone.description_md],
  );
  const milestoneMd = useMemo(
    () =>
      currentMilestone
        ? extractMilestoneSection(capstone.description_md, currentMilestone.ordinal)
        : "",
    [capstone.description_md, currentMilestone],
  );

  const editorStorageKey = currentMilestone
    ? `capstone-${capstone.slug}-m${currentMilestone.ordinal}`
    : `capstone-${capstone.slug}`;

  const handleReset = useCallback(() => {
    editorRef.current?.resetToDefault();
    codeRef.current = capstone.starter_code;
    setStoreCode(capstone.starter_code);
  }, [capstone.starter_code, setStoreCode]);

  const runMilestone = useCallback(async () => {
    if (!currentMilestone) return;
    setBusy(true);
    setResults(null);
    setOverallStatus(null);
    setErrorMessage(null);
    setConsoleOpen(true);
    try {
      const res = await fetch(`/api/capstones/${capstone.slug}/run`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          milestone_ordinal: currentMilestone.ordinal,
          source_code: codeRef.current,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrorMessage(json.error ?? `Error ${res.status}`);
        return;
      }
      setOverallStatus(json.overall_status);
      setResults(json.test_results);
      setAttempts((prev) => {
        const without = prev.filter((a) => a.milestone_id !== json.milestone_id);
        return [
          ...without,
          {
            milestone_id: json.milestone_id,
            passed: json.passed,
            last_attempted_at: new Date().toISOString(),
          },
        ];
      });
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Network error");
    } finally {
      setBusy(false);
    }
  }, [capstone.slug, currentMilestone]);

  if (!currentMilestone) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        No milestones for this capstone.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <CapstoneNav
        capstone={capstone}
        stageTitle={stageTitle}
        passedCount={passedCount}
        totalMilestones={totalMilestones}
        percent={percent}
        currentOrdinal={selectedOrdinal}
        onSelectMilestone={(o) => setSelectedOrdinal(o)}
        passedByMilestoneId={passedByMilestoneId}
        drawerOpen={milestoneDrawerOpen}
        setDrawerOpen={setMilestoneDrawerOpen}
        tutorOpen={tutorOpen}
        onToggleTutor={toggleTutor}
      />

      <div className="min-h-0 flex-1 p-2">
        <ResizablePanelGroup
          key={String(tutorOpen)}
          orientation="horizontal"
          className="h-full gap-2"
        >
          {/* Content panel */}
          <ResizablePanel defaultSize={tutorOpen ? "40" : "50"} minSize="20" maxSize="80">
            <div className="bg-surface flex h-full flex-col overflow-hidden rounded-lg border border-border">
              <Tabs defaultValue="milestone" className="flex min-h-0 flex-1 flex-col">
                <TabsList variant="line" className="h-11 w-full justify-start gap-0 px-4">
                  <TabsTrigger
                    value="milestone"
                    className="border-none! flex-none gap-2 px-3 py-2.5 text-sm"
                  >
                    Milestone {currentMilestone.ordinal}
                  </TabsTrigger>
                  <div className="h-4 w-px self-center bg-border" />
                  <TabsTrigger
                    value="project"
                    className="border-none! flex-none gap-2 px-3 py-2.5 text-sm"
                  >
                    Project
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="milestone" className="flex-1 overflow-y-auto p-4">
                  <div className="mb-4 flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-foreground">
                      {currentMilestone.title}
                    </h2>
                    {passedByMilestoneId.has(currentMilestone.id) && (
                      <Badge variant="outline" noAnimate>
                        Passed
                      </Badge>
                    )}
                  </div>
                  <div className="prose prose-base prose-invert max-w-none">
                    <SummaryView markdown={milestoneMd} />
                  </div>
                </TabsContent>

                <TabsContent value="project" className="flex-1 overflow-y-auto p-4">
                  <div className="mb-4 flex items-center gap-2">
                    <Badge variant="secondary" noAnimate>
                      {stageTitle}
                    </Badge>
                    <h2 className="text-lg font-semibold text-foreground">{capstone.title}</h2>
                  </div>
                  <div className="prose prose-base prose-invert max-w-none">
                    <SummaryView markdown={projectMd} />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </ResizablePanel>

          <ResizableHandle className="w-0 bg-transparent hover:bg-border" />

          {/* Editor panel */}
          <ResizablePanel defaultSize={tutorOpen ? "30" : "50"} minSize="20">
            <div className="bg-surface flex h-full min-w-0 flex-col overflow-hidden rounded-lg border border-border">
              <EditorToolbar
                languageStd={languageStd}
                onLanguageChange={setLanguageStd}
                disabled={busy}
                onReset={handleReset}
              />

              <ResizablePanelGroup orientation="vertical" className="min-h-0 flex-1">
                <ResizablePanel defaultSize={consoleOpen ? "65" : "100"} minSize="25">
                  <div className="h-full min-h-0">
                    <MonacoEditor
                      handleRef={editorRef}
                      defaultValue={capstone.starter_code}
                      onChange={(val) => {
                        codeRef.current = val;
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
                      <div className="bg-background h-full overflow-y-auto p-4">
                        <CapstoneConsole
                          status={overallStatus}
                          results={results}
                          error={errorMessage}
                          busy={busy}
                        />
                      </div>
                    </ResizablePanel>
                  </>
                )}
              </ResizablePanelGroup>

              <div className="bg-elevated flex items-center border-t border-border px-4 py-2">
                <button
                  onClick={() => setConsoleOpen((p) => !p)}
                  className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
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
                <Button size="sm" onClick={runMilestone} disabled={busy}>
                  {busy && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
                  Run milestone
                </Button>
              </div>
            </div>
          </ResizablePanel>

          {tutorOpen && (
            <>
              <ResizableHandle className="w-0 bg-transparent hover:bg-border" />
              <ResizablePanel defaultSize="30" minSize="15" maxSize="45">
                <div className="bg-surface flex h-full min-w-0 flex-col overflow-hidden rounded-lg border border-border">
                  <TutorPanel />
                </div>
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>
    </div>
  );
}

function CapstoneNav({
  capstone,
  stageTitle,
  passedCount,
  totalMilestones,
  percent,
  currentOrdinal,
  onSelectMilestone,
  passedByMilestoneId,
  drawerOpen,
  setDrawerOpen,
  tutorOpen,
  onToggleTutor,
}: {
  capstone: PublicCapstone;
  stageTitle: string;
  passedCount: number;
  totalMilestones: number;
  percent: number;
  currentOrdinal: number;
  onSelectMilestone: (ordinal: number) => void;
  passedByMilestoneId: Set<string>;
  drawerOpen: boolean;
  setDrawerOpen: (v: boolean) => void;
  tutorOpen: boolean;
  onToggleTutor: () => void;
}) {
  return (
    <div className="bg-elevated flex items-center gap-2 border-b border-border px-4 py-2 text-sm">
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
        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-hover hover:text-primary"
        title="Milestones"
      >
        <MenuIcon className="size-4" />
      </button>

      <Drawer
        open={drawerOpen}
        onOpenChange={(v) => !v && setDrawerOpen(false)}
        swipeDirection="left"
      >
        <DrawerPopup className="module-drawer-popup module-drawer-popup-left">
          <div className="module-drawer-content mb-4" style={{ "--stagger": 0 } as React.CSSProperties}>
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
                      className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm transition-colors hover:bg-accent ${
                        active ? "bg-accent/50" : ""
                      }`}
                    >
                      {passed ? (
                        <CheckCircle2 className="size-4 shrink-0 text-green-500" />
                      ) : (
                        <Circle className="size-4 shrink-0 text-muted-foreground" />
                      )}
                      <span className="text-muted-foreground shrink-0 tabular-nums">
                        {m.ordinal}
                      </span>
                      <span className="text-card-foreground">
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

      <div className="ml-1 flex min-w-0 items-center gap-2">
        <span className="text-muted-foreground shrink-0 text-xs uppercase tracking-wide">
          {stageTitle}
        </span>
        <span className="truncate text-sm font-medium text-foreground">{capstone.title}</span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <span className="text-xs text-muted-foreground tabular-nums">
          {passedCount}/{totalMilestones}
        </span>
        <Button
          size="sm"
          variant={tutorOpen ? "default" : "outline"}
          onClick={onToggleTutor}
          title="Toggle tutor"
        >
          <MessageSquareIcon className="mr-1.5 size-3.5" />
          Tutor
        </Button>
      </div>
    </div>
  );
}

function CapstoneConsole({
  status,
  results,
  error,
  busy,
}: {
  status: string | null;
  results: TestResultRow[] | null;
  error: string | null;
  busy: boolean;
}) {
  if (busy && !results) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-3.5 animate-spin" />
        Compiling and running tests...
      </div>
    );
  }
  if (error) {
    return <pre className="whitespace-pre-wrap text-xs text-red-500">{error}</pre>;
  }
  if (!results && status === null) {
    return (
      <p className="text-xs text-muted-foreground">
        Click <span className="font-medium text-foreground">Run milestone</span> to compile your code
        and run this milestone&apos;s test cases.
      </p>
    );
  }
  const passed = status === "passed";
  return (
    <div className="space-y-3 text-xs">
      <div
        className={`flex items-center gap-2 text-sm font-medium ${
          passed ? "text-green-500" : "text-amber-500"
        }`}
      >
        {passed ? (
          <CheckCircle2 className="size-4" />
        ) : (
          <Circle className="size-4" />
        )}
        {passed ? "All tests passed" : `Status: ${status}`}
      </div>
      {results && (
        <ul className="space-y-2">
          {results.map((r, i) => (
            <li key={i} className="rounded border border-border bg-surface p-2">
              <div
                className={`mb-1 flex items-center gap-2 ${
                  r.passed ? "text-green-500" : "text-red-500"
                }`}
              >
                {r.passed ? "✓" : "✗"} <span className="font-medium">{r.label}</span>
              </div>
              {!r.passed && (
                <div className="space-y-1 font-mono text-[11px] text-muted-foreground">
                  <div>
                    <span className="text-foreground/70">expected:</span>{" "}
                    <pre className="inline whitespace-pre-wrap">{r.expected}</pre>
                  </div>
                  <div>
                    <span className="text-foreground/70">actual:</span>{" "}
                    <pre className="inline whitespace-pre-wrap">{r.actual}</pre>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import type { MonacoEditorHandle } from "@/components/editor/MonacoEditor";
import type { CppStandard } from "@/lib/judge0/client";
import { useTutorStore } from "@/lib/store/tutor-store";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
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
import { ReportBugButton } from "@/components/lesson/ReportBugButton";

const MonacoEditor = dynamic(() => import("@/components/editor/MonacoEditor"), { ssr: false });
const TutorPanel = dynamic(() => import("@/components/tutor/TutorPanel"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Loading tutor...</div>
  ),
});

const DEFAULT_CODE = `#include <iostream>

int main() {
    std::cout << "Hello, World!" << std::endl;
    return 0;
}
`;

const STD_OPTIONS: { label: string; value: CppStandard }[] = [
  { label: "C++17", value: "c++17" },
  { label: "C++20", value: "c++20" },
  { label: "C++23", value: "c++23" },
];

interface SavedState {
  sourceCode: string;
  stdin: string;
  languageStd: CppStandard;
}

interface SubmissionResult {
  status: string;
  stdout: string | null;
  stderr: string | null;
  compileOutput: string | null;
  exitCode: number | null;
  wallTimeMs: number;
}

interface Props {
  savedState: SavedState | null;
}

function loadLocal(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function saveLocal(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, value);
  } catch {}
}

export default function PlaygroundClient({ savedState }: Props) {
  const editorRef = useRef<MonacoEditorHandle>(null);

  const localCode = loadLocal("cpproad:playground:code");
  const localStdin = loadLocal("cpproad:playground:stdin");
  const localStd = loadLocal("cpproad:playground:std") as CppStandard | null;

  const initialCode = localCode ?? savedState?.sourceCode ?? DEFAULT_CODE;
  const initialStdin = localStdin ?? savedState?.stdin ?? "";
  const initialStd = localStd ?? savedState?.languageStd ?? "c++20";

  const [code, setCode] = useState(initialCode);
  const [stdin, setStdin] = useState(initialStdin);
  const [languageStd, setLanguageStd] = useState<CppStandard>(initialStd);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [stdinCollapsed, setStdinCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileTab, setMobileTab] = useState<"code" | "input" | "output" | "tutor">("code");


  const setStoreCode = useTutorStore((s) => s.setCode);
  const setStoreContext = useTutorStore((s) => s.setContext);
  const tutorOpen = useTutorStore((s) => s.tutorOpen);
  const toggleTutor = useTutorStore((s) => s.toggleTutor);
  const setTutorOpen = useTutorStore((s) => s.setTutorOpen);

  useEffect(() => {
    setStoreContext("playground");
    setStoreCode(initialCode);
    setTutorOpen(true);
    return () => setStoreContext("lesson");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setStoreContext]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Debounced localStorage save
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveLocal("cpproad:playground:code", code);
      saveLocal("cpproad:playground:stdin", stdin);
      saveLocal("cpproad:playground:std", languageStd);
    }, 500);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [code, stdin, languageStd]);

  // Debounced DB save (5s)
  const dbSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (dbSaveTimerRef.current) clearTimeout(dbSaveTimerRef.current);
    dbSaveTimerRef.current = setTimeout(() => {
      fetch("/api/playground/state", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source_code: code, stdin, language_std: languageStd }),
      }).catch(() => {});
    }, 5000);
    return () => {
      if (dbSaveTimerRef.current) clearTimeout(dbSaveTimerRef.current);
    };
  }, [code, stdin, languageStd]);

  const handleRun = useCallback(async () => {
    if (isRunning) return;
    const currentCode = editorRef.current?.getValue() ?? code;
    if (!currentCode.trim()) {
      setError("Please write some code before running.");
      return;
    }
    setError(null);
    setResult(null);
    setIsRunning(true);
    if (isMobile) setMobileTab("output");

    try {
      const res = await fetch("/api/playground/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source_code: currentCode, stdin, language_std: languageStd }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? `Request failed with status ${res.status}`);
        return;
      }
      setResult(data as SubmissionResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsRunning(false);
    }
  }, [code, stdin, languageStd, isRunning, isMobile]);

  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  const handleReset = useCallback(() => {
    setResetDialogOpen(true);
  }, []);

  const confirmReset = useCallback(() => {
    editorRef.current?.resetToDefault();
    setStdin("");
    setResult(null);
    setError(null);
    setResetDialogOpen(false);
  }, []);

  const handleCodeChange = useCallback(
    (val: string) => {
      setCode(val);
      setStoreCode(val);
    },
    [setStoreCode],
  );

  const handleToggleTutor = useCallback(() => {
    toggleTutor();
  }, [toggleTutor]);

  // Keyboard shortcut: Cmd/Ctrl+Enter to run
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleRun();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleRun]);

  const resetDialog = (
    <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reset to default code?</AlertDialogTitle>
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
  );

  if (isMobile) {
    return (
      <div className="flex flex-col h-full bg-base">
        {/* Header */}
        <div className="flex items-center gap-2 bg-elevated px-3 py-2 border-b border-border">
          <Link href="/dashboard" className="shrink-0">
            <Image src="/fulllogo-Photoroom.png" alt="cpproad" width={96} height={24} className="h-6 w-auto" />
          </Link>
          <span className="text-sm font-semibold text-foreground">Playground</span>
          <div className="flex-1" />
          <select
            value={languageStd}
            onChange={(e) => setLanguageStd(e.target.value as CppStandard)}
            className="rounded-md border border-border bg-surface px-2 py-1 text-xs font-medium text-foreground"
          >
            {STD_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {mobileTab === "code" && (
            <div className="h-full flex flex-col">
              <div className="flex items-center gap-2 px-3 py-2 bg-elevated border-b border-border">
                <button
                  onClick={() => void handleRun()}
                  disabled={isRunning}
                  className="rounded-md bg-brand-bright px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                >
                  {isRunning ? "Running..." : "Run"}
                </button>
                <button
                  onClick={handleReset}
                  className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-primary"
                >
                  Reset
                </button>
              </div>
              <div className="flex-1 min-h-0">
                <MonacoEditor
                  ref={editorRef}
                  defaultValue={initialCode}
                  onChange={handleCodeChange}
                  language="cpp"
                />
              </div>
            </div>
          )}
          {mobileTab === "input" && (
            <div className="h-full flex flex-col p-3">
              <label className="text-xs font-medium text-muted-foreground mb-2">Standard Input (stdin)</label>
              <textarea
                value={stdin}
                onChange={(e) => setStdin(e.target.value)}
                placeholder="Enter input for your program..."
                className="flex-1 resize-none rounded-md border border-border bg-surface p-3 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-brand-bright"
              />
            </div>
          )}
          {mobileTab === "output" && (
            <div className="h-full overflow-y-auto p-3">
              <PlaygroundOutput result={result} error={error} isRunning={isRunning} />
            </div>
          )}
          {mobileTab === "tutor" && (
            <div className="h-full">
              <TutorPanel />
            </div>
          )}
        </div>

        {/* Bottom tab bar */}
        <div className="flex border-t border-border bg-elevated">
          {(["code", "input", "output", "tutor"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setMobileTab(tab)}
              className={`flex-1 py-2.5 text-xs font-medium capitalize transition-colors ${
                mobileTab === tab ? "text-brand-bright border-t-2 border-brand-bright" : "text-muted-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        {resetDialog}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-base">
      <div className="flex items-center gap-2 bg-elevated px-4 py-2 border-b border-border">
        <Link href="/dashboard" className="shrink-0">
          <Image src="/fulllogo-Photoroom.png" alt="cpproad" width={112} height={28} className="h-7 w-auto" />
        </Link>
        <div className="h-4 w-px bg-border mx-1" />
        <span className="text-sm font-semibold text-foreground">Playground</span>
        <div className="flex-1" />

        <ReportBugButton lessonId="playground" />

        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggleTutor}
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

      {/* Main content */}
      <ResizablePanelGroup key={String(tutorOpen)} orientation="horizontal" className="flex-1 min-h-0">
        {/* Editor panel */}
        <ResizablePanel defaultSize={tutorOpen ? "75" : "100"} minSize="30">
          <div className="flex flex-col h-full min-w-0 bg-base">
            {/* Editor toolbar — matches lesson EditorToolbar */}
            <div className="flex items-center gap-3 px-4 py-2 bg-elevated border-b border-border">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Language:</span>
                <select
                  value={languageStd}
                  onChange={(e) => setLanguageStd(e.target.value as CppStandard)}
                  disabled={isRunning}
                  className="rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-foreground transition hover:bg-hover focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {STD_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1" />
            </div>

            <ResizablePanelGroup orientation="vertical">
              {/* Editor */}
              <ResizablePanel defaultSize="70" minSize="25" maxSize="85">
                <div className="h-full min-h-0">
                  <MonacoEditor
                    ref={editorRef}
                    defaultValue={initialCode}
                    onChange={handleCodeChange}
                    language="cpp"
                  />
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle />

              {/* Console — matches lesson OutputPanel layout */}
              <ResizablePanel defaultSize="30" minSize="15">
                <div className="flex flex-col h-full overflow-hidden">
                  {/* Console header with actions */}
                  <div className="flex items-center gap-2 px-4 py-2 bg-elevated border-b border-border">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Console</span>
                    <div className="flex-1" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void handleRun()}
                      disabled={isRunning}
                    >
                      {isRunning && <Spinner />}
                      Run
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleReset}
                      disabled={isRunning}
                    >
                      Reset
                    </Button>
                  </div>

                  {/* Stdin */}
                  {!stdinCollapsed && (
                    <div className="border-b border-border" style={{ height: "30%" }}>
                      <div className="flex items-center justify-between px-3 py-1.5 bg-elevated border-b border-border">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Input
                        </span>
                        <button
                          onClick={() => setStdinCollapsed(true)}
                          className="text-xs text-muted-foreground hover:text-primary transition-colors"
                        >
                          Hide
                        </button>
                      </div>
                      <textarea
                        value={stdin}
                        onChange={(e) => setStdin(e.target.value)}
                        placeholder="stdin..."
                        className="w-full h-[calc(100%-28px)] resize-none bg-base p-3 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                      />
                    </div>
                  )}
                  {stdinCollapsed && (
                    <button
                      onClick={() => setStdinCollapsed(false)}
                      className="flex items-center gap-1.5 px-3 py-1 bg-elevated border-b border-border text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      <ChevronDownIcon /> Input
                    </button>
                  )}

                  {/* Output */}
                  <div className="flex-1 min-h-0 overflow-y-auto p-4">
                    <PlaygroundOutput result={result} error={error} isRunning={isRunning} />
                  </div>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </ResizablePanel>

        {/* Tutor panel (toggled) */}
        {tutorOpen && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize="25" minSize="15" maxSize="50">
              <div className="flex flex-col h-full min-w-0 border-l border-border">
                <TutorPanel />
              </div>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
      {resetDialog}
    </div>
  );
}

function PlaygroundOutput({
  result,
  error,
  isRunning,
}: {
  result: SubmissionResult | null;
  error: string | null;
  isRunning: boolean;
}) {
  if (isRunning) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Spinner /> Compiling and running...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-error/10 border border-error/30 p-3 text-sm text-error">
        {error}
      </div>
    );
  }

  if (!result) {
    return (
      <div className="text-muted-foreground text-sm">
        Press <strong>Run</strong> to execute your code
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${
            result.status === "accepted"
              ? "bg-success/20 text-success"
              : result.status === "compile_error"
                ? "bg-error/20 text-error"
                : result.status === "runtime_error"
                  ? "bg-error/20 text-error"
                  : "bg-warning/20 text-warning"
          }`}
        >
          {result.status === "accepted" ? "success" : result.status.replace(/_/g, " ")}
        </span>
        {result.wallTimeMs > 0 && (
          <span className="text-xs text-muted-foreground">{result.wallTimeMs}ms</span>
        )}
      </div>

      {result.compileOutput && (
        <div>
          <div className="text-xs font-medium text-muted-foreground mb-1">Compiler Output</div>
          <pre className="rounded-md border border-error/30 bg-error/5 p-3 font-mono text-xs text-error whitespace-pre-wrap">
            {result.compileOutput}
          </pre>
        </div>
      )}

      {result.stdout !== null && (
        <div>
          <div className="text-xs font-medium text-muted-foreground mb-1">Output</div>
          <pre className="rounded-md border border-border bg-surface p-3 font-mono text-xs text-foreground whitespace-pre-wrap">
            {result.stdout || <span className="text-muted-foreground italic">(no output)</span>}
          </pre>
        </div>
      )}

      {result.stderr && (
        <div>
          <div className="text-xs font-medium text-muted-foreground mb-1">Stderr</div>
          <pre className="rounded-md border border-warning/30 bg-warning/5 p-3 font-mono text-xs text-warning whitespace-pre-wrap">
            {result.stderr}
          </pre>
        </div>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}


function ChevronDownIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 10.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
}


function TutorIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path
        fillRule="evenodd"
        d="M10 2c-2.236 0-4.43.18-6.57.524C1.993 2.755 1 3.925 1 5.261v2.978c0 1.336.993 2.506 2.43 2.737.236.038.474.072.713.1l2.315 2.316a.75.75 0 001.06 0L9.83 11.08c.055 0 .113.002.17.002s.115-.001.17-.002l2.312 2.312a.75.75 0 001.06 0l2.315-2.316c.24-.028.477-.062.714-.1C18.007 10.745 19 9.575 19 8.239V5.261c0-1.336-.993-2.506-2.43-2.737A48.726 48.726 0 0010 2zm0 7a1 1 0 100-2 1 1 0 000 2zm-4-1a1 1 0 11-2 0 1 1 0 012 0zm9 1a1 1 0 100-2 1 1 0 000 2z"
        clipRule="evenodd"
      />
    </svg>
  );
}


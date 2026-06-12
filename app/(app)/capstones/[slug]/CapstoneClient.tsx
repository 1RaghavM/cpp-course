"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress, ProgressLabel } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { PublicCapstone, CapstoneAttempt } from "@/lib/capstones/types";

interface Props {
  capstone: PublicCapstone;
  attempts: CapstoneAttempt[];
  unlocked: boolean;
  stageProgress: { completed: number; total: number };
  stageTitle: string;
}

interface TestResult {
  label: string;
  passed: boolean;
  expected: string;
  actual: string;
}

const STORAGE_KEY_PREFIX = "capstone:";

export function CapstoneClient({
  capstone,
  attempts: initialAttempts,
  unlocked,
  stageProgress,
  stageTitle,
}: Props) {
  const [selectedOrdinal, setSelectedOrdinal] = useState<number>(1);
  const [code, setCode] = useState<string>(() => {
    if (typeof window === "undefined") return capstone.starter_code;
    return (
      localStorage.getItem(`${STORAGE_KEY_PREFIX}${capstone.slug}:code`) ??
      capstone.starter_code
    );
  });
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<TestResult[] | null>(null);
  const [overallStatus, setOverallStatus] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<CapstoneAttempt[]>(initialAttempts);

  const passedByMilestoneId = useMemo(() => {
    const set = new Set<string>();
    for (const a of attempts) if (a.passed) set.add(a.milestone_id);
    return set;
  }, [attempts]);

  const passedCount = passedByMilestoneId.size;

  const currentMilestone = capstone.milestones.find((m) => m.ordinal === selectedOrdinal)!;

  function persistCode(next: string) {
    setCode(next);
    if (typeof window !== "undefined") {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${capstone.slug}:code`, next);
    }
  }

  async function runMilestone() {
    setRunning(true);
    setResults(null);
    setOverallStatus(null);
    try {
      const res = await fetch(`/api/capstones/${capstone.slug}/run`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ milestone_ordinal: selectedOrdinal, source_code: code }),
      });
      const json = await res.json();
      if (!res.ok) {
        setOverallStatus(json.error ?? "error");
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
    } finally {
      setRunning(false);
    }
  }

  if (!unlocked) {
    const pct = stageProgress.total
      ? Math.round((stageProgress.completed / stageProgress.total) * 100)
      : 0;
    return (
      <div className="mx-auto max-w-2xl py-16">
        <Card>
          <CardHeader>
            <CardTitle>Capstone locked</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-foreground/80">
              Complete at least 80% of the {stageTitle} lessons to unlock this capstone.
            </p>
            <Progress value={pct}>
              <ProgressLabel>
                {stageProgress.completed} / {stageProgress.total} ({pct}%)
              </ProgressLabel>
            </Progress>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl grid gap-4 py-6 lg:grid-cols-[220px_1fr_460px]">
      <aside className="space-y-2">
        <h2 className="text-sm font-semibold">{capstone.title}</h2>
        <p className="text-xs text-foreground/60">
          {passedCount} / {capstone.milestones.length} milestones passed
        </p>
        <ul className="space-y-1">
          {capstone.milestones.map((m) => {
            const passed = passedByMilestoneId.has(m.id);
            return (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => setSelectedOrdinal(m.ordinal)}
                  className={`w-full text-left rounded px-2 py-1 text-sm ${
                    m.ordinal === selectedOrdinal ? "bg-muted font-medium" : "hover:bg-muted/50"
                  }`}
                >
                  <span className="mr-2">{passed ? "✓" : m.ordinal}.</span>
                  {m.title.replace(/^Milestone\s*\d+:\s*/, "")}
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      <section>
        <ScrollArea className="h-[70vh] pr-4">
          <article className="prose prose-sm dark:prose-invert max-w-none">
            <h1>{capstone.title}</h1>
            <p className="text-foreground/70">Current focus: {currentMilestone.title}</p>
            <pre className="whitespace-pre-wrap text-xs bg-muted rounded p-3">
              {extractMilestoneSection(capstone.description_md, currentMilestone.ordinal)}
            </pre>
          </article>
        </ScrollArea>
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <Badge variant="secondary" noAnimate>
            Milestone {currentMilestone.ordinal}
          </Badge>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => persistCode(capstone.starter_code)}>
              Reset
            </Button>
            <Button size="sm" onClick={runMilestone} disabled={running}>
              {running ? "Running…" : "Run milestone"}
            </Button>
          </div>
        </div>
        <textarea
          value={code}
          onChange={(e) => persistCode(e.target.value)}
          className="font-mono text-xs w-full h-[50vh] rounded border bg-muted p-3"
          spellCheck={false}
        />
        {overallStatus !== null && (
          <div className="text-xs">
            <p className="font-medium">
              Status: {overallStatus === "passed" ? "✓ All tests passed" : `✗ ${overallStatus}`}
            </p>
            {results && (
              <ul className="space-y-1 mt-2">
                {results.map((r) => (
                  <li key={r.label} className={r.passed ? "text-green-600" : "text-red-600"}>
                    {r.passed ? "✓" : "✗"} {r.label}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function extractMilestoneSection(md: string, ordinal: number): string {
  const start = md.search(new RegExp(`^##\\s+Milestone\\s+${ordinal}\\b`, "m"));
  if (start === -1) return md;
  const remainder = md.slice(start);
  const nextH2 = remainder.search(/\n##\s+/);
  return (nextH2 === -1 ? remainder : remainder.slice(0, nextH2)).trim();
}

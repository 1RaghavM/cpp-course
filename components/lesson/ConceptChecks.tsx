"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { CheckCircle2, ChevronDown, XCircle } from "lucide-react";
import { normalizePredictedOutput } from "@/lib/content/grading";

const SummaryView = dynamic(
  () => import("@/components/lesson/SummaryView").then((m) => m.SummaryView),
  { ssr: false },
);

export interface ConceptCheckClient {
  id: string;
  kind: "predict_output" | "spot_bug" | "mcq";
  promptMd: string;
  options: Record<string, string> | null;
  answer: string;
  explanationMd: string;
  /** Set for warm-up items: lesson number the check came from. */
  originLesson?: string;
}

const KIND_LABEL: Record<ConceptCheckClient["kind"], string> = {
  predict_output: "Predict the output",
  spot_bug: "Spot the bug",
  mcq: "Quick check",
};

export function ConceptCheckCard({ check }: { check: ConceptCheckClient }) {
  const [selected, setSelected] = useState("");
  const [typed, setTyped] = useState("");
  const [result, setResult] = useState<"correct" | "incorrect" | null>(null);

  const answered = result !== null;
  const canSubmit = check.options !== null ? selected !== "" : typed.trim() !== "";

  const submit = () => {
    const correct =
      check.options !== null
        ? selected === check.answer
        : normalizePredictedOutput(typed) === normalizePredictedOutput(check.answer);
    setResult(correct ? "correct" : "incorrect");
    fetch("/api/concept-checks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checkId: check.id, correct }),
    })
      .then((res) => {
        if (!res.ok) {
          console.error(`Failed to record concept-check attempt: ${res.status} ${res.statusText}`);
        }
      })
      .catch((err: unknown) => {
        console.error("Failed to record concept-check attempt:", err);
      });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
        <Badge variant="outline">{KIND_LABEL[check.kind]}</Badge>
        {check.originLesson && (
          <Badge variant="secondary">Lesson {check.originLesson}</Badge>
        )}
        {result === "correct" && <CheckCircle2 className="ml-auto h-4 w-4 text-green-500" />}
        {result === "incorrect" && <XCircle className="ml-auto h-4 w-4 text-red-500" />}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="prose prose-sm prose-invert max-w-none">
          <SummaryView markdown={check.promptMd} />
        </div>

        {check.options !== null ? (
          <RadioGroup value={selected} onValueChange={setSelected} disabled={answered}>
            {Object.entries(check.options)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([key, text]) => (
                <div key={key} className="flex items-start gap-2">
                  <RadioGroupItem value={key} id={`${check.id}-${key}`} />
                  <Label htmlFor={`${check.id}-${key}`} className="font-normal leading-snug">
                    {text}
                  </Label>
                </div>
              ))}
          </RadioGroup>
        ) : (
          <Input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            disabled={answered}
            placeholder="Type the exact output…"
            className="font-mono"
          />
        )}

        {!answered ? (
          <Button size="sm" onClick={submit} disabled={!canSubmit}>
            Check answer
          </Button>
        ) : (
          <div className="rounded-md border border-border bg-muted/40 p-3 space-y-2">
            {result === "incorrect" && (
              <p className="text-sm font-medium">
                Correct answer:{" "}
                <code className="font-mono">
                  {check.options !== null ? check.options[check.answer] : check.answer}
                </code>
              </p>
            )}
            <div className="prose prose-sm prose-invert max-w-none">
              <SummaryView markdown={check.explanationMd} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ConceptChecksSection({ checks }: { checks: ConceptCheckClient[] }) {
  if (checks.length === 0) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-foreground">Check yourself</h2>
      {checks.map((c) => (
        <ConceptCheckCard key={c.id} check={c} />
      ))}
    </section>
  );
}

export function WarmupBlock({ checks }: { checks: ConceptCheckClient[] }) {
  const [open, setOpen] = useState(true);
  if (checks.length === 0) return null;
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CollapsibleTrigger className="flex w-full cursor-pointer flex-row items-center justify-between bg-transparent px-6 py-3 text-left">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Warm-up: quick recall</h2>
            <p className="text-xs text-muted-foreground">From earlier lessons</p>
          </div>
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
          />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-3 pt-0">
            {checks.map((c) => (
              <ConceptCheckCard key={c.id} check={c} />
            ))}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

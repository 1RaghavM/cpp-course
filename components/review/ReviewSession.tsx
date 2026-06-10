"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type { ConceptCheck } from "@/lib/supabase/types";

export interface ReviewCard {
  check: ConceptCheck;
  lessonNumber: string;
}

export interface ReviewSessionResult {
  total: number;
  correct: number;
  missed: ReviewCard[];
}

interface Props {
  cards: ReviewCard[];
  onComplete?: (result: ReviewSessionResult) => void;
  /** Title shown in the empty/finished card, e.g. "Daily review" or "Chapter 4 quiz". */
  surfaceLabel: string;
}

function gradeAnswer(check: ConceptCheck, userAnswer: string): boolean {
  if (check.kind === "predict_output") {
    return userAnswer.trim() === check.answer.trim();
  }
  return userAnswer === check.answer;
}

export function ReviewSession({ cards, onComplete, surfaceLabel }: Props) {
  const [index, setIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [results, setResults] = useState<Array<{ card: ReviewCard; correct: boolean }>>([]);

  if (cards.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Nothing to review</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Answer a concept check on any lesson to start your queue.
        </CardContent>
      </Card>
    );
  }

  const finished = index >= cards.length;

  if (finished) {
    const total = results.length;
    const correct = results.filter((r) => r.correct).length;
    const missed = results.filter((r) => !r.correct).map((r) => r.card);
    return (
      <Card>
        <CardHeader>
          <CardTitle>{surfaceLabel} complete</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm">
            {correct} correct of {total} ({Math.round((correct / total) * 100)}%)
          </p>
          {missed.length > 0 && (
            <div className="text-sm text-muted-foreground">
              <p className="font-medium">Missed:</p>
              <ul className="list-disc pl-5">
                {missed.map((m) => (
                  <li key={m.check.id}>From lesson {m.lessonNumber}</li>
                ))}
              </ul>
            </div>
          )}
          <Button onClick={() => onComplete?.({ total, correct, missed })}>Done</Button>
        </CardContent>
      </Card>
    );
  }

  const current = cards[index]!;
  const opts = (current.check.options ?? {}) as Record<string, string>;

  const submit = async () => {
    if (revealed) {
      setResults([...results, { card: current, correct: gradeAnswer(current.check, userAnswer) }]);
      setRevealed(false);
      setUserAnswer("");
      setIndex(index + 1);
      return;
    }
    const correct = gradeAnswer(current.check, userAnswer);
    setRevealed(true);
    void fetch("/api/review/attempt", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ checkId: current.check.id, correct }),
    });
  };

  const correctNow = revealed && gradeAnswer(current.check, userAnswer);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">
          Card {index + 1} of {cards.length}
        </CardTitle>
        <Badge variant="outline">From lesson {current.lessonNumber}</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <ReactMarkdown>{current.check.prompt_md}</ReactMarkdown>
        </div>

        {current.check.kind === "predict_output" ? (
          <Input
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="Type the expected stdout"
            disabled={revealed}
            className="font-mono"
          />
        ) : (
          <RadioGroup value={userAnswer} onValueChange={setUserAnswer} disabled={revealed}>
            {Object.entries(opts).map(([key, text]) => (
              <div key={key} className="flex items-start gap-2">
                <RadioGroupItem value={key} id={`opt-${key}`} />
                <Label htmlFor={`opt-${key}`} className="text-sm font-normal">
                  <span className="font-medium mr-1">{key}.</span>
                  {text}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )}

        {revealed && (
          <div
            className={`rounded-md border p-3 text-sm ${
              correctNow ? "border-green-500/40 bg-green-500/5" : "border-red-500/40 bg-red-500/5"
            }`}
          >
            <p className="font-medium mb-1">{correctNow ? "Correct" : "Not quite"}</p>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown>{current.check.explanation_md}</ReactMarkdown>
            </div>
          </div>
        )}

        <Button onClick={submit} disabled={!revealed && userAnswer.length === 0}>
          {revealed ? "Continue" : "Submit"}
        </Button>
      </CardContent>
    </Card>
  );
}

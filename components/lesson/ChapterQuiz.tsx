"use client";

import { useEffect, useState } from "react";
import { ReviewSession, type ReviewCard, type ReviewSessionResult } from "@/components/review/ReviewSession";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const PASS_THRESHOLD = 0.7;

interface Props {
  chapterNumber: string;
  lessonId: string;
}

interface QuizResponse {
  chapterNumber: string;
  checks: ReviewCard["check"][];
  composition: { currentChapter: number; priorChapters: number };
}

export function ChapterQuiz({ chapterNumber, lessonId }: Props) {
  const [cards, setCards] = useState<ReviewCard[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [finalResult, setFinalResult] = useState<ReviewSessionResult | null>(null);
  const [retakeKey, setRetakeKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setFinalResult(null);
    setCards(null);

    fetch(`/api/chapters/${chapterNumber}/quiz`)
      .then(async (r) => {
        if (r.status === 404) {
          throw new Error("This chapter doesn't have a quiz yet.");
        }
        if (!r.ok) throw new Error("Failed to load the quiz.");
        return (await r.json()) as QuizResponse;
      })
      .then((payload) => {
        if (cancelled) return;
        setCards(
          payload.checks.map((c) => ({
            check: c,
            lessonNumber: `ch ${chapterNumber}`,
          })),
        );
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });

    return () => {
      cancelled = true;
    };
  }, [chapterNumber, retakeKey]);

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Chapter quiz</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">{error}</CardContent>
      </Card>
    );
  }

  if (cards === null) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (finalResult) {
    const score = finalResult.total === 0 ? 0 : finalResult.correct / finalResult.total;
    const passed = score >= PASS_THRESHOLD;

    if (passed) {
      void fetch(`/api/progress/${lessonId}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ state: "completed" }),
      });
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>{passed ? "Chapter complete" : "Try again"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm">
            {finalResult.correct} of {finalResult.total} correct ({Math.round(score * 100)}%).
          </p>
          {!passed && (
            <p className="text-sm text-muted-foreground">
              Pass threshold is 70%. Take another pass at the missed items.
            </p>
          )}
          <Button
            onClick={() => {
              setFinalResult(null);
              setRetakeKey((k) => k + 1);
            }}
          >
            {passed ? "Retake" : "Try again"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <ReviewSession
      cards={cards}
      surfaceLabel={`Chapter ${chapterNumber} quiz`}
      onComplete={setFinalResult}
    />
  );
}

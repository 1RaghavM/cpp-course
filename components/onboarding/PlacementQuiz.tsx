"use client";

import { useState, useEffect } from "react";
import type { Action } from "@/lib/onboarding/types";
import { PLACEMENT_QUESTIONS, scoreAnswers } from "@/lib/onboarding/placement-questions";
import { MODULE_TITLES } from "@/lib/onboarding/constants";
import { placeFromScore } from "@/lib/onboarding/reducer";
import { OptionCard } from "./OptionCard";
import { trackEvent } from "@/lib/onboarding/analytics";

type Props = {
  dispatch: React.Dispatch<Action>;
  onBack: () => void;
};

export function PlacementQuiz({ dispatch, onBack }: Props) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<{ score: number; module: string } | null>(null);
  const [tracked, setTracked] = useState(false);

  useEffect(() => {
    if (!tracked) {
      trackEvent("placement_started");
      setTracked(true);
    }
  }, [tracked]);

  const question = PLACEMENT_QUESTIONS[questionIndex];

  function handleAnswer(optionIndex: number) {
    const newAnswers = [...answers, optionIndex];
    setAnswers(newAnswers);

    if (questionIndex < PLACEMENT_QUESTIONS.length - 1) {
      setQuestionIndex(questionIndex + 1);
    } else {
      const score = scoreAnswers(newAnswers);
      const startModule = placeFromScore(score);
      setResult({ score, module: startModule });
      trackEvent("placement_completed", { score });
    }
  }

  if (result) {
    const title = MODULE_TITLES[result.module] ?? result.module;
    return (
      <div className="ob-step">
        <h1 className="ob-heading">
          Got it &mdash; starting you at <strong>{title}</strong>.
        </h1>
        <p className="ob-subtext">Too easy or too hard? Jump anywhere from the path on the left.</p>
        <button
          type="button"
          className="ob-primary-btn"
          onClick={() => dispatch({ type: "COMPLETE_PLACEMENT", score: result.score })}
        >
          Continue
        </button>
      </div>
    );
  }

  if (!question) return null;

  return (
    <div className="ob-step">
      <button type="button" className="ob-back" onClick={onBack} aria-label="Go back">
        &larr;
      </button>
      <p className="ob-quiz-counter">
        {questionIndex + 1} / {PLACEMENT_QUESTIONS.length}
      </p>
      {questionIndex === 0 && (
        <p className="ob-subtext" style={{ marginBottom: 24 }}>
          Five quick ones. No score, no pressure &mdash; just so we don&rsquo;t start you somewhere
          boring.
        </p>
      )}
      {question.code ? (
        <pre className="ob-quiz-code">
          <code>{question.code}</code>
        </pre>
      ) : null}
      <p className="ob-quiz-question">{question.question}</p>
      <div className="ob-options-stack">
        {question.options.map((opt, i) => (
          <OptionCard key={i} label={opt} onSelect={() => handleAnswer(i)} />
        ))}
      </div>
    </div>
  );
}

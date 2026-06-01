"use client";

import type { Action } from "@/lib/onboarding/types";
import { OptionCard } from "./OptionCard";

type Props = {
  dispatch: React.Dispatch<Action>;
  onBack: () => void;
};

const OPTIONS: { label: string; value: number | null }[] = [
  { label: "Casual — 1 lesson/week", value: 1 },
  { label: "Steady — 3 lessons/week", value: 3 },
  { label: "Serious — 5+ lessons/week", value: 5 },
  { label: "No goal for now", value: null },
];

export function StepWeeklyGoal({ dispatch, onBack }: Props) {
  return (
    <div className="ob-step">
      <button type="button" className="ob-back" onClick={onBack} aria-label="Go back">
        &larr;
      </button>
      <h1 className="ob-heading">Want a weekly target?</h1>
      <p className="ob-subtext">
        Optional. It&rsquo;s a nudge, not a streak you&rsquo;ll lose sleep over.
      </p>
      <div className="ob-options-stack">
        {OPTIONS.map((opt) => (
          <OptionCard
            key={String(opt.value)}
            label={opt.label}
            onSelect={() => dispatch({ type: "SET_WEEKLY_GOAL", value: opt.value })}
          />
        ))}
      </div>
      <button
        type="button"
        className="ob-skip-link"
        onClick={() => dispatch({ type: "SET_WEEKLY_GOAL", value: null })}
      >
        Skip
      </button>
    </div>
  );
}

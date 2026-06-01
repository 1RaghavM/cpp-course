"use client";

import type { Action, Motivation } from "@/lib/onboarding/types";
import { OptionCard } from "./OptionCard";
import { ProgressBar } from "./ProgressBar";

type Props = {
  dispatch: React.Dispatch<Action>;
  onBack: () => void;
};

const OPTIONS: { label: string; value: Motivation }[] = [
  { label: "Coding interviews / jobs", value: "interviews" },
  { label: "School or coursework", value: "school" },
  { label: "Game development", value: "gamedev" },
  { label: "Systems / embedded / robotics", value: "systems" },
  { label: "Competitive programming", value: "competitive" },
  { label: "Just curious", value: "curious" },
];

export function StepMotivation({ dispatch, onBack }: Props) {
  return (
    <div className="ob-step">
      <ProgressBar current={2} total={3} />
      <button type="button" className="ob-back" onClick={onBack} aria-label="Go back">
        &larr;
      </button>
      <h1 className="ob-heading">What are you learning C++ for?</h1>
      <p className="ob-subtext">We&rsquo;ll lean your examples in that direction.</p>
      <div className="ob-options-grid">
        {OPTIONS.map((opt) => (
          <OptionCard
            key={opt.value}
            label={opt.label}
            onSelect={() => dispatch({ type: "SET_MOTIVATION", value: opt.value })}
          />
        ))}
      </div>
    </div>
  );
}

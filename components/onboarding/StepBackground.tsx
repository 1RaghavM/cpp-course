"use client";

import type { Action, Background } from "@/lib/onboarding/types";
import { OptionCard } from "./OptionCard";
import { ProgressBar } from "./ProgressBar";

type Props = { dispatch: React.Dispatch<Action> };

const OPTIONS: { label: string; description: string; value: Background }[] = [
  { label: "New to programming", description: "No coding experience yet", value: "new" },
  {
    label: "I know another language",
    description: "Python, JS, Java, or similar",
    value: "other_lang",
  },
  {
    label: "I've written some C or C++",
    description: "Some hands-on experience with C/C++",
    value: "some_cpp",
  },
];

export function StepBackground({ dispatch }: Props) {
  return (
    <div className="ob-step">
      <ProgressBar current={1} total={3} />
      <h1 className="ob-heading">First, where are you starting from?</h1>
      <p className="ob-subtext">This sets your starting point. You can change it anytime.</p>
      <div className="ob-options-stack">
        {OPTIONS.map((opt) => (
          <OptionCard
            key={opt.value}
            label={opt.label}
            description={opt.description}
            onSelect={() => dispatch({ type: "SET_BACKGROUND", value: opt.value })}
          />
        ))}
      </div>
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
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
      <motion.button
        type="button"
        className="ob-back"
        onClick={onBack}
        aria-label="Go back"
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.05, duration: 0.25 }}
      >
        &larr;
      </motion.button>
      <motion.h1
        className="ob-heading"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.35, ease: "easeOut" }}
      >
        What are you learning C++ for?
      </motion.h1>
      <motion.p
        className="ob-subtext"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.35, ease: "easeOut" }}
      >
        We&rsquo;ll lean your examples in that direction.
      </motion.p>
      <motion.div
        className="ob-options-grid"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.35, ease: "easeOut" }}
      >
        {OPTIONS.map((opt) => (
          <OptionCard
            key={opt.value}
            label={opt.label}
            onSelect={() => dispatch({ type: "SET_MOTIVATION", value: opt.value })}
          />
        ))}
      </motion.div>
    </div>
  );
}

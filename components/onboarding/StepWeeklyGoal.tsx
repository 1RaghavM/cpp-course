"use client";

import type { Action } from "@/lib/onboarding/types";
import { motion } from "framer-motion";
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
        transition={{ delay: 0.1, duration: 0.35 }}
      >
        Want a weekly target?
      </motion.h1>
      <motion.p
        className="ob-subtext"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.35 }}
      >
        Optional. It&rsquo;s a nudge, not a streak you&rsquo;ll lose sleep over.
      </motion.p>
      <motion.div
        className="ob-options-stack"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.35 }}
      >
        {OPTIONS.map((opt) => (
          <OptionCard
            key={String(opt.value)}
            label={opt.label}
            onSelect={() => dispatch({ type: "SET_WEEKLY_GOAL", value: opt.value })}
          />
        ))}
      </motion.div>
      <motion.button
        type="button"
        className="ob-skip-link"
        onClick={() => dispatch({ type: "SET_WEEKLY_GOAL", value: null })}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.35 }}
      >
        Skip
      </motion.button>
    </div>
  );
}

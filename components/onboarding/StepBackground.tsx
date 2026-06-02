"use client";

import { motion } from "framer-motion";
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
      <motion.h1
        className="ob-heading"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.35, ease: "easeOut" }}
      >
        First, where are you starting from?
      </motion.h1>
      <motion.p
        className="ob-subtext"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.35, ease: "easeOut" }}
      >
        This sets your starting point. You can change it anytime.
      </motion.p>
      <motion.div
        className="ob-options-stack"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.35, ease: "easeOut" }}
      >
        {OPTIONS.map((opt) => (
          <OptionCard
            key={opt.value}
            label={opt.label}
            description={opt.description}
            onSelect={() => dispatch({ type: "SET_BACKGROUND", value: opt.value })}
          />
        ))}
      </motion.div>
    </div>
  );
}

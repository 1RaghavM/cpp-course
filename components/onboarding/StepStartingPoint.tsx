"use client";

import type { Action, Background, ModuleId } from "@/lib/onboarding/types";
import { motion } from "framer-motion";
import { OptionCard } from "./OptionCard";
import { ProgressBar } from "./ProgressBar";

type Props = {
  background: Background;
  dispatch: React.Dispatch<Action>;
  onBack: () => void;
};

function BranchNew({ dispatch }: { dispatch: React.Dispatch<Action> }) {
  return (
    <>
      <motion.h1
        className="ob-heading"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.35 }}
      >
        We&rsquo;ll start at the beginning.
      </motion.h1>
      <motion.p
        className="ob-subtext"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.35 }}
      >
        First program, then variables, then we build up. No setup, no prior knowledge assumed.
      </motion.p>
      <motion.button
        type="button"
        className="ob-primary-btn"
        onClick={() => dispatch({ type: "SET_START_MODULE", module: "intro-basics" })}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.35 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
      >
        Let&rsquo;s go
      </motion.button>
    </>
  );
}

function BranchOtherLang({ dispatch }: { dispatch: React.Dispatch<Action> }) {
  return (
    <>
      <motion.h1
        className="ob-heading"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.35 }}
      >
        You already code. Want the C++-specific track?
      </motion.h1>
      <motion.p
        className="ob-subtext"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.35 }}
      >
        Skip &ldquo;what&rsquo;s a loop.&rdquo; Start where C++ actually differs &mdash; types,
        compilation, and memory.
      </motion.p>
      <motion.div
        className="ob-options-stack"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.35 }}
      >
        <OptionCard
          label="Yes, skip to what's different"
          onSelect={() =>
            dispatch({ type: "SET_START_MODULE", module: "intro-basics", fastTrack: true })
          }
        />
        <OptionCard
          label="No, walk me through everything"
          onSelect={() =>
            dispatch({ type: "SET_START_MODULE", module: "intro-basics", fastTrack: false })
          }
        />
      </motion.div>
    </>
  );
}

const SELF_SELECT: { label: string; module: ModuleId }[] = [
  { label: "References & pointers", module: "refs-pointers" },
  { label: "Classes", module: "classes" },
  { label: "Vectors & arrays", module: "vectors-arrays" },
];

function BranchSomeCpp({ dispatch }: { dispatch: React.Dispatch<Action> }) {
  return (
    <>
      <motion.h1
        className="ob-heading"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.35 }}
      >
        Where do you want to jump in?
      </motion.h1>
      <motion.p
        className="ob-subtext"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.35 }}
      >
        Not sure? Take a 5-question check and we&rsquo;ll place you.
      </motion.p>
      <motion.div
        className="ob-options-stack"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.35 }}
      >
        {SELF_SELECT.map((opt) => (
          <OptionCard
            key={opt.module}
            label={opt.label}
            onSelect={() => dispatch({ type: "SET_START_MODULE", module: opt.module })}
          />
        ))}
        <OptionCard
          label="Place me with a quick check"
          onSelect={() => dispatch({ type: "START_PLACEMENT" })}
        />
        <OptionCard
          label="Actually, start me from the basics"
          onSelect={() => dispatch({ type: "SET_START_MODULE", module: "intro-basics" })}
        />
      </motion.div>
    </>
  );
}

export function StepStartingPoint({ background, dispatch, onBack }: Props) {
  return (
    <div className="ob-step">
      <ProgressBar current={3} total={3} />
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
      {background === "new" && <BranchNew dispatch={dispatch} />}
      {background === "other_lang" && <BranchOtherLang dispatch={dispatch} />}
      {background === "some_cpp" && <BranchSomeCpp dispatch={dispatch} />}
    </div>
  );
}

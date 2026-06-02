"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MODULE_TITLES, MOTIVATION_LINES, MODULE_FIRST_LESSON } from "@/lib/onboarding/constants";
import type { Motivation } from "@/lib/onboarding/types";
import { trackEvent } from "@/lib/onboarding/analytics";

type Props = {
  firstName: string | null;
  startModule: string;
  motivation: string;
};

export function StepPayoff({ firstName, startModule, motivation }: Props) {
  const moduleTitle = MODULE_TITLES[startModule] ?? startModule;
  const motivationLine = MOTIVATION_LINES[motivation as Motivation] ?? "";
  const lessonSlug = MODULE_FIRST_LESSON[startModule] ?? "1-1";

  return (
    <div className="ob-step">
      <motion.h1
        className="ob-heading"
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.4, type: "spring", stiffness: 200 }}
      >
        You&rsquo;re set{firstName ? `, ${firstName}` : ", let's go"}.
      </motion.h1>
      <motion.p
        className="ob-subtext"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.35 }}
      >
        Starting you at <strong>{moduleTitle}</strong>. {motivationLine}
      </motion.p>
      <motion.p
        className="ob-subtext"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.35 }}
      >
        Stuck on anything? Hit <strong>Ask the tutor</strong> in the corner &mdash; it can see your
        code.
      </motion.p>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.35 }}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
      >
        <Link
          href={`/lessons/${lessonSlug}`}
          className="ob-primary-btn"
          onClick={() => trackEvent("first_lesson_opened", { startModule })}
        >
          Open first lesson
        </Link>
      </motion.div>
    </div>
  );
}

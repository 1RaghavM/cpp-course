"use client";

import Link from "next/link";
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
      <h1 className="ob-heading">You&rsquo;re set{firstName ? `, ${firstName}` : ", let's go"}.</h1>
      <p className="ob-subtext">
        Starting you at <strong>{moduleTitle}</strong>. {motivationLine}
      </p>
      <p className="ob-subtext">
        Stuck on anything? Hit <strong>Ask the tutor</strong> in the corner &mdash; it can see your
        code.
      </p>
      <Link
        href={`/lessons/${lessonSlug}`}
        className="ob-primary-btn"
        onClick={() => trackEvent("first_lesson_opened", { startModule })}
      >
        Open first lesson
      </Link>
    </div>
  );
}

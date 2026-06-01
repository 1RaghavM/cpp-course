"use client";

import Link from "next/link";
import type { Lesson, Module, ResumeVariant } from "@/lib/dashboard/types";
import { trackDashboardEvent } from "@/lib/dashboard/analytics";

interface ResumeCardProps {
  lesson: Lesson;
  module: Module;
  variant: ResumeVariant;
  snippet?: string;
}

const STOCK_SNIPPET = `#include <iostream>

int main() {
    std::cout << "Hello, C++!" << std::endl;
}`;

const variantConfig: Record<ResumeVariant, {
  label: string;
  buttonText: string;
  showTitle: boolean;
}> = {
  resume: { label: "Pick up where you left off", buttonText: "Resume coding", showTitle: true },
  start: { label: "Start here", buttonText: "Start lesson 1", showTitle: true },
  complete: { label: "You finished the path", buttonText: "Review a topic", showTitle: false },
};

export function ResumeCard({ lesson, module, variant, snippet }: ResumeCardProps) {
  const config = variantConfig[variant];
  const codePreview = variant === "resume" && snippet ? snippet : STOCK_SNIPPET;

  return (
    <div className="rounded-lg border border-border-subtle bg-surface p-6">
      <p className="text-xs tracking-wide text-muted">{config.label}</p>

      {config.showTitle && (
        <div className="mt-2">
          <p className="text-sm text-secondary">{module.title}</p>
          <h2 className="mt-0.5 text-xl font-medium text-primary">{lesson.title}</h2>
        </div>
      )}

      <pre className="mt-4 line-clamp-3 overflow-hidden rounded-md bg-elevated px-4 py-3 font-mono text-sm text-muted">
        {codePreview}
      </pre>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Link
          href={`/lessons/${lesson.slug}`}
          onClick={() =>
            trackDashboardEvent(
              variant === "complete" ? "review_clicked" : "resume_clicked",
              { lessonId: lesson.id, moduleId: module.id, variant },
            )
          }
          className="inline-flex items-center justify-center gap-2 rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-base"
          aria-label={`${config.buttonText}: ${lesson.title}`}
          prefetch
        >
          {config.buttonText}
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      </div>
    </div>
  );
}

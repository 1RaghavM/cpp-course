"use client";

import Link from "next/link";
import SyntaxHighlighter from "react-syntax-highlighter";
import { atomOneDark } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { GlassCard } from "@/components/ui/GlassCard";
import { trackDashboardEvent } from "@/lib/dashboard/analytics";
import type { Lesson, Module, ResumeVariant } from "@/lib/dashboard/types";

interface HeroProps {
  lesson: Lesson;
  module: Module;
  variant: ResumeVariant;
  snippet?: string;
}

const STOCK_SNIPPET = `#include <iostream>

int main() {
    std::cout << "Hello, C++!" << std::endl;
    return 0;
}`;

const variantConfig: Record<
  ResumeVariant,
  { label: string; buttonText: string; showTitle: boolean }
> = {
  resume: { label: "PICK UP WHERE YOU LEFT OFF", buttonText: "Resume coding", showTitle: true },
  start: { label: "START HERE", buttonText: "Start lesson 1", showTitle: true },
  complete: { label: "PATH COMPLETE", buttonText: "Review a topic", showTitle: false },
};

const highlighterTheme: Record<string, React.CSSProperties> = {
  ...atomOneDark,
  hljs: {
    ...atomOneDark["hljs"],
    background: "transparent",
    padding: "0",
  },
};

export function Hero({ lesson, module, variant, snippet }: HeroProps) {
  const config = variantConfig[variant];
  const codePreview = variant === "resume" && snippet ? snippet : STOCK_SNIPPET;

  return (
    <GlassCard as="section" className="p-6 sm:p-8">
      <p className="text-xs font-medium uppercase tracking-widest text-muted">{config.label}</p>

      {config.showTitle && (
        <div className="mt-3">
          <p className="text-sm text-secondary">{module.title}</p>
          <h2 className="mt-0.5 text-xl font-semibold text-primary sm:text-2xl">{lesson.title}</h2>
        </div>
      )}

      <div
        className="relative mt-5 overflow-hidden rounded-lg bg-[var(--bg-elevated)] px-4 py-3"
        style={{
          maskImage: "linear-gradient(to bottom, black 60%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 60%, transparent 100%)",
        }}
      >
        <SyntaxHighlighter
          language="cpp"
          style={highlighterTheme}
          customStyle={{ background: "transparent", fontSize: "0.875rem" }}
          codeTagProps={{ className: "font-mono" }}
        >
          {codePreview}
        </SyntaxHighlighter>
      </div>

      <div className="mt-5">
        <Link
          href={`/lessons/${lesson.slug}`}
          onClick={() =>
            trackDashboardEvent(variant === "complete" ? "review_clicked" : "resume_clicked", {
              lessonId: lesson.id,
              moduleId: module.id,
              variant,
            })
          }
          className="group inline-flex items-center gap-2 rounded-lg bg-brand-bright px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-cyan)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]"
          aria-label={`${config.buttonText}: ${lesson.title}`}
          prefetch
        >
          {config.buttonText}
          <svg
            className="h-4 w-4 transition-transform duration-fast ease-smooth group-hover:translate-x-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      </div>
    </GlassCard>
  );
}

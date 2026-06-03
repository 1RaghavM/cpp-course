"use client";

import Link from "next/link";
import { SyntaxHighlighter, oneDark } from "@/lib/syntax-highlight";
import { ArrowRightIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  "next-chapter": { label: "CHAPTER COMPLETE", buttonText: "Start Next Chapter", showTitle: true },
};

const highlighterTheme: Record<string, React.CSSProperties> = {
  ...oneDark,
  'pre[class*="language-"]': {
    ...oneDark['pre[class*="language-"]'],
    background: "transparent",
    padding: "0",
  },
};

export function Hero({ lesson, module, variant, snippet }: HeroProps) {
  const config = variantConfig[variant];
  const codePreview = variant === "resume" && snippet ? snippet : STOCK_SNIPPET;

  return (
    <Card>
      <CardHeader>
        <CardDescription className="text-xs font-medium uppercase tracking-widest">
          {config.label}
        </CardDescription>
        {config.showTitle && (
          <>
            <p className="text-sm text-muted-foreground">{module.title}</p>
            <CardTitle className="text-xl sm:text-2xl">{lesson.title}</CardTitle>
          </>
        )}
      </CardHeader>

      <CardContent>
        <div
          className="overflow-hidden rounded-lg bg-muted px-4 py-3"
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
      </CardContent>

      <CardFooter>
        <Button
          render={
            <Link
              href={`/lessons/${lesson.slug}`}
              onClick={() =>
                trackDashboardEvent(
                  variant === "complete" ? "review_clicked" : "resume_clicked",
                  { lessonId: lesson.id, moduleId: module.id, variant }
                )
              }
              aria-label={`${config.buttonText}: ${lesson.title}`}
              prefetch
            />
          }
          className="gap-2"
        >
          {config.buttonText}
          <ArrowRightIcon className="size-4 transition-transform group-hover/button:translate-x-1" />
        </Button>
      </CardFooter>
    </Card>
  );
}

"use client";

import Link from "next/link";
import { CheckIcon, PlayIcon, LockIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import type { StageState } from "@/lib/dashboard/types";
import { getPrereqHint } from "@/lib/path";
import { trackDashboardEvent } from "@/lib/dashboard/analytics";

interface RoadNodeProps {
  state: StageState;
  title: string;
  targetLessonSlug: string;
  index?: number;
}

const nodeStyles: Record<StageState["status"], { ring: string; bg: string; label: string }> = {
  completed: {
    ring: "ring-2 ring-node-complete",
    bg: "bg-node-complete",
    label: "text-foreground",
  },
  active: {
    ring: "ring-2 ring-node-active",
    bg: "bg-node-active",
    label: "text-foreground font-semibold",
  },
  unlocked: {
    ring: "ring-1 ring-border",
    bg: "bg-muted",
    label: "text-muted-foreground",
  },
  locked: {
    ring: "ring-1 ring-border",
    bg: "bg-muted/50",
    label: "text-muted-foreground",
  },
};

export function RoadNode({ state, title, targetLessonSlug, index = 0 }: RoadNodeProps) {
  const isLocked = state.status === "locked";
  const style = nodeStyles[state.status];
  const hint = getPrereqHint(state.stageId);
  const statusLabel =
    state.status === "completed"
      ? "complete"
      : state.status === "active"
        ? "in progress"
        : state.status === "locked"
          ? "locked"
          : "available";

  // Stagger node entrance: first node starts at 100ms (before road-fill 560ms completes),
  // each subsequent node delayed by 80ms. Honors reduced-motion via motion-safe: prefix.
  const enterDelay = `${100 + index * 80}ms`;
  const enterStyle = { animationDelay: enterDelay } as React.CSSProperties;
  const enterClasses =
    "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300 motion-safe:fill-mode-both";

  const nodeContent = (
    <>
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-full ${style.bg} ${style.ring} transition-all`}
        style={
          state.status === "active"
            ? {
                animation: "node-pulse 2.4s ease-in-out infinite",
                boxShadow: "0 0 20px var(--glow-blue)",
              }
            : undefined
        }
      >
        {state.status === "completed" && <CheckIcon className="size-4 text-white" />}
        {state.status === "active" && <PlayIcon className="size-4 text-white" />}
        {state.status === "locked" && <LockIcon className="size-4 text-muted-foreground" />}
        {state.status === "unlocked" && (
          <span className="font-mono text-xs text-muted-foreground">{state.completed}</span>
        )}
      </div>
      <div className="mt-2 text-center">
        <p className={`text-sm ${style.label}`}>{title}</p>
        <p className="font-mono text-xs tabular-nums text-muted-foreground">
          {state.completed} / {state.total}
        </p>
        {state.status === "active" && (
          <p className="mt-0.5 text-xs text-foreground">you&apos;re here</p>
        )}
      </div>
    </>
  );

  if (isLocked && hint) {
    return (
      <li
        className={`relative flex flex-col items-center ${enterClasses}`}
        style={enterStyle}
      >
        <Popover>
          <PopoverTrigger
            className="flex flex-col items-center opacity-60 transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-safe:transition-transform motion-safe:hover:scale-105"
            onClick={() => trackDashboardEvent("locked_stage_clicked", { stage: state.stageId })}
            aria-label={`${title}, ${state.completed} of ${state.total} lessons, ${statusLabel}`}
          >
            {nodeContent}
          </PopoverTrigger>
          <PopoverContent side="bottom" sideOffset={12}>
            <PopoverDescription>{hint}</PopoverDescription>
            <Button
              size="sm"
              render={
                <Link
                  href={`/lessons/${targetLessonSlug}`}
                  onClick={() =>
                    trackDashboardEvent("locked_stage_continued", { stage: state.stageId })
                  }
                />
              }
            >
              Continue anyway
            </Button>
          </PopoverContent>
        </Popover>
      </li>
    );
  }

  return (
    <li className={`flex flex-col items-center ${enterClasses}`} style={enterStyle}>
      <Link
        href={`/lessons/${targetLessonSlug}`}
        onClick={() => trackDashboardEvent("stage_clicked", { stage: state.stageId })}
        className={`flex flex-col items-center transition-transform motion-safe:hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${isLocked ? "opacity-60" : ""}`}
        aria-label={`${title}, ${state.completed} of ${state.total} lessons, ${statusLabel}`}
      >
        {nodeContent}
      </Link>
    </li>
  );
}

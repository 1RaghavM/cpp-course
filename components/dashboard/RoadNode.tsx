"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import type { StageState } from "@/lib/dashboard/types";
import { getPrereqHint } from "@/lib/path";
import { trackDashboardEvent } from "@/lib/dashboard/analytics";

interface RoadNodeProps {
  state: StageState;
  title: string;
  targetLessonSlug: string;
}

function CheckIcon() {
  return (
    <svg
      className="h-4 w-4 text-white"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg
      className="h-4 w-4 text-white"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      className="h-4 w-4 text-muted"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
      />
    </svg>
  );
}

const nodeStyles: Record<StageState["status"], { ring: string; bg: string; label: string }> = {
  completed: {
    ring: "ring-2 ring-node-complete",
    bg: "bg-node-complete",
    label: "text-primary",
  },
  active: {
    ring: "ring-2 ring-node-active",
    bg: "bg-node-active",
    label: "text-primary font-semibold",
  },
  unlocked: {
    ring: "ring-1 ring-glass-border",
    bg: "bg-[var(--bg-elevated)]",
    label: "text-secondary",
  },
  locked: {
    ring: "ring-1 ring-glass-border",
    bg: "bg-node-locked",
    label: "text-muted",
  },
};

export function RoadNode({ state, title, targetLessonSlug }: RoadNodeProps) {
  const [showHint, setShowHint] = useState(false);
  const popoverRef = useRef<HTMLLIElement>(null);
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

  useEffect(() => {
    if (!showHint) return;
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowHint(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setShowHint(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showHint]);

  const nodeContent = (
    <>
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-full ${style.bg} ${style.ring} transition-all duration-fast ease-smooth`}
        style={
          state.status === "active"
            ? { animation: "node-pulse 2.4s ease-in-out infinite", boxShadow: "0 0 20px var(--glow-blue)" }
            : undefined
        }
      >
        {state.status === "completed" && <CheckIcon />}
        {state.status === "active" && <PlayIcon />}
        {state.status === "locked" && <LockIcon />}
        {state.status === "unlocked" && (
          <span className="font-mono text-xs text-secondary">{state.completed}</span>
        )}
      </div>
      <div className="mt-2 text-center">
        <p className={`text-sm ${style.label}`}>{title}</p>
        <p className="font-mono text-xs tabular-nums text-muted">
          {state.completed} / {state.total}
        </p>
        {state.status === "active" && (
          <p className="mt-0.5 text-xs text-accent-cyan">you&apos;re here</p>
        )}
      </div>
    </>
  );

  if (isLocked && hint) {
    return (
      <li className="relative flex flex-col items-center" ref={popoverRef}>
        <button
          type="button"
          onClick={() => {
            setShowHint(true);
            trackDashboardEvent("locked_stage_clicked", { stage: state.stageId });
          }}
          className="flex flex-col items-center opacity-60 transition-opacity duration-fast hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]"
          aria-label={`${title}, ${state.completed} of ${state.total} lessons, ${statusLabel}`}
        >
          {nodeContent}
        </button>

        {showHint && (
          <div
            className="absolute top-full z-10 mt-3 w-64 rounded-card border border-glass-border bg-[var(--bg-surface)] p-4 shadow-lg"
            role="dialog"
            aria-label="Prerequisites"
          >
            <p className="text-sm text-secondary">{hint}</p>
            <Link
              href={`/lessons/${targetLessonSlug}`}
              className="mt-3 inline-block rounded-lg bg-brand-bright px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[var(--accent-cyan)]"
              onClick={() => {
                setShowHint(false);
                trackDashboardEvent("locked_stage_continued", { stage: state.stageId });
              }}
            >
              Continue anyway
            </Link>
          </div>
        )}
      </li>
    );
  }

  return (
    <li className="flex flex-col items-center">
      <Link
        href={`/lessons/${targetLessonSlug}`}
        onClick={() => trackDashboardEvent("stage_clicked", { stage: state.stageId })}
        className={`flex flex-col items-center transition-transform duration-fast ease-smooth hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)] ${isLocked ? "opacity-60" : ""}`}
        aria-label={`${title}, ${state.completed} of ${state.total} lessons, ${statusLabel}`}
      >
        {nodeContent}
      </Link>
    </li>
  );
}

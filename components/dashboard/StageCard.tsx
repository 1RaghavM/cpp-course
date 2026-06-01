"use client";

import Link from "next/link";
import type { Stage, StageStatus } from "@/lib/dashboard/types";
import { trackDashboardEvent } from "@/lib/dashboard/analytics";

interface StageCardProps {
  stage: Stage;
  title: string;
  completed: number;
  total: number;
  status: StageStatus;
  targetLessonSlug: string;
}

function CheckIcon() {
  return (
    <svg className="h-4 w-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg className="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg className="h-4 w-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  );
}

const statusIcon: Record<StageStatus, () => JSX.Element> = {
  done: CheckIcon,
  active: PlayIcon,
  locked: LockIcon,
};

const barColor: Record<StageStatus, string> = {
  done: "bg-success",
  active: "bg-accent",
  locked: "bg-muted/30",
};

export function StageCard({ stage, title, completed, total, status, targetLessonSlug }: StageCardProps) {
  const Icon = statusIcon[status];
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  const statusLabel = status === "done" ? "complete" : status === "active" ? "in progress" : "locked";

  return (
    <Link
      href={`/lessons/${targetLessonSlug}`}
      onClick={() => trackDashboardEvent("stage_clicked", { stage, targetLessonId: targetLessonSlug })}
      className={`
        flex flex-col gap-2 rounded-lg border p-4 transition-colors
        hover:bg-hover/50
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-base
        ${status === "active" ? "border-accent border-2" : "border-border"}
        ${status === "locked" ? "opacity-60" : ""}
      `}
      aria-label={`${title}, ${completed} of ${total} lessons complete, ${statusLabel}`}
    >
      <div className="flex items-center gap-2">
        <Icon />
        <span className={`text-sm font-medium ${status === "locked" ? "text-muted" : "text-primary"}`}>
          {title}
        </span>
      </div>
      <div
        className="h-1 w-full overflow-hidden rounded-full bg-elevated"
        role="progressbar"
        aria-valuenow={completed}
        aria-valuemin={0}
        aria-valuemax={total}
      >
        <div
          className={`h-full rounded-full motion-safe:transition-all motion-safe:duration-500 ${barColor[status]}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="text-xs text-muted">
        {completed} / {total}
        {status === "done" && " done"}
        {status === "active" && " · you're here"}
      </span>
    </Link>
  );
}

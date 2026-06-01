"use client";

import { RoadNode } from "@/components/dashboard/RoadNode";
import type { StageState, Stage } from "@/lib/dashboard/types";
import { STAGES } from "@/lib/dashboard/curriculum";

interface RoadProps {
  stageStates: StageState[];
  pathPercent: number;
  stageTargetSlugs: Record<Stage, string>;
}

function TrackSVG({ percent, vertical }: { percent: number; vertical: boolean }) {
  if (vertical) {
    const height = 100;
    return (
      <svg
        className="absolute left-1/2 top-0 -z-10 h-full -translate-x-1/2"
        width="4"
        height="100%"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <line
          x1="2" y1="0" x2="2" y2={height}
          stroke="var(--node-locked)"
          strokeWidth="4"
          vectorEffect="non-scaling-stroke"
        />
        <line
          x1="2" y1="0" x2="2" y2={height}
          stroke="url(#road-gradient-v)"
          strokeWidth="4"
          strokeDasharray={`${height}`}
          strokeDashoffset={`${height - (height * percent) / 100}`}
          vectorEffect="non-scaling-stroke"
          className="transition-all duration-slow ease-smooth"
        />
        <defs>
          <linearGradient id="road-gradient-v" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--brand)" />
            <stop offset="100%" stopColor="var(--accent-cyan)" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  const width = 100;
  return (
    <svg
      className="absolute left-0 top-1/2 -z-10 w-full -translate-y-1/2"
      height="4"
      width="100%"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <line
        x1="0" y1="2" x2={width} y2="2"
        stroke="var(--node-locked)"
        strokeWidth="4"
        vectorEffect="non-scaling-stroke"
      />
      <line
        x1="0" y1="2" x2={width} y2="2"
        stroke="url(#road-gradient-h)"
        strokeWidth="4"
        strokeDasharray={`${width}`}
        strokeDashoffset={`${width - (width * percent) / 100}`}
        vectorEffect="non-scaling-stroke"
        className="transition-all duration-slow ease-smooth"
      />
      <defs>
        <linearGradient id="road-gradient-h" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--brand)" />
          <stop offset="100%" stopColor="var(--accent-cyan)" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function Road({ stageStates, pathPercent, stageTargetSlugs }: RoadProps) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-medium text-primary">Your path</h3>
        <span className="font-mono text-xs tabular-nums text-muted">{pathPercent}%</span>
      </div>

      {/* Mobile: vertical */}
      <div className="relative md:hidden">
        <TrackSVG percent={pathPercent} vertical />
        <ol className="relative flex flex-col items-center gap-10 py-4">
          {STAGES.map((stage) => {
            const state = stageStates.find((s) => s.stageId === stage.id);
            if (!state) return null;
            return (
              <RoadNode
                key={stage.id}
                state={state}
                title={stage.title}
                targetLessonSlug={stageTargetSlugs[stage.id]}
              />
            );
          })}
        </ol>
      </div>

      {/* Desktop: horizontal */}
      <div className="relative hidden md:block">
        <TrackSVG percent={pathPercent} vertical={false} />
        <ol className="relative flex items-start justify-between py-4">
          {STAGES.map((stage) => {
            const state = stageStates.find((s) => s.stageId === stage.id);
            if (!state) return null;
            return (
              <RoadNode
                key={stage.id}
                state={state}
                title={stage.title}
                targetLessonSlug={stageTargetSlugs[stage.id]}
              />
            );
          })}
        </ol>
      </div>
    </div>
  );
}

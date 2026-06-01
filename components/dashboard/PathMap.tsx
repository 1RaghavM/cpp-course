import { StageCard } from "@/components/dashboard/StageCard";
import type { Module, DashboardProgress, Stage } from "@/lib/dashboard/types";
import { computeStageProgress } from "@/lib/dashboard/resume";
import { STAGES } from "@/lib/dashboard/curriculum";

interface PathMapProps {
  curriculum: Module[];
  progress: DashboardProgress;
  pathPercent: number;
  resumeTargetId: string;
  stageTargetSlugs: Record<Stage, string>;
}

export function PathMap({ curriculum, progress, pathPercent, resumeTargetId, stageTargetSlugs }: PathMapProps) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-medium text-primary">Your path</h3>
        <span className="font-mono text-xs tabular-nums text-muted">{pathPercent}%</span>
      </div>
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
        {STAGES.map((stage) => {
          const sp = computeStageProgress(curriculum, progress, stage.id, resumeTargetId);
          return (
            <StageCard
              key={stage.id}
              stage={stage.id}
              title={stage.title}
              completed={sp.completed}
              total={sp.total}
              status={sp.status}
              targetLessonSlug={stageTargetSlugs[stage.id]}
            />
          );
        })}
      </div>
    </div>
  );
}

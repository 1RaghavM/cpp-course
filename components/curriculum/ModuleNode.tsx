"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Lock, Circle } from "lucide-react";
import type { ModuleNodeData, ModuleStatus } from "./curriculum-utils";

// ─── Status styles lookup ─────────────────────────────────────────────────────

const statusStyles: Record<
  ModuleStatus,
  {
    border: string;
    ring: string;
    opacity: string;
    icon: React.ReactNode;
  }
> = {
  completed: {
    border: "border-[var(--color-brand)]",
    ring: "",
    opacity: "",
    icon: <CheckCircle2 className="h-3 w-3 shrink-0 text-[var(--color-brand)]" />,
  },
  active: {
    border: "border-[var(--node-active)]",
    ring: "ring-2 ring-[var(--glow-blue)]",
    opacity: "",
    icon: <Circle className="h-3 w-3 shrink-0 fill-[var(--node-active)] text-[var(--node-active)]" />,
  },
  not_started: {
    border: "border-border",
    ring: "",
    opacity: "",
    icon: <Circle className="h-3 w-3 shrink-0 text-muted-foreground" />,
  },
  locked: {
    border: "border-border",
    ring: "",
    opacity: "opacity-50",
    icon: <Lock className="h-3 w-3 shrink-0 text-muted-foreground" />,
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

function ModuleNodeComponent({ data }: NodeProps) {
  const nodeData = data as ModuleNodeData;
  const { title, completed, total, status } = nodeData;

  const styles = statusStyles[status];
  const progressValue = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <>
      {/* Hidden handles — required for edges to connect, but visually invisible */}
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-transparent !border-0 !w-0 !h-0"
      />
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-transparent !border-0 !w-0 !h-0"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-transparent !border-0 !w-0 !h-0"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-transparent !border-0 !w-0 !h-0"
      />

      {/* Card */}
      <Card
        size="sm"
        className={[
          "w-[200px] border-2 cursor-default select-none",
          styles.border,
          styles.ring,
          styles.opacity,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <CardContent className="flex flex-col gap-2 py-2">
          {/* Title row with status icon */}
          <div className="flex items-start gap-1.5">
            <span className="mt-0.5 shrink-0">{styles.icon}</span>
            <p className="truncate text-xs font-semibold leading-tight">{title}</p>
          </div>

          {/* Progress bar */}
          <Progress value={progressValue} className="gap-0" />

          {/* Lesson count */}
          <p className="text-[10px] text-muted-foreground tabular-nums">
            {completed}/{total} lessons
          </p>
        </CardContent>
      </Card>
    </>
  );
}

export const ModuleNode = memo(ModuleNodeComponent);

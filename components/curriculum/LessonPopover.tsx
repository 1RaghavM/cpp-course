"use client";

import Link from "next/link";
import { NodeToolbar, Position } from "@xyflow/react";
import { CheckCircle2, Circle, Loader2, Lock } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface LessonPopoverProps {
  lessons: { id: string; title: string; slug: string; status: string }[];
  moduleTitle: string;
  nodeId: string;
  isVisible: boolean;
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="size-4 shrink-0" style={{ color: "var(--color-brand)" }} />;
    case "skipped":
      return <CheckCircle2 className="size-4 shrink-0 text-muted-foreground" />;
    case "in_progress":
      return (
        <Loader2
          className="size-4 shrink-0 animate-spin"
          style={{ color: "var(--node-active)" }}
        />
      );
    case "locked":
      return <Lock className="size-4 shrink-0 text-muted-foreground/50" />;
    case "not_started":
    default:
      return <Circle className="size-4 shrink-0 text-muted-foreground" />;
  }
}

export function LessonPopover({ lessons, moduleTitle, nodeId, isVisible }: LessonPopoverProps) {
  return (
    <NodeToolbar nodeId={nodeId} isVisible={isVisible} position={Position.Right} offset={12} className="z-50">
      <div className="w-64 rounded-xl border bg-card p-3 shadow-lg">
        <p className="mb-2 text-xs font-semibold text-card-foreground">{moduleTitle}</p>
        <ScrollArea className="max-h-56">
          <ul className="flex flex-col gap-0.5">
            {lessons.map((lesson) => (
              <li key={lesson.id}>
                <Link
                  href={`/lessons/${lesson.slug}`}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-accent"
                >
                  <StatusIcon status={lesson.status} />
                  <span className="truncate text-card-foreground">{lesson.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </ScrollArea>
      </div>
    </NodeToolbar>
  );
}

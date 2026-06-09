"use client";

import Link from "next/link";
import { CheckCircle2, Circle, Loader2, Lock } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  Drawer,
  DrawerPopup,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import type { ModuleNodeData } from "./curriculum-utils";

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

interface ModuleSidebarProps {
  data: ModuleNodeData | null;
  open: boolean;
  onClose: () => void;
}

export function ModuleSidebar({ data, open, onClose }: ModuleSidebarProps) {
  if (!data) return null;

  const percent = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;

  return (
    <Drawer open={open} onOpenChange={(val) => !val && onClose()} swipeDirection="right">
      <DrawerPopup className="module-drawer-popup">
        <div className="mb-4 module-drawer-content" style={{ "--stagger": 0 } as React.CSSProperties}>
          <DrawerTitle>{data.title}</DrawerTitle>
          <DrawerDescription>
            {data.completed}/{data.total} lessons completed ({percent}%)
          </DrawerDescription>
          <Progress value={percent} className="mt-2" />
        </div>
        <ScrollArea className="flex-1">
          <ul className="flex flex-col gap-0.5 pb-4">
            {data.lessons.map((lesson, i) => (
              <li
                key={lesson.id}
                className="module-drawer-content"
                style={{ "--stagger": i + 1 } as React.CSSProperties}
              >
                <Link
                  href={`/lessons/${lesson.slug}`}
                  className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-accent"
                  onClick={onClose}
                >
                  <StatusIcon status={lesson.status} />
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {lesson.number}
                  </span>
                  <span className="text-card-foreground">{lesson.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </ScrollArea>
      </DrawerPopup>
    </Drawer>
  );
}

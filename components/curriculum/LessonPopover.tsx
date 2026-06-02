"use client";

import Link from "next/link";
import { CheckCircle2, Circle, Loader2, Lock } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
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
    <Sheet open={open} onOpenChange={(val) => !val && onClose()}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>{data.title}</SheetTitle>
          <SheetDescription>
            {data.completed}/{data.total} lessons completed ({percent}%)
          </SheetDescription>
          <Progress value={percent} className="mt-1" />
        </SheetHeader>
        <ScrollArea className="flex-1 px-4">
          <ul className="flex flex-col gap-0.5 pb-4">
            {data.lessons.map((lesson) => (
              <li key={lesson.id}>
                <Link
                  href={`/lessons/${lesson.slug}`}
                  className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-accent"
                  onClick={onClose}
                >
                  <StatusIcon status={lesson.status} />
                  <span className="text-card-foreground">{lesson.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

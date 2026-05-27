import Link from "next/link";

export interface RecentLesson {
  slug: string;
  title: string;
  number: string;
  state: "in_progress" | "completed" | "skipped";
  lastVisitAt: string;
}

interface RecentActivityProps {
  lessons: RecentLesson[];
}

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const stateColor: Record<RecentLesson["state"], string> = {
  in_progress: "hsl(var(--slate))",
  completed: "hsl(var(--success))",
  skipped: "hsl(var(--warning))",
};

export function RecentActivity({ lessons }: RecentActivityProps) {
  if (lessons.length === 0) return null;

  return (
    <section className="reveal reveal-d3">
      <h2 className="font-display text-xl italic text-primary">Recently</h2>
      <div className="mt-3 space-y-0.5">
        {lessons.map((lesson) => (
          <Link
            key={lesson.slug}
            href={`/lessons/${lesson.slug}`}
            className="group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-surface"
          >
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: stateColor[lesson.state] }}
            />
            <span className="shrink-0 font-mono text-xs tabular-nums text-muted">
              {lesson.number}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm text-secondary transition-colors group-hover:text-primary">
              {lesson.title}
            </span>
            <span className="shrink-0 font-mono text-xs tabular-nums text-muted/60">
              {formatRelativeTime(lesson.lastVisitAt)}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

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

const stateLabel: Record<RecentLesson["state"], string> = {
  in_progress: "In progress",
  completed: "Completed",
  skipped: "Skipped",
};

export function RecentActivity({ lessons }: RecentActivityProps) {
  if (lessons.length === 0) return null;

  return (
    <section className="home-fade-in home-fade-in-delay-2">
      <h2 className="mb-3 font-display text-lg font-semibold text-primary">Recent activity</h2>
      <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
        {lessons.map((lesson) => (
          <li key={lesson.slug}>
            <Link
              href={`/lessons/${lesson.slug}`}
              className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-hover"
            >
              <span className="shrink-0 font-mono text-xs tabular-nums text-muted">
                {lesson.number}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm text-primary">{lesson.title}</span>
              <span className="hidden shrink-0 text-xs text-muted sm:inline">
                {stateLabel[lesson.state]}
              </span>
              <span className="shrink-0 font-mono text-xs tabular-nums text-muted">
                {formatRelativeTime(lesson.lastVisitAt)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

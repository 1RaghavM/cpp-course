import Link from "next/link";

export interface DetailLesson {
  id: string;
  number: string;
  slug: string;
  title: string;
  state: "not_started" | "in_progress" | "completed" | "skipped";
}

export interface DetailChapter {
  id: number;
  number: string;
  title: string;
  completionPercent: number;
  lessons: DetailLesson[];
}

interface ChapterDetailProps {
  chapter: DetailChapter;
  chapterIndex: number;
}

const stateIndicator: Record<DetailLesson["state"], { label: string; className: string }> = {
  completed: { label: "●", className: "text-success" },
  in_progress: { label: "◐", className: "text-accent" },
  not_started: { label: "○", className: "text-muted" },
  skipped: { label: "–", className: "text-warning" },
};

export function ChapterDetail({ chapter }: ChapterDetailProps) {
  const totalLessons = chapter.lessons.length;
  const completedCount = chapter.lessons.filter(
    (l) => l.state === "completed" || l.state === "skipped",
  ).length;

  return (
    <div className="reveal">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-7 min-w-[2.5rem] items-center justify-center rounded-md px-2 font-mono text-xs font-medium bg-accent/10 text-accent-hover">
            {chapter.number}
          </span>
          <h2 className="text-xl font-semibold tracking-tight text-primary">{chapter.title}</h2>
        </div>
        <p className="mt-2 text-xs text-muted">
          <span className="font-mono tabular-nums text-secondary">{completedCount}</span>
          {" of "}
          <span className="font-mono tabular-nums">{totalLessons}</span>
          {" lessons"}
          <span className="mx-2 opacity-30">&middot;</span>
          <span className="font-mono tabular-nums text-secondary">
            {chapter.completionPercent}%
          </span>
        </p>
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-elevated">
          <div
            className="h-full rounded-full bg-accent transition-all duration-300"
            style={{ width: `${chapter.completionPercent}%` }}
          />
        </div>
      </div>

      <div className="space-y-0.5">
        {chapter.lessons.map((lesson) => {
          const indicator = stateIndicator[lesson.state];
          const isActive = lesson.state === "in_progress";

          return (
            <Link
              key={lesson.id}
              href={`/lessons/${lesson.slug}`}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-hover/50 ${
                isActive ? "bg-accent/[0.06]" : ""
              }`}
            >
              <span className={`shrink-0 text-sm leading-none ${indicator.className}`}>
                {indicator.label}
              </span>
              <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted">
                {lesson.number}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm text-secondary transition-colors group-hover:text-primary">
                {lesson.title}
              </span>
              {isActive && (
                <span className="shrink-0 font-mono text-[10px] text-accent">current</span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

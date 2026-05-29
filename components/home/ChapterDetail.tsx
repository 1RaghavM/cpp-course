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

const chapterHues = [10, 220, 38, 155, 280, 190, 350, 45, 120, 260];

function getChapterColors(index: number) {
  const hue = chapterHues[index % chapterHues.length]!;
  return {
    badge: `hsl(${hue} 30% 20%)`,
    badgeText: `hsl(${hue} 40% 68%)`,
    bar: `hsl(${hue} 35% 42%)`,
  };
}

const stateIndicator: Record<DetailLesson["state"], { label: string; color: string }> = {
  completed: { label: "●", color: "hsl(var(--success))" },
  in_progress: { label: "◐", color: "hsl(var(--accent))" },
  not_started: { label: "○", color: "hsl(var(--text-muted))" },
  skipped: { label: "–", color: "hsl(var(--warning))" },
};

export function ChapterDetail({ chapter, chapterIndex }: ChapterDetailProps) {
  const colors = getChapterColors(chapterIndex);
  const totalLessons = chapter.lessons.length;
  const completedCount = chapter.lessons.filter(
    (l) => l.state === "completed" || l.state === "skipped",
  ).length;

  return (
    <div className="reveal">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <span
            className="inline-flex h-7 min-w-[2.5rem] items-center justify-center rounded-md px-2 font-mono text-xs font-medium"
            style={{ backgroundColor: colors.badge, color: colors.badgeText }}
          >
            {chapter.number}
          </span>
          <h2 className="font-display text-xl text-primary">{chapter.title}</h2>
        </div>
        <p className="mt-2 text-xs text-muted">
          <span className="font-mono tabular-nums text-secondary">{completedCount}</span>
          {" of "}
          <span className="font-mono tabular-nums">{totalLessons}</span>
          {" lessons"}
          <span className="mx-2 opacity-30">·</span>
          <span className="font-mono tabular-nums text-secondary">{chapter.completionPercent}%</span>
        </p>
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-elevated">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${chapter.completionPercent}%`,
              backgroundColor: colors.bar,
            }}
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
              <span
                className="shrink-0 text-sm leading-none"
                style={{ color: indicator.color }}
              >
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

import Link from "next/link";

export interface ContinueLesson {
  slug: string;
  title: string;
  number: string;
  chapterNumber: string;
  chapterTitle: string;
  state: "in_progress" | "not_started";
}

interface ContinueLearningProps {
  lesson: ContinueLesson | null;
  hasAnyProgress: boolean;
}

export function ContinueLearning({ lesson, hasAnyProgress }: ContinueLearningProps) {
  if (!lesson) {
    return (
      <section className="home-fade-in home-fade-in-delay-1 rounded-xl border border-success/30 bg-success/5 p-6">
        <p className="font-mono text-xs uppercase tracking-wider text-success">Complete</p>
        <h2 className="mt-1 font-display text-xl font-semibold text-primary">
          You&apos;ve finished the curriculum
        </h2>
        <p className="mt-2 text-sm text-secondary">
          Every lesson is marked complete or skipped. Revisit any chapter below to review.
        </p>
      </section>
    );
  }

  const isResume = lesson.state === "in_progress";

  return (
    <section className="home-fade-in home-fade-in-delay-1 rounded-xl border border-border bg-surface p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-muted">
            {isResume ? "Continue where you left off" : hasAnyProgress ? "Up next" : "Start here"}
          </p>
          <h2 className="mt-1 font-display text-xl font-semibold text-primary">{lesson.title}</h2>
          <p className="mt-1 text-sm text-secondary">
            Chapter {lesson.chapterNumber} · {lesson.chapterTitle}
            <span className="mx-2 text-muted">·</span>
            <span className="font-mono text-muted">{lesson.number}</span>
          </p>
        </div>

        <Link
          href={`/lessons/${lesson.slug}`}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-base transition-all hover:bg-accent-hover hover:shadow-[0_0_24px_hsl(var(--accent)/0.35)]"
        >
          {isResume ? "Continue learning" : "Start lesson"}
          <ArrowIcon />
        </Link>
      </div>
    </section>
  );
}

function ArrowIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
  );
}

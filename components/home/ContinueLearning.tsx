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
      <section className="reveal rounded-2xl border border-success/20 bg-success/[0.04] px-8 py-10">
        <p className="font-display text-3xl italic text-primary">Curriculum complete</p>
        <p className="mt-3 text-sm text-secondary">
          Every lesson is marked done or skipped. Revisit any chapter below.
        </p>
      </section>
    );
  }

  const isResume = lesson.state === "in_progress";

  return (
    <section className="reveal group relative overflow-hidden rounded-2xl border border-border bg-surface px-8 py-10">
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-[0.06]"
        style={{ background: "radial-gradient(circle, hsl(var(--accent)), transparent 70%)" }}
      />

      <p className="relative font-mono text-xs uppercase tracking-[0.2em] text-muted">
        {isResume ? "Continue where you left off" : hasAnyProgress ? "Up next" : "Start here"}
      </p>
      <h2 className="relative mt-4 font-display text-3xl italic leading-snug text-primary sm:text-4xl">
        {lesson.title}
      </h2>
      <p className="relative mt-3 text-sm text-secondary">
        Chapter {lesson.chapterNumber}
        <span className="mx-2 opacity-30">·</span>
        {lesson.chapterTitle}
        <span className="mx-2 opacity-30">·</span>
        <span className="font-mono text-muted">{lesson.number}</span>
      </p>

      <Link
        href={`/lessons/${lesson.slug}`}
        className="relative mt-8 inline-flex items-center gap-2.5 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-accent-fg transition-all hover:bg-accent-hover hover:shadow-[0_4px_24px_hsl(var(--accent)/0.25)]"
      >
        {isResume ? "Continue" : "Begin lesson"}
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </Link>
    </section>
  );
}

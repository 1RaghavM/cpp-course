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
      <div className="rounded-lg border border-success/20 bg-success/[0.04] px-4 py-3">
        <p className="text-sm font-medium text-primary">
          Curriculum complete
          <span className="ml-2 text-xs font-normal text-secondary">
            Every lesson is marked done or skipped.
          </span>
        </p>
      </div>
    );
  }

  const isResume = lesson.state === "in_progress";

  return (
    <div className="flex items-center gap-4 rounded-lg border border-border/60 bg-surface/50 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-primary">
          <span className="font-mono text-xs text-muted">{lesson.number}</span>
          <span className="mx-2 opacity-30">·</span>
          {lesson.title}
        </p>
        <p className="mt-0.5 truncate text-xs text-muted">
          Ch {lesson.chapterNumber} · {lesson.chapterTitle}
        </p>
      </div>
      <Link
        href={`/lessons/${lesson.slug}`}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-white px-4 py-1.5 text-xs font-semibold text-black border border-white transition-colors hover:bg-white/90"
      >
        {isResume ? "Continue" : hasAnyProgress ? "Next" : "Start"}
        <svg
          className="h-3.5 w-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </Link>
    </div>
  );
}

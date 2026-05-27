import Link from "next/link";

interface ExerciseCardProps {
  id: string;
  title: string;
  promptMd: string;
  difficulty: string;
  completed?: boolean;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  practice:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  challenge:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  hard: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

/**
 * A card that previews an exercise and links to the exercise page.
 * Shows title, difficulty badge, first few lines of the problem, and
 * a completion indicator if the user has a passing submission.
 */
export function ExerciseCard({
  id,
  title,
  promptMd,
  difficulty,
  completed = false,
}: ExerciseCardProps) {
  // Extract the first 2-3 lines of the problem for preview
  const previewText = promptMd
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .slice(0, 3)
    .join(" ")
    .slice(0, 160);

  const badgeColor =
    DIFFICULTY_COLORS[difficulty] ?? DIFFICULTY_COLORS["practice"];

  return (
    <Link
      href={`/exercises/${id}`}
      className="group block rounded-lg border border-neutral-200 p-4 transition-colors hover:border-blue-400 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:border-blue-500 dark:hover:bg-neutral-800/50"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-medium text-neutral-900 group-hover:text-blue-600 dark:text-neutral-100 dark:group-hover:text-blue-400">
              {title}
            </h3>
            <span
              className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium ${badgeColor}`}
            >
              {difficulty}
            </span>
          </div>
          <p className="mt-1.5 line-clamp-2 text-sm text-neutral-500 dark:text-neutral-400">
            {previewText}
            {promptMd.length > 160 ? "..." : ""}
          </p>
        </div>

        {completed && (
          <span
            className="mt-0.5 shrink-0 text-green-600 dark:text-green-400"
            title="Completed"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-5 w-5"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        )}
      </div>
    </Link>
  );
}

/**
 * Loading state shown while lesson content is being fetched/generated.
 * On first visit, generation can take 5-15 seconds.
 */
export default function LessonLoading() {
  return (
    <div className="pb-12">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="h-4 w-20 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
        <div className="mt-2 h-8 w-64 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
      </div>

      {/* Generation notice */}
      <div className="mb-10 rounded-lg border border-blue-200 bg-blue-50 p-6 text-center dark:border-blue-800 dark:bg-blue-950/30">
        <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-blue-300 border-t-blue-600" />
        <p className="font-medium text-blue-800 dark:text-blue-300">Generating lesson content...</p>
        <p className="mt-1 text-sm text-blue-600 dark:text-blue-400">
          This may take a few seconds on first visit.
        </p>
      </div>

      {/* Content skeleton lines */}
      <div className="space-y-3">
        <div className="h-4 w-full animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
        <div className="h-4 w-5/6 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
        <div className="h-4 w-4/6 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
        <div className="h-4 w-full animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
      </div>

      {/* Exercise cards skeleton */}
      <div className="mt-10">
        <div className="mb-4 h-6 w-24 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-700"
            >
              <div className="h-5 w-48 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
              <div className="mt-2 h-4 w-full animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

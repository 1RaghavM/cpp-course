import { Skeleton } from "@/components/ui/skeleton"

export default function CurriculumLoading() {
  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col">
      <div className="flex shrink-0 items-center justify-between border-b px-4 py-3 lg:px-6">
        <Skeleton className="h-6 w-36" />
      </div>
      <div className="min-h-0 flex-1 p-4 lg:p-6">
        <div className="space-y-4">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="rounded-lg border p-4">
              <Skeleton className="h-5 w-48" />
              <div className="mt-3 flex flex-wrap gap-2">
                {Array.from({ length: 6 }, (_, j) => (
                  <Skeleton key={j} className="h-8 w-8 rounded-full" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

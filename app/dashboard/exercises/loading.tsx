import { Skeleton } from "@/components/ui/skeleton"

export default function ExercisesLoading() {
  return (
    <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
      <Skeleton className="h-10 w-full max-w-sm rounded-lg" />
      <div className="space-y-6">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i}>
            <Skeleton className="h-6 w-48 mb-3" />
            <div className="rounded-lg border">
              <Skeleton className="h-10 w-full" />
              {Array.from({ length: 5 }, (_, j) => (
                <Skeleton key={j} className="h-12 w-full border-t" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

import { Skeleton } from "@/components/ui/skeleton"

export default function NotesLoading() {
  return (
    <div className="mx-auto max-w-[800px] px-6 py-8">
      <div className="mb-6">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="mt-2 h-4 w-48" />
      </div>
      <Skeleton className="h-10 w-full rounded-lg" />
      <div className="mt-6 space-y-4">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="rounded-lg border p-4">
            <Skeleton className="h-5 w-40" />
            <div className="mt-3 space-y-2">
              {Array.from({ length: 3 }, (_, j) => (
                <Skeleton key={j} className="h-10 w-full rounded-md" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

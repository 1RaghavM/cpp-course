import { Skeleton } from "@/components/ui/skeleton"

export default function StatsLoading() {
  return (
    <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
      <div className="rounded-xl border bg-card p-6">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="mt-4 h-[180px] w-full rounded-lg" />
      </div>
    </div>
  )
}

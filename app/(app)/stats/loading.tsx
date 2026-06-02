import { Skeleton } from "@/components/ui/skeleton";

export default function StatsLoading() {
  return (
    <div className="mx-auto w-full max-w-[800px] px-6 py-8">
      <Skeleton className="mb-6 h-7 w-16" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-[120px] rounded-xl" />
        <Skeleton className="h-[120px] rounded-xl" />
        <Skeleton className="h-[120px] rounded-xl" />
        <Skeleton className="h-[120px] rounded-xl" />

        <Skeleton className="h-[280px] rounded-xl sm:col-span-2" />
        <Skeleton className="h-[280px] rounded-xl sm:col-span-2" />

        <Skeleton className="h-[200px] rounded-xl" />
        <Skeleton className="h-[200px] rounded-xl" />
        <Skeleton className="h-[200px] rounded-xl sm:col-span-2" />

        <Skeleton className="h-[280px] rounded-xl sm:col-span-2" />
        <Skeleton className="h-[280px] rounded-xl sm:col-span-2" />
      </div>
    </div>
  );
}

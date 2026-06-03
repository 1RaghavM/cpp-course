import { Skeleton } from "@/components/ui/skeleton";

export default function NoteLoading() {
  return (
    <div className="mx-auto max-w-[800px] px-6 py-8">
      <Skeleton className="mb-4 h-5 w-64" />
      <div className="mb-4 flex items-center justify-between">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="h-[540px] w-full rounded-lg" />
    </div>
  );
}

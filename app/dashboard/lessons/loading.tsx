import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function LessonsLoading() {
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader className="gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-8 w-36" />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <Skeleton className="h-9 w-[360px]" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-[200px]" />
                <Skeleton className="h-8 w-[180px]" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-col">
              {Array.from({ length: 8 }, (_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 border-t border-border py-4"
                >
                  <Skeleton className="h-5 flex-1" />
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-1.5 w-28 rounded-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

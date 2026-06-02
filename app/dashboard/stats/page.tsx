import { requireServerSession } from "@/lib/auth/require-auth"
import { fetchStats } from "@/lib/stats/fetch-stats"
import { StatsHeatmap } from "@/components/stats/StatsHeatmap"

export const dynamic = "force-dynamic"

export default async function StatsPage() {
  const { supabase, session } = await requireServerSession()
  const stats = await fetchStats(supabase, session.user.id)

  return (
    <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
      <StatsHeatmap activityData={stats.activityData} />
    </div>
  )
}

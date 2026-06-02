import { requireServerSession } from "@/lib/auth/require-auth";
import { StatsPage } from "@/components/stats/StatsPage";
import { fetchStats } from "@/lib/stats/fetch-stats";

export const dynamic = "force-dynamic";

export default async function StatsRoute() {
  const { supabase, userId } = await requireServerSession();
  const stats = await fetchStats(supabase, userId);
  return <StatsPage stats={stats} />;
}

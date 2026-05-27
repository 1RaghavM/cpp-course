import { createServiceClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/layout/AppHeader";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServiceClient();

  const [progressResult, lessonCountResult] = await Promise.all([
    supabase.from("progress").select("state") as unknown as {
      data: { state: string }[] | null;
    },
    supabase.from("lessons").select("id", { count: "exact", head: true }),
  ]);

  const totalLessons = lessonCountResult.count ?? 0;
  const completed =
    progressResult.data?.filter((p) => p.state === "completed" || p.state === "skipped")
      .length ?? 0;
  const overallPercent =
    totalLessons > 0 ? Math.round((completed / totalLessons) * 100) : 0;

  return (
    <div className="flex h-screen flex-col bg-base overflow-hidden">
      <AppHeader progressPercent={overallPercent} />
      <main className="home-grid-bg flex-1 min-h-0 overflow-auto">{children}</main>
    </div>
  );
}

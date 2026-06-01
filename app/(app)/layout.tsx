import { createServiceClient } from "@/lib/supabase/server";
import { requireServerSession } from "@/lib/auth/require-auth";
import { AppShell } from "@/components/layout/AppShell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { supabase } = await requireServerSession();
  const serviceClient = createServiceClient();

  const [progressResult, lessonCountResult] = await Promise.all([
    supabase.from("progress").select("state") as unknown as {
      data: { state: string }[] | null;
    },
    serviceClient.from("lessons").select("id", { count: "exact", head: true }),
  ]);

  const totalLessons = lessonCountResult.count ?? 0;
  const completed =
    progressResult.data?.filter((p) => p.state === "completed" || p.state === "skipped").length ??
    0;
  const overallPercent = totalLessons > 0 ? Math.round((completed / totalLessons) * 100) : 0;

  return <AppShell progressPercent={overallPercent}>{children}</AppShell>;
}

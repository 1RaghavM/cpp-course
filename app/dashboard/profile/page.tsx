import { requireServerSession } from "@/lib/auth/require-auth";
import { ProfilePage } from "@/components/profile/ProfilePage";
import { computeWeeklyCompleted } from "@/lib/dashboard/resume";

export const dynamic = "force-dynamic";

export default async function ProfileRoute() {
  const { supabase, user } = await requireServerSession();

  const [statsResult, onboardingResult, progressResult, apiKeyResult] = await Promise.all([
    supabase.from("user_stats").select("display_name, streak_days, weekly_goal").single(),
    supabase.from("onboarding").select("background, motivation").single(),
    supabase
      .from("progress")
      .select("state, completed_at")
      .or("state.eq.completed,state.eq.skipped"),
    supabase
      .from("user_api_keys")
      .select("key_preview, is_valid")
      .eq("provider", "google")
      .single(),
  ]);

  const stats = statsResult.data as {
    display_name: string | null;
    streak_days: number;
    weekly_goal: number | null;
  } | null;

  const onboarding = onboardingResult.data as {
    background: string;
    motivation: string;
  } | null;

  const progressRows = (progressResult.data ?? []) as {
    state: string;
    completed_at: string | null;
  }[];

  const totalCompleted = progressRows.length;

  const today = new Date().toISOString().slice(0, 10);
  const weeklyRecords = progressRows
    .filter((r) => r.completed_at)
    .map((r) => ({ completedAt: r.completed_at! }));
  const lessonsCompletedThisWeek = computeWeeklyCompleted(weeklyRecords, today);

  const apiKeyStatus = apiKeyResult.data
    ? {
        hasKey: true,
        preview: (apiKeyResult.data as { key_preview: string; is_valid: boolean }).key_preview,
        isValid: (apiKeyResult.data as { key_preview: string; is_valid: boolean }).is_valid,
      }
    : { hasKey: false, preview: "", isValid: false };

  const email = user.email ?? "";
  const userInitial = (email[0] ?? "?").toUpperCase();

  return (
    <ProfilePage
      email={email}
      userInitial={userInitial}
      displayName={stats?.display_name ?? null}
      streakDays={stats?.streak_days ?? 0}
      weeklyGoal={stats?.weekly_goal ?? null}
      totalCompleted={totalCompleted}
      totalLessons={345}
      lessonsCompletedThisWeek={lessonsCompletedThisWeek}
      background={onboarding?.background ?? null}
      motivation={onboarding?.motivation ?? null}
      apiKeyStatus={apiKeyStatus}
    />
  );
}

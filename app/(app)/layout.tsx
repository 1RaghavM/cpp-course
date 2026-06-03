import { Suspense } from "react";
import { requireServerSession } from "@/lib/auth/require-auth";
import { AppShell } from "@/components/layout/AppShell";
import { Background } from "@/components/Background";
import { AsyncTopBar } from "@/app/(app)/_components/AsyncTopBar";
import { TopBarSkeleton } from "@/app/(app)/_components/TopBarSkeleton";
import { StatsigProviderWrapper } from "@/lib/statsig/provider";
import { buildStatsigUser } from "@/lib/statsig/user";

/**
 * (app) layout — only awaits the fast auth check (cookie verification).
 *
 * Heavy data fetching (lessons, progress, stats) is deferred to
 * AsyncTopBar which runs inside a Suspense boundary. This means the
 * page content (and its loading.tsx skeleton) renders immediately
 * while the TopBar streams in.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireServerSession();

  const userEmail = user.email ?? "";
  const userInitial = (userEmail[0] ?? "?").toUpperCase();

  const createdAt = user.created_at ? new Date(user.created_at) : new Date();
  const accountAgeDays = Math.floor(
    (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24),
  );

  const statsigUser = buildStatsigUser({
    userID: user.id,
    accountAgeDays,
    platform: "web",
    appVersion: "1.0.0",
    lessonsCompleted: 0,
    streakDays: 0,
    hasCompletedOnboarding: false,
  });

  const topBar = (
    <Suspense fallback={<TopBarSkeleton userInitial={userInitial} />}>
      <AsyncTopBar userEmail={userEmail} userInitial={userInitial} />
    </Suspense>
  );

  return (
    <StatsigProviderWrapper user={statsigUser}>
      <Background />
      <AppShell topBar={topBar}>{children}</AppShell>
    </StatsigProviderWrapper>
  );
}

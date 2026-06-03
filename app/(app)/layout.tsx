import { Suspense } from "react";
import { requireServerSession } from "@/lib/auth/require-auth";
import { AppShell } from "@/components/layout/AppShell";
import { Background } from "@/components/Background";
import { AsyncTopBar } from "@/app/(app)/_components/AsyncTopBar";
import { TopBarSkeleton } from "@/app/(app)/_components/TopBarSkeleton";

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

  const topBar = (
    <Suspense fallback={<TopBarSkeleton userInitial={userInitial} />}>
      <AsyncTopBar userEmail={userEmail} userInitial={userInitial} />
    </Suspense>
  );

  return (
    <>
      <Background />
      <AppShell topBar={topBar}>{children}</AppShell>
    </>
  );
}

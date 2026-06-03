"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

interface AppShellProps {
  /** Pre-rendered TopBar element (wrapped in Suspense by the layout) */
  topBar: React.ReactNode;
  children: React.ReactNode;
}

export function AppShell({ topBar, children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const hideHeader =
    pathname.startsWith("/lessons/") ||
    pathname.startsWith("/playground") ||
    pathname.startsWith("/exercises/");

  useEffect(() => {
    async function syncOnboarding() {
      let raw: string | null = null;
      try {
        raw = localStorage.getItem("cpproad_onboarding");
      } catch {
        return;
      }
      if (!raw) return;

      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(raw);
      } catch {
        return;
      }

      if (!parsed.background || !parsed.motivation || !parsed.startModule) return;

      try {
        const res = await fetch("/api/onboarding", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            background: parsed.background,
            motivation: parsed.motivation,
            startModule: parsed.startModule,
            fastTrack: parsed.fastTrack ?? false,
            placementTaken: parsed.placementTaken ?? false,
            placementScore: parsed.placementScore ?? null,
            weeklyGoal: parsed.weeklyGoal ?? null,
            displayName: parsed.displayName ?? null,
          }),
        });

        if (res.ok) {
          localStorage.removeItem("cpproad_onboarding");
          router.push("/onboarding?step=payoff");
        }
      } catch {
        // Network error — will retry on next app load
      }
    }

    syncOnboarding();
  }, [router]);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {hideHeader ? null : topBar}
      <main
        className={
          hideHeader
            ? "flex min-h-0 flex-1 flex-col overflow-hidden"
            : "min-h-0 flex-1 overflow-auto"
        }
      >
        {children}
      </main>
    </div>
  );
}

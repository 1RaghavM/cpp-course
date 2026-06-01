"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { AppHeader } from "@/components/layout/AppHeader";

type AppShellProps = {
  progressPercent: number;
  children: React.ReactNode;
};

export function AppShell({ progressPercent, children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const hideHeader = pathname.startsWith("/lessons/");

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
      {hideHeader ? null : <AppHeader progressPercent={progressPercent} />}
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

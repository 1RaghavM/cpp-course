"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { syncOnboardingFromStorage } from "@/lib/onboarding/sync";

interface AppShellProps {
  /** Pre-rendered TopBar element (wrapped in Suspense by the layout) */
  topBar: React.ReactNode;
  children: React.ReactNode;
}

export function AppShell({ topBar, children }: AppShellProps) {
  const pathname = usePathname();
  const hideHeader =
    pathname.startsWith("/lessons/") ||
    pathname.startsWith("/playground") ||
    pathname.startsWith("/exercises/") ||
    pathname.startsWith("/capstones/");

  useEffect(() => {
    const ac = new AbortController();

    void (async () => {
      await syncOnboardingFromStorage(ac.signal);
    })();

    return () => ac.abort();
  }, []);

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

"use client";

import { usePathname } from "next/navigation";
import { AppHeader } from "@/components/layout/AppHeader";

type AppShellProps = {
  progressPercent: number;
  children: React.ReactNode;
};

export function AppShell({ progressPercent, children }: AppShellProps) {
  const pathname = usePathname();
  const hideHeader = pathname.startsWith("/lessons/");

  return (
    <div className="flex h-screen flex-col bg-base overflow-hidden">
      {hideHeader ? null : <AppHeader progressPercent={progressPercent} />}
      <main
        className={
          hideHeader
            ? "flex min-h-0 flex-1 flex-col overflow-hidden"
            : "home-grid-bg min-h-0 flex-1 overflow-auto"
        }
      >
        {children}
      </main>
    </div>
  );
}

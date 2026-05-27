import Link from "next/link";
import { LogoutButton } from "@/components/auth/LogoutButton";

export function AppHeader({ progressPercent }: { progressPercent: number }) {
  return (
    <header className="border-b border-border/50">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-6 px-6">
        <Link href="/" className="flex items-center gap-1">
          <span className="font-display text-lg italic text-accent">cpp</span>
          <span className="font-display text-lg text-primary">road</span>
        </Link>

        <div className="ml-auto flex items-center gap-4">
          <div className="hidden items-center gap-2.5 sm:flex">
            <div className="h-1 w-24 overflow-hidden rounded-full bg-elevated">
              <div
                className="h-full rounded-full bg-accent/60 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="font-mono text-[11px] tabular-nums text-muted">
              {progressPercent}%
            </span>
          </div>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}

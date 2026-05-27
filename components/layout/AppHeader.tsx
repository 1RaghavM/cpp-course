import Link from "next/link";
import { LogoutButton } from "@/components/auth/LogoutButton";

export function AppHeader({ progressPercent }: { progressPercent: number }) {
  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-base/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link href="/" className="group flex shrink-0 items-center gap-2.5">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-accent font-mono text-xs font-bold text-base shadow-[0_0_20px_hsl(var(--accent)/0.35)] transition-shadow group-hover:shadow-[0_0_28px_hsl(var(--accent)/0.5)]">
            C++
          </span>
          <span className="font-display text-lg font-semibold tracking-tight text-primary">
            cpproad
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-3">
          <LogoutButton />
          <div className="hidden items-center gap-2 sm:flex">
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-elevated">
              <div
                className="h-full rounded-full bg-accent transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="font-mono text-xs tabular-nums text-muted">{progressPercent}%</span>
          </div>
        </div>
      </div>
    </header>
  );
}

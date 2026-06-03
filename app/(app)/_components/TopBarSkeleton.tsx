import Image from "next/image";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Static skeleton that mirrors the TopBar layout while navigation data loads.
 * Shows the logo, placeholder links, and user avatar immediately.
 */
export function TopBarSkeleton({
  userInitial,
}: {
  userInitial: string;
}) {
  return (
    <header className="border-b border-border/50">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-6 px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image
            src="/fulllogo-Photoroom.png"
            alt="cpproad"
            width={160}
            height={40}
            priority
            className="h-10 w-auto"
          />
        </Link>

        <div className="ml-auto flex items-center gap-3">
          {/* Streak placeholder */}
          <Skeleton className="h-7 w-12 rounded-full" />
          {/* Tutor link placeholder */}
          <Skeleton className="h-6 w-10 rounded-md" />
          {/* Notes link placeholder */}
          <Skeleton className="h-6 w-10 rounded-md" />
          {/* User avatar — rendered immediately since we have the initial */}
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-elevated text-xs font-semibold text-muted-foreground">
            {userInitial}
          </div>
        </div>
      </div>
    </header>
  );
}

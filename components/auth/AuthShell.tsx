import Link from "next/link";
import type { ReactNode } from "react";

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-base px-4 py-12">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--border-subtle) / 0.35) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border-subtle) / 0.35) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-surface/95 p-8 shadow-[0_24px_80px_hsl(0_0%_0%/0.45)] backdrop-blur-sm">
        <div className="mb-6 flex flex-col items-center gap-2">
          <Link href="/login" className="group flex items-center gap-2.5">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-accent font-mono text-sm font-bold text-base shadow-[0_0_24px_hsl(var(--accent)/0.4)] transition-shadow group-hover:shadow-[0_0_32px_hsl(var(--accent)/0.55)]">
              C++
            </span>
          </Link>
          <h1 className="font-display text-2xl font-bold tracking-tight text-primary">{title}</h1>
          <p className="text-center text-sm text-secondary">{subtitle}</p>
        </div>

        {children}

        {footer ? <div className="mt-6 border-t border-border-subtle pt-6 text-center">{footer}</div> : null}
      </div>
    </div>
  );
}

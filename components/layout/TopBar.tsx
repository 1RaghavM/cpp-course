"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";
import { trackDashboardEvent } from "@/lib/dashboard/analytics";

interface TopBarProps {
  streakDays: number;
  resumeLessonSlug: string | null;
  userEmail: string;
  userInitial: string;
}

export function TopBar({ streakDays, resumeLessonSlug, userEmail, userInitial }: TopBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  async function handleSignOut() {
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <header className="border-b border-border/50">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-6 px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <img src="/fulllogo-Photoroom.png" alt="cpproad" className="h-10 w-auto" />
        </Link>

        <div className="ml-auto flex items-center gap-3">
          {streakDays > 0 && (
            <div
              className="flex items-center gap-1.5 rounded-full bg-elevated px-2.5 py-1"
              aria-label={`${streakDays} day streak`}
            >
              <svg className="h-3.5 w-3.5 text-warning" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 23c-3.866 0-7-3.134-7-7 0-2.692 1.475-5.598 3.434-8.12a.75.75 0 011.232.028C11.01 9.817 12 11.7 12 11.7s2.25-3.6 3.75-5.4a.75.75 0 011.248.06C18.664 9.1 19 12.05 19 16c0 3.866-3.134 7-7 7z" />
              </svg>
              <span className="font-mono text-xs tabular-nums text-secondary">{streakDays}</span>
            </div>
          )}

          {resumeLessonSlug && (
            <Link
              href={`/lessons/${resumeLessonSlug}?tutor=open`}
              onClick={() => trackDashboardEvent("tutor_opened", { from: "dashboard" })}
              className="rounded-md px-2.5 py-1.5 text-xs font-medium text-secondary transition-colors hover:bg-hover hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              aria-label="Open AI tutor"
              title="AI tutor — get hints when you're stuck"
            >
              Tutor
            </Link>
          )}

          <Link
            href="/notes"
            className="rounded-md px-2.5 py-1.5 text-xs font-medium text-secondary transition-colors hover:bg-hover hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label="View notes"
          >
            Notes
          </Link>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-elevated text-xs font-semibold text-secondary transition-colors hover:bg-hover hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              aria-label="Account menu"
            >
              {userInitial}
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 rounded-lg border border-border bg-surface py-2 shadow-lg">
                <p className="truncate px-3 py-1.5 text-xs text-muted">{userEmail}</p>
                <hr className="my-1 border-border" />
                <Link
                  href="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="block w-full px-3 py-1.5 text-left text-xs text-secondary transition-colors hover:bg-hover hover:text-primary"
                >
                  Profile
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full px-3 py-1.5 text-left text-xs text-secondary transition-colors hover:bg-hover hover:text-primary"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

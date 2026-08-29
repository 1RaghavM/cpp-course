"use client";

import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { setTheme } = useTheme();

  return (
    <button
      type="button"
      className={cn("theme-toggle", className)}
      aria-label="Toggle color mode"
      title="Toggle color mode"
      onClick={() => {
        const dark = document.documentElement.classList.contains("dark");
        setTheme(dark ? "light" : "dark");
      }}
    >
      <svg className="theme-toggle-sun" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="4.2" />
        {Array.from({ length: 8 }, (_, i) => (
          <line
            key={i}
            x1="12"
            y1="2.5"
            x2="12"
            y2="5.2"
            transform={`rotate(${i * 45} 12 12)`}
          />
        ))}
      </svg>
      <svg className="theme-toggle-moon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 3a6.4 6.4 0 0 0 9 9 9 9 0 1 1-9-9Z" />
      </svg>
    </button>
  );
}

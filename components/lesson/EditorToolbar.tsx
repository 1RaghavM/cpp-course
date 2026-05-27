"use client";

import type { CppStandard } from "@/lib/judge0/client";

const STD_OPTIONS: { label: string; value: CppStandard }[] = [
  { label: "C++17", value: "c++17" },
  { label: "C++20", value: "c++20" },
  { label: "C++23", value: "c++23" },
];

interface EditorToolbarProps {
  languageStd: CppStandard;
  onLanguageChange: (std: CppStandard) => void;
  disabled?: boolean;
  hasLastPassingCode?: boolean;
  onRestorePassing?: () => void;
  onReset: () => void;
}

export function EditorToolbar({
  languageStd,
  onLanguageChange,
  disabled = false,
  hasLastPassingCode = false,
  onRestorePassing,
  onReset,
}: EditorToolbarProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-elevated border-b border-border">
      {/* Language selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted">Language:</span>
        <select
          value={languageStd}
          onChange={(e) => onLanguageChange(e.target.value as CppStandard)}
          disabled={disabled}
          className="rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-primary transition hover:bg-hover focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {STD_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        {hasLastPassingCode && onRestorePassing && (
          <button
            type="button"
            onClick={onRestorePassing}
            disabled={disabled}
            className="inline-flex items-center gap-1.5 text-xs text-secondary hover:text-primary transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <HistoryIcon className="h-3.5 w-3.5" />
            Restore passing
          </button>
        )}

        <button
          type="button"
          onClick={onReset}
          disabled={disabled}
          className="inline-flex items-center gap-1.5 text-xs text-secondary hover:text-primary transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ResetIcon className="h-3.5 w-3.5" />
          Reset
        </button>
      </div>
    </div>
  );
}

function HistoryIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
    >
      <path
        fillRule="evenodd"
        d="M7.793 2.232a.75.75 0 01-.025 1.06L3.622 7.25h10.003a5.375 5.375 0 010 10.75H10.75a.75.75 0 010-1.5h2.875a3.875 3.875 0 000-7.75H3.622l4.146 3.957a.75.75 0 01-1.036 1.085l-5.5-5.25a.75.75 0 010-1.085l5.5-5.25a.75.75 0 011.06.025z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ResetIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
    >
      <path
        fillRule="evenodd"
        d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm-1.763-7.279a.75.75 0 00-1.5 0v2.43l-.31-.31A7 7 0 00.027 9.403a.75.75 0 101.449.39 5.5 5.5 0 019.201-2.466l.312.311H8.557a.75.75 0 000 1.5h4.243a.75.75 0 00.75-.75V4.145z"
        clipRule="evenodd"
      />
    </svg>
  );
}

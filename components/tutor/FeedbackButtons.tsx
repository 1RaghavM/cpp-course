"use client";

import { useState } from "react";

interface Props {
  messageId: string;
  initialFeedback: string | null;
}

export default function FeedbackButtons({ messageId, initialFeedback }: Props) {
  const [feedback, setFeedback] = useState<string | null>(initialFeedback);

  const send = async (value: "up" | "down") => {
    if (feedback === value) return;
    setFeedback(value);
    await fetch("/api/chat/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId, value }),
    });
  };

  return (
    <div className="flex items-center gap-1 mt-1">
      <button
        onClick={() => send("up")}
        className={`p-1 rounded text-xs transition-colors ${
          feedback === "up"
            ? "text-[var(--color-accent)]"
            : "text-[var(--color-fg-subtle)] hover:text-[var(--color-fg-muted)]"
        }`}
        aria-label="Helpful"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M7 10v12M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
        </svg>
      </button>
      <button
        onClick={() => send("down")}
        className={`p-1 rounded text-xs transition-colors ${
          feedback === "down"
            ? "text-[var(--color-accent)]"
            : "text-[var(--color-fg-subtle)] hover:text-[var(--color-fg-muted)]"
        }`}
        aria-label="Not helpful"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M17 14V2M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z" />
        </svg>
      </button>
    </div>
  );
}

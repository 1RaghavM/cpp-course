"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "cpproad_coachmark_shown";

export function TutorCoachmark() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
      setVisible(true);
      localStorage.setItem(STORAGE_KEY, "1");

      const timer = setTimeout(() => setVisible(false), 8000);
      return () => clearTimeout(timer);
    } catch {
      // localStorage unavailable
    }
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "absolute",
        bottom: "calc(100% + 8px)",
        right: 0,
        background: "var(--color-surface-2, #161b22)",
        border: "1px solid var(--color-border-strong, #30363d)",
        borderRadius: "8px",
        padding: "10px 14px",
        fontSize: "0.8125rem",
        color: "var(--color-fg, #ededed)",
        whiteSpace: "nowrap",
        zIndex: 10,
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
      }}
      role="status"
    >
      Stuck? Ask me &mdash; I can see your code.
      <button
        onClick={() => setVisible(false)}
        style={{
          background: "none",
          border: "none",
          color: "var(--color-fg-muted, #8b949e)",
          marginLeft: 8,
          cursor: "pointer",
          fontSize: "0.75rem",
        }}
        aria-label="Dismiss"
      >
        &times;
      </button>
    </div>
  );
}

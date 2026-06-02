"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

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
      className="absolute bottom-[calc(100%+8px)] right-0 z-10 rounded-md bg-popover border border-border px-3.5 py-2.5 text-sm text-popover-foreground shadow-md whitespace-nowrap"
      role="status"
    >
      Stuck? Ask me &mdash; I can see your code.
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={() => setVisible(false)}
        className="ml-2 text-muted-foreground"
        aria-label="Dismiss"
      >
        <X className="size-3" />
      </Button>
    </div>
  );
}

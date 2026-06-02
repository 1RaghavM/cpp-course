"use client";

import { Check, Loader2, AlertCircle } from "lucide-react";

interface SaveStatusProps {
  status: "idle" | "saving" | "saved" | "error";
}

export function SaveStatus({ status }: SaveStatusProps) {
  if (status === "idle") return null;

  return (
    <span className="flex items-center gap-1 text-xs text-muted">
      {status === "saving" && (
        <>
          <Loader2 className="h-3 w-3 animate-spin" />
          Saving…
        </>
      )}
      {status === "saved" && (
        <>
          <Check className="h-3 w-3 text-success" />
          Saved
        </>
      )}
      {status === "error" && (
        <>
          <AlertCircle className="h-3 w-3 text-error" />
          Error
        </>
      )}
    </span>
  );
}

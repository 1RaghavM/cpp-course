"use client";

import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

export type SuggestionsProps = ComponentProps<"div">;

export const Suggestions = ({ className, ...props }: SuggestionsProps) => (
  <div
    className={cn("flex flex-wrap items-center justify-center gap-2", className)}
    {...props}
  />
);

export type SuggestionProps = Omit<ComponentProps<"button">, "onClick"> & {
  suggestion: string;
  onClick: (suggestion: string) => void;
};

export const Suggestion = ({
  suggestion,
  onClick,
  className,
  ...props
}: SuggestionProps) => (
  <button
    type="button"
    onClick={() => onClick(suggestion)}
    className={cn(
      "rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
      className,
    )}
    {...props}
  >
    {suggestion}
  </button>
);

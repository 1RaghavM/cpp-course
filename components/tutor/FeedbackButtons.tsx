"use client";

import { useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

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
    <ToggleGroup className="mt-1 gap-0.5">
      <ToggleGroupItem
        value="up"
        pressed={feedback === "up"}
        size="sm"
        aria-label="Helpful"
        onClick={() => send("up")}
        className={feedback === "up" ? "text-accent" : "text-muted hover:text-secondary"}
      >
        <ThumbsUp className="size-3.5" />
      </ToggleGroupItem>
      <ToggleGroupItem
        value="down"
        pressed={feedback === "down"}
        size="sm"
        aria-label="Not helpful"
        onClick={() => send("down")}
        className={feedback === "down" ? "text-accent" : "text-muted hover:text-secondary"}
      >
        <ThumbsDown className="size-3.5" />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}

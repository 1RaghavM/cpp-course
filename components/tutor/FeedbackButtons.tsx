"use client";

import { useState, useCallback } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { MessageActions, MessageAction } from "@/components/ai-elements/message";

interface Props {
  messageId: string;
  initialFeedback: string | null;
}

export default function FeedbackButtons({ messageId, initialFeedback }: Props) {
  const [feedback, setFeedback] = useState<string | null>(initialFeedback);

  const send = useCallback(
    async (value: "up" | "down") => {
      if (feedback === value) return;
      setFeedback(value);
      await fetch("/api/chat/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, value }),
      });
    },
    [feedback, messageId],
  );

  return (
    <MessageActions>
      <MessageAction
        label="Helpful"
        tooltip="Helpful"
        onClick={() => send("up")}
        className={feedback === "up" ? "text-accent" : "text-muted-foreground"}
      >
        <ThumbsUp className="size-3.5" fill={feedback === "up" ? "currentColor" : "none"} />
      </MessageAction>
      <MessageAction
        label="Not helpful"
        tooltip="Not helpful"
        onClick={() => send("down")}
        className={feedback === "down" ? "text-accent" : "text-muted-foreground"}
      >
        <ThumbsDown
          className="size-3.5"
          fill={feedback === "down" ? "currentColor" : "none"}
        />
      </MessageAction>
    </MessageActions>
  );
}

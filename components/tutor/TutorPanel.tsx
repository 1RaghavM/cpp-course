"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useCallback, useMemo, useState } from "react";
import { useTutorStore } from "@/lib/store/tutor-store";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, AlertTriangle } from "lucide-react";
import MessageList from "./MessageList";
import Composer from "./Composer";
import QuotaIndicator from "./QuotaIndicator";
import ExplainErrorButton from "./ExplainErrorButton";
import TierBadge from "./TierBadge";
import { TutorCoachmark } from "./TutorCoachmark";

export default function TutorPanel() {
  const { lessonId, context, code, lastSubmissionId, lastSubmissionStatus } = useTutorStore();
  const isPlayground = context === "playground";
  const [currentTier, setCurrentTier] = useState(1);
  const [quotaExhausted, setQuotaExhausted] = useState(false);
  const [input, setInput] = useState("");

  const bodyRef = useMemo(
    () =>
      isPlayground
        ? { context: "playground" as const, code }
        : { lessonId, code, lastSubmissionToken: lastSubmissionId },
    [isPlayground, lessonId, code, lastSubmissionId],
  );

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: bodyRef,
      }),
    [bodyRef],
  );

  const { messages, sendMessage, stop, setMessages, status, error } = useChat({
    transport,
    onError(err) {
      try {
        const parsed = JSON.parse(err.message) as { error?: { code?: string } };
        if (parsed?.error?.code === "RATE_LIMITED" || parsed?.error?.code === "BUDGET_EXCEEDED") {
          setQuotaExhausted(true);
        }
      } catch {
        // not JSON, ignore
      }
    },
  });

  const isStreaming = status === "streaming";
  const userTurnCount = messages.filter((m) => m.role === "user").length;
  const displayTier = Math.min(
    4,
    Math.max(1, userTurnCount >= 7 ? 4 : userTurnCount >= 5 ? 3 : userTurnCount >= 3 ? 2 : 1),
  );

  const handleSend = useCallback(() => {
    if (!input.trim() || isStreaming) return;
    setCurrentTier(displayTier);
    void sendMessage({ text: input });
    setInput("");
  }, [input, isStreaming, sendMessage, displayTier]);

  const handleExplainError = useCallback(() => {
    void sendMessage({
      text: "Can you explain the error I got from my last code run? What went wrong and how should I fix it?",
    });
  }, [sendMessage]);

  const handleReset = useCallback(async () => {
    const msg = isPlayground
      ? "Start a new playground conversation? The current one will be archived."
      : "Start a new conversation for this lesson? The current conversation will be archived.";
    if (!window.confirm(msg)) return;
    const res = await fetch("/api/chat/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isPlayground ? { context: "playground" } : { lessonId }),
    });
    if (!res.ok) return;
    setMessages([]);
    setCurrentTier(1);
    setQuotaExhausted(false);
  }, [isPlayground, lessonId, setMessages]);

  const showExplainError =
    lastSubmissionStatus !== null &&
    lastSubmissionStatus !== "accepted" &&
    !isStreaming &&
    messages.length > 0;

  return (
    <div className="flex flex-col h-full bg-surface" style={{ position: "relative" }}>
      <TutorCoachmark />
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-primary">Tutor</span>
          {!isPlayground && <TierBadge tier={currentTier} />}
          <QuotaIndicator refreshKey={messages.length} />
        </div>
        <Button variant="outline" size="xs" onClick={() => void handleReset()}>
          New chat
        </Button>
      </div>

      {/* Messages */}
      <MessageList messages={messages} isStreaming={isStreaming} />

      {/* Error display */}
      {error && !quotaExhausted && (
        <Alert className="mx-4 mb-2 bg-error/10 border-error/20 text-error">
          <AlertCircle className="size-4" />
          <AlertDescription>
            The tutor is briefly unavailable. Your editor and lessons still work.
          </AlertDescription>
        </Alert>
      )}

      {quotaExhausted && (
        <Alert className="mx-4 mb-2 bg-warning/10 border-warning/20 text-warning">
          <AlertTriangle className="size-4" />
          <AlertDescription>
            You&apos;ve reached today&apos;s message limit. Come back tomorrow!
          </AlertDescription>
        </Alert>
      )}

      {/* Explain error shortcut */}
      <ExplainErrorButton visible={showExplainError} onExplain={handleExplainError} />

      {/* Input */}
      <Composer
        input={input}
        onInputChange={setInput}
        onSubmit={handleSend}
        onStop={stop}
        isStreaming={isStreaming}
        disabled={quotaExhausted}
      />
    </div>
  );
}

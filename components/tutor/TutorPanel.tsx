"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useCallback, useMemo, useState } from "react";
import { useTutorStore } from "@/lib/store/tutor-store";
import MessageList from "./MessageList";
import Composer from "./Composer";
import QuotaIndicator from "./QuotaIndicator";
import ExplainErrorButton from "./ExplainErrorButton";
import TierBadge from "./TierBadge";

export default function TutorPanel() {
  const { lessonId, code, lastSubmissionId, lastSubmissionStatus } = useTutorStore();
  const [currentTier, setCurrentTier] = useState(1);
  const [quotaExhausted, setQuotaExhausted] = useState(false);
  const [input, setInput] = useState("");

  const bodyRef = useMemo(
    () => ({ lessonId, code, lastSubmissionToken: lastSubmissionId }),
    [lessonId, code, lastSubmissionId],
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
    if (
      !window.confirm(
        "Start a new conversation for this lesson? The current conversation will be archived.",
      )
    )
      return;
    const res = await fetch("/api/chat/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId }),
    });
    if (!res.ok) return;
    setMessages([]);
    setCurrentTier(1);
    setQuotaExhausted(false);
  }, [lessonId, setMessages]);

  const showExplainError =
    lastSubmissionStatus !== null &&
    lastSubmissionStatus !== "accepted" &&
    !isStreaming &&
    messages.length > 0;

  return (
    <div className="flex flex-col h-full bg-[var(--color-surface)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[var(--color-fg)]">Tutor</span>
          <TierBadge tier={currentTier} />
          <QuotaIndicator refreshKey={messages.length} />
        </div>
        <button
          onClick={() => void handleReset()}
          className="rounded-md border border-[var(--color-border-strong)] bg-transparent px-2 py-1 text-xs font-medium text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--color-surface-2)] transition-colors"
        >
          New chat
        </button>
      </div>

      {/* Messages */}
      <MessageList messages={messages} isStreaming={isStreaming} />

      {/* Error display */}
      {error && !quotaExhausted && (
        <div className="mx-4 mb-2 rounded-md bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-400">
          The tutor is briefly unavailable. Your editor and lessons still work.
        </div>
      )}

      {quotaExhausted && (
        <div className="mx-4 mb-2 rounded-md bg-yellow-500/10 border border-yellow-500/20 px-3 py-2 text-xs text-yellow-400">
          You&apos;ve reached today&apos;s message limit. Come back tomorrow!
        </div>
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

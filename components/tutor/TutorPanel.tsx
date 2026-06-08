"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { PromptInputMessage } from "@/components/ai-elements/prompt-input";
import { useTutorStore } from "@/lib/store/tutor-store";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, AlertTriangle } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import ApiKeySetup from "./ApiKeySetup";
import ApiKeyInvalid from "./ApiKeyInvalid";
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
  const [keyStatus, setKeyStatus] = useState<{
    hasKey: boolean;
    isValid: boolean;
    preview: string;
  } | null>(null);
  const [keyLoading, setKeyLoading] = useState(true);

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

  useEffect(() => {
    fetch("/api/profile/api-key")
      .then((r) => r.json())
      .then((data) => {
        setKeyStatus({
          hasKey: data.hasKey ?? false,
          isValid: data.isValid ?? false,
          preview: data.preview ?? "",
        });
      })
      .catch(() => {
        setKeyStatus({ hasKey: false, isValid: false, preview: "" });
      })
      .finally(() => setKeyLoading(false));
  }, []);

  const { messages, sendMessage, stop, setMessages, status, error } = useChat({
    transport,
    onError(err) {
      try {
        const parsed = JSON.parse(err.message) as { error?: { code?: string; message?: string } };
        if (parsed?.error?.code === "RATE_LIMITED" || parsed?.error?.code === "BUDGET_EXCEEDED") {
          setQuotaExhausted(true);
        }
        if (parsed?.error?.code === "API_KEY_REQUIRED") {
          setKeyStatus({ hasKey: false, isValid: false, preview: "" });
        }
        if (parsed?.error?.code === "API_KEY_INVALID") {
          setKeyStatus((prev) => ({
            hasKey: true,
            isValid: false,
            preview: prev?.preview ?? "",
          }));
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

  const handleSend = useCallback(
    (message: PromptInputMessage) => {
      if (!message.text.trim() || isStreaming) return;
      setCurrentTier(displayTier);
      void sendMessage({ text: message.text });
    },
    [isStreaming, sendMessage, displayTier],
  );

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

  const handleKeySaved = useCallback(() => {
    setKeyStatus({ hasKey: true, isValid: true, preview: "" });
    fetch("/api/profile/api-key")
      .then((r) => r.json())
      .then((data) => {
        setKeyStatus({
          hasKey: data.hasKey ?? false,
          isValid: data.isValid ?? false,
          preview: data.preview ?? "",
        });
      })
      .catch(() => {});
  }, []);

  const handleKeyRemoved = useCallback(() => {
    setKeyStatus({ hasKey: false, isValid: false, preview: "" });
  }, []);

  const LESSON_SUGGESTIONS = [
    "Summarize this lesson for me",
    "What are the key concepts here?",
    "Give me a practice problem",
  ];

  const PLAYGROUND_SUGGESTIONS = [
    "Explain what my code does",
    "How can I improve this code?",
    "Help me fix a bug",
  ];

  const suggestions = isPlayground ? PLAYGROUND_SUGGESTIONS : LESSON_SUGGESTIONS;

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      if (isStreaming) return;
      void sendMessage({ text: suggestion });
    },
    [isStreaming, sendMessage],
  );

  const showExplainError =
    lastSubmissionStatus !== null &&
    lastSubmissionStatus !== "accepted" &&
    !isStreaming &&
    messages.length > 0;

  return (
    <div className="flex flex-col h-full bg-surface" style={{ position: "relative" }}>
      <TutorCoachmark />

      {keyLoading && (
        <div className="flex flex-1 items-center justify-center">
          <Spinner className="size-6" />
        </div>
      )}

      {!keyLoading && keyStatus && !keyStatus.hasKey && (
        <ApiKeySetup onKeySaved={handleKeySaved} />
      )}

      {!keyLoading && keyStatus && keyStatus.hasKey && !keyStatus.isValid && (
        <ApiKeyInvalid
          preview={keyStatus.preview}
          onKeyUpdated={handleKeySaved}
          onKeyRemoved={handleKeyRemoved}
        />
      )}

      {!keyLoading && keyStatus?.hasKey && keyStatus.isValid && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">Tutor</span>
              {!isPlayground && <TierBadge tier={currentTier} />}
              <QuotaIndicator
                refreshKey={messages.length}
                hasByoakKey={keyStatus?.hasKey && keyStatus.isValid}
              />
            </div>
            <Button variant="outline" size="xs" onClick={() => void handleReset()}>
              New chat
            </Button>
          </div>

          {/* Messages */}
          <MessageList
            messages={messages}
            status={status}
            suggestions={suggestions}
            onSuggestionClick={handleSuggestionClick}
          />

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
            onSubmit={handleSend}
            onStop={stop}
            status={status}
            disabled={quotaExhausted}
          />
        </>
      )}
    </div>
  );
}

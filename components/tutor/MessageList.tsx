"use client";

import type { UIMessage, TextUIPart, ChatStatus } from "ai";
import { MessageSquareIcon } from "lucide-react";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import { Suggestions, Suggestion } from "@/components/ai-elements/suggestion";
import { Shimmer } from "@/components/ai-elements/shimmer";
import FeedbackButtons from "./FeedbackButtons";

interface Props {
  messages: UIMessage[];
  status: ChatStatus;
  suggestions?: string[];
  onSuggestionClick?: (suggestion: string) => void;
}

export default function MessageList({
  messages,
  status,
  suggestions,
  onSuggestionClick,
}: Props) {
  const isStreaming = status === "streaming";
  const isAwaitingResponse =
    status === "submitted" ||
    (isStreaming && messages.at(-1)?.role === "user");
  if (messages.length === 0) {
    return (
      <Conversation className="flex-1">
        <ConversationContent className="h-full">
          <ConversationEmptyState>
            <div className="text-muted-foreground">
              <MessageSquareIcon className="size-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-medium text-sm">Ask a question</h3>
              <p className="text-muted-foreground text-sm">
                Ask about this lesson and get guided hints.
              </p>
            </div>
            {suggestions && suggestions.length > 0 && onSuggestionClick && (
              <Suggestions className="mt-3">
                {suggestions.map((s) => (
                  <Suggestion key={s} suggestion={s} onClick={onSuggestionClick} />
                ))}
              </Suggestions>
            )}
          </ConversationEmptyState>
        </ConversationContent>
      </Conversation>
    );
  }

  return (
    <Conversation className="flex-1">
      <ConversationContent>
        {messages.map((msg, i) => {
          const textContent = msg.parts
            .filter((p): p is TextUIPart => p.type === "text")
            .map((p) => p.text)
            .join("");

          const isLastAssistant =
            msg.role === "assistant" && i === messages.length - 1;

          return (
            <Message key={msg.id} from={msg.role}>
              <MessageContent>
                {msg.role === "assistant" ? (
                  textContent ? (
                    <MessageResponse isAnimating={isLastAssistant && isStreaming}>
                      {textContent}
                    </MessageResponse>
                  ) : isStreaming ? (
                    <Shimmer className="text-sm" duration={1.5}>Thinking...</Shimmer>
                  ) : null
                ) : (
                  <span className="whitespace-pre-wrap">{textContent}</span>
                )}
              </MessageContent>
              {msg.role === "assistant" && textContent && !isStreaming && (
                <FeedbackButtons messageId={msg.id} initialFeedback={null} />
              )}
            </Message>
          );
        })}
        {isAwaitingResponse && (
          <Message from="assistant">
            <MessageContent>
              <Shimmer className="text-sm" duration={1.5}>Thinking...</Shimmer>
            </MessageContent>
          </Message>
        )}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
}

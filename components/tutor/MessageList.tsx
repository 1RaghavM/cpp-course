'use client';

import { useRef, useEffect } from 'react';
import type { UIMessage, TextUIPart } from 'ai';
import MarkdownMessage from './MarkdownMessage';
import FeedbackButtons from './FeedbackButtons';

interface Props {
  messages: UIMessage[];
  isStreaming: boolean;
}

export default function MessageList({ messages, isStreaming }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center px-4">
        <p className="text-sm text-[var(--color-fg-muted)]">Ask a question about this lesson.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3">
      {messages.map((msg) => {
        const textContent = msg.parts
          .filter((p): p is TextUIPart => p.type === 'text')
          .map((p) => p.text)
          .join('');

        return (
          <div key={msg.id} className={`mb-4 ${msg.role === 'user' ? 'flex justify-end' : ''}`}>
            {msg.role === 'user' ? (
              <div className="max-w-[85%] rounded-lg bg-[var(--color-surface-2)] px-3 py-2 text-sm text-[var(--color-fg)]">
                <div className="whitespace-pre-wrap">{textContent}</div>
              </div>
            ) : (
              <div className="max-w-[95%]">
                {textContent ? (
                  <MarkdownMessage content={textContent} />
                ) : isStreaming ? (
                  <div className="text-sm text-[var(--color-fg-muted)]">Thinking...</div>
                ) : null}
                {textContent && !isStreaming && (
                  <FeedbackButtons messageId={msg.id} initialFeedback={null} />
                )}
              </div>
            )}
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import TierBadge from './TierBadge';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  hintTier: number | null;
}

interface ConversationSummary {
  id: string;
  title: string | null;
  createdAt: string;
  messageCount: number;
}

interface ChatPanelProps {
  lessonId: string;
  currentCode?: string;
  lastSubmissionId?: string;
}

export default function ChatPanel({ lessonId, currentCode, lastSubmissionId }: ChatPanelProps) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentTier, setCurrentTier] = useState(1);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    fetch(`/api/conversations?lesson_id=${lessonId}`)
      .then((r) => r.json())
      .then((data) => setConversations(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [lessonId]);

  const loadConversation = async (convId: string) => {
    const res = await fetch(`/api/conversations/${convId}`);
    if (!res.ok) return;
    const data = await res.json();
    setConversationId(convId);
    setMessages(
      (data.messages ?? []).map((m: Record<string, unknown>) => ({
        id: m.id as string,
        role: m.role as 'user' | 'assistant',
        content: m.content as string,
        hintTier: m.hintTier as number | null,
      })),
    );
    const lastAssistant = (data.messages ?? [])
      .filter((m: Record<string, unknown>) => m.role === 'assistant')
      .pop();
    if (lastAssistant?.hintTier) {
      setCurrentTier(lastAssistant.hintTier as number);
    }
  };

  const startNewConversation = () => {
    setConversationId(null);
    setMessages([]);
    setCurrentTier(1);
  };

  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return;

    const userMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      hintTier: null,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsStreaming(true);

    const streamingMsg: ChatMessage = {
      id: `streaming-${Date.now()}`,
      role: 'assistant',
      content: '',
      hintTier: null,
    };
    setMessages((prev) => [...prev, streamingMsg]);

    try {
      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lesson_id: lessonId,
          conversation_id: conversationId ?? undefined,
          content: userMsg.content,
          current_code: currentCode,
          last_submission_id: lastSubmissionId,
        }),
      });

      if (!res.ok || !res.body) throw new Error('Stream failed');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === 'token') {
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last && last.role === 'assistant') {
                  updated[updated.length - 1] = { ...last, content: last.content + event.content };
                }
                return updated;
              });
            } else if (event.type === 'done') {
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last && last.role === 'assistant') {
                  updated[updated.length - 1] = {
                    ...last,
                    id: event.message_id ?? last.id,
                    hintTier: event.hint_tier,
                  };
                }
                return updated;
              });
              if (event.hint_tier) setCurrentTier(event.hint_tier);
              if (!conversationId && event.conversation_id) {
                setConversationId(event.conversation_id);
              }
            } else if (event.type === 'error') {
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last && last.role === 'assistant') {
                  updated[updated.length - 1] = { ...last, content: event.message };
                }
                return updated;
              });
            }
          } catch {
            // skip malformed SSE lines
          }
        }
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last && last.role === 'assistant' && !last.content) {
          updated[updated.length - 1] = {
            ...last,
            content: 'Tutor unavailable. Try again or use the Run button.',
          };
        }
        return updated;
      });
    } finally {
      setIsStreaming(false);
      fetch(`/api/conversations?lesson_id=${lessonId}`)
        .then((r) => r.json())
        .then((data) => setConversations(Array.isArray(data) ? data : []))
        .catch(() => {});
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 rounded-full bg-blue-600 px-4 py-3 text-sm font-medium text-white shadow-lg hover:bg-blue-500"
      >
        Ask Tutor
      </button>
    );
  }

  return (
    <div className="fixed bottom-0 right-0 z-50 flex h-[600px] w-full flex-col border-l border-neutral-700 bg-neutral-900 sm:w-[420px]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-700 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-neutral-200">Tutor</span>
          <TierBadge tier={currentTier} />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={startNewConversation}
            className="rounded px-2 py-1 text-xs text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
          >
            New chat
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded px-2 py-1 text-xs text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
          >
            Close
          </button>
        </div>
      </div>

      {/* Conversation selector */}
      {conversations.length > 0 && !conversationId && messages.length === 0 && (
        <div className="border-b border-neutral-700 p-3">
          <p className="mb-2 text-xs text-neutral-400">Previous conversations</p>
          <div className="flex max-h-32 flex-col gap-1 overflow-y-auto">
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => loadConversation(c.id)}
                className="rounded px-2 py-1.5 text-left text-xs text-neutral-300 hover:bg-neutral-800"
              >
                {c.title ?? 'Untitled'}{' '}
                <span className="text-neutral-500">({c.messageCount} msgs)</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {messages.length === 0 && (
          <p className="text-center text-sm text-neutral-500">
            Ask a question about this lesson.
          </p>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`mb-3 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}
          >
            <div
              className={`inline-block max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-neutral-800 text-neutral-200'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>
              {msg.role === 'assistant' && msg.hintTier && (
                <div className="mt-1">
                  <TierBadge tier={msg.hintTier} />
                </div>
              )}
            </div>
          </div>
        ))}
        {isStreaming && messages[messages.length - 1]?.content === '' && (
          <div className="mb-3 text-left">
            <div className="inline-block rounded-lg bg-neutral-800 px-3 py-2 text-sm text-neutral-400">
              Thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-neutral-700 p-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Ask about this lesson..."
            disabled={isStreaming}
            className="flex-1 rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-200 placeholder-neutral-500 focus:border-blue-500 focus:outline-none disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={isStreaming || !input.trim()}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

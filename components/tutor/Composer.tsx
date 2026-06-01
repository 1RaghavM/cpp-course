'use client';

import { useRef, useEffect } from 'react';

interface Props {
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  isStreaming: boolean;
  disabled: boolean;
}

export default function Composer({
  input,
  onInputChange,
  onSubmit,
  onStop,
  isStreaming,
  disabled,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isStreaming && !disabled && input.trim()) onSubmit();
    }
  };

  return (
    <div className="border-t border-[var(--color-border)] p-3">
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? 'Daily limit reached' : 'Ask about this lesson...'}
          disabled={isStreaming || disabled}
          rows={1}
          className="flex-1 resize-none rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-fg)] placeholder-[var(--color-fg-subtle)] focus:border-[var(--color-accent)] focus:outline-none disabled:opacity-50 transition-colors"
        />
        {isStreaming ? (
          <button
            onClick={onStop}
            className="rounded-md border border-[var(--color-border-strong)] bg-transparent px-4 py-2 text-sm font-medium text-[var(--color-fg)] hover:bg-[var(--color-surface-2)] transition-colors"
          >
            Stop
          </button>
        ) : (
          <button
            onClick={onSubmit}
            disabled={disabled || !input.trim()}
            className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:bg-white/90 disabled:opacity-50 transition-colors"
          >
            Send
          </button>
        )}
      </div>
    </div>
  );
}

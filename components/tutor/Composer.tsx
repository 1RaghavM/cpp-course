"use client";

import { useRef, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

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
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isStreaming && !disabled && input.trim()) onSubmit();
    }
  };

  return (
    <div className="border-t border-border p-3">
      <div className="flex items-end gap-2">
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? "Daily limit reached" : "Ask about this lesson..."}
          disabled={isStreaming || disabled}
          rows={1}
          className="flex-1 resize-none min-h-0 field-sizing-normal text-sm"
        />
        {isStreaming ? (
          <Button variant="outline" onClick={onStop}>
            Stop
          </Button>
        ) : (
          <Button onClick={onSubmit} disabled={disabled || !input.trim()}>
            Send
          </Button>
        )}
      </div>
    </div>
  );
}

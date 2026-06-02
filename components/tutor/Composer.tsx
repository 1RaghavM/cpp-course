"use client";

import type { ChatStatus } from "ai";
import type { PromptInputMessage } from "@/components/ai-elements/prompt-input";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";

interface Props {
  onSubmit: (message: PromptInputMessage) => void;
  onStop: () => void;
  status: ChatStatus;
  disabled: boolean;
}

export default function Composer({ onSubmit, onStop, status, disabled }: Props) {
  return (
    <div className="border-t border-border p-3">
      <PromptInput onSubmit={onSubmit}>
        <PromptInputBody>
          <PromptInputTextarea
            placeholder={disabled ? "Daily limit reached" : "Ask about this lesson..."}
            disabled={status !== "ready" || disabled}
            className="text-foreground"
          />
        </PromptInputBody>
        <PromptInputFooter className="justify-end">
          <PromptInputSubmit status={status} onStop={onStop} disabled={disabled} />
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
}

"use client";

import { useTypingAnimation } from "./useTypingAnimation";

export function CodeCard() {
  const { html, isFading } = useTypingAnimation();

  return (
    <div className={`code-card editor-card${isFading ? " code-card-fading" : ""}`}>
      <div className="code-card-header">
        <span className="code-card-tab">main.cpp</span>
      </div>
      <div
        className="code-card-body"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}

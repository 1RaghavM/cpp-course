"use client";

import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import type { Components } from "react-markdown";

interface SummaryViewProps {
  markdown: string;
}

/**
 * Renders the lesson summary markdown with syntax-highlighted C++ code blocks
 * and Tailwind prose styling.
 */
export function SummaryView({ markdown }: SummaryViewProps) {
  const components: Components = {
    code({ className, children, ...rest }) {
      const match = /language-(\w+)/.exec(className || "");
      const codeString = String(children).replace(/\n$/, "");

      // If there's a language tag, render with syntax highlighting
      if (match) {
        return (
          <SyntaxHighlighter
            style={oneDark}
            language={match[1]}
            PreTag="div"
            customStyle={{
              margin: 0,
              borderRadius: "0.375rem",
              fontSize: "0.875rem",
            }}
          >
            {codeString}
          </SyntaxHighlighter>
        );
      }

      // Inline code
      return (
        <code
          className="rounded bg-neutral-100 px-1.5 py-0.5 text-sm dark:bg-neutral-800"
          {...rest}
        >
          {children}
        </code>
      );
    },
  };

  return (
    <div className="prose prose-neutral dark:prose-invert max-w-none prose-pre:bg-transparent prose-pre:p-0">
      <ReactMarkdown components={components}>{markdown}</ReactMarkdown>
    </div>
  );
}

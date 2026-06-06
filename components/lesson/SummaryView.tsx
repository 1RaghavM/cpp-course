"use client";

import ReactMarkdown from "react-markdown";
import { SyntaxHighlighter, oneDark } from "@/lib/syntax-highlight";
import type { Components } from "react-markdown";

interface SummaryViewProps {
  markdown: string;
}

const customOneDark = {
  ...oneDark,
  'pre[class*="language-"]': {
    ...oneDark['pre[class*="language-"]'],
    background: "#0f1115",
    borderRadius: "0.5rem",
    border: "1px solid #23262d",
  },
  'code[class*="language-"]': {
    ...oneDark['code[class*="language-"]'],
    background: "transparent",
  },
};

export function SummaryView({ markdown }: SummaryViewProps) {
  const components: Components = {
    code({ className, children, ...rest }) {
      const match = /language-(\w+)/.exec(className || "");
      const codeString = String(children).replace(/\n$/, "");

      if (match) {
        return (
          <SyntaxHighlighter
            style={customOneDark}
            language={match[1]}
            PreTag="div"
            customStyle={{
              margin: 0,
              fontSize: "0.9rem",
              lineHeight: "1.6",
            }}
          >
            {codeString}
          </SyntaxHighlighter>
        );
      }

      if (codeString.includes("\n")) {
        return (
          <code
            className="block text-sm font-mono text-brand-bright"
            {...rest}
          >
            {children}
          </code>
        );
      }

      return (
        <code
          className="rounded-md bg-elevated px-1.5 py-0.5 text-sm font-mono text-brand-bright"
          {...rest}
        >
          {children}
        </code>
      );
    },
    pre({ children, ...rest }) {
      return (
        <pre
          className="rounded-lg bg-elevated border border-border p-3 overflow-x-auto"
          {...rest}
        >
          {children}
        </pre>
      );
    },
  };

  return (
    <div className="prose prose-invert prose-base max-w-none prose-pre:bg-transparent prose-pre:p-0 prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-a:text-brand-bright prose-a:no-underline hover:prose-a:underline prose-li:text-muted-foreground prose-code:before:content-none prose-code:after:content-none">
      <ReactMarkdown components={components}>{markdown}</ReactMarkdown>
    </div>
  );
}

"use client";

import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";

interface Props {
  content: string;
}

export default function MarkdownMessage({ content }: Props) {
  return (
    <div className="prose prose-sm prose-invert max-w-none text-primary">
      <ReactMarkdown
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className ?? "");
            const codeString = String(children).replace(/\n$/, "");
            if (match) {
              return (
                <SyntaxHighlighter
                  style={oneDark}
                  language={match[1]}
                  PreTag="div"
                  customStyle={{
                    background: "var(--bg-surface)",
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                    fontSize: "0.8125rem",
                  }}
                >
                  {codeString}
                </SyntaxHighlighter>
              );
            }
            return (
              <code
                className="rounded bg-surface px-1.5 py-0.5 text-xs font-mono"
                {...props}
              >
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

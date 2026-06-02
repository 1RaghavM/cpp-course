"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import type { Components } from "react-markdown";

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
          customStyle={{ margin: 0, fontSize: "0.8125rem", lineHeight: "1.6" }}
        >
          {codeString}
        </SyntaxHighlighter>
      );
    }

    return (
      <code
        className="rounded-md bg-elevated px-1.5 py-0.5 text-sm font-mono text-accent"
        {...rest}
      >
        {children}
      </code>
    );
  },
};

interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

export function MarkdownPreview({ content, className }: MarkdownPreviewProps) {
  return (
    <div
      className={`prose prose-invert prose-sm max-w-none prose-pre:bg-transparent prose-pre:p-0 prose-headings:text-primary prose-p:text-secondary prose-strong:text-primary prose-a:text-accent prose-a:no-underline hover:prose-a:underline prose-li:text-secondary prose-code:before:content-none prose-code:after:content-none ${className ?? ""}`}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

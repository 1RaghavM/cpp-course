"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { SyntaxHighlighter } from "@/lib/syntax-highlight";
import { useSyntaxStyle } from "@/lib/use-syntax-style";
import type { Components } from "react-markdown";

interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

export function MarkdownPreview({ content, className }: MarkdownPreviewProps) {
  const syntaxStyle = useSyntaxStyle();
  const highlighterTheme = {
    ...syntaxStyle,
    'pre[class*="language-"]': {
      ...syntaxStyle['pre[class*="language-"]'],
      background: "var(--bg-surface)",
      borderRadius: "0.5rem",
      border: "1px solid var(--border)",
    },
    'code[class*="language-"]': {
      ...syntaxStyle['code[class*="language-"]'],
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
            style={highlighterTheme}
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
          className="rounded-md bg-elevated px-1.5 py-0.5 text-sm font-mono text-sidebar-primary"
          {...rest}
        >
          {children}
        </code>
      );
    },
  };

  return (
    <div
      className={`prose dark:prose-invert prose-sm max-w-none prose-pre:bg-transparent prose-pre:p-0 prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-a:text-sidebar-primary prose-a:no-underline hover:prose-a:underline prose-li:text-muted-foreground prose-code:before:content-none prose-code:after:content-none ${className ?? ""}`}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

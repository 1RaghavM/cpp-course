"use client";

import { useCallback, useRef } from "react";
import { Bold, Italic, Code, List, Heading2, CodeSquare } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MarkdownPreview } from "@/components/notes/MarkdownPreview";

interface MarkdownEditorProps {
  content: string;
  onChange: (value: string) => void;
  mode: "edit" | "preview";
  onModeChange: (mode: "edit" | "preview") => void;
  className?: string;
  textareaClassName?: string;
}

type FormatAction = "bold" | "italic" | "code" | "codeBlock" | "list" | "heading";

const FORMAT_CONFIG: { action: FormatAction; icon: typeof Bold; label: string }[] = [
  { action: "bold", icon: Bold, label: "Bold" },
  { action: "italic", icon: Italic, label: "Italic" },
  { action: "code", icon: Code, label: "Inline code" },
  { action: "codeBlock", icon: CodeSquare, label: "Code block" },
  { action: "list", icon: List, label: "Bullet list" },
  { action: "heading", icon: Heading2, label: "Heading" },
];

function applyFormat(
  textarea: HTMLTextAreaElement,
  action: FormatAction,
  content: string,
  onChange: (v: string) => void,
) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = content.slice(start, end);
  let replacement: string;
  let cursorOffset: number;

  switch (action) {
    case "bold":
      replacement = `**${selected || "bold text"}**`;
      cursorOffset = selected ? replacement.length : 2;
      break;
    case "italic":
      replacement = `*${selected || "italic text"}*`;
      cursorOffset = selected ? replacement.length : 1;
      break;
    case "code":
      replacement = `\`${selected || "code"}\``;
      cursorOffset = selected ? replacement.length : 1;
      break;
    case "codeBlock":
      replacement = `\n\`\`\`cpp\n${selected || "// code here"}\n\`\`\`\n`;
      cursorOffset = 8;
      break;
    case "list":
      replacement = selected
        ? selected
            .split("\n")
            .map((line) => `- ${line}`)
            .join("\n")
        : "- ";
      cursorOffset = replacement.length;
      break;
    case "heading":
      replacement = `## ${selected || "Heading"}`;
      cursorOffset = selected ? replacement.length : 3;
      break;
    default:
      return;
  }

  const newContent = content.slice(0, start) + replacement + content.slice(end);
  onChange(newContent);

  requestAnimationFrame(() => {
    textarea.focus();
    const pos = start + cursorOffset;
    textarea.setSelectionRange(pos, pos);
  });
}

export function MarkdownEditor({
  content,
  onChange,
  mode,
  onModeChange,
  className,
  textareaClassName,
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleFormat = useCallback(
    (action: FormatAction) => {
      if (!textareaRef.current) return;
      applyFormat(textareaRef.current, action, content, onChange);
    },
    [content, onChange],
  );

  return (
    <div className={`flex flex-col ${className ?? ""}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-2 py-1.5">
        <TooltipProvider delay={300}>
          {FORMAT_CONFIG.map(({ action, icon: Icon, label }) => (
            <Tooltip key={action}>
              <TooltipTrigger
                render={
                  <Toggle
                    size="sm"
                    aria-label={label}
                    disabled={mode === "preview"}
                    onPressedChange={() => handleFormat(action)}
                    className="h-7 w-7 p-0"
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </Toggle>
                }
              />
              <TooltipContent side="bottom" className="text-xs">
                {label}
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>

        <Separator orientation="vertical" className="mx-1 h-5" />

        <ToggleGroup
          multiple={false}
          value={[mode]}
          onValueChange={(values) => {
            const next = values[0];
            if (next === "edit" || next === "preview") onModeChange(next);
          }}
          size="sm"
        >
          <ToggleGroupItem value="edit" className="h-7 px-2 text-xs">
            Edit
          </ToggleGroupItem>
          <ToggleGroupItem value="preview" className="h-7 px-2 text-xs">
            Preview
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <Separator />

      {/* Content area */}
      {mode === "edit" ? (
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Start writing notes…"
          className={`flex-1 resize-none rounded-none border-0 bg-transparent font-mono text-sm focus-visible:ring-0 ${textareaClassName ?? ""}`}
        />
      ) : (
        <ScrollArea className={`flex-1 p-3 ${textareaClassName ?? ""}`}>
          {content ? (
            <MarkdownPreview content={content} />
          ) : (
            <p className="text-sm text-muted">Nothing to preview</p>
          )}
        </ScrollArea>
      )}
    </div>
  );
}

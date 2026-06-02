"use client";

import { useState } from "react";
import { MarkdownEditor } from "@/components/notes/MarkdownEditor";
import { SaveStatus } from "@/components/notes/SaveStatus";
import { useNote } from "@/lib/notes/use-note";

interface NoteEditorProps {
  lessonId: string;
}

export function NoteEditor({ lessonId }: NoteEditorProps) {
  const { content, setContent, saveStatus, isLoading } = useNote(lessonId);
  const [mode, setMode] = useState<"edit" | "preview">("edit");

  if (isLoading) {
    return (
      <div className="flex h-[500px] items-center justify-center rounded-lg border border-border bg-surface text-sm text-muted">
        Loading note…
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="text-sm font-medium text-primary">Note</span>
        <SaveStatus status={saveStatus} />
      </div>
      <MarkdownEditor
        content={content}
        onChange={setContent}
        mode={mode}
        onModeChange={setMode}
        className="h-[500px]"
        textareaClassName="h-full"
      />
    </div>
  );
}

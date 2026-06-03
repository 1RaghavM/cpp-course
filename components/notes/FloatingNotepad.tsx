"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { X, Minus, GripVertical, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarkdownEditor } from "@/components/notes/MarkdownEditor";
import { SaveStatus } from "@/components/notes/SaveStatus";
import { useNote } from "@/lib/notes/use-note";
import { useNotepadPosition } from "@/lib/notes/use-notepad-position";

interface FloatingNotepadProps {
  lessonId: string;
  onClose: () => void;
}

export function FloatingNotepad({ lessonId, onClose }: FloatingNotepadProps) {
  const { content, setContent, saveStatus, isLoading } = useNote(lessonId);
  const { position, setPosition, toggleMinimized } = useNotepadPosition();
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const panelRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const isResizing = useRef(false);

  useEffect(() => {
    if (position.x === -1 && position.y === -1) {
      setPosition({
        x: window.innerWidth - position.width - 24,
        y: window.innerHeight - position.height - 24,
      });
    }
  }, [position.x, position.y, position.width, position.height, setPosition]);

  const handleDragStart = useCallback(
    (e: React.PointerEvent) => {
      isDragging.current = true;
      dragOffset.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [position.x, position.y],
  );

  const handleDragMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging.current) return;
      setPosition({
        x: Math.max(0, e.clientX - dragOffset.current.x),
        y: Math.max(0, e.clientY - dragOffset.current.y),
      });
    },
    [setPosition],
  );

  const handleDragEnd = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleResizeStart = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      isResizing.current = true;
      const startX = e.clientX;
      const startY = e.clientY;
      const startW = position.width;
      const startH = position.height;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);

      const onMove = (ev: PointerEvent) => {
        if (!isResizing.current) return;
        setPosition({
          width: Math.max(300, startW + (ev.clientX - startX)),
          height: Math.max(250, startH + (ev.clientY - startY)),
        });
      };

      const onUp = () => {
        isResizing.current = false;
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [position.width, position.height, setPosition],
  );

  if (position.minimized) {
    return (
      <button
        onClick={toggleMinimized}
        className="fixed bottom-6 right-6 z-[9000] flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-white shadow-lg transition hover:bg-accent/90"
      >
        <Maximize2 className="h-4 w-4" />
        Notes
      </button>
    );
  }

  return (
    <div
      ref={panelRef}
      className="fixed z-[9000] flex flex-col rounded-lg border border-border bg-surface shadow-2xl"
      style={{
        left: position.x,
        top: position.y,
        width: position.width,
        height: position.height,
      }}
    >
      {/* Header — draggable */}
      <div
        className="flex items-center gap-2 border-b border-border px-3 py-2 select-none"
        onPointerDown={handleDragStart}
        onPointerMove={handleDragMove}
        onPointerUp={handleDragEnd}
        style={{ cursor: "grab" }}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">Notes</span>
        <SaveStatus status={saveStatus} />

        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={toggleMinimized}
            aria-label="Minimize"
          >
            <Minus className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Editor */}
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          Loading note…
        </div>
      ) : (
        <MarkdownEditor
          content={content}
          onChange={setContent}
          mode={mode}
          onModeChange={setMode}
          className="flex-1 min-h-0"
          textareaClassName="min-h-0 flex-1"
        />
      )}

      {/* Resize handle */}
      <div
        onPointerDown={handleResizeStart}
        className="absolute bottom-0 right-0 h-4 w-4 cursor-se-resize"
        aria-hidden
      >
        <svg viewBox="0 0 16 16" className="h-4 w-4 text-muted-foreground/50">
          <path d="M14 14L8 14L14 8Z" fill="currentColor" />
        </svg>
      </div>
    </div>
  );
}

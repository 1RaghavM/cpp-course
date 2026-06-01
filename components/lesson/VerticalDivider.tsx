"use client";

import { useCallback, useRef } from "react";

interface Props {
  onResize: (topPercent: number) => void;
  containerRef: React.RefObject<HTMLElement | null>;
  min?: number;
  max?: number;
}

export default function VerticalDivider({ onResize, containerRef, min = 20, max = 85 }: Props) {
  const isDragging = useRef(false);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isDragging.current = true;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!isDragging.current || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const percent = ((moveEvent.clientY - rect.top) / rect.height) * 100;
        const clamped = Math.max(min, Math.min(max, percent));
        onResize(clamped);
      };

      const handleMouseUp = () => {
        isDragging.current = false;
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "row-resize";
      document.body.style.userSelect = "none";
    },
    [onResize, containerRef, min, max],
  );

  return (
    <div
      onMouseDown={handleMouseDown}
      className="h-1 cursor-row-resize bg-border hover:bg-border-subtle transition-colors flex-shrink-0"
      role="separator"
      aria-orientation="horizontal"
    />
  );
}

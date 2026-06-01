'use client';

import { useCallback, useRef } from 'react';

interface Props {
  onResize: (leftPercent: number) => void;
}

export default function ResizableDivider({ onResize }: Props) {
  const isDragging = useRef(false);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isDragging.current = true;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!isDragging.current) return;
        const percent = (moveEvent.clientX / window.innerWidth) * 100;
        const clamped = Math.max(25, Math.min(75, percent));
        onResize(clamped);
      };

      const handleMouseUp = () => {
        isDragging.current = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    },
    [onResize],
  );

  return (
    <div
      onMouseDown={handleMouseDown}
      className="w-1 cursor-col-resize bg-[var(--color-border)] hover:bg-[var(--color-border-strong)] transition-colors flex-shrink-0"
      role="separator"
      aria-orientation="vertical"
    />
  );
}

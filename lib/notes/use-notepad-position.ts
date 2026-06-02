"use client";

import { useState, useCallback } from "react";

const STORAGE_KEY = "cpproad:notepad:position";

interface NotepadPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  minimized: boolean;
}

const DEFAULT_POSITION: NotepadPosition = {
  x: -1,
  y: -1,
  width: 400,
  height: 350,
  minimized: false,
};

function loadPosition(): NotepadPosition {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_POSITION;
    const parsed = JSON.parse(raw) as Partial<NotepadPosition>;
    return { ...DEFAULT_POSITION, ...parsed };
  } catch {
    return DEFAULT_POSITION;
  }
}

function persistPosition(pos: NotepadPosition) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pos));
  } catch {
    // localStorage unavailable
  }
}

export function useNotepadPosition() {
  const [position, setPositionState] = useState<NotepadPosition>(loadPosition);

  const setPosition = useCallback((update: Partial<NotepadPosition>) => {
    setPositionState((prev) => {
      const next = { ...prev, ...update };
      persistPosition(next);
      return next;
    });
  }, []);

  const toggleMinimized = useCallback(() => {
    setPositionState((prev) => {
      const next = { ...prev, minimized: !prev.minimized };
      persistPosition(next);
      return next;
    });
  }, []);

  return { position, setPosition, toggleMinimized };
}

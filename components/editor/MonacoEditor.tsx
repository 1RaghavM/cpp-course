"use client";

import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  forwardRef,
} from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import type { editor } from "monaco-editor";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MonacoEditorProps {
  /** Starter / default code shown when there is no localStorage save. */
  defaultValue: string;
  /** Called on every content change (debounced internally for localStorage). */
  onChange: (value: string) => void;
  /** Monaco language id. Default "cpp". */
  language?: string;
  /** Make the editor read-only (e.g. on mobile). */
  readOnly?: boolean;
  /** localStorage key suffix. Should be the exercise id. */
  exerciseId: string;
}

export interface MonacoEditorHandle {
  /** Return the current editor content. */
  getValue: () => string;
  /** Reset the editor to the original starter code. */
  resetToDefault: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function storageKey(exerciseId: string): string {
  return `cpproad:editor:${exerciseId}`;
}

function loadFromStorage(exerciseId: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(storageKey(exerciseId));
  } catch {
    return null;
  }
}

function saveToStorage(exerciseId: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(exerciseId), value);
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const MonacoEditor = forwardRef<MonacoEditorHandle, MonacoEditorProps>(
  function MonacoEditor(
    { defaultValue, onChange, language = "cpp", readOnly = false, exerciseId },
    ref,
  ) {
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Determine initial value: localStorage takes precedence over starter code
    const initialValue = loadFromStorage(exerciseId) ?? defaultValue;

    // ---- Ref API ------------------------------------------------------------

    useImperativeHandle(ref, () => ({
      getValue() {
        return editorRef.current?.getValue() ?? initialValue;
      },
      resetToDefault() {
        editorRef.current?.setValue(defaultValue);
        saveToStorage(exerciseId, defaultValue);
        onChange(defaultValue);
      },
    }));

    // ---- Auto-save to localStorage (debounced 500ms) -------------------------

    const handleChange = useCallback(
      (value: string | undefined) => {
        const v = value ?? "";
        onChange(v);

        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
          saveToStorage(exerciseId, v);
        }, 500);
      },
      [exerciseId, onChange],
    );

    // Clean up debounce timer on unmount
    useEffect(() => {
      return () => {
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
      };
    }, []);

    // ---- Editor mount callback -----------------------------------------------

    const handleMount: OnMount = useCallback((monacoEditor) => {
      editorRef.current = monacoEditor;
    }, []);

    // ---- Render --------------------------------------------------------------

    return (
      <Editor
        height="100%"
        defaultLanguage={language}
        defaultValue={initialValue}
        onMount={handleMount}
        onChange={handleChange}
        theme="vs-dark"
        options={{
          fontSize: 14,
          minimap: { enabled: false },
          lineNumbers: "on",
          readOnly,
          scrollBeyondLastLine: false,
          wordWrap: "on",
          automaticLayout: true,
          padding: { top: 12, bottom: 12 },
          tabSize: 4,
          insertSpaces: true,
          renderWhitespace: "selection",
          bracketPairColorization: { enabled: true },
        }}
        loading={
          <div className="flex h-full items-center justify-center text-neutral-500">
            Loading editor...
          </div>
        }
      />
    );
  },
);

export default MonacoEditor;

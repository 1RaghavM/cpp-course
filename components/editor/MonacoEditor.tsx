"use client";

import { useCallback, useEffect, useImperativeHandle, useRef, forwardRef } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import type { editor } from "monaco-editor";

export interface MonacoEditorProps {
  defaultValue: string;
  onChange: (value: string) => void;
  language?: string;
  readOnly?: boolean;
  exerciseId?: string;
}

export interface MonacoEditorHandle {
  getValue: () => string;
  resetToDefault: () => void;
}

function storageKey(exerciseId: string | undefined): string {
  return `cpproad:editor:${exerciseId ?? "playground"}`;
}

function loadFromStorage(exerciseId: string | undefined): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(storageKey(exerciseId));
  } catch {
    return null;
  }
}

function saveToStorage(exerciseId: string | undefined, value: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(exerciseId), value);
  } catch {
    // localStorage full or unavailable
  }
}

const MonacoEditor = forwardRef<MonacoEditorHandle, MonacoEditorProps>(function MonacoEditor(
  { defaultValue, onChange, language = "cpp", readOnly = false, exerciseId },
  ref,
) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const initialValue = loadFromStorage(exerciseId) ?? defaultValue;

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

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  const handleMount: OnMount = useCallback((monacoEditor, monaco) => {
    editorRef.current = monacoEditor;

    monaco.editor.defineTheme("cpproad-dark", {
      base: "vs-dark",
      inherit: false,
      rules: [
        { token: "", foreground: "e6edf3" },
        { token: "comment", foreground: "8b949e", fontStyle: "italic" },
        { token: "keyword", foreground: "ff7b72" },
        { token: "keyword.control", foreground: "ff7b72" },
        { token: "keyword.operator", foreground: "ff7b72" },
        { token: "storage.type", foreground: "ff7b72" },
        { token: "type", foreground: "ff7b72" },
        { token: "string", foreground: "a5d6ff" },
        { token: "string.escape", foreground: "79c0ff" },
        { token: "number", foreground: "79c0ff" },
        { token: "constant", foreground: "79c0ff" },
        { token: "entity.name.function", foreground: "d2a8ff" },
        { token: "support.function", foreground: "d2a8ff" },
        { token: "identifier", foreground: "e6edf3" },
        { token: "variable", foreground: "ffa657" },
        { token: "tag", foreground: "7ee787" },
        { token: "attribute.name", foreground: "79c0ff" },
        { token: "delimiter", foreground: "e6edf3" },
        { token: "delimiter.bracket", foreground: "e6edf3" },
        { token: "operator", foreground: "ff7b72" },
        { token: "namespace", foreground: "ffa657" },
        { token: "annotation", foreground: "d2a8ff" },
        { token: "predefined", foreground: "79c0ff" },
        { token: "invalid", foreground: "f85149" },
      ],
      colors: {
        "editor.background": "#0f1115",
        "editor.foreground": "#e6edf3",
        "editor.lineHighlightBackground": "#161b22",
        "editor.selectionBackground": "#2f81f733",
        "editor.inactiveSelectionBackground": "#2f81f722",
        "editorLineNumber.foreground": "#6e7681",
        "editorLineNumber.activeForeground": "#8b949e",
        "editorCursor.foreground": "#58a6ff",
        "editor.selectionHighlightBackground": "#2f81f722",
        "editorIndentGuide.background": "#23262d",
        "editorIndentGuide.activeBackground": "#30363d",
        "editorBracketMatch.background": "#2f81f733",
        "editorBracketMatch.border": "#2f81f7",
        "editorWidget.background": "#161b22",
        "editorWidget.border": "#30363d",
        "editorSuggestWidget.background": "#161b22",
        "editorSuggestWidget.border": "#30363d",
        "editorSuggestWidget.selectedBackground": "#1c2128",
        "input.background": "#0f1115",
        "input.border": "#30363d",
        "input.foreground": "#e6edf3",
        "scrollbarSlider.background": "#23262d80",
        "scrollbarSlider.hoverBackground": "#30363d80",
        "scrollbarSlider.activeBackground": "#8b949e40",
      },
    });

    monaco.editor.setTheme("cpproad-dark");
  }, []);

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
        <div className="flex h-full items-center justify-center text-muted-foreground">Loading editor...</div>
      }
    />
  );
});

export default MonacoEditor;

"use client";

import { useCallback, useEffect, useImperativeHandle, useRef } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { useIsLightTheme } from "@/lib/use-syntax-style";

export interface MonacoEditorProps {
  defaultValue: string;
  onChange: (value: string) => void;
  language?: string;
  readOnly?: boolean;
  exerciseId?: string;
  handleRef?: React.RefObject<MonacoEditorHandle | null>;
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

function MonacoEditor({
  defaultValue,
  onChange,
  language = "cpp",
  readOnly = false,
  exerciseId,
  handleRef,
}: MonacoEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Parameters<OnMount>[1] | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLight = useIsLightTheme();
  const monacoTheme = isLight ? "cpproad-light" : "cpproad-dark";

  const initialValue = loadFromStorage(exerciseId) ?? defaultValue;

  useImperativeHandle(handleRef, () => ({
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
    monacoRef.current = monaco;

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

    monaco.editor.defineTheme("cpproad-light", {
      base: "vs",
      inherit: false,
      rules: [
        { token: "", foreground: "1f2328" },
        { token: "comment", foreground: "656d76", fontStyle: "italic" },
        { token: "keyword", foreground: "cf222e" },
        { token: "keyword.control", foreground: "cf222e" },
        { token: "keyword.operator", foreground: "cf222e" },
        { token: "storage.type", foreground: "cf222e" },
        { token: "type", foreground: "cf222e" },
        { token: "string", foreground: "0a3069" },
        { token: "string.escape", foreground: "0550ae" },
        { token: "number", foreground: "0550ae" },
        { token: "constant", foreground: "0550ae" },
        { token: "entity.name.function", foreground: "8250df" },
        { token: "support.function", foreground: "8250df" },
        { token: "identifier", foreground: "1f2328" },
        { token: "variable", foreground: "953800" },
        { token: "tag", foreground: "116329" },
        { token: "attribute.name", foreground: "0550ae" },
        { token: "delimiter", foreground: "1f2328" },
        { token: "delimiter.bracket", foreground: "1f2328" },
        { token: "operator", foreground: "cf222e" },
        { token: "namespace", foreground: "953800" },
        { token: "annotation", foreground: "8250df" },
        { token: "predefined", foreground: "0550ae" },
        { token: "invalid", foreground: "b62324" },
      ],
      colors: {
        "editor.background": "#ffffff",
        "editor.foreground": "#1f2328",
        "editor.lineHighlightBackground": "#f3f5f7",
        "editor.selectionBackground": "#0969da33",
        "editor.inactiveSelectionBackground": "#0969da22",
        "editorLineNumber.foreground": "#8b949e",
        "editorLineNumber.activeForeground": "#636c76",
        "editorCursor.foreground": "#0969da",
        "editor.selectionHighlightBackground": "#0969da22",
        "editorIndentGuide.background": "#d8dee4",
        "editorIndentGuide.activeBackground": "#d0d7de",
        "editorBracketMatch.background": "#0969da22",
        "editorBracketMatch.border": "#0969da",
        "editorWidget.background": "#ffffff",
        "editorWidget.border": "#d0d7de",
        "editorSuggestWidget.background": "#ffffff",
        "editorSuggestWidget.border": "#d0d7de",
        "editorSuggestWidget.selectedBackground": "#eef1f4",
        "input.background": "#ffffff",
        "input.border": "#d0d7de",
        "input.foreground": "#1f2328",
        "scrollbarSlider.background": "#d0d7de80",
        "scrollbarSlider.hoverBackground": "#afb8c080",
        "scrollbarSlider.activeBackground": "#636c7640",
      },
    });

    monaco.editor.setTheme(monacoTheme);
  }, [monacoTheme]);

  useEffect(() => {
    monacoRef.current?.editor.setTheme(monacoTheme);
  }, [monacoTheme]);

  return (
    <Editor
      height="100%"
      defaultLanguage={language}
      defaultValue={initialValue}
      onMount={handleMount}
      onChange={handleChange}
      theme={monacoTheme}
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
}

export default MonacoEditor;

"use client";

import { useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import Editor, { type BeforeMount, type OnMount } from "@monaco-editor/react";
import type { editor } from "monaco-editor";

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

type CppThemeName = "cpproad-light" | "cpproad-dark";

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

function themeFromDom(): CppThemeName {
  if (typeof document === "undefined") return "cpproad-dark";
  return document.documentElement.classList.contains("dark") ? "cpproad-dark" : "cpproad-light";
}

function registerCppThemes(monaco: Parameters<OnMount>[1]) {
  monaco.editor.defineTheme("cpproad-dark", CPPROAD_DARK);
  monaco.editor.defineTheme("cpproad-light", CPPROAD_LIGHT);
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
  const [monacoTheme, setMonacoTheme] = useState<CppThemeName>(themeFromDom);

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
    const apply = () => {
      const next = themeFromDom();
      setMonacoTheme(next);
      monacoRef.current?.editor.setTheme(next);
    };

    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  const handleBeforeMount: BeforeMount = useCallback((monaco) => {
    registerCppThemes(monaco);
  }, []);

  const handleMount: OnMount = useCallback((monacoEditor, monaco) => {
    editorRef.current = monacoEditor;
    monacoRef.current = monaco;
    registerCppThemes(monaco);
    monaco.editor.setTheme(themeFromDom());
  }, []);

  return (
    <Editor
      height="100%"
      className="cpproad-monaco"
      defaultLanguage={language}
      defaultValue={initialValue}
      beforeMount={handleBeforeMount}
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
        <div className="flex h-full items-center justify-center bg-surface text-muted-foreground">
          Loading editor...
        </div>
      }
    />
  );
}

const CPP_DARK_TOKENS: editor.ITokenThemeRule[] = [
  { token: "", foreground: "ededed" },
  { token: "comment", foreground: "8b949e", fontStyle: "italic" },
  { token: "keyword", foreground: "ff7b72" },
  { token: "storage.type", foreground: "ff7b72" },
  { token: "type", foreground: "ff7b72" },
  { token: "string", foreground: "a5d6ff" },
  { token: "number", foreground: "79c0ff" },
  { token: "constant", foreground: "79c0ff" },
  { token: "identifier", foreground: "ededed" },
  { token: "entity.name.function", foreground: "d2a8ff" },
  { token: "support.function", foreground: "d2a8ff" },
  { token: "variable", foreground: "ffa657" },
  { token: "namespace", foreground: "ffa657" },
  { token: "delimiter", foreground: "ededed" },
  { token: "operator", foreground: "ff7b72" },
  { token: "annotation", foreground: "d2a8ff" },
  { token: "predefined", foreground: "79c0ff" },
  { token: "invalid", foreground: "f85149" },
];

const CPP_LIGHT_TOKENS: editor.ITokenThemeRule[] = [
  { token: "", foreground: "1f2328" },
  { token: "comment", foreground: "656d76", fontStyle: "italic" },
  { token: "keyword", foreground: "cf222e" },
  { token: "storage.type", foreground: "cf222e" },
  { token: "type", foreground: "cf222e" },
  { token: "string", foreground: "0a3069" },
  { token: "number", foreground: "0550ae" },
  { token: "constant", foreground: "0550ae" },
  { token: "identifier", foreground: "1f2328" },
  { token: "entity.name.function", foreground: "8250df" },
  { token: "support.function", foreground: "8250df" },
  { token: "variable", foreground: "953800" },
  { token: "namespace", foreground: "953800" },
  { token: "delimiter", foreground: "1f2328" },
  { token: "operator", foreground: "cf222e" },
  { token: "annotation", foreground: "8250df" },
  { token: "predefined", foreground: "0550ae" },
  { token: "invalid", foreground: "b62324" },
];

const CPPROAD_DARK: editor.IStandaloneThemeData = {
  base: "vs-dark",
  inherit: false,
  rules: CPP_DARK_TOKENS,
  colors: {
    "editor.background": "#0f1115",
    "editor.foreground": "#ededed",
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
    "input.foreground": "#ededed",
    "scrollbarSlider.background": "#23262d80",
    "scrollbarSlider.hoverBackground": "#30363d80",
    "scrollbarSlider.activeBackground": "#8b949e40",
  },
};

const CPPROAD_LIGHT: editor.IStandaloneThemeData = {
  base: "vs",
  inherit: false,
  rules: CPP_LIGHT_TOKENS,
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
};

export default MonacoEditor;

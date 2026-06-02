"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createBrowserClient } from "@/lib/supabase/client";

const DEBOUNCE_MS = 1500;

interface UseNoteReturn {
  content: string;
  setContent: (value: string) => void;
  saveStatus: "idle" | "saving" | "saved" | "error";
  isLoading: boolean;
}

export function useNote(lessonId: string): UseNoteReturn {
  const [content, setContentState] = useState("");
  const [saveStatus, setSaveStatus] = useState<UseNoteReturn["saveStatus"]>("idle");
  const [isLoading, setIsLoading] = useState(true);
  const contentRef = useRef(content);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    async function fetchNote() {
      const supabase = createBrowserClient();
      const { data } = await supabase
        .from("notes")
        .select("*")
        .eq("lesson_id", lessonId)
        .maybeSingle();

      if (cancelled) return;
      setContentState(data?.content ?? "");
      contentRef.current = data?.content ?? "";
      setIsLoading(false);
      setSaveStatus("idle");
    }

    fetchNote();
    return () => {
      cancelled = true;
    };
  }, [lessonId]);

  const save = useCallback(
    async (value: string) => {
      setSaveStatus("saving");
      try {
        const res = await fetch(`/api/notes/${lessonId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: value }),
        });
        if (!isMountedRef.current) return;
        setSaveStatus(res.ok ? "saved" : "error");
      } catch {
        if (!isMountedRef.current) return;
        setSaveStatus("error");
      }
    },
    [lessonId],
  );

  const setContent = useCallback(
    (value: string) => {
      setContentState(value);
      contentRef.current = value;
      setSaveStatus("idle");

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        save(contentRef.current);
      }, DEBOUNCE_MS);
    },
    [save],
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        if (contentRef.current !== "") {
          save(contentRef.current);
        }
      }
    };
  }, [save]);

  return { content, setContent, saveStatus, isLoading };
}

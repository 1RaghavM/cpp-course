"use client";

import { create } from "zustand";

interface TutorStore {
  lessonId: string;
  context: "lesson" | "playground";
  code: string;
  lastSubmissionId: string | null;
  lastSubmissionStatus: string | null;
  tutorOpen: boolean;
  setLessonId: (id: string) => void;
  setContext: (ctx: "lesson" | "playground") => void;
  setCode: (code: string) => void;
  setSubmissionResult: (id: string, status: string) => void;
  toggleTutor: () => void;
}

export const useTutorStore = create<TutorStore>((set) => ({
  lessonId: "",
  context: "lesson",
  code: "",
  lastSubmissionId: null,
  lastSubmissionStatus: null,
  tutorOpen: false,
  setLessonId: (id) => set({ lessonId: id }),
  setContext: (ctx) => set({ context: ctx }),
  setCode: (code) => set({ code }),
  setSubmissionResult: (id, status) => set({ lastSubmissionId: id, lastSubmissionStatus: status }),
  toggleTutor: () => set((s) => ({ tutorOpen: !s.tutorOpen })),
}));

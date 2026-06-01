'use client';

import { create } from 'zustand';

interface TutorStore {
  lessonId: string;
  code: string;
  lastSubmissionId: string | null;
  lastSubmissionStatus: string | null;
  setLessonId: (id: string) => void;
  setCode: (code: string) => void;
  setSubmissionResult: (id: string, status: string) => void;
}

export const useTutorStore = create<TutorStore>((set) => ({
  lessonId: '',
  code: '',
  lastSubmissionId: null,
  lastSubmissionStatus: null,
  setLessonId: (id) => set({ lessonId: id }),
  setCode: (code) => set({ code }),
  setSubmissionResult: (id, status) =>
    set({ lastSubmissionId: id, lastSubmissionStatus: status }),
}));

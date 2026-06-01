import type { OnboardingState } from "./types";

const STORAGE_KEY = "cpproad_onboarding";

export function saveOnboardingState(state: OnboardingState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage full or unavailable
  }
}

export function loadOnboardingState(): OnboardingState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as OnboardingState;
    if (!parsed.step) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearOnboardingState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // silent fail
  }
}

export function hasOnboardingData(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return parsed?.background != null && parsed?.motivation != null;
  } catch {
    return false;
  }
}

export function getOnboardingPayload(): {
  background: string;
  motivation: string;
  startModule: string;
  fastTrack: boolean;
  placementTaken: boolean;
  placementScore: number | null;
  weeklyGoal: number | null;
} | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as OnboardingState;
    if (!s.background || !s.motivation || !s.startModule) return null;
    return {
      background: s.background,
      motivation: s.motivation,
      startModule: s.startModule,
      fastTrack: s.fastTrack,
      placementTaken: s.placementTaken,
      placementScore: s.placementScore,
      weeklyGoal: s.weeklyGoal,
    };
  } catch {
    return null;
  }
}

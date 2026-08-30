import type { OnboardingState, OnboardingPayload } from "./types";
import { isOnboardingPayload, parseOnboardingState } from "./validate";

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
    return parseOnboardingState(JSON.parse(raw));
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
  return getOnboardingPayload() != null;
}

export function getOnboardingPayload(): OnboardingPayload | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    const state = parseOnboardingState(parsed);
    if (!state) return null;
    const payload = {
      background: state.background,
      motivation: state.motivation,
      startModule: state.startModule,
      fastTrack: state.fastTrack,
      placementTaken: state.placementTaken,
      placementScore: state.placementScore,
      weeklyGoal: state.weeklyGoal,
      displayName: state.displayName ?? null,
    };
    return isOnboardingPayload(payload) ? payload : null;
  } catch {
    return null;
  }
}

import type { OnboardingState, Action, ModuleId } from "./types";

export function placeFromScore(score: number): ModuleId {
  if (score <= 1) return "pointers";
  if (score <= 3) return "vectors-maps";
  return "templates";
}

export function deriveStartModule(s: OnboardingState): ModuleId {
  switch (s.background) {
    case "new":
      return "variables";
    case "other_lang":
      return "variables";
    case "some_cpp":
      if (s.placementTaken && s.placementScore != null) return placeFromScore(s.placementScore);
      return s.startModule ?? "pointers";
    default:
      return "variables";
  }
}

const BACK_MAP: Record<string, OnboardingState["step"]> = {
  motivation: "background",
  "starting-point": "motivation",
  placement: "starting-point",
  "weekly-goal": "starting-point",
};

export function onboardingReducer(state: OnboardingState, action: Action): OnboardingState {
  switch (action.type) {
    case "SET_BACKGROUND":
      return { ...state, step: "motivation", background: action.value };

    case "SET_MOTIVATION":
      return { ...state, step: "starting-point", motivation: action.value };

    case "SET_START_MODULE":
      return {
        ...state,
        step: "weekly-goal",
        startModule: action.module,
        fastTrack: action.fastTrack ?? false,
      };

    case "START_PLACEMENT":
      return { ...state, step: "placement" };

    case "COMPLETE_PLACEMENT": {
      const module = placeFromScore(action.score);
      return {
        ...state,
        step: "weekly-goal",
        placementTaken: true,
        placementScore: action.score,
        startModule: module,
      };
    }

    case "SET_WEEKLY_GOAL":
      return { ...state, weeklyGoal: action.value };

    case "GO_BACK": {
      const prev = BACK_MAP[state.step];
      if (!prev) return state;
      return { ...state, step: prev };
    }

    default:
      return state;
  }
}

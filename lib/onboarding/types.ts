export type Background = "new" | "other_lang" | "some_cpp";

export type Motivation =
  | "interviews"
  | "school"
  | "gamedev"
  | "systems"
  | "competitive"
  | "curious";

export type ModuleId =
  | "variables"
  | "control-flow"
  | "functions"
  | "arrays-strings"
  | "io-streams"
  | "operators"
  | "pointers"
  | "references"
  | "classes"
  | "raii"
  | "vectors-maps"
  | "algorithms"
  | "templates"
  | "move-semantics"
  | "smart-pointers"
  | "concurrency";

export type Step =
  | "background"
  | "motivation"
  | "starting-point"
  | "placement"
  | "weekly-goal"
  | "payoff";

export interface OnboardingState {
  step: Step;
  background: Background | null;
  motivation: Motivation | null;
  startModule: ModuleId | null;
  fastTrack: boolean;
  placementTaken: boolean;
  placementScore: number | null;
  weeklyGoal: number | null;
  displayName: string | null;
}

export type Action =
  | { type: "SET_BACKGROUND"; value: Background }
  | { type: "SET_MOTIVATION"; value: Motivation }
  | { type: "SET_START_MODULE"; module: ModuleId; fastTrack?: boolean }
  | { type: "START_PLACEMENT" }
  | { type: "COMPLETE_PLACEMENT"; score: number }
  | { type: "SET_WEEKLY_GOAL"; value: number | null }
  | { type: "SET_DISPLAY_NAME"; value: string }
  | { type: "GO_BACK" };

export interface OnboardingPayload {
  background: Background;
  motivation: Motivation;
  startModule: ModuleId;
  fastTrack: boolean;
  placementTaken: boolean;
  placementScore: number | null;
  weeklyGoal: number | null;
  displayName: string | null;
}

export const INITIAL_STATE: OnboardingState = {
  step: "background",
  background: null,
  motivation: null,
  startModule: null,
  fastTrack: false,
  placementTaken: false,
  placementScore: null,
  weeklyGoal: null,
  displayName: null,
};

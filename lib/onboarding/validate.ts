import { MODULE_TITLES } from "./constants";
import { INITIAL_STATE } from "./types";
import type {
  Background,
  ModuleId,
  Motivation,
  OnboardingPayload,
  OnboardingState,
  Step,
} from "./types";

export const VALID_BACKGROUNDS: readonly Background[] = ["new", "other_lang", "some_cpp"];
export const VALID_MOTIVATIONS: readonly Motivation[] = [
  "interviews",
  "school",
  "gamedev",
  "systems",
  "competitive",
  "curious",
];
export const VALID_START_MODULES = Object.keys(MODULE_TITLES) as ModuleId[];
export const VALID_WEEKLY_GOALS = [1, 3, 5] as const;
export const VALID_STEPS: readonly Step[] = [
  "background",
  "motivation",
  "starting-point",
  "placement",
  "weekly-goal",
  "payoff",
];

function isBackground(value: unknown): value is Background {
  return VALID_BACKGROUNDS.includes(value as Background);
}

function isMotivation(value: unknown): value is Motivation {
  return VALID_MOTIVATIONS.includes(value as Motivation);
}

function isModuleId(value: unknown): value is ModuleId {
  return typeof value === "string" && VALID_START_MODULES.includes(value as ModuleId);
}

function isWeeklyGoal(value: unknown): value is (typeof VALID_WEEKLY_GOALS)[number] | null {
  return (
    value === null || (typeof value === "number" && VALID_WEEKLY_GOALS.includes(value as 1 | 3 | 5))
  );
}

function isPlacementScore(value: unknown): value is number | null {
  return (
    value === null ||
    (typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 5)
  );
}

/** Normalize persisted wizard state. Corrupt or impossible steps fall back safely. */
export function parseOnboardingState(raw: unknown): OnboardingState | null {
  if (typeof raw !== "object" || raw === null) return null;
  const s = raw as Record<string, unknown>;

  let step: Step = VALID_STEPS.includes(s.step as Step) ? (s.step as Step) : "background";
  if (step === "payoff") step = "weekly-goal";

  const background = isBackground(s.background) ? s.background : null;
  const motivation = isMotivation(s.motivation) ? s.motivation : null;
  const startModule = isModuleId(s.startModule) ? s.startModule : null;
  const weeklyGoal = isWeeklyGoal(s.weeklyGoal) ? s.weeklyGoal : null;
  const placementScore = isPlacementScore(s.placementScore) ? s.placementScore : null;
  const fastTrack = s.fastTrack === true;
  const placementTaken = s.placementTaken === true;
  const displayName = typeof s.displayName === "string" ? s.displayName : null;

  if (step === "motivation" && !background) step = "background";
  if (
    (step === "starting-point" || step === "placement" || step === "weekly-goal") &&
    !background
  ) {
    step = "background";
  }
  if (step === "starting-point" && !motivation) step = background ? "motivation" : "background";
  if (step === "placement" && background !== "some_cpp") {
    step = motivation ? "starting-point" : background ? "motivation" : "background";
  }
  if (step === "weekly-goal" && !startModule) {
    step = motivation ? "starting-point" : background ? "motivation" : "background";
  }

  return {
    ...INITIAL_STATE,
    step,
    background,
    motivation,
    startModule,
    fastTrack,
    placementTaken,
    placementScore,
    weeklyGoal,
    displayName,
  };
}

export function isOnboardingPayload(body: unknown): body is OnboardingPayload {
  if (typeof body !== "object" || body === null) return false;
  const b = body as Record<string, unknown>;
  if (!isBackground(b.background)) return false;
  if (!isMotivation(b.motivation)) return false;
  if (!isModuleId(b.startModule)) return false;
  if (typeof b.fastTrack !== "boolean") return false;
  if (typeof b.placementTaken !== "boolean") return false;
  if (!isPlacementScore(b.placementScore)) return false;
  if (!isWeeklyGoal(b.weeklyGoal)) return false;
  if (b.displayName !== null && typeof b.displayName !== "string") return false;
  return true;
}

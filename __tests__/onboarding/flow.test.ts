import { describe, expect, it } from "vitest";
import { INITIAL_STATE } from "@/lib/onboarding/types";
import { onboardingReducer, placeFromScore } from "@/lib/onboarding/reducer";
import { isOnboardingPayload, parseOnboardingState } from "@/lib/onboarding/validate";

describe("parseOnboardingState", () => {
  it("returns null for non-objects", () => {
    expect(parseOnboardingState(null)).toBeNull();
    expect(parseOnboardingState("nope")).toBeNull();
  });

  it("falls back when starting-point is missing background", () => {
    const parsed = parseOnboardingState({ step: "starting-point", motivation: "school" });
    expect(parsed?.step).toBe("background");
    expect(parsed?.background).toBeNull();
  });

  it("keeps a valid in-progress questionnaire", () => {
    const parsed = parseOnboardingState({
      step: "weekly-goal",
      background: "new",
      motivation: "curious",
      startModule: "intro-basics",
      fastTrack: false,
      placementTaken: false,
      placementScore: null,
      weeklyGoal: 3,
    });
    expect(parsed?.step).toBe("weekly-goal");
    expect(parsed?.weeklyGoal).toBe(3);
    expect(parsed?.startModule).toBe("intro-basics");
  });

  it("rejects unknown start modules and weekly goals", () => {
    const parsed = parseOnboardingState({
      step: "weekly-goal",
      background: "new",
      motivation: "curious",
      startModule: "not-a-module",
      weeklyGoal: 2,
    });
    expect(parsed?.step).toBe("starting-point");
    expect(parsed?.startModule).toBeNull();
    expect(parsed?.weeklyGoal).toBeNull();
  });

  it("does not resume placement unless background is some_cpp", () => {
    const parsed = parseOnboardingState({
      step: "placement",
      background: "new",
      motivation: "school",
    });
    expect(parsed?.step).toBe("starting-point");
  });
});

describe("isOnboardingPayload", () => {
  const valid = {
    background: "other_lang",
    motivation: "interviews",
    startModule: "intro-basics",
    fastTrack: true,
    placementTaken: false,
    placementScore: null,
    weeklyGoal: null,
    displayName: null,
  };

  it("accepts a complete payload", () => {
    expect(isOnboardingPayload(valid)).toBe(true);
  });

  it("rejects weekly goals outside 1/3/5", () => {
    expect(isOnboardingPayload({ ...valid, weeklyGoal: 4 })).toBe(false);
  });

  it("rejects unknown modules", () => {
    expect(isOnboardingPayload({ ...valid, startModule: "functions-debugging" })).toBe(false);
  });
});

describe("onboardingReducer", () => {
  it("walks the new-programmer path to weekly-goal", () => {
    let state = INITIAL_STATE;
    state = onboardingReducer(state, { type: "SET_BACKGROUND", value: "new" });
    state = onboardingReducer(state, { type: "SET_MOTIVATION", value: "curious" });
    state = onboardingReducer(state, { type: "SET_START_MODULE", module: "intro-basics" });
    expect(state.step).toBe("weekly-goal");
    expect(state.startModule).toBe("intro-basics");
    expect(state.fastTrack).toBe(false);
  });

  it("goes back from weekly-goal to starting-point, not placement", () => {
    const state = onboardingReducer(
      { ...INITIAL_STATE, step: "weekly-goal", placementTaken: true },
      { type: "GO_BACK" },
    );
    expect(state.step).toBe("starting-point");
  });

  it("places from score", () => {
    expect(placeFromScore(0)).toBe("refs-pointers");
    expect(placeFromScore(3)).toBe("vectors-arrays");
    expect(placeFromScore(5)).toBe("adv-functions");
  });

  it("hydrates a restored snapshot", () => {
    const restored = parseOnboardingState({
      step: "motivation",
      background: "some_cpp",
    });
    expect(restored).not.toBeNull();
    const state = onboardingReducer(INITIAL_STATE, { type: "HYDRATE", state: restored! });
    expect(state.step).toBe("motivation");
    expect(state.background).toBe("some_cpp");
  });
});

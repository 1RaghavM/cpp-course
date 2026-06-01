"use client";

import { Suspense, useReducer, useEffect, useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { onboardingReducer } from "@/lib/onboarding/reducer";
import { INITIAL_STATE } from "@/lib/onboarding/types";
import { saveOnboardingState, loadOnboardingState } from "@/lib/onboarding/storage";
import { trackEvent } from "@/lib/onboarding/analytics";
import { StepBackground } from "@/components/onboarding/StepBackground";
import { StepMotivation } from "@/components/onboarding/StepMotivation";
import { StepStartingPoint } from "@/components/onboarding/StepStartingPoint";
import { StepWeeklyGoal } from "@/components/onboarding/StepWeeklyGoal";
import { StepPayoff } from "@/components/onboarding/StepPayoff";
import { PlacementQuiz } from "@/components/onboarding/PlacementQuiz";
import type { Action } from "@/lib/onboarding/types";

function OnboardingFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPayoff = searchParams.get("step") === "payoff";

  const [state, rawDispatch] = useReducer(
    onboardingReducer,
    INITIAL_STATE,
    (initial) => loadOnboardingState() ?? initial,
  );

  const [payoffData, setPayoffData] = useState<{
    firstName: string | null;
    startModule: string;
    motivation: string;
  } | null>(null);

  useEffect(() => {
    trackEvent("onboarding_started");
  }, []);

  useEffect(() => {
    if (!isPayoff) {
      saveOnboardingState(state);
    }
  }, [state, isPayoff]);

  useEffect(() => {
    if (isPayoff) {
      fetch("/api/onboarding")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) {
            setPayoffData({
              firstName: data.firstName ?? null,
              startModule: data.startModule,
              motivation: data.motivation,
            });
          }
        })
        .catch(() => {});
    }
  }, [isPayoff]);

  const dispatch = useCallback(
    (action: Action) => {
      rawDispatch(action);

      if (action.type === "SET_BACKGROUND") {
        trackEvent("onboarding_q_answered", { step: "background", value: action.value });
      } else if (action.type === "SET_MOTIVATION") {
        trackEvent("onboarding_q_answered", { step: "motivation", value: action.value });
      } else if (action.type === "SET_START_MODULE") {
        trackEvent("onboarding_q_answered", {
          step: "start",
          value: action.module,
          fastTrack: action.fastTrack,
        });
      } else if (action.type === "SET_WEEKLY_GOAL") {
        trackEvent("goal_set", { weeklyGoal: action.value });
        setTimeout(() => router.push("/register"), 0);
      }
    },
    [router],
  );

  const handleBack = useCallback(() => {
    rawDispatch({ type: "GO_BACK" });
  }, []);

  if (isPayoff && payoffData) {
    return (
      <StepPayoff
        firstName={payoffData.firstName}
        startModule={payoffData.startModule}
        motivation={payoffData.motivation}
      />
    );
  }

  if (isPayoff && !payoffData) {
    return (
      <div className="ob-step">
        <p className="ob-subtext">Loading...</p>
      </div>
    );
  }

  switch (state.step) {
    case "background":
      return <StepBackground dispatch={dispatch} />;
    case "motivation":
      return <StepMotivation dispatch={dispatch} onBack={handleBack} />;
    case "starting-point":
      return (
        <StepStartingPoint background={state.background!} dispatch={dispatch} onBack={handleBack} />
      );
    case "placement":
      return <PlacementQuiz dispatch={dispatch} onBack={handleBack} />;
    case "weekly-goal":
      return <StepWeeklyGoal dispatch={dispatch} onBack={handleBack} />;
    default:
      return <StepBackground dispatch={dispatch} />;
  }
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="ob-step">
          <p className="ob-subtext">Loading...</p>
        </div>
      }
    >
      <OnboardingFlow />
    </Suspense>
  );
}

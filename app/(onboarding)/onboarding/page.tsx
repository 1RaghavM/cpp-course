"use client";

import { Suspense, useReducer, useEffect, useCallback, useState, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { onboardingReducer } from "@/lib/onboarding/reducer";
import { INITIAL_STATE } from "@/lib/onboarding/types";
import { saveOnboardingState, loadOnboardingState } from "@/lib/onboarding/storage";
import { saveOnboardingPayload } from "@/lib/onboarding/sync";
import { trackEvent } from "@/lib/onboarding/analytics";
import { StepBackground } from "@/components/onboarding/StepBackground";
import { StepMotivation } from "@/components/onboarding/StepMotivation";
import { StepStartingPoint } from "@/components/onboarding/StepStartingPoint";
import { StepWeeklyGoal } from "@/components/onboarding/StepWeeklyGoal";
import { StepPayoff } from "@/components/onboarding/StepPayoff";
import { PlacementQuiz } from "@/components/onboarding/PlacementQuiz";
import { createBrowserClient } from "@/lib/supabase/client";
import type { Action } from "@/lib/onboarding/types";

function LoadingStep({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="ob-step">
      <p className="ob-subtext">{label}</p>
    </div>
  );
}

function OnboardingFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPayoff = searchParams.get("step") === "payoff";

  const [state, rawDispatch] = useReducer(onboardingReducer, INITIAL_STATE);
  const [ready, setReady] = useState(false);
  const [payoffData, setPayoffData] = useState<{
    firstName: string | null;
    startModule: string;
    motivation: string;
  } | null>(null);
  const [payoffError, setPayoffError] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const finishingRef = useRef(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      if (isPayoff) {
        try {
          const res = await fetch("/api/onboarding");
          if (cancelled) return;
          if (res.status === 401) {
            router.replace("/login");
            return;
          }
          if (!res.ok) {
            setPayoffError(true);
            setReady(true);
            return;
          }
          const data = (await res.json()) as {
            firstName?: string | null;
            startModule: string;
            motivation: string;
          };
          setPayoffData({
            firstName: data.firstName ?? null,
            startModule: data.startModule,
            motivation: data.motivation,
          });
        } catch {
          if (!cancelled) setPayoffError(true);
        }
        if (!cancelled) setReady(true);
        return;
      }

      const saved = loadOnboardingState();
      if (saved && !cancelled) {
        rawDispatch({ type: "HYDRATE", state: saved });
      }
      if (!cancelled) {
        setReady(true);
        trackEvent("onboarding_started");
      }

      const supabase = createBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled || !session) return;

      try {
        const res = await fetch("/api/onboarding");
        if (cancelled) return;
        if (res.ok) {
          router.replace("/dashboard");
        }
      } catch {
        // stay on wizard if the lookup fails
      }
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, [isPayoff, router]);

  useEffect(() => {
    if (!ready || isPayoff) return;
    saveOnboardingState(state);
  }, [state, isPayoff, ready]);

  const finishOnboarding = useCallback(
    async (weeklyGoal: number | null) => {
      if (finishingRef.current) return;
      finishingRef.current = true;
      setFinishing(true);

      const next = onboardingReducer(stateRef.current, {
        type: "SET_WEEKLY_GOAL",
        value: weeklyGoal,
      });
      rawDispatch({ type: "SET_WEEKLY_GOAL", value: weeklyGoal });
      saveOnboardingState(next);
      trackEvent("goal_set", { weeklyGoal });

      const supabase = createBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        const result = await saveOnboardingPayload();
        if (result.status === "applied") {
          router.replace("/onboarding?step=payoff");
          return;
        }
        router.replace("/dashboard");
        return;
      }

      router.push("/register");
    },
    [router],
  );

  const dispatch = useCallback(
    (action: Action) => {
      if (action.type === "SET_WEEKLY_GOAL") {
        void finishOnboarding(action.value);
        return;
      }

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
      }
    },
    [finishOnboarding],
  );

  const handleBack = useCallback(() => {
    rawDispatch({ type: "GO_BACK" });
  }, []);

  if (!ready) {
    return <LoadingStep />;
  }

  if (isPayoff && payoffError) {
    return (
      <div className="ob-step">
        <h1 className="ob-heading">Couldn&rsquo;t load your plan.</h1>
        <p className="ob-subtext">Your account is ready — you can pick up from the dashboard.</p>
        <Link href="/dashboard" className="ob-primary-btn">
          Go to dashboard
        </Link>
      </div>
    );
  }

  if (isPayoff && payoffData) {
    return (
      <StepPayoff
        firstName={payoffData.firstName}
        startModule={payoffData.startModule}
        motivation={payoffData.motivation}
      />
    );
  }

  if (isPayoff) {
    return <LoadingStep />;
  }

  switch (state.step) {
    case "background":
      return <StepBackground dispatch={dispatch} />;
    case "motivation":
      return <StepMotivation dispatch={dispatch} onBack={handleBack} />;
    case "starting-point":
      if (!state.background) return <StepBackground dispatch={dispatch} />;
      return (
        <StepStartingPoint background={state.background} dispatch={dispatch} onBack={handleBack} />
      );
    case "placement":
      return <PlacementQuiz dispatch={dispatch} onBack={handleBack} />;
    case "weekly-goal":
      return <StepWeeklyGoal dispatch={dispatch} onBack={handleBack} busy={finishing} />;
    default:
      return <StepBackground dispatch={dispatch} />;
  }
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<LoadingStep />}>
      <OnboardingFlow />
    </Suspense>
  );
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { syncOnboardingFromStorage } from "@/lib/onboarding/sync";

/** Runs after login/signup to save a pending questionnaire without clobbering existing accounts. */
export function OnboardingSync() {
  const router = useRouter();

  useEffect(() => {
    const ac = new AbortController();

    void (async () => {
      const result = await syncOnboardingFromStorage(ac.signal);
      if (ac.signal.aborted) return;
      if (result.status === "applied") {
        router.replace("/onboarding?step=payoff");
      }
    })();

    return () => ac.abort();
  }, [router]);

  return null;
}

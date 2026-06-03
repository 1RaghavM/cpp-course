import { trackEvent as statsigTrack } from "@/lib/statsig/track";
import type { EventMap, EventName } from "@/lib/statsig/events";

type LegacyEventName =
  | "onboarding_started"
  | "onboarding_q_answered"
  | "placement_started"
  | "placement_completed"
  | "goal_set"
  | "first_lesson_opened"
  | "onboarding_abandoned";

const LEGACY_TO_NEW: Partial<Record<LegacyEventName, EventName>> = {
  onboarding_started: "onboarding_started",
  onboarding_abandoned: "onboarding_abandoned",
};

export function trackEvent(name: LegacyEventName, props?: Record<string, unknown>): void {
  const mapped = LEGACY_TO_NEW[name];

  if (mapped) {
    statsigTrack(mapped, (props ?? {}) as EventMap[typeof mapped]);
    return;
  }

  // Legacy events not yet mapped to the new taxonomy log in dev only
  if (process.env.NODE_ENV === "development") {
    console.log(`[analytics:legacy] ${name}`, props ?? "");
  }
}

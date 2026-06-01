export type EventName =
  | "onboarding_started"
  | "onboarding_q_answered"
  | "placement_started"
  | "placement_completed"
  | "goal_set"
  | "first_lesson_opened"
  | "onboarding_abandoned";

export function trackEvent(name: EventName, props?: Record<string, unknown>): void {
  if (process.env.NODE_ENV === "development") {
    console.log(`[analytics] ${name}`, props ?? "");
  }
}

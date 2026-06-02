export type DashboardEvent =
  | "dashboard_viewed"
  | "resume_clicked"
  | "stage_clicked"
  | "tutor_opened"
  | "review_clicked"
  | "locked_stage_clicked"
  | "locked_stage_continued";

export function trackDashboardEvent(name: DashboardEvent, props?: Record<string, unknown>): void {
  if (process.env.NODE_ENV === "development") {
    console.log(`[analytics] ${name}`, props ?? "");
  }
}

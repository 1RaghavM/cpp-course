import type { StatsigUser } from "@statsig/client-core";

export type StatsigUserParams = {
  userID: string;
  accountAgeDays: number;
  platform: string;
  appVersion: string;
  skillLevel?: string;
  weeklyGoal?: string;
  currentModuleId?: string;
  lessonsCompleted: number;
  streakDays: number;
  hasCompletedOnboarding: boolean;
};

export function bucketLessonsCompleted(count: number): "0" | "1-3" | "4-10" | "11+" {
  if (count === 0) return "0";
  if (count <= 3) return "1-3";
  if (count <= 10) return "4-10";
  return "11+";
}

export function bucketStreakDays(days: number): "0" | "1-3" | "4-7" | "8+" {
  if (days === 0) return "0";
  if (days <= 3) return "1-3";
  if (days <= 7) return "4-7";
  return "8+";
}

export function buildStatsigUser(params: StatsigUserParams): StatsigUser {
  return {
    userID: params.userID,
    appVersion: params.appVersion,
    custom: {
      account_age_days: params.accountAgeDays,
      platform: params.platform,
      app_version: params.appVersion,
      skill_level: params.skillLevel,
      weekly_goal: params.weeklyGoal,
      current_module_id: params.currentModuleId,
      lessons_completed_bucket: bucketLessonsCompleted(params.lessonsCompleted),
      streak_days_bucket: bucketStreakDays(params.streakDays),
      has_completed_onboarding: params.hasCompletedOnboarding,
    },
  };
}

export function buildAnonymousUser(stableID: string): StatsigUser {
  return {
    customIDs: { stableID },
  };
}

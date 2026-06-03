import { useExperiment } from '@statsig/react-bindings';
import Statsig from 'statsig-node';

export const EXPERIMENTS = {
  ONBOARDING_LENGTH: 'onboarding_length',
  PROACTIVE_TUTOR: 'proactive_tutor',
  FIRST_EXERCISE_DIFFICULTY: 'first_exercise_difficulty',
  DASHBOARD_RECOMMENDED_NEXT: 'dashboard_recommended_next',
  LESSON_SUMMARY_LENGTH: 'lesson_summary_length',
} as const;

export type ExperimentName = (typeof EXPERIMENTS)[keyof typeof EXPERIMENTS];

export function useExperimentValue<T>(
  experiment: ExperimentName,
  param: string,
  defaultValue: T,
): T {
  const exp = useExperiment(experiment);
  return exp.get(param, defaultValue) as T;
}

export async function getExperimentServer<T>(
  userId: string,
  experiment: ExperimentName,
  param: string,
  defaultValue: T,
): Promise<T> {
  const exp = Statsig.getExperiment({ userID: userId }, experiment);
  return exp.get(param, defaultValue) as T;
}

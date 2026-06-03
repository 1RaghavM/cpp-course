import { useGateValue } from '@statsig/react-bindings';
import Statsig from 'statsig-node';

export const GATES = {
  TUTOR_ENABLED: 'tutor_enabled',
  TUTOR_PROACTIVE_PROMPTS: 'tutor_proactive_prompts',
  NEW_ONBOARDING_FLOW: 'new_onboarding_flow',
  DASHBOARD_RECOMMENDED_NEXT: 'dashboard_recommended_next',
  EDITOR_V2: 'editor_v2',
} as const;

export type GateName = (typeof GATES)[keyof typeof GATES];

export function useGate(gate: GateName): boolean {
  return useGateValue(gate);
}

export async function checkGateServer(userId: string, gate: GateName): Promise<boolean> {
  return Statsig.checkGate({ userID: userId }, gate);
}

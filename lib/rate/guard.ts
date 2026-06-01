import { TUTOR_CONFIG } from "@/lib/ai/config";

export interface GuardInput {
  minuteCount: number;
  dailyCount: number;
  monthSpendMicro: number;
  conversationSpendMicro: number;
}

export interface GuardResult {
  allowed: boolean;
  code?: "RATE_LIMITED" | "BUDGET_EXCEEDED" | "CONVERSATION_LIMIT";
  message?: string;
}

export function checkRateAndBudget(input: GuardInput): GuardResult {
  if (input.minuteCount >= TUTOR_CONFIG.perMinMsgCap) {
    return {
      allowed: false,
      code: "RATE_LIMITED",
      message: `Slow down — max ${TUTOR_CONFIG.perMinMsgCap} messages per minute. Try again shortly.`,
    };
  }

  if (input.dailyCount >= TUTOR_CONFIG.dailyMsgCap) {
    return {
      allowed: false,
      code: "RATE_LIMITED",
      message: `You've used all ${TUTOR_CONFIG.dailyMsgCap} messages for today. Come back tomorrow!`,
    };
  }

  if (input.conversationSpendMicro >= TUTOR_CONFIG.maxConvoCostMicro) {
    return {
      allowed: false,
      code: "CONVERSATION_LIMIT",
      message: "This conversation has reached its cost limit. Start a new one to continue.",
    };
  }

  if (input.monthSpendMicro >= TUTOR_CONFIG.monthlyHardCapMicro) {
    return {
      allowed: false,
      code: "BUDGET_EXCEEDED",
      message: "The tutor has reached its monthly budget. Your editor and lessons still work.",
    };
  }

  if (input.monthSpendMicro >= TUTOR_CONFIG.monthlySoftCapMicro) {
    console.warn(
      `Tutor monthly spend at $${(input.monthSpendMicro / 1_000_000).toFixed(2)} — approaching hard cap`,
    );
  }

  return { allowed: true };
}

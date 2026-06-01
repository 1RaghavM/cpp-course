const env = process.env;

export const TUTOR_CONFIG = {
  dailyMsgCap: Number(env.TUTOR_DAILY_MSG_CAP ?? 50),
  perMinMsgCap: Number(env.TUTOR_PER_MIN_MSG_CAP ?? 8),
  monthlyHardCapMicro: Number(env.TUTOR_MONTHLY_HARD_CAP_USD ?? 50) * 1_000_000,
  monthlySoftCapMicro: Number(env.TUTOR_MONTHLY_SOFT_CAP_USD ?? 30) * 1_000_000,
  maxConvoCostMicro: Number(env.TUTOR_MAX_CONVO_COST_USD ?? 0.05) * 1_000_000,
  contextTokenBudget: Number(env.TUTOR_CONTEXT_TOKEN_BUDGET ?? 12_000),
  maxOutputTokens: Number(env.TUTOR_MAX_OUTPUT_TOKENS ?? 1024),
  maxInputBytes: 64 * 1024,
} as const;

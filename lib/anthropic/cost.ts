import type { AppSupabaseClient } from '@/lib/supabase/types';

// ---------------------------------------------------------------------------
// Pricing (per million tokens, USD)
// ---------------------------------------------------------------------------

const PRICING: Record<string, { input: number; output: number }> = {
  'claude-sonnet-4-6': { input: 3.0, output: 15.0 },
  'claude-haiku-4-5': { input: 1.0, output: 5.0 },
};

/** Cached input tokens are billed at 10 % of the base input rate. */
const CACHE_DISCOUNT = 0.1;

// ---------------------------------------------------------------------------
// Cost computation
// ---------------------------------------------------------------------------

/**
 * Compute the cost of an LLM call in **microdollars** (1 USD = 1,000,000 micro).
 *
 * Uses bigint arithmetic to avoid floating-point drift on very small amounts.
 *
 * Math:
 *   pricePerMTok is dollars per million tokens.
 *   1 token costs (pricePerMTok / 1,000,000) dollars
 *                = (pricePerMTok / 1,000,000) * 1,000,000 microdollars
 *                = pricePerMTok microdollars.
 *   So: microUSD = tokens * pricePerMTok   (exact for integer prices).
 *
 * For cached input tokens the effective rate is baseInput * CACHE_DISCOUNT.
 */
export function computeCostMicro(
  model: string,
  tokensIn: number,
  tokensOut: number,
  cachedIn: number,
): bigint {
  const pricing = PRICING[model];
  if (!pricing) {
    throw new Error(`Unknown model for pricing: ${model}`);
  }

  const inputMicro = BigInt(Math.round(tokensIn * pricing.input));
  const outputMicro = BigInt(Math.round(tokensOut * pricing.output));
  const cachedMicro = BigInt(
    Math.round(cachedIn * pricing.input * CACHE_DISCOUNT),
  );

  return inputMicro + outputMicro + cachedMicro;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CallType = 'lesson_summary' | 'exercise_gen' | 'tutor' | 'other';

export interface TokenUsageParams {
  callType: CallType;
  model: string;
  tokensIn: number;
  tokensOut: number;
  cachedIn: number;
  lessonId?: string;
}

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------

/** Cost threshold for a console.warn (microdollars). $0.10 = 100,000 micro. */
const EXPENSIVE_CALL_THRESHOLD = BigInt(100000);

/**
 * Compute cost and insert a row into `token_usage`. Fires a console.warn
 * when a single call exceeds $0.10.
 */
export async function logTokenUsage(
  supabase: AppSupabaseClient,
  params: TokenUsageParams,
): Promise<void> {
  const costMicro = computeCostMicro(
    params.model,
    params.tokensIn,
    params.tokensOut,
    params.cachedIn,
  );

  if (costMicro > EXPENSIVE_CALL_THRESHOLD) {
    console.warn(
      `Expensive LLM call: $${Number(costMicro) / 1000000} (${params.callType})`,
    );
  }

  const { error } = await supabase.from('token_usage').insert({
    call_type: params.callType,
    model: params.model,
    tokens_in: params.tokensIn,
    tokens_out: params.tokensOut,
    cached_in: params.cachedIn,
    cost_usd_micro: Number(costMicro),
    lesson_id: params.lessonId ?? null,
  });

  if (error) {
    console.error('Failed to log token usage:', error);
  }
}

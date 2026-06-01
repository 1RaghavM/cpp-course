const PRICING: Record<string, { input: number; output: number; cachedInput: number }> = {
  'claude-sonnet-4-6': { input: 3.0, output: 15.0, cachedInput: 2.7 },
  'claude-haiku-4-5': { input: 1.0, output: 5.0, cachedInput: 0.9 },
  'gemini-2.5-flash': { input: 0.15, output: 0.60, cachedInput: 0.04 },
};

export function computeTutorCostMicro(
  model: string,
  promptTokens: number,
  completionTokens: number,
): bigint {
  const p = PRICING[model];
  if (!p) throw new Error(`Unknown model for pricing: ${model}`);
  const inputMicro = BigInt(Math.round(promptTokens * p.input));
  const outputMicro = BigInt(Math.round(completionTokens * p.output));
  return inputMicro + outputMicro;
}

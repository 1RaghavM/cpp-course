import type { TextBlockParam } from '@anthropic-ai/sdk/resources/messages';

/**
 * Adds `cache_control: { type: 'ephemeral' }` to a text content block so
 * Anthropic's prompt caching applies to it. Successive calls that include the
 * same cached prefix pay only 10% of the normal input-token rate.
 */
export function withCache(block: TextBlockParam): TextBlockParam {
  return { ...block, cache_control: { type: 'ephemeral' } };
}

/**
 * Build a system message array with caching applied correctly:
 * - The static system instruction gets `cache_control` (shared across all calls of the same type)
 * - The lesson/context block gets its own `cache_control` (shared across turns in one conversation)
 */
export function buildCachedSystemBlocks(
  systemInstruction: string,
  contextBlock?: string,
): TextBlockParam[] {
  const blocks: TextBlockParam[] = [
    withCache({ type: 'text', text: systemInstruction }),
  ];

  if (contextBlock) {
    blocks.push(withCache({ type: 'text', text: contextBlock }));
  }

  return blocks;
}

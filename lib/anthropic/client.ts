import Anthropic from '@anthropic-ai/sdk';
import type {
  Message,
  MessageParam,
  TextBlockParam,
} from '@anthropic-ai/sdk/resources/messages';
import type { MessageStream } from '@anthropic-ai/sdk/lib/MessageStream';
import type { AppSupabaseClient } from '@/lib/supabase/types';
import { logTokenUsage, type CallType } from './cost';

// ---------------------------------------------------------------------------
// Singleton SDK client
// ---------------------------------------------------------------------------

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export interface CompletionParams {
  model: string;
  system: TextBlockParam[];
  messages: MessageParam[];
  maxTokens: number;
  temperature?: number;
}

export interface CompletionMeta {
  callType: CallType;
  lessonId?: string;
  userId?: string;
  supabase: AppSupabaseClient;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractUsage(message: Message): {
  tokensIn: number;
  tokensOut: number;
  cachedIn: number;
} {
  return {
    tokensIn: message.usage.input_tokens,
    tokensOut: message.usage.output_tokens,
    cachedIn: message.usage.cache_read_input_tokens ?? 0,
  };
}

// ---------------------------------------------------------------------------
// createCompletion — non-streaming, returns full Message
// ---------------------------------------------------------------------------

/**
 * Make a non-streaming Anthropic API call. Logs token usage automatically.
 *
 * Use for lesson summary and exercise generation where we need the full
 * response before continuing.
 */
export async function createCompletion(
  params: CompletionParams,
  meta: CompletionMeta,
): Promise<Message> {
  const response = await anthropic.messages.create({
    model: params.model,
    max_tokens: params.maxTokens,
    system: params.system,
    messages: params.messages,
    temperature: params.temperature,
  });

  const usage = extractUsage(response);

  // Fire-and-forget: don't block on the DB insert
  logTokenUsage(meta.supabase, {
    callType: meta.callType,
    model: params.model,
    ...usage,
    lessonId: meta.lessonId,
    userId: meta.userId,
  }).catch((err: unknown) => {
    console.error('Token usage logging failed:', err);
  });

  return response;
}

// ---------------------------------------------------------------------------
// streamCompletion — streaming for SSE (tutor), returns MessageStream
// ---------------------------------------------------------------------------

/**
 * Make a streaming Anthropic API call. Returns the `MessageStream` so the
 * caller can pipe SSE events to the client.
 *
 * Token usage is logged automatically after the stream completes (from the
 * `finalMessage` event).
 */
export function streamCompletion(
  params: CompletionParams,
  meta: CompletionMeta,
): MessageStream {
  const stream = anthropic.messages.stream({
    model: params.model,
    max_tokens: params.maxTokens,
    system: params.system,
    messages: params.messages,
    temperature: params.temperature,
  });

  // Log usage once the stream is fully consumed.
  stream.on('finalMessage', (message: Message) => {
    const usage = extractUsage(message);
    logTokenUsage(meta.supabase, {
      callType: meta.callType,
      model: params.model,
      ...usage,
      lessonId: meta.lessonId,
      userId: meta.userId,
    }).catch((err: unknown) => {
      console.error('Token usage logging failed (stream):', err);
    });
  });

  return stream;
}

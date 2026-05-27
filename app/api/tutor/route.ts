import { NextResponse } from 'next/server';
import type { MessageParam } from '@anthropic-ai/sdk/resources/messages';
import { createRouteClient, createServiceClient } from '@/lib/supabase/server';
import { requireOwner } from '@/lib/auth/owner-only';
import { streamCompletion } from '@/lib/anthropic/client';
import { buildTutorPrompt } from '@/lib/anthropic/prompts';

export const dynamic = 'force-dynamic';

const T4_TRIGGERS = ['show me', 'give me the answer', 'just tell me', 'i give up'];

function computeHintTier(turnCount: number, userMessage: string): number {
  const lower = userMessage.toLowerCase();
  if (T4_TRIGGERS.some((t) => lower.includes(t))) return 4;
  if (turnCount >= 7) return 4;
  if (turnCount >= 5) return 3;
  if (turnCount >= 3) return 2;
  return 1;
}

export async function POST(request: Request) {
  const authClient = createRouteClient();
  const authResult = await requireOwner(authClient);
  if (authResult instanceof NextResponse) return authResult;

  const supabase = createServiceClient();

  const body = await request.json();
  const {
    lesson_id,
    conversation_id,
    content,
    current_code,
    last_submission_id,
  } = body as {
    lesson_id: string;
    conversation_id?: string;
    content: string;
    current_code?: string;
    last_submission_id?: string;
  };

  if (!lesson_id || !content) {
    return NextResponse.json({ error: 'lesson_id and content are required' }, { status: 400 });
  }

  let convId = conversation_id;

  if (!convId) {
    const title = content.length > 60 ? content.slice(0, 60) + '...' : content;
    const { data: conv, error } = await supabase
      .from('conversations')
      .insert({ lesson_id, title })
      .select('id')
      .single();
    if (error || !conv) {
      return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
    }
    convId = conv.id;
  }

  await supabase.from('messages').insert({
    conversation_id: convId,
    role: 'user',
    content,
  });

  const { data: existingMessages } = await supabase
    .from('messages')
    .select('role, content')
    .eq('conversation_id', convId)
    .order('created_at', { ascending: true });

  const turnCount = (existingMessages ?? []).filter((m) => m.role === 'user').length;
  const tier = computeHintTier(turnCount, content);

  const { data: lesson } = await supabase
    .from('lessons')
    .select('summary_md')
    .eq('id', lesson_id)
    .single();

  let exercisePrompt = '';
  const { data: exercises } = await supabase
    .from('exercises')
    .select('prompt_md')
    .eq('lesson_id', lesson_id)
    .order('sort_order', { ascending: true })
    .limit(1);
  if (exercises && exercises.length > 0) {
    exercisePrompt = exercises[0]?.prompt_md ?? '';
  }

  let lastOutput = '';
  if (last_submission_id) {
    const { data: sub } = await supabase
      .from('submissions')
      .select('stdout, stderr, compile_output')
      .eq('id', last_submission_id)
      .single();
    if (sub) {
      lastOutput = [sub.compile_output, sub.stdout, sub.stderr].filter(Boolean).join('\n');
    }
  }

  const history: MessageParam[] = (existingMessages ?? []).map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));

  const promptPayload = buildTutorPrompt(
    tier,
    lesson?.summary_md ?? '',
    exercisePrompt,
    current_code ?? '',
    lastOutput,
    history,
  );

  const stream = streamCompletion(promptPayload, {
    callType: 'tutor',
    lessonId: lesson_id,
    supabase,
  });

  const encoder = new TextEncoder();
  let fullResponse = '';

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            const token = event.delta.text;
            fullResponse += token;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'token', content: token })}\n\n`),
            );
          }
        }

        const finalMessage = await stream.finalMessage();
        const usage = finalMessage.usage;

        const { data: assistantMsg } = await supabase
          .from('messages')
          .insert({
            conversation_id: convId,
            role: 'assistant',
            content: fullResponse,
            hint_tier: tier,
            tokens_in: usage.input_tokens,
            tokens_out: usage.output_tokens,
            cached_tokens_in: usage.cache_read_input_tokens ?? 0,
            model: promptPayload.model,
          })
          .select('id')
          .single();

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: 'done', message_id: assistantMsg?.id, hint_tier: tier })}\n\n`,
          ),
        );
        controller.close();
      } catch {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: 'error', message: 'Tutor unavailable, try Run instead' })}\n\n`,
          ),
        );
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

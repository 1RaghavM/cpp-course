import { NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/require-auth';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const supabase = createRouteClient();
  const authResult = await requireAuth(supabase);
  if (authResult instanceof NextResponse) return authResult;

  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .select('id, lesson_id, title')
    .eq('id', params.id)
    .single();

  if (convError || !conversation) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }

  const { data: messages, error: msgError } = await supabase
    .from('messages')
    .select('id, role, content, hint_tier, created_at')
    .eq('conversation_id', params.id)
    .order('created_at', { ascending: true });

  if (msgError) {
    return NextResponse.json({ error: 'Failed to load messages' }, { status: 500 });
  }

  return NextResponse.json({
    id: conversation.id,
    lessonId: conversation.lesson_id,
    title: conversation.title,
    messages: (messages ?? []).map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      hintTier: m.hint_tier,
      createdAt: m.created_at,
    })),
  });
}

import { NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/require-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const supabase = createRouteClient();
  const authResult = await requireAuth(supabase);
  if (authResult instanceof NextResponse) return authResult;

  const { searchParams } = new URL(request.url);
  const lessonId = searchParams.get('lesson_id');

  if (!lessonId) {
    return NextResponse.json({ error: 'lesson_id is required' }, { status: 400 });
  }

  const { data: conversations, error } = await supabase
    .from('conversations')
    .select('id, title, created_at')
    .eq('lesson_id', lessonId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Failed to load conversations' }, { status: 500 });
  }

  const results = await Promise.all(
    (conversations ?? []).map(async (conv) => {
      const { count } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('conversation_id', conv.id);

      return {
        id: conv.id,
        title: conv.title,
        createdAt: conv.created_at,
        messageCount: count ?? 0,
      };
    }),
  );

  return NextResponse.json(results);
}

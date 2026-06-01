import { NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/require-auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const supabase = createRouteClient();
  const authResult = await requireAuth(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const userId = authResult.session.user.id;

  const body = await request.json();
  const { lessonId } = body as { lessonId?: string };

  if (!lessonId) {
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: 'lessonId required' } },
      { status: 400 },
    );
  }

  const { error } = await supabase
    .from('conversations')
    .update({ status: 'archived', updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .eq('status', 'active');

  if (error) {
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: 'Reset failed' } },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true });
}

import { NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/require-auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const supabase = createRouteClient();
  const authResult = await requireAuth(supabase);
  if (authResult instanceof NextResponse) return authResult;

  const body = await request.json();
  const { messageId, value } = body as { messageId?: string; value?: string };

  if (!messageId || !value || !['up', 'down'].includes(value)) {
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: 'messageId and value (up|down) required' } },
      { status: 400 },
    );
  }

  const { error } = await supabase
    .from('messages')
    .update({ feedback: value })
    .eq('id', messageId);

  if (error) {
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: 'Message not found or update failed' } },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true });
}

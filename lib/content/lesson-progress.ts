import type { AppSupabaseClient } from '@/lib/supabase/types';

/**
 * Updates visit progress for the signed-in user without blocking the caller.
 * Safe to call fire-and-forget on lesson page load; failures are logged only.
 */
export function touchLessonProgress(
  supabase: AppSupabaseClient,
  userId: string,
  lessonId: string,
): void {
  void (async () => {
    const { data: progress } = (await supabase
      .from('progress')
      .select('state')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .single()) as unknown as { data: { state: string } | null };

    const now = new Date().toISOString();

    if (!progress) {
      await supabase.from('progress').insert({
        user_id: userId,
        lesson_id: lessonId,
        state: 'in_progress',
        first_visit_at: now,
        last_visit_at: now,
      });
      return;
    }

    if (progress.state === 'not_started') {
      await supabase
        .from('progress')
        .update({
          state: 'in_progress',
          first_visit_at: now,
          last_visit_at: now,
        })
        .eq('user_id', userId)
        .eq('lesson_id', lessonId);
      return;
    }

    await supabase
      .from('progress')
      .update({ last_visit_at: now })
      .eq('user_id', userId)
      .eq('lesson_id', lessonId);
  })().catch((err: unknown) => {
    console.error('Failed to touch lesson progress:', err);
  });
}

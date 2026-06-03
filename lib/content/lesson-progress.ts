import type { AppSupabaseClient } from "@/lib/supabase/types";

/**
 * Updates visit progress for the signed-in user without blocking the caller.
 * Safe to call fire-and-forget on lesson page load; failures are logged only.
 */
export function touchLessonProgress(
  supabase: AppSupabaseClient,
  userId: string,
  lessonId: string,
  hasExercises: boolean = true,
): void {
  void (async () => {
    const { data: progress } = (await supabase
      .from("progress")
      .select("state")
      .eq("user_id", userId)
      .eq("lesson_id", lessonId)
      .single()) as unknown as { data: { state: string } | null };

    const now = new Date().toISOString();
    const newState = hasExercises ? "in_progress" : "completed";

    if (!progress) {
      await supabase.from("progress").insert({
        user_id: userId,
        lesson_id: lessonId,
        state: newState,
        first_visit_at: now,
        last_visit_at: now,
        ...(newState === "completed" ? { completed_at: now } : {}),
      });
      return;
    }

    if (progress.state === "completed") {
      await supabase
        .from("progress")
        .update({ last_visit_at: now })
        .eq("user_id", userId)
        .eq("lesson_id", lessonId);
      return;
    }

    if (progress.state === "not_started" || (!hasExercises && progress.state === "in_progress")) {
      await supabase
        .from("progress")
        .update({
          state: newState,
          first_visit_at: now,
          last_visit_at: now,
          ...(newState === "completed" ? { completed_at: now } : {}),
        })
        .eq("user_id", userId)
        .eq("lesson_id", lessonId);
      return;
    }

    await supabase
      .from("progress")
      .update({ last_visit_at: now })
      .eq("user_id", userId)
      .eq("lesson_id", lessonId);
  })().catch((err: unknown) => {
    console.error("Failed to touch lesson progress:", err);
  });
}

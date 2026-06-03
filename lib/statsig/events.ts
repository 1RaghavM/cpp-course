export type EventMap = {
  // Acquisition & Landing
  page_view: { path: string; referrer_category: string };
  roadmap_viewed: { entry_source: string };
  lesson_preview_viewed: { lesson_id: string; module_id: string };
  signup_cta_clicked: { location: "hero" | "navbar" | "lesson_gate" };

  // Auth & Onboarding
  signup_started: { method: "email" | "google" };
  signup_completed: { method: "email" | "google" };
  login: { method: "email" | "google" };
  onboarding_started: Record<string, never>;
  onboarding_step_viewed: { step_id: string; step_index: number };
  onboarding_question_answered: { question_id: string; answer_value: string };
  weekly_goal_set: { lessons_per_week: number };
  onboarding_completed: { duration_seconds_bucket: string; steps_count: number };
  onboarding_abandoned: { last_step_id: string };

  // Core Learning Loop
  lesson_viewed: {
    lesson_id: string;
    module_id: string;
    difficulty: string;
    curriculum_position: number;
    is_first_view: boolean;
  };
  lesson_summary_completed: { lesson_id: string; dwell_seconds_bucket: string };
  editor_opened: { exercise_id: string; lesson_id: string; difficulty: string };
  code_run: {
    exercise_id: string;
    run_index: number;
    compile_ok: boolean;
    runtime_bucket: string;
  };
  code_compile_failed: { exercise_id: string; error_category: string };
  exercise_submitted: { exercise_id: string; attempt_number: number };
  exercise_passed: {
    exercise_id: string;
    difficulty: string;
    attempts: number;
    time_to_pass_seconds_bucket: string;
    hints_used: number;
    tutor_used: boolean;
  };
  exercise_failed: {
    exercise_id: string;
    attempt_number: number;
    tests_passed: number;
    tests_total: number;
  };
  hint_revealed: { exercise_id: string; hint_index: number };
  solution_viewed: { exercise_id: string; attempts_before_reveal: number };
  exercise_abandoned: {
    exercise_id: string;
    attempts: number;
    dwell_seconds_bucket: string;
  };
  lesson_completed: { lesson_id: string; module_id: string };

  // AI Tutor
  tutor_opened: {
    context_type: "lesson" | "exercise";
    context_id: string;
    trigger: "manual" | "proactive";
  };
  tutor_message_sent: { context_type: "lesson" | "exercise"; message_index: number };
  tutor_response_received: {
    latency_ms_bucket: string;
    tokens_in: number;
    tokens_out: number;
    model: string;
  };
  tutor_feedback: { rating: "up" | "down" };
  tutor_closed: { messages_count: number; session_seconds_bucket: string };

  // Progression & Habit
  chapter_completed: { chapter_id: string; module_id: string; lessons_count: number };
  module_completed: { module_id: string; days_since_start_bucket: string };
  streak_extended: { streak_days: number };
  streak_broken: { previous_streak_days: number };
  weekly_goal_met: { lessons_completed: number };
  resume_clicked: { target_lesson_id: string };

  // Dashboard & Navigation
  dashboard_viewed: Record<string, never>;
  recommended_next_clicked: { lesson_id: string; reason: "struggled" | "next" };
  search_used: { result_count_bucket: string };
  settings_changed: { setting: string; value: string };

  // Errors & Performance
  app_error: { error_category: string; surface: string };
  editor_load_time: { ms_bucket: string };
  code_execution_timeout: { exercise_id: string };
  api_error: { endpoint_category: string; status: number };
};

export type EventName = keyof EventMap;

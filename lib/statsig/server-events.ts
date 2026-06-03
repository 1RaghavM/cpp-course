import { getServerStatsig } from "@/lib/statsig/server";

export async function logExercisePassed(
  userId: string,
  metadata: {
    exercise_id: string;
    difficulty: string;
    attempts: number;
    time_to_pass_seconds_bucket: string;
    hints_used: number;
    tutor_used: boolean;
  },
): Promise<void> {
  const statsig = await getServerStatsig();
  statsig.logEvent({ userID: userId }, "exercise_passed", null, {
    exercise_id: metadata.exercise_id,
    difficulty: metadata.difficulty,
    attempts: String(metadata.attempts),
    time_to_pass_seconds_bucket: metadata.time_to_pass_seconds_bucket,
    hints_used: String(metadata.hints_used),
    tutor_used: String(metadata.tutor_used),
  });
}

export async function logExerciseFailed(
  userId: string,
  metadata: {
    exercise_id: string;
    attempt_number: number;
    tests_passed: number;
    tests_total: number;
  },
): Promise<void> {
  const statsig = await getServerStatsig();
  statsig.logEvent({ userID: userId }, "exercise_failed", null, {
    exercise_id: metadata.exercise_id,
    attempt_number: String(metadata.attempt_number),
    tests_passed: String(metadata.tests_passed),
    tests_total: String(metadata.tests_total),
  });
}

export async function logLessonCompleted(
  userId: string,
  metadata: {
    lesson_id: string;
    module_id: string;
  },
): Promise<void> {
  const statsig = await getServerStatsig();
  statsig.logEvent({ userID: userId }, "lesson_completed", null, {
    lesson_id: metadata.lesson_id,
    module_id: metadata.module_id,
  });
}

export async function logTutorResponse(
  userId: string,
  metadata: {
    latency_ms_bucket: string;
    tokens_in: string;
    tokens_out: string;
    model: string;
  },
): Promise<void> {
  const statsig = await getServerStatsig();
  statsig.logEvent({ userID: userId }, "tutor_response_received", null, {
    latency_ms_bucket: metadata.latency_ms_bucket,
    tokens_in: metadata.tokens_in,
    tokens_out: metadata.tokens_out,
    model: metadata.model,
  });
}

export async function logApiError(
  userId: string | null,
  metadata: {
    endpoint_category: string;
    status: string;
  },
): Promise<void> {
  const statsig = await getServerStatsig();
  statsig.logEvent({ userID: userId ?? "anonymous" }, "api_error", null, {
    endpoint_category: metadata.endpoint_category,
    status: metadata.status,
  });
}

export async function logExecutionTimeout(
  userId: string,
  metadata: {
    exercise_id: string;
  },
): Promise<void> {
  const statsig = await getServerStatsig();
  statsig.logEvent({ userID: userId }, "code_execution_timeout", null, {
    exercise_id: metadata.exercise_id,
  });
}

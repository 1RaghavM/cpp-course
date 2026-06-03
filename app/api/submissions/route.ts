import { NextRequest, NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/require-auth";
import {
  submitCode,
  type CppStandard,
  type JudgeStatus,
  type SubmissionResult,
} from "@/lib/judge0/client";
import { evaluateTestCases, type TestCase } from "@/lib/judge0/verdict";
import type { Json } from "@/lib/supabase/types";
import {
  logExercisePassed,
  logExerciseFailed,
  logLessonCompleted,
  logExecutionTimeout,
} from "@/lib/statsig/server-events";

export const dynamic = "force-dynamic";

const MAX_SOURCE_SIZE = 50 * 1024; // 50 KB
const VALID_MODES = ["run", "submit"] as const;
const VALID_STANDARDS: CppStandard[] = ["c++17", "c++20", "c++23"];

type Mode = (typeof VALID_MODES)[number];

interface RequestBody {
  exercise_id: string;
  source_code: string;
  mode: Mode;
  language_std?: CppStandard;
}

export async function POST(request: NextRequest) {
  const authClient = createRouteClient();

  // ---- Auth guard -----------------------------------------------------------
  const authResult = await requireAuth(authClient);
  if (authResult instanceof NextResponse) return authResult;
  const userId = authResult.user.id;

  const supabase = authClient;

  // ---- Per-user rate limit (5 submissions per 60s) --------------------------
  const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString();
  const { count: recentSubmissionCount } = await supabase
    .from("submissions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", oneMinuteAgo);

  if ((recentSubmissionCount ?? 0) >= 5) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Max 5 submissions per minute." },
      { status: 429 },
    );
  }

  // ---- Parse & validate request body ----------------------------------------
  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { exercise_id, source_code, mode, language_std = "c++20" } = body;

  if (!exercise_id || typeof exercise_id !== "string") {
    return NextResponse.json({ error: "exercise_id is required" }, { status: 400 });
  }

  if (!source_code || typeof source_code !== "string") {
    return NextResponse.json(
      { error: "source_code is required and must be non-empty" },
      { status: 400 },
    );
  }

  if (Buffer.byteLength(source_code, "utf-8") > MAX_SOURCE_SIZE) {
    return NextResponse.json({ error: "Source code exceeds the 50 KB limit" }, { status: 400 });
  }

  if (mode !== "run" && mode !== "submit") {
    return NextResponse.json(
      { error: `mode must be one of: ${VALID_MODES.join(", ")}` },
      { status: 400 },
    );
  }

  if (language_std !== "c++17" && language_std !== "c++20" && language_std !== "c++23") {
    return NextResponse.json(
      { error: `language_std must be one of: ${VALID_STANDARDS.join(", ")}` },
      { status: 400 },
    );
  }

  // ---- Validate exercise exists ---------------------------------------------
  const { data: exercise, error: exerciseError } = await supabase
    .from("exercises")
    .select("id, lesson_id")
    .eq("id", exercise_id)
    .single();

  if (exerciseError || !exercise) {
    return NextResponse.json({ error: "Exercise not found" }, { status: 404 });
  }

  // ---- Mode: run ------------------------------------------------------------
  if (mode === "run") {
    const result = await submitCode({
      sourceCode: source_code,
      stdin: "",
      languageStd: language_std,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 502 });
    }

    const { data } = result;

    // Save submission (fire-and-forget is fine for logging)
    await supabase.from("submissions").insert({
      user_id: userId,
      exercise_id,
      mode: "run",
      language_std,
      source_code,
      status: data.status,
      stdout: data.stdout,
      stderr: data.stderr,
      compile_output: data.compileOutput,
      exit_code: data.exitCode,
      wall_time_ms: data.wallTimeMs,
    });

    await supabase
      .from("progress")
      .update({ last_code_snippet: source_code, last_visit_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("lesson_id", exercise.lesson_id)
      .then(() => {});

    return NextResponse.json({
      status: data.status,
      stdout: data.stdout,
      stderr: data.stderr,
      compileOutput: data.compileOutput,
      exitCode: data.exitCode,
      wallTimeMs: data.wallTimeMs,
    });
  }

  // ---- Mode: submit ---------------------------------------------------------

  // Load all test cases for this exercise
  const { data: dbTestCases, error: tcError } = await supabase
    .from("test_cases")
    .select("id, label, stdin, expected_stdout, sort_order")
    .eq("exercise_id", exercise_id)
    .order("sort_order", { ascending: true });

  if (tcError || !dbTestCases || dbTestCases.length === 0) {
    return NextResponse.json({ error: "No test cases found for this exercise" }, { status: 404 });
  }

  // Run each test case against Judge0
  const judgeResults: Array<{ stdout: string | null; status: JudgeStatus }> = [];
  let totalWallTimeMs = 0;
  let lastCompileOutput: string | null = null;
  let lastStderr: string | null = null;
  let compileErrorOccurred = false;

  for (const tc of dbTestCases) {
    const result = await submitCode({
      sourceCode: source_code,
      stdin: tc.stdin,
      languageStd: language_std,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 502 });
    }

    const d: SubmissionResult = result.data;
    totalWallTimeMs += d.wallTimeMs;
    lastCompileOutput = d.compileOutput ?? lastCompileOutput;
    lastStderr = d.stderr ?? lastStderr;

    judgeResults.push({ stdout: d.stdout, status: d.status });

    // If compile error, fill remaining with same status -- code won't compile
    // differently for different stdin
    if (d.status === "compile_error") {
      compileErrorOccurred = true;
      for (let i = judgeResults.length; i < dbTestCases.length; i++) {
        judgeResults.push({ stdout: null, status: "compile_error" });
      }
      break;
    }
  }

  // Evaluate verdicts
  const testCasesForEval: TestCase[] = dbTestCases.map((tc) => ({
    label: tc.label,
    stdin: tc.stdin,
    expectedStdout: tc.expected_stdout,
  }));

  const verdict = evaluateTestCases(testCasesForEval, judgeResults);

  // Save submission
  await supabase.from("submissions").insert({
    user_id: userId,
    exercise_id,
    mode: "submit",
    language_std,
    source_code,
    status: verdict.overallStatus,
    stdout: judgeResults[judgeResults.length - 1]?.stdout ?? null,
    stderr: lastStderr,
    compile_output: lastCompileOutput,
    exit_code: null,
    wall_time_ms: totalWallTimeMs,
    test_results: verdict.testResults as unknown as Json,
  });

  await supabase
    .from("progress")
    .update({ last_code_snippet: source_code, last_visit_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("lesson_id", exercise.lesson_id)
    .then(() => {});

  // Auto-mark lesson completed only when ALL exercises in the lesson have passing submissions
  let lessonCompleted = false;
  if (verdict.overallStatus === "passed") {
    const { data: lessonExercises } = await supabase
      .from("exercises")
      .select("id")
      .eq("lesson_id", exercise.lesson_id);

    const otherExerciseIds = (lessonExercises ?? [])
      .map((e) => e.id)
      .filter((id) => id !== exercise_id);

    let allPassed = true;
    if (otherExerciseIds.length > 0) {
      const { data: passedSubs } = await supabase
        .from("submissions")
        .select("exercise_id")
        .eq("user_id", userId)
        .in("exercise_id", otherExerciseIds)
        .eq("mode", "submit")
        .eq("status", "passed");

      const passedIds = new Set((passedSubs ?? []).map((s) => s.exercise_id));
      allPassed = otherExerciseIds.every((id) => passedIds.has(id));
    }

    if (allPassed) {
      lessonCompleted = true;
      await supabase.from("progress").upsert(
        {
          user_id: userId,
          lesson_id: exercise.lesson_id,
          state: "completed",
          completed_at: new Date().toISOString(),
          last_visit_at: new Date().toISOString(),
        },
        { onConflict: "user_id,lesson_id" },
      );
    }
  }

  // ---- Statsig events (fire-and-forget) ------------------------------------
  const testsPassed = verdict.testResults.filter((t) => t.passed).length;
  const testsTotal = verdict.testResults.length;

  if (verdict.overallStatus === "passed") {
    logExercisePassed(userId, {
      exercise_id,
      difficulty: "standard",
      attempts: 1,
      time_to_pass_seconds_bucket: "unknown",
      hints_used: 0,
      tutor_used: false,
    }).catch(() => {});
  } else {
    logExerciseFailed(userId, {
      exercise_id,
      attempt_number: 1,
      tests_passed: testsPassed,
      tests_total: testsTotal,
    }).catch(() => {});
  }

  if (lessonCompleted) {
    logLessonCompleted(userId, {
      lesson_id: exercise.lesson_id,
      module_id: exercise.lesson_id,
    }).catch(() => {});
  }

  const hasTimeout = judgeResults.some((r) => r.status === "tle");
  if (hasTimeout) {
    logExecutionTimeout(userId, { exercise_id }).catch(() => {});
  }

  return NextResponse.json({
    status: verdict.overallStatus,
    stdout: compileErrorOccurred ? null : (judgeResults[judgeResults.length - 1]?.stdout ?? null),
    stderr: lastStderr,
    compileOutput: lastCompileOutput,
    exitCode: null,
    wallTimeMs: totalWallTimeMs,
    testResults: verdict.testResults,
    lessonCompleted,
  });
}

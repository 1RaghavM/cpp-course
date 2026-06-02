import type { AppSupabaseClient } from "@/lib/supabase/types";
import type {
  StatsResponse,
  ChapterProgressEntry,
  WeeklySubmissionEntry,
} from "@/lib/stats/types";

function getISOWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function getWeekMondayUTC(today: Date): Date {
  const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const dayOfWeek = d.getUTCDay();
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  d.setUTCDate(d.getUTCDate() - daysSinceMonday);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export async function fetchStats(
  supabase: AppSupabaseClient,
  userId: string,
): Promise<StatsResponse> {
  const now = new Date();
  const eightWeeksAgo = new Date(now);
  eightWeeksAgo.setUTCDate(eightWeeksAgo.getUTCDate() - 56);

  const sixteenWeeksAgo = new Date(now);
  sixteenWeeksAgo.setUTCDate(sixteenWeeksAgo.getUTCDate() - 112);

  // Fetch conversation IDs first (needed for messages count)
  const { data: convRows } = await supabase
    .from("conversations")
    .select("id")
    .eq("user_id", userId);
  const conversationIds = (convRows ?? []).map((c) => c.id);

  const [
    progressResult,
    lessonsResult,
    chaptersResult,
    submissionsResult,
    conversationsResult,
    messagesResult,
    notesResult,
    userStatsResult,
  ] = await Promise.all([
    supabase
      .from("progress")
      .select("lesson_id, state, first_visit_at, completed_at, last_visit_at")
      .eq("user_id", userId),
    supabase
      .from("lessons")
      .select("id, chapter_id")
      .order("sort_order", { ascending: true }),
    supabase.from("chapters").select("id, learncpp_title"),
    supabase.from("submissions").select("mode, status, created_at").eq("user_id", userId),
    supabase
      .from("conversations")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    conversationIds.length > 0
      ? supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("role", "user")
          .in("conversation_id", conversationIds)
      : Promise.resolve({ count: 0, data: null, error: null }),
    supabase
      .from("notes")
      .select("lesson_id", { count: "exact", head: true })
      .eq("user_id", userId)
      .neq("content", ""),
    supabase
      .from("user_stats")
      .select("streak_days, weekly_goal")
      .eq("user_id", userId)
      .single(),
  ]);

  const progressRows = (progressResult.data ?? []) as {
    lesson_id: string;
    state: string;
    first_visit_at: string | null;
    completed_at: string | null;
    last_visit_at: string | null;
  }[];

  const lessonRows = (lessonsResult.data ?? []) as {
    id: string;
    chapter_id: number;
  }[];

  const chapterRows = (chaptersResult.data ?? []) as {
    id: number;
    learncpp_title: string;
  }[];

  const chapterTitleMap = new Map<number, string>();
  for (const ch of chapterRows) {
    chapterTitleMap.set(ch.id, ch.learncpp_title);
  }

  const submissionRows = (submissionsResult.data ?? []) as {
    mode: string;
    status: string;
    created_at: string;
  }[];

  // --- Core learning ---
  const totalLessons = lessonRows.length;
  let lessonsCompleted = 0;
  let lessonsInProgress = 0;
  let lessonsSkipped = 0;

  const progressMap = new Map<string, (typeof progressRows)[0]>();
  for (const row of progressRows) {
    progressMap.set(row.lesson_id, row);
    if (row.state === "completed") lessonsCompleted++;
    else if (row.state === "in_progress") lessonsInProgress++;
    else if (row.state === "skipped") lessonsSkipped++;
  }

  // Weekly completed
  const weekMonday = getWeekMondayUTC(now);
  const weekSunday = new Date(weekMonday.getTime() + 7 * 24 * 60 * 60 * 1000);
  let lessonsCompletedThisWeek = 0;
  for (const row of progressRows) {
    if (row.completed_at) {
      const d = new Date(row.completed_at);
      if (d >= weekMonday && d < weekSunday) lessonsCompletedThisWeek++;
    }
  }

  // Chapter progress
  const chapterMap = new Map<number, { title: string; total: number; completed: number }>();
  for (const lesson of lessonRows) {
    const chId = lesson.chapter_id;
    const existing = chapterMap.get(chId);
    const isCompleted = progressMap.get(lesson.id)?.state === "completed";
    if (existing) {
      existing.total++;
      if (isCompleted) existing.completed++;
    } else {
      chapterMap.set(chId, {
        title: chapterTitleMap.get(chId) ?? String(chId),
        total: 1,
        completed: isCompleted ? 1 : 0,
      });
    }
  }
  const chapterProgress: ChapterProgressEntry[] = Array.from(chapterMap.entries()).map(
    ([chapterId, v]) => ({
      chapterId,
      chapterTitle: v.title,
      completed: v.completed,
      total: v.total,
    }),
  );

  // Activity data (16 weeks)
  const activityData: Record<string, number> = {};
  for (const row of progressRows) {
    if (row.last_visit_at) {
      const dateStr = row.last_visit_at.slice(0, 10);
      if (new Date(dateStr) >= sixteenWeeksAgo) {
        activityData[dateStr] = (activityData[dateStr] ?? 0) + 1;
      }
    }
  }

  // --- Code performance ---
  const submitRows = submissionRows.filter((r) => r.mode === "submit");
  const totalSubmissions = submitRows.length;
  const totalRuns = submissionRows.filter((r) => r.mode === "run").length;
  let passedSubmissions = 0;
  let failedSubmissions = 0;
  let compileErrors = 0;

  for (const row of submitRows) {
    if (row.status === "passed") passedSubmissions++;
    else if (row.status === "compile_error") compileErrors++;
    else failedSubmissions++;
  }

  const successRate = totalSubmissions > 0 ? passedSubmissions / totalSubmissions : 0;

  // Weekly submissions (last 8 weeks)
  const weeklyMap = new Map<string, { passed: number; failed: number }>();
  for (const row of submitRows) {
    const d = new Date(row.created_at);
    if (d < eightWeeksAgo) continue;
    const week = getISOWeek(d);
    const entry = weeklyMap.get(week) ?? { passed: 0, failed: 0 };
    if (row.status === "passed") entry.passed++;
    else entry.failed++;
    weeklyMap.set(week, entry);
  }

  const weeklySubmissions: WeeklySubmissionEntry[] = [];
  for (let i = 7; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i * 7);
    const week = getISOWeek(d);
    if (!weeklySubmissions.some((w) => w.week === week)) {
      const entry = weeklyMap.get(week) ?? { passed: 0, failed: 0 };
      weeklySubmissions.push({ week, ...entry });
    }
  }

  // --- Engagement ---
  const tutorConversations = conversationsResult.count ?? 0;
  const tutorMessages = messagesResult.count ?? 0;
  const notesWritten = notesResult.count ?? 0;

  // Time spent (sum of visit durations, capped at 120 min per lesson)
  let totalTimeMinutes = 0;
  for (const row of progressRows) {
    if (row.first_visit_at && row.last_visit_at) {
      const start = new Date(row.first_visit_at).getTime();
      const end = new Date(row.last_visit_at).getTime();
      const diffMin = (end - start) / 60000;
      totalTimeMinutes += Math.min(diffMin, 120);
    }
  }
  totalTimeMinutes = Math.round(totalTimeMinutes);

  const stats = userStatsResult.data as {
    streak_days: number;
    weekly_goal: number | null;
  } | null;

  return {
    totalLessons,
    lessonsCompleted,
    lessonsInProgress,
    lessonsSkipped,
    streakDays: stats?.streak_days ?? 0,
    weeklyGoal: stats?.weekly_goal ?? null,
    lessonsCompletedThisWeek,
    chapterProgress,
    activityData,
    totalSubmissions,
    totalRuns,
    passedSubmissions,
    failedSubmissions,
    compileErrors,
    successRate,
    weeklySubmissions,
    tutorConversations,
    tutorMessages,
    notesWritten,
    totalTimeMinutes,
  };
}

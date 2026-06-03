import type { TypedSupabaseClient } from "@/lib/supabase/server";

export interface LessonContext {
  chapterTitle: string;
  lessonTitle: string;
  priorLessonTitles: string[];
}

export async function loadLessonContext(
  supabase: TypedSupabaseClient,
  lessonId: string,
): Promise<LessonContext | null> {
  const { data: lesson } = await supabase
    .from("lessons")
    .select("my_title, learncpp_title, chapter_id, sort_order")
    .eq("id", lessonId)
    .single();

  if (!lesson) return null;

  const [chapterResult, priorResult] = await Promise.all([
    supabase
      .from("chapters")
      .select("learncpp_title, my_title")
      .eq("id", lesson.chapter_id)
      .single(),
    supabase
      .from("lessons")
      .select("my_title, learncpp_title")
      .eq("chapter_id", lesson.chapter_id)
      .lt("sort_order", lesson.sort_order)
      .order("sort_order", { ascending: true }),
  ]);

  const chapter = chapterResult.data;
  const priorLessonTitles = (priorResult.data ?? []).map(
    (row) => row.my_title ?? row.learncpp_title,
  );

  return {
    chapterTitle: chapter?.my_title ?? chapter?.learncpp_title ?? "Unknown Chapter",
    lessonTitle: lesson.my_title ?? lesson.learncpp_title,
    priorLessonTitles,
  };
}

export function buildExecutionResult(
  submission: {
    status: string;
    compile_output: string | null;
    stderr: string | null;
    stdout: string | null;
  } | null,
): string | null {
  if (!submission) return null;
  const parts: string[] = [`Status: ${submission.status}`];
  if (submission.compile_output) parts.push(`Compile output: ${submission.compile_output}`);
  if (submission.stderr) parts.push(`stderr: ${submission.stderr}`);
  if (submission.stdout) parts.push(`stdout: ${submission.stdout}`);
  return parts.join("\n");
}

export async function resolveOrCreateConversation(
  supabase: TypedSupabaseClient,
  userId: string,
  lessonId: string,
  firstMessageContent: string,
): Promise<string> {
  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("user_id", userId)
    .eq("lesson_id", lessonId)
    .eq("status", "active")
    .single();

  if (existing) return existing.id;

  const title =
    firstMessageContent.length > 60
      ? firstMessageContent.slice(0, 60) + "..."
      : firstMessageContent;

  const { data: conv, error } = await supabase
    .from("conversations")
    .insert({ lesson_id: lessonId, title, user_id: userId, status: "active" })
    .select("id")
    .single();

  if (error || !conv) {
    console.error("Failed to create conversation:", error);
    throw new Error(`Failed to create conversation: ${error?.message ?? "no data returned"}`);
  }
  return conv.id;
}

export async function resolveOrCreatePlaygroundConversation(
  supabase: TypedSupabaseClient,
  userId: string,
  firstMessageContent: string,
): Promise<string> {
  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("user_id", userId)
    .is("lesson_id", null)
    .eq("context", "playground")
    .eq("status", "active")
    .single();

  if (existing) return existing.id;

  const title =
    firstMessageContent.length > 60
      ? firstMessageContent.slice(0, 60) + "..."
      : firstMessageContent;

  const { data: conv, error } = await supabase
    .from("conversations")
    .insert({
      lesson_id: null,
      title,
      user_id: userId,
      status: "active",
      context: "playground",
    })
    .select("id")
    .single();

  if (error || !conv) {
    throw new Error(`Failed to create playground conversation: ${error?.message ?? "no data returned"}`);
  }
  return conv.id;
}

export async function loadConversationHistory(
  supabase: TypedSupabaseClient,
  conversationId: string,
  limit: number = 10,
): Promise<{ role: "user" | "assistant"; content: string }[]> {
  const { data: messages } = await supabase
    .from("messages")
    .select("role, content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (messages ?? []).reverse().map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));
}

export async function getGuardCounts(
  supabase: TypedSupabaseClient,
  userId: string,
  conversationId: string | null,
): Promise<{
  minuteCount: number;
  dailyCount: number;
  monthSpendMicro: number;
  conversationSpendMicro: number;
}> {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const oneMinuteAgo = new Date(now.getTime() - 60_000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [minuteRes, dailyRes, monthRes, convoRes] = await Promise.all([
    // RLS scopes messages to the authenticated user via conversations
    supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("role", "user")
      .gte("created_at", oneMinuteAgo.toISOString()),
    supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("role", "user")
      .gte("created_at", startOfDay.toISOString()),
    supabase
      .from("token_usage")
      .select("cost_usd_micro")
      .eq("user_id", userId)
      .eq("call_type", "tutor")
      .gte("created_at", startOfMonth.toISOString()),
    conversationId
      ? supabase.from("token_usage").select("cost_usd_micro").eq("conversation_id", conversationId)
      : Promise.resolve({ data: [] as { cost_usd_micro: number }[] }),
  ]);

  const monthSpendMicro = (monthRes.data ?? []).reduce(
    (sum, row) => sum + (row.cost_usd_micro ?? 0),
    0,
  );

  const convoData = "data" in convoRes ? (convoRes.data ?? []) : [];
  const conversationSpendMicro = convoData.reduce(
    (sum: number, row: { cost_usd_micro: number }) => sum + (row.cost_usd_micro ?? 0),
    0,
  );

  return {
    minuteCount: minuteRes.count ?? 0,
    dailyCount: dailyRes.count ?? 0,
    monthSpendMicro,
    conversationSpendMicro,
  };
}

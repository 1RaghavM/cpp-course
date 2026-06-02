import { streamText, type UIMessage } from "ai";
import { NextResponse } from "next/server";
import { createRouteClient, createServiceClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { tutorModel } from "@/lib/ai/model";
import { buildSystemPrompt, buildPlaygroundSystemPrompt, computeHintTier } from "@/lib/ai/system-prompt";
import {
  loadLessonContext,
  buildExecutionResult,
  resolveOrCreateConversation,
  resolveOrCreatePlaygroundConversation,
  loadConversationHistory,
  getGuardCounts,
} from "@/lib/ai/context";
import { checkRateAndBudget } from "@/lib/rate/guard";
import { computeTutorCostMicro } from "@/lib/ai/pricing";
import { TUTOR_CONFIG } from "@/lib/ai/config";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  const supabase = createRouteClient();
  const authResult = await requireAuth(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const userId = authResult.session.user.id;

  const rawBody = await request.text();
  if (rawBody.length > TUTOR_CONFIG.maxInputBytes) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "Request too large" } },
      { status: 400 },
    );
  }

  let body: {
    messages: UIMessage[];
    lessonId?: string;
    context?: "playground";
    code: string;
    lastSubmissionToken?: string;
  };
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "Invalid JSON" } },
      { status: 400 },
    );
  }

  const isPlayground = body.context === "playground";

  if (!isPlayground && !body.lessonId) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "lessonId or context is required" } },
      { status: 400 },
    );
  }

  if (!body.messages || body.messages.length === 0) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "messages are required" } },
      { status: 400 },
    );
  }

  const latestUserMessage = body.messages.filter((m) => m.role === "user").pop();
  if (!latestUserMessage) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "No user message found" } },
      { status: 400 },
    );
  }

  const extractTextFromMessage = (msg: UIMessage): string => {
    const textPart = msg.parts.find((p): p is { type: "text"; text: string } => p.type === "text");
    return textPart?.text ?? "";
  };

  const conversationId = isPlayground
    ? await resolveOrCreatePlaygroundConversation(
        supabase,
        userId,
        extractTextFromMessage(latestUserMessage) || "Playground chat",
      )
    : await resolveOrCreateConversation(
        supabase,
        userId,
        body.lessonId!,
        extractTextFromMessage(latestUserMessage) || "New conversation",
      );

  const guardCounts = await getGuardCounts(supabase, userId, conversationId);
  const guardResult = checkRateAndBudget(guardCounts);
  if (!guardResult.allowed) {
    return NextResponse.json(
      { error: { code: guardResult.code, message: guardResult.message } },
      { status: 429 },
    );
  }

  const history = await loadConversationHistory(supabase, conversationId);
  const userContent = extractTextFromMessage(latestUserMessage);

  const { data: onboardingData } = await supabase
    .from("onboarding")
    .select("background, motivation")
    .eq("user_id", userId)
    .single();

  let systemPrompt: string;
  let tier: number | null = null;

  if (isPlayground) {
    systemPrompt = buildPlaygroundSystemPrompt({
      editorCode: body.code ?? "",
      learnerBackground: onboardingData?.background ?? null,
      learnerMotivation: onboardingData?.motivation ?? null,
    });
  } else {
    const serviceClient = createServiceClient();
    const lessonContext = await loadLessonContext(serviceClient, body.lessonId!);
    if (!lessonContext) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Lesson not found" } },
        { status: 400 },
      );
    }

    let executionResult: string | null = null;
    if (body.lastSubmissionToken) {
      const { data: sub } = await supabase
        .from("submissions")
        .select("status, compile_output, stderr, stdout")
        .eq("id", body.lastSubmissionToken)
        .eq("user_id", userId)
        .single();
      executionResult = buildExecutionResult(sub);
    }

    const turnCount = history.filter((m) => m.role === "user").length;
    tier = computeHintTier(turnCount, userContent);

    systemPrompt = buildSystemPrompt({
      tier,
      chapterTitle: lessonContext.chapterTitle,
      lessonTitle: lessonContext.lessonTitle,
      editorCode: body.code ?? "",
      executionResult,
      learnerBackground: onboardingData?.background ?? null,
      learnerMotivation: onboardingData?.motivation ?? null,
    });
  }

  await supabase.from("messages").insert({
    conversation_id: conversationId,
    role: "user",
    content: userContent,
  });

  const result = streamText({
    model: tutorModel(),
    system: systemPrompt,
    messages: history.concat({ role: "user", content: userContent }),
    maxOutputTokens: TUTOR_CONFIG.maxOutputTokens,
    abortSignal: AbortSignal.timeout(30_000),
    async onFinish({ text, usage }) {
      const tokensIn = usage.inputTokens ?? 0;
      const tokensOut = usage.outputTokens ?? 0;
      const costMicro = computeTutorCostMicro("gemini-2.5-flash", tokensIn, tokensOut);

      try {
        await supabase.from("messages").insert({
          conversation_id: conversationId,
          role: "assistant",
          content: text,
          hint_tier: tier,
          tokens_in: tokensIn,
          tokens_out: tokensOut,
          model: "gemini-2.5-flash",
        });
      } catch (e) {
        console.error("Failed to persist assistant message", e);
      }

      try {
        const serviceClient = createServiceClient();
        await serviceClient.from("token_usage").insert({
          user_id: userId,
          call_type: "tutor",
          model: "gemini-2.5-flash",
          tokens_in: tokensIn,
          tokens_out: tokensOut,
          cached_in: 0,
          cost_usd_micro: Number(costMicro),
          lesson_id: isPlayground ? null : (body.lessonId ?? null),
          conversation_id: conversationId,
        });
      } catch (e) {
        console.error("Failed to persist token usage", e);
      }
    },
  });

  return result.toUIMessageStreamResponse();
}

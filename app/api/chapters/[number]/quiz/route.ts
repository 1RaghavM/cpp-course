import { NextRequest, NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { pickChapterQuizSet, type AttemptSummary } from "@/lib/content/chapter-quiz";
import type { ConceptCheck } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

// GET /api/chapters/[number]/quiz — 10-15 mixed concept checks for the chapter quiz.
// 404 if the chapter has zero concept checks; degrades to current-only when prior chapters empty.
export async function GET(_request: NextRequest, { params }: { params: { number: string } }) {
  const supabase = createRouteClient();

  const authResult = await requireAuth(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  const chapterNumber = params.number;
  const numeric = parseInt(chapterNumber, 10);
  const priorNumbers: string[] = Number.isNaN(numeric)
    ? []
    : [numeric - 1, numeric - 2].filter((n) => n >= 0).map(String);

  const { data: chapters, error: chErr } = await supabase
    .from("chapters")
    .select("id, number")
    .in("number", [chapterNumber, ...priorNumbers]);

  if (chErr) return NextResponse.json({ error: chErr.message }, { status: 500 });

  const currentChapter = chapters?.find((c) => c.number === chapterNumber);
  if (!currentChapter) return NextResponse.json({ error: "Chapter not found" }, { status: 404 });

  const priorChapterIds = (chapters ?? [])
    .filter((c) => c.number !== chapterNumber)
    .map((c) => c.id);

  const { data: currentChecks, error: ccErr } = await supabase
    .from("concept_checks")
    .select("*, lessons!inner(chapter_id)")
    .eq("lessons.chapter_id", currentChapter.id);

  if (ccErr) return NextResponse.json({ error: ccErr.message }, { status: 500 });

  let priorChecksRaw: unknown[] = [];
  if (priorChapterIds.length > 0) {
    const { data, error } = await supabase
      .from("concept_checks")
      .select("*, lessons!inner(chapter_id)")
      .in("lessons.chapter_id", priorChapterIds);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    priorChecksRaw = data ?? [];
  }

  const currentChapterChecks = (currentChecks ?? []) as unknown as ConceptCheck[];
  const priorChapterChecks = priorChecksRaw as unknown as ConceptCheck[];

  if (currentChapterChecks.length === 0 && priorChapterChecks.length === 0) {
    return NextResponse.json({ error: "No concept checks for this chapter yet" }, { status: 404 });
  }

  const allCheckIds = [...currentChapterChecks, ...priorChapterChecks].map((c) => c.id);
  const { data: reviews } = await supabase
    .from("concept_check_reviews")
    .select("check_id, last_correct, last_answered_at")
    .in("check_id", allCheckIds);

  const attemptHistory: AttemptSummary[] = (reviews ?? []).map((r) => ({
    checkId: r.check_id,
    lastCorrect: r.last_correct,
    lastAnsweredAt: r.last_answered_at,
  }));

  const today = new Date().toISOString().slice(0, 10);
  const seed = `${user.id}|${chapterNumber}|${today}`;

  const checks = pickChapterQuizSet({
    currentChapterChecks,
    priorChapterChecks,
    attemptHistory,
    seed,
  });

  // Strip the joined lessons.chapter_id field from the response payload
  const cleanChecks: ConceptCheck[] = checks.map((c) => {
    const withoutLessons: ConceptCheck & { lessons?: unknown } = { ...(c as ConceptCheck & { lessons?: unknown }) };
    delete withoutLessons.lessons;
    return withoutLessons as ConceptCheck;
  });

  const currentIds = new Set(currentChapterChecks.map((c) => c.id));
  const priorIds = new Set(priorChapterChecks.map((c) => c.id));

  return NextResponse.json({
    chapterNumber,
    checks: cleanChecks,
    composition: {
      currentChapter: cleanChecks.filter((c) => currentIds.has(c.id)).length,
      priorChapters: cleanChecks.filter((c) => priorIds.has(c.id)).length,
    },
  });
}

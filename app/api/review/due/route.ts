import { NextRequest, NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { loadDueReviewQueue, nextDueDate, type DueCandidate } from "@/lib/content/review";
import type { ConceptCheck } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

interface DueResponse {
  count: number;
  cards: Array<{ check: ConceptCheck; lessonNumber: string; intervalIndex: number }>;
  nextDueDate: string | null;
}

// GET /api/review/due           → due-today queue (cap 20) + nextDueDate when empty
// GET /api/review/due?practice=1 → 5 oldest-known-good cards for the empty-state practice button
export async function GET(request: NextRequest) {
  const supabase = createRouteClient();

  const authResult = await requireAuth(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  const practice = request.nextUrl.searchParams.get("practice") === "1";
  const today = new Date();

  if (practice) {
    const { data, error } = await supabase
      .from("concept_check_reviews")
      .select("check_id, interval_index, next_due, last_correct, concept_checks(*, lessons(number))")
      .eq("user_id", user.id)
      .eq("last_correct", true)
      .order("last_answered_at", { ascending: true })
      .limit(5);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const cards = (data ?? [])
      .filter(
        (row): row is typeof row & { concept_checks: ConceptCheck & { lessons: { number: string } } } =>
          row.concept_checks !== null && (row.concept_checks as unknown as { lessons: unknown }).lessons !== null,
      )
      .map((row) => ({
        check: row.concept_checks,
        lessonNumber: row.concept_checks.lessons.number,
        intervalIndex: row.interval_index,
      }));

    const response: DueResponse = { count: cards.length, cards, nextDueDate: null };
    return NextResponse.json(response);
  }

  const cards = await loadDueReviewQueue(supabase, user.id, today, 20);

  let dueDate: string | null = null;
  if (cards.length === 0) {
    const { data: future } = await supabase
      .from("concept_check_reviews")
      .select("check_id, next_due, interval_index")
      .eq("user_id", user.id)
      .gt("next_due", today.toISOString().slice(0, 10))
      .order("next_due", { ascending: true })
      .limit(1);

    const candidates: DueCandidate[] = (future ?? []).map((row) => ({
      checkId: row.check_id,
      nextDue: row.next_due,
      intervalIndex: row.interval_index,
    }));
    dueDate = nextDueDate(candidates);
  }

  const response: DueResponse = { count: cards.length, cards, nextDueDate: dueDate };
  return NextResponse.json(response);
}

import Link from "next/link";
import { requireServerSession } from "@/lib/auth/require-auth";
import { loadDueReviewQueue, nextDueDate, type DueCandidate } from "@/lib/content/review";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ConceptCheck } from "@/lib/supabase/types";
import { ReviewPageClient } from "./ReviewPageClient";

export const dynamic = "force-dynamic";

export default async function ReviewPage({
  searchParams,
}: {
  searchParams: { practice?: string };
}) {
  const { supabase, userId } = await requireServerSession();
  const today = new Date();
  const practice = searchParams.practice === "1";

  if (practice) {
    const { data } = await supabase
      .from("concept_check_reviews")
      .select("check_id, interval_index, concept_checks(*, lessons(number))")
      .eq("user_id", userId)
      .eq("last_correct", true)
      .order("last_answered_at", { ascending: true })
      .limit(5);

    const practiceCards = (data ?? [])
      .filter(
        (row): row is typeof row & {
          concept_checks: ConceptCheck & { lessons: { number: string } };
        } =>
          row.concept_checks !== null &&
          (row.concept_checks as unknown as { lessons: unknown }).lessons !== null,
      )
      .map((row) => ({
        check: row.concept_checks,
        lessonNumber: row.concept_checks.lessons.number,
      }));

    return (
      <div className="mx-auto max-w-2xl p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Practice</h1>
        <ReviewPageClient cards={practiceCards} />
      </div>
    );
  }

  const cards = await loadDueReviewQueue(supabase, userId, today, 20);

  if (cards.length === 0) {
    const { data: future } = await supabase
      .from("concept_check_reviews")
      .select("check_id, next_due, interval_index")
      .eq("user_id", userId)
      .gt("next_due", today.toISOString().slice(0, 10))
      .order("next_due", { ascending: true })
      .limit(1);

    const candidates: DueCandidate[] = (future ?? []).map((row) => ({
      checkId: row.check_id,
      nextDue: row.next_due,
      intervalIndex: row.interval_index,
    }));
    const upcoming = nextDueDate(candidates);

    return (
      <div className="mx-auto max-w-2xl p-6">
        <Card>
          <CardHeader>
            <CardTitle>All caught up</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            {upcoming ? (
              <p>Next review available {upcoming}.</p>
            ) : (
              <p>Answer a concept check on any lesson to start your review queue.</p>
            )}
            {upcoming && (
              <form action="/dashboard/review">
                <input type="hidden" name="practice" value="1" />
                <Button type="submit">Practice 5 random reviews</Button>
              </form>
            )}
            <Link href="/dashboard">
              <Button variant="outline">Back to dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Daily review</h1>
      <ReviewPageClient
        cards={cards.map((c) => ({ check: c.check, lessonNumber: c.lessonNumber }))}
      />
    </div>
  );
}

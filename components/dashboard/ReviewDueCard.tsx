import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { loadDueReviewQueue, nextDueDate, type DueCandidate } from "@/lib/content/review";
import type { AppSupabaseClient } from "@/lib/supabase/types";

interface Props {
  supabase: AppSupabaseClient;
  userId: string;
}

export async function ReviewDueCard({ supabase, userId }: Props) {
  const today = new Date();
  const cards = await loadDueReviewQueue(supabase, userId, today, 20);

  if (cards.length > 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Daily review</CardTitle>
          <Badge>{cards.length}</Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {cards.length} {cards.length === 1 ? "card" : "cards"} due today.
          </p>
          <Link href="/dashboard/review">
            <Button>Start review</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

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
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Daily review</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        {upcoming ? (
          <p>All caught up. Next review {upcoming}.</p>
        ) : (
          <p>Answer a concept check on any lesson to start your queue.</p>
        )}
      </CardContent>
    </Card>
  );
}

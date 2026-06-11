"use client";

import { useRouter } from "next/navigation";
import { ReviewSession, type ReviewCard } from "@/components/review/ReviewSession";

export function ReviewPageClient({ cards }: { cards: ReviewCard[] }) {
  const router = useRouter();
  return (
    <ReviewSession
      cards={cards}
      surfaceLabel="Daily review"
      onComplete={() => router.push("/dashboard")}
    />
  );
}

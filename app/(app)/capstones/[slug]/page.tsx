import { notFound } from "next/navigation";
import { requireServerSession } from "@/lib/auth/require-auth";
import { fetchPublicCapstone, fetchUserAttempts } from "@/lib/capstones/server";
import { CAPSTONE_SLUGS, type CapstoneSlug } from "@/lib/capstones/types";
import { isCapstoneUnlocked } from "@/lib/capstones/unlock";
import { CURRICULUM, STAGES } from "@/lib/dashboard/curriculum";
import type { Stage } from "@/lib/dashboard/types";
import type { AppSupabaseClient } from "@/lib/supabase/types";
import { CapstoneClient } from "./CapstoneClient";

interface PageProps {
  params: { slug: string };
}

/**
 * Compute the user's completed+skipped count + total lessons for a stage.
 * Reads the existing `progress` table (RLS scopes to the caller; `state`
 * column is the canonical lesson status).
 */
async function fetchStageProgress(
  supabase: AppSupabaseClient,
  stage: Stage,
): Promise<{ completed: number; total: number }> {
  const moduleChapterIds = CURRICULUM.filter((m) => m.stage === stage).flatMap((m) => m.chapterIds);
  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, chapter_id")
    .in("chapter_id", moduleChapterIds);
  const total = lessons?.length ?? 0;
  if (total === 0) return { completed: 0, total };
  const lessonIds = (lessons ?? []).map((l) => l.id);
  const { data: progress } = await supabase
    .from("progress")
    .select("lesson_id, state")
    .in("lesson_id", lessonIds);
  const completed = (progress ?? []).filter(
    (r) => r.state === "completed" || r.state === "skipped",
  ).length;
  return { completed, total };
}

export default async function CapstonePage({ params }: PageProps) {
  if (!CAPSTONE_SLUGS.includes(params.slug as CapstoneSlug)) notFound();
  const slug = params.slug as CapstoneSlug;

  const { supabase } = await requireServerSession();

  const capstone = await fetchPublicCapstone(supabase, slug);
  if (!capstone) notFound();

  const stageProgress = await fetchStageProgress(supabase, capstone.stage);
  const unlocked = isCapstoneUnlocked(stageProgress.completed, stageProgress.total);

  const attempts = await fetchUserAttempts(
    supabase,
    (await supabase.auth.getUser()).data.user!.id,
    capstone.milestones.map((m) => m.id),
  );

  const stageTitle = STAGES.find((s) => s.id === capstone.stage)?.title ?? capstone.stage;

  return (
    <CapstoneClient
      capstone={capstone}
      attempts={attempts}
      unlocked={unlocked}
      stageProgress={stageProgress}
      stageTitle={stageTitle}
    />
  );
}

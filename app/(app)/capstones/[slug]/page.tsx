import { notFound } from "next/navigation";
import { requireServerSession } from "@/lib/auth/require-auth";
import { fetchPublicCapstone, fetchUserAttempts } from "@/lib/capstones/server";
import { CAPSTONE_SLUGS, type CapstoneSlug } from "@/lib/capstones/types";
import { STAGES } from "@/lib/dashboard/curriculum";
import { CapstoneClient } from "./CapstoneClient";

interface PageProps {
  params: { slug: string };
}

export default async function CapstonePage({ params }: PageProps) {
  if (!CAPSTONE_SLUGS.includes(params.slug as CapstoneSlug)) notFound();
  const slug = params.slug as CapstoneSlug;

  const { supabase, userId } = await requireServerSession();

  const capstone = await fetchPublicCapstone(supabase, slug);
  if (!capstone) notFound();

  const attempts = await fetchUserAttempts(
    supabase,
    userId,
    capstone.milestones.map((m) => m.id),
  );

  const stageTitle = STAGES.find((s) => s.id === capstone.stage)?.title ?? capstone.stage;

  return <CapstoneClient capstone={capstone} attempts={attempts} stageTitle={stageTitle} />;
}

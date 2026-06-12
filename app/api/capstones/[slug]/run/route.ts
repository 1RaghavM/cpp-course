import { NextRequest, NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { fetchInternalCapstone, upsertAttempt } from "@/lib/capstones/server";
import { runMilestone, type CapstoneRunMode } from "@/lib/capstones/judge0";
import { CAPSTONE_SLUGS, type CapstoneSlug } from "@/lib/capstones/types";

export const dynamic = "force-dynamic";

const MAX_SOURCE_SIZE = 50 * 1024;
const VALID_MODES: CapstoneRunMode[] = ["run", "submit"];

interface RequestBody {
  milestone_ordinal?: number;
  source_code?: string;
  mode?: CapstoneRunMode;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } },
): Promise<NextResponse> {
  const authClient = createRouteClient();
  const authResult = await requireAuth(authClient);
  if (authResult instanceof NextResponse) return authResult;
  const userId = authResult.user.id;

  if (!CAPSTONE_SLUGS.includes(params.slug as CapstoneSlug)) {
    return NextResponse.json({ error: "Unknown capstone" }, { status: 404 });
  }
  const slug = params.slug as CapstoneSlug;

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (
    typeof body.milestone_ordinal !== "number" ||
    body.milestone_ordinal < 1 ||
    body.milestone_ordinal > 5
  ) {
    return NextResponse.json({ error: "milestone_ordinal must be 1..5" }, { status: 400 });
  }
  if (typeof body.source_code !== "string" || body.source_code.length === 0) {
    return NextResponse.json({ error: "source_code is required" }, { status: 400 });
  }
  if (Buffer.byteLength(body.source_code, "utf-8") > MAX_SOURCE_SIZE) {
    return NextResponse.json({ error: "source_code exceeds 50KB" }, { status: 413 });
  }

  const mode: CapstoneRunMode = VALID_MODES.includes(body.mode as CapstoneRunMode)
    ? (body.mode as CapstoneRunMode)
    : "submit";

  // Per-user rate limit: 5 submissions / 60s (matches submissions route policy).
  const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString();
  const { count } = (await authClient
    .from("submissions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", oneMinuteAgo)) as { count: number | null };
  if ((count ?? 0) >= 5) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Max 5 submissions per minute." },
      { status: 429 },
    );
  }

  const capstone = await fetchInternalCapstone(authClient, slug);
  if (!capstone) {
    return NextResponse.json({ error: "Capstone not found" }, { status: 404 });
  }
  const milestone = capstone.milestones.find((m) => m.ordinal === body.milestone_ordinal);
  if (!milestone) {
    return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
  }

  const result = await runMilestone({
    sourceCode: body.source_code,
    languageStandard: capstone.language_standard,
    tests: milestone.tests,
    mode,
  });

  // Only persist attempts on submit, mirroring how /api/submissions only
  // counts "submit" toward grading (Run is for quick iteration).
  if (mode === "submit") {
    await upsertAttempt(authClient, userId, milestone.id, result.passed, null);
  }

  return NextResponse.json({
    ...result,
    milestone_id: milestone.id,
    mode,
  });
}

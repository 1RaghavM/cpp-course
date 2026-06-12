import Link from "next/link";
import { requireServerSession } from "@/lib/auth/require-auth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { STAGES } from "@/lib/dashboard/curriculum";
import type { Stage } from "@/lib/dashboard/types";
import type { CapstoneSlug } from "@/lib/capstones/types";

interface CapstoneCatalogRow {
  id: string;
  slug: CapstoneSlug;
  stage: Stage;
  title: string;
  description_md: string;
  milestone_total: number;
  passed_count: number;
}

function firstParagraph(md: string): string {
  const body = md.replace(/^#[^\n]*\n+/, "").trim();
  const idx = body.indexOf("\n\n");
  const para = idx === -1 ? body : body.slice(0, idx);
  return para.trim();
}

export default async function CapstonesIndexPage() {
  const { supabase, userId } = await requireServerSession();

  const { data: capstoneRows } = await supabase
    .from("capstones")
    .select("id, slug, stage, title, description_md");

  const capstones = capstoneRows ?? [];
  const ids = capstones.map((c) => c.id);

  const { data: milestoneRows } = ids.length
    ? await supabase
        .from("capstone_milestones")
        .select("id, capstone_id")
        .in("capstone_id", ids)
    : { data: [] as { id: string; capstone_id: string }[] };

  const milestonesByCapstone = new Map<string, string[]>();
  for (const m of milestoneRows ?? []) {
    const list = milestonesByCapstone.get(m.capstone_id) ?? [];
    list.push(m.id);
    milestonesByCapstone.set(m.capstone_id, list);
  }

  const allMilestoneIds = (milestoneRows ?? []).map((m) => m.id);
  const { data: attemptRows } = allMilestoneIds.length
    ? await supabase
        .from("capstone_attempts")
        .select("milestone_id, passed")
        .eq("user_id", userId)
        .in("milestone_id", allMilestoneIds)
    : { data: [] as { milestone_id: string; passed: boolean }[] };
  const passedSet = new Set(
    (attemptRows ?? []).filter((r) => r.passed).map((r) => r.milestone_id),
  );

  const stageOrder = new Map(STAGES.map((s, i) => [s.id, i] as const));
  const catalog: CapstoneCatalogRow[] = capstones
    .map((c) => {
      const ms = milestonesByCapstone.get(c.id) ?? [];
      return {
        id: c.id,
        slug: c.slug as CapstoneSlug,
        stage: c.stage as Stage,
        title: c.title,
        description_md: c.description_md,
        milestone_total: ms.length,
        passed_count: ms.filter((id) => passedSet.has(id)).length,
      };
    })
    .sort((a, b) => (stageOrder.get(a.stage) ?? 99) - (stageOrder.get(b.stage) ?? 99));

  return (
    <div className="mx-auto max-w-5xl py-8 px-4 space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">Capstone Projects</h1>
        <p className="text-sm text-foreground/70 max-w-2xl">
          End-of-part C++ projects you can take any time. Each is a single-file program built across
          5 milestones, using only the topics from that part of the curriculum.
        </p>
      </header>

      {catalog.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-sm text-foreground/70">
            No capstones found. Run <code className="font-mono text-xs">npm run seed:capstones</code>{" "}
            to load them.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {catalog.map((c) => {
            const stageTitle = STAGES.find((s) => s.id === c.stage)?.title ?? c.stage;
            const done = c.milestone_total > 0 && c.passed_count === c.milestone_total;
            const progressLabel = done
              ? "Completed"
              : `${c.passed_count} / ${c.milestone_total} milestones`;
            return (
              <Link
                key={c.id}
                href={`/capstones/${c.slug}`}
                className="no-underline text-foreground"
              >
                <Card className="h-full transition-colors hover:bg-muted/40">
                  <CardHeader className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" noAnimate>
                        {stageTitle}
                      </Badge>
                      <Badge variant={done ? "outline" : "default"} noAnimate>
                        {progressLabel}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{c.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-foreground/70">
                    {firstParagraph(c.description_md)}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

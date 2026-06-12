/**
 * seed_capstones.ts — Load content/capstones/<slug>.md + <slug>.tests.json into Postgres.
 *
 * Usage: npx tsx scripts/seed_capstones.ts
 * Requires: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Idempotent — upserts on capstones.slug; replaces milestones per capstone.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import type { CapstoneTestsFile, CapstoneSlug } from "../lib/capstones/types";
import type { Database, Json } from "../lib/supabase/types";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const CAPSTONE_DIR = resolve(__dirname, "..", "content", "capstones");

async function seedOne(slug: CapstoneSlug) {
  const tests = JSON.parse(
    readFileSync(join(CAPSTONE_DIR, `${slug}.tests.json`), "utf8"),
  ) as CapstoneTestsFile;
  const md = readFileSync(join(CAPSTONE_DIR, `${slug}.md`), "utf8");

  const { data: capRow, error: capErr } = await supabase
    .from("capstones")
    .upsert(
      {
        slug: tests.slug,
        stage: tests.stage,
        title: tests.title,
        description_md: md,
        language_standard: tests.language_standard,
        compile_flags: tests.compile_flags,
        starter_code: tests.starter_code,
        reference_solution: tests.reference_solution,
      },
      { onConflict: "slug" },
    )
    .select("id")
    .single();
  if (capErr || !capRow) throw capErr ?? new Error("upsert returned no row");

  const { error: delErr } = await supabase
    .from("capstone_milestones")
    .delete()
    .eq("capstone_id", capRow.id);
  if (delErr) throw delErr;

  const { error: insErr } = await supabase.from("capstone_milestones").insert(
    tests.milestones.map((m) => ({
      capstone_id: capRow.id,
      ordinal: m.id,
      title: m.title,
      spec_anchor: m.spec_anchor,
      tests: m.tests as unknown as Json,
    })),
  );
  if (insErr) throw insErr;

  console.log(`✓ seeded ${slug} (${tests.milestones.length} milestones)`);
}

async function main() {
  const files = readdirSync(CAPSTONE_DIR).filter((f) => f.endsWith(".tests.json"));
  for (const f of files) {
    const slug = f.replace(".tests.json", "") as CapstoneSlug;
    await seedOne(slug);
  }
  console.log(`done — ${files.length} capstone(s) seeded`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

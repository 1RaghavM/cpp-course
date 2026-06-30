/**
 * push_summaries.ts — Update lessons.summary_md from shipped 14.Y_summary.md files.
 *
 * Summaries are plain column updates on `lessons` (no exercise/test_case churn,
 * no FK concerns). This complements push_exercise_fixes.ts, which only handles
 * exercises. Defaults to dry-run; pass --apply to write. Scope with --chapter.
 *
 * Usage:
 *   npx tsx scripts/push_summaries.ts --chapter 14            # DRY RUN
 *   npx tsx scripts/push_summaries.ts --chapter 14 --apply    # write
 *
 * Env (.env / .env.local): NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL),
 *                          SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { config } from "dotenv";

config({ path: resolve(__dirname, "..", ".env") });
config({ path: resolve(__dirname, "..", ".env.local") });

const APPLY = process.argv.includes("--apply");
const CHAPTERS: string[] = (() => {
  const idx = process.argv.indexOf("--chapter");
  if (idx < 0) return [];
  const out: string[] = [];
  for (let i = idx + 1; i < process.argv.length; i++) {
    if (process.argv[i]!.startsWith("--")) break;
    out.push(process.argv[i]!);
  }
  return out;
})();

function deterministicUUID(lessonNumber: string): string {
  const hash = createHash("sha256").update(`cpproad-lesson:${lessonNumber}`).digest("hex");
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    "4" + hash.slice(13, 16),
    ((parseInt(hash[16]!, 16) & 0x3) | 0x8).toString(16) + hash.slice(17, 20),
    hash.slice(20, 32),
  ].join("-");
}

async function main(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }
  if (CHAPTERS.length === 0) {
    console.error("Refusing to run without --chapter (safety). Pass e.g. --chapter 14.");
    process.exit(1);
  }
  const sb = createClient(url, key);
  const regenDir = resolve(__dirname, "regenerated");

  const lessonNums = readdirSync(regenDir)
    .filter((f) => f.endsWith("_summary.md"))
    .map((f) => f.replace("_summary.md", ""))
    .filter((n) => CHAPTERS.includes(n.split(".")[0]!))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  console.log(`Mode: ${APPLY ? "APPLY (writing)" : "DRY RUN (no writes)"}`);
  console.log(`Chapters: ${CHAPTERS.join(", ")}  (${lessonNums.length} summaries)\n`);

  let changed = 0,
    same = 0,
    missing = 0;
  for (const num of lessonNums) {
    const id = deterministicUUID(num);
    const md = readFileSync(resolve(regenDir, `${num}_summary.md`), "utf-8");
    const { data: lesson, error } = await sb
      .from("lessons")
      .select("id, learncpp_title, summary_md")
      .eq("id", id)
      .single();
    if (error || !lesson) {
      console.log(`! ${num}: lesson not found (id=${id}) — SKIPPED`);
      missing++;
      continue;
    }
    if ((lesson.summary_md ?? "") === md) {
      same++;
      console.log(`  ${num}: unchanged (${md.length} chars)`);
      continue;
    }
    changed++;
    console.log(`  ${num}: ${APPLY ? "UPDATE" : "would update"} "${lesson.learncpp_title}" (${(lesson.summary_md ?? "").length} -> ${md.length} chars)`);
    if (APPLY) {
      const { error: upErr } = await sb
        .from("lessons")
        .update({ summary_md: md, summary_generated_at: new Date().toISOString() })
        .eq("id", id);
      if (upErr) throw new Error(`update failed (${num}): ${upErr.message}`);
    }
  }

  console.log(`\n${APPLY ? "Applied" : "Would apply"}: ${changed} changed, ${same} unchanged, ${missing} missing.`);
  if (!APPLY) console.log("DRY RUN — re-run with --apply to write.");
}

main().catch((e) => {
  console.error("\nFATAL:", e instanceof Error ? e.message : e);
  process.exit(1);
});

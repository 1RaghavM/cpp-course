/**
 * push_exercise_fixes.ts — FK-safe, in-place push of rewritten exercises.
 *
 * Unlike push_regenerated.ts (which DELETEs then re-INSERTs every exercise and
 * therefore FK-violates against `submissions.exercise_id` whenever a learner has
 * already submitted), this loader UPDATEs each exercise row in place — preserving
 * its primary key — so existing submission history stays valid. Only `test_cases`
 * are deleted + re-inserted, which is safe (nothing references test_cases).
 *
 * Scope: only the chapters whose exercises were rewritten in the audit pass.
 * It does NOT touch lessons.summary_md (the rewrites never changed summaries).
 *
 * Matching: new exercise i (sort_order i+1) is matched to the existing row with
 * the same sort_order. Same-count, same-order lessons update cleanly. Count
 * mismatches are reported and handled conservatively (extra new rows inserted;
 * leftover old rows deleted only if they carry no submissions, else skipped with
 * a warning).
 *
 * Usage:
 *   npx tsx scripts/push_exercise_fixes.ts                 # DRY RUN (default, no writes)
 *   npx tsx scripts/push_exercise_fixes.ts --apply         # perform writes
 *   npx tsx scripts/push_exercise_fixes.ts --chapter 22    # restrict to one/more chapters
 *
 * Env (.env / .env.local): NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL),
 *                          SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { config } from "dotenv";

config({ path: resolve(__dirname, "..", ".env") });
config({ path: resolve(__dirname, "..", ".env.local") });

const APPLY = process.argv.includes("--apply");
// All chapters rewritten this session. scripts/regenerated/ contains exactly
// these 11 chapters; the live DB is still at the pre-rewrite baseline for all
// of them, so all are pushed by default. Narrow with --chapter when needed.
const DEFAULT_CHAPTERS = ["1", "13", "17", "18", "19", "20", "21", "22", "23", "24", "25"];
const CHAPTERS: string[] = (() => {
  const idx = process.argv.indexOf("--chapter");
  if (idx < 0) return DEFAULT_CHAPTERS;
  const out: string[] = [];
  for (let i = idx + 1; i < process.argv.length; i++) {
    if (process.argv[i]!.startsWith("--")) break;
    out.push(process.argv[i]!);
  }
  return out.length ? out : DEFAULT_CHAPTERS;
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

interface TestCase {
  label: string;
  is_sample: boolean;
  stdin: string;
  expected_stdout: string;
}
interface ExerciseData {
  title: string;
  prompt_md: string;
  starter_code: string;
  solution_code: string | null;
  difficulty: string;
  test_cases: TestCase[];
}
interface ExistingExercise {
  id: string;
  sort_order: number;
  title: string;
  prompt_md: string;
  starter_code: string;
  solution_code: string | null;
  difficulty: string;
}

const stats = { lessons: 0, updated: 0, inserted: 0, unchanged: 0, tcReplaced: 0, warnings: 0 };

function changedFields(a: ExistingExercise, b: ExerciseData): string[] {
  const f: string[] = [];
  if (a.title !== b.title) f.push("title");
  if (a.prompt_md !== b.prompt_md) f.push("prompt_md");
  if (a.starter_code !== b.starter_code) f.push("starter_code");
  if ((a.solution_code ?? "") !== (b.solution_code ?? "")) f.push("solution_code");
  if (a.difficulty !== b.difficulty) f.push("difficulty");
  return f;
}

async function countSubmissions(sb: SupabaseClient, exId: string): Promise<number> {
  const { count } = await sb
    .from("submissions")
    .select("*", { count: "exact", head: true })
    .eq("exercise_id", exId);
  return count ?? 0;
}

async function replaceTestCases(sb: SupabaseClient, exId: string, tcs: TestCase[]): Promise<void> {
  if (!APPLY) return;
  const { error: delErr } = await sb.from("test_cases").delete().eq("exercise_id", exId);
  if (delErr) throw new Error(`test_cases delete failed for ${exId}: ${delErr.message}`);
  const rows = tcs.map((tc, j) => ({
    exercise_id: exId,
    label: tc.label,
    is_sample: tc.is_sample,
    stdin: tc.stdin,
    expected_stdout: tc.expected_stdout,
    sort_order: j + 1,
  }));
  const { error: insErr } = await sb.from("test_cases").insert(rows);
  if (insErr) throw new Error(`test_cases insert failed for ${exId}: ${insErr.message}`);
}

async function main(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }
  const sb = createClient(url, key);
  const regenDir = resolve(__dirname, "regenerated");

  console.log(`Mode: ${APPLY ? "APPLY (writing)" : "DRY RUN (no writes)"}`);
  console.log(`Chapters: ${CHAPTERS.join(", ")}\n`);

  const lessonNums = readdirSync(regenDir)
    .filter((f) => f.endsWith("_exercises.json"))
    .map((f) => f.replace("_exercises.json", ""))
    .filter((n) => CHAPTERS.includes(n.split(".")[0]!))
    .sort((a, b) => {
      const [ac, al] = a.split(".") as [string, string];
      const [bc, bl] = b.split(".") as [string, string];
      return Number(ac) - Number(bc) || al.localeCompare(bl, undefined, { numeric: true });
    });

  for (const lessonNum of lessonNums) {
    const lessonId = deterministicUUID(lessonNum);
    const exercises: ExerciseData[] = JSON.parse(
      readFileSync(resolve(regenDir, `${lessonNum}_exercises.json`), "utf-8")
    );

    const { data: lesson, error: lErr } = await sb
      .from("lessons")
      .select("id, learncpp_title")
      .eq("id", lessonId)
      .single();
    if (lErr || !lesson) {
      console.log(`! ${lessonNum}: lesson not found in DB (id=${lessonId}) — SKIPPED`);
      stats.warnings++;
      continue;
    }

    const { data: existingRaw, error: exErr } = await sb
      .from("exercises")
      .select("id, sort_order, title, prompt_md, starter_code, solution_code, difficulty")
      .eq("lesson_id", lessonId)
      .order("sort_order", { ascending: true });
    if (exErr) {
      console.log(`! ${lessonNum}: failed to read existing exercises: ${exErr.message} — SKIPPED`);
      stats.warnings++;
      continue;
    }
    const existing = (existingRaw ?? []) as ExistingExercise[];
    const bySort = new Map(existing.map((e) => [e.sort_order, e]));

    stats.lessons++;
    console.log(`--- ${lessonNum}  "${lesson.learncpp_title}"  (db:${existing.length} file:${exercises.length})`);

    for (let i = 0; i < exercises.length; i++) {
      const ex = exercises[i]!;
      const sortOrder = i + 1;
      const cur = bySort.get(sortOrder);

      if (cur) {
        const diff = changedFields(cur, ex);
        const subs = await countSubmissions(sb, cur.id);
        if (diff.length === 0) {
          stats.unchanged++;
          console.log(`    [${sortOrder}] unchanged "${ex.title}" (subs:${subs}) — refresh ${ex.test_cases.length} test_cases`);
        } else {
          stats.updated++;
          console.log(`    [${sortOrder}] UPDATE "${ex.title}" (subs:${subs}) fields: ${diff.join(", ")}; ${ex.test_cases.length} test_cases`);
          if (APPLY) {
            const { error: updErr } = await sb
              .from("exercises")
              .update({
                title: ex.title,
                prompt_md: ex.prompt_md,
                starter_code: ex.starter_code,
                solution_code: ex.solution_code,
                difficulty: ex.difficulty,
              })
              .eq("id", cur.id);
            if (updErr) throw new Error(`exercise update failed (${lessonNum} #${sortOrder}): ${updErr.message}`);
          }
        }
        await replaceTestCases(sb, cur.id, ex.test_cases);
        stats.tcReplaced++;
      } else {
        // New exercise beyond existing count — insert fresh (no submissions can exist yet).
        stats.inserted++;
        console.log(`    [${sortOrder}] INSERT "${ex.title}" (new row); ${ex.test_cases.length} test_cases`);
        if (APPLY) {
          const { data: ins, error: insErr } = await sb
            .from("exercises")
            .insert({
              lesson_id: lessonId,
              title: ex.title,
              prompt_md: ex.prompt_md,
              starter_code: ex.starter_code,
              solution_code: ex.solution_code,
              difficulty: ex.difficulty,
              sort_order: sortOrder,
            })
            .select("id")
            .single();
          if (insErr || !ins) throw new Error(`exercise insert failed (${lessonNum} #${sortOrder}): ${insErr?.message}`);
          await replaceTestCases(sb, ins.id, ex.test_cases);
        }
        stats.tcReplaced++;
      }
    }

    // Leftover old rows (DB had more exercises than the file). Delete only if safe.
    const leftover = existing.filter((e) => e.sort_order > exercises.length);
    for (const lo of leftover) {
      const subs = await countSubmissions(sb, lo.id);
      if (subs > 0) {
        stats.warnings++;
        console.log(`    [!] leftover "${lo.title}" (sort ${lo.sort_order}) has ${subs} submissions — LEFT IN PLACE (manual review)`);
      } else {
        console.log(`    [-] DELETE leftover "${lo.title}" (sort ${lo.sort_order}, no submissions)`);
        if (APPLY) {
          await sb.from("test_cases").delete().eq("exercise_id", lo.id);
          const { error: dErr } = await sb.from("exercises").delete().eq("id", lo.id);
          if (dErr) throw new Error(`leftover delete failed (${lessonNum} ${lo.id}): ${dErr.message}`);
        }
      }
    }
  }

  console.log(
    `\n${APPLY ? "Applied" : "Would apply"}: ${stats.lessons} lessons | ` +
      `updated ${stats.updated}, inserted ${stats.inserted}, unchanged ${stats.unchanged}, ` +
      `test_case sets replaced ${stats.tcReplaced}, warnings ${stats.warnings}`
  );
  if (!APPLY) console.log("\nDRY RUN — no changes were written. Re-run with --apply to commit.");
}

main().catch((e) => {
  console.error("\nFATAL:", e instanceof Error ? e.message : e);
  process.exit(1);
});

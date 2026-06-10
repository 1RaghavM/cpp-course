/**
 * push_v2.ts — Push validated Phase A content to Supabase.
 *
 * Reads scripts/regenerated/v2/<lesson_number>/{summary.md, checks.json, exercises.json}
 * and v2/validation_status.json. Only lessons with status "pass" are pushed
 * (override with --force, e.g. for intro-chapter lessons that only have a summary).
 *
 * Per lesson: updates lessons.summary_md, replaces exercises + test_cases,
 * replaces concept_checks. This is the offline equivalent of the (disabled)
 * regenerate endpoint — the ONLY path that clears cached content.
 *
 * Usage:
 *   npx tsx scripts/push_v2.ts
 *   npx tsx scripts/push_v2.ts --lessons 13.7,13.8
 *
 * Env (.env / .env.local): NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";

config({ path: resolve(__dirname, "..", ".env") });
config({ path: resolve(__dirname, "..", ".env.local") });

const V2_ROOT = resolve(__dirname, "regenerated", "v2");
const MODEL = "claude-sonnet-4-6";

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

interface CheckItem {
  kind: string;
  prompt_md: string;
  options: Record<string, string> | null;
  answer: string;
  explanation_md: string;
}

interface ExerciseItem {
  title: string;
  prompt_md: string;
  starter_code: string;
  solution_code: string;
  difficulty?: string;
  test_cases: Array<{ label: string; is_sample: boolean; stdin: string; expected_stdout: string }>;
}

async function main(): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }
  const supabase = createClient(supabaseUrl, supabaseKey);

  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const li = args.indexOf("--lessons");
  const filter = li !== -1 && args[li + 1] ? args[li + 1]!.split(",").map((s) => s.trim()) : null;

  const statusPath = resolve(V2_ROOT, "validation_status.json");
  const status: Record<string, string> = existsSync(statusPath)
    ? (JSON.parse(readFileSync(statusPath, "utf-8")) as Record<string, string>)
    : {};

  const lessonDirs = readdirSync(V2_ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== ".build" && d.name !== "_meta")
    .map((d) => d.name)
    .filter((name) => !filter || filter.includes(name))
    .sort();

  let pushed = 0;
  let skipped = 0;

  for (const lessonNum of lessonDirs) {
    if (status[lessonNum] !== "pass" && !force) {
      console.log(`[${lessonNum}] skipped (validation status: ${status[lessonNum] ?? "missing"})`);
      skipped++;
      continue;
    }

    const lessonId = deterministicUUID(lessonNum);
    const dir = resolve(V2_ROOT, lessonNum);
    console.log(`\n[${lessonNum}] (id: ${lessonId})`);

    const { data: lesson, error: lessonError } = await supabase
      .from("lessons")
      .select("id, learncpp_title")
      .eq("id", lessonId)
      .single();
    if (lessonError || !lesson) {
      console.error(`  not found in DB: ${lessonError?.message}`);
      continue;
    }

    // 1. Summary
    const summaryMd = readFileSync(resolve(dir, "summary.md"), "utf-8");
    const { error: upErr } = await supabase
      .from("lessons")
      .update({
        summary_md: summaryMd,
        summary_generated_at: new Date().toISOString(),
        summary_model: MODEL,
      })
      .eq("id", lessonId);
    if (upErr) {
      console.error(`  summary update failed: ${upErr.message}`);
      continue;
    }
    console.log(`  summary updated (${summaryMd.length} chars)`);

    // 2. Concept checks: replace
    const checksPath = resolve(dir, "checks.json");
    const { error: ccDelErr } = await supabase.from("concept_checks").delete().eq("lesson_id", lessonId);
    if (ccDelErr) console.error(`  concept_checks delete failed: ${ccDelErr.message}`);
    if (existsSync(checksPath)) {
      const checks = JSON.parse(readFileSync(checksPath, "utf-8")) as CheckItem[];
      const rows = checks.map((c, i) => ({
        lesson_id: lessonId,
        kind: c.kind,
        prompt_md: c.prompt_md,
        options: c.options,
        answer: c.answer,
        explanation_md: c.explanation_md,
        position: i + 1,
        generated_model: MODEL,
      }));
      const { error: ccInsErr } = await supabase.from("concept_checks").insert(rows);
      if (ccInsErr) console.error(`  concept_checks insert failed: ${ccInsErr.message}`);
      else console.log(`  ${rows.length} concept checks inserted`);
    }

    // 3. Exercises + test cases: replace (same order as push_regenerated.ts)
    const exercisesPath = resolve(dir, "exercises.json");
    if (existsSync(exercisesPath)) {
      const { data: oldExercises } = await supabase.from("exercises").select("id").eq("lesson_id", lessonId);
      if (oldExercises && oldExercises.length > 0) {
        await supabase.from("test_cases").delete().in("exercise_id", oldExercises.map((e) => e.id));
      }
      await supabase.from("exercises").delete().eq("lesson_id", lessonId);

      const exercises = JSON.parse(readFileSync(exercisesPath, "utf-8")) as ExerciseItem[];
      for (let i = 0; i < exercises.length; i++) {
        const ex = exercises[i]!;
        const { data: insertedEx, error: exInsErr } = await supabase
          .from("exercises")
          .insert({
            lesson_id: lessonId,
            title: ex.title,
            prompt_md: ex.prompt_md,
            starter_code: ex.starter_code,
            solution_code: ex.solution_code,
            difficulty: ex.difficulty ?? "practice",
            sort_order: i + 1,
            generated_model: MODEL,
          })
          .select("id")
          .single();
        if (exInsErr || !insertedEx) {
          console.error(`  exercise "${ex.title}" insert failed: ${exInsErr?.message}`);
          continue;
        }
        const tcRows = ex.test_cases.map((tcase, j) => ({
          exercise_id: insertedEx.id,
          label: tcase.label,
          is_sample: tcase.is_sample,
          stdin: tcase.stdin,
          expected_stdout: tcase.expected_stdout,
          sort_order: j + 1,
        }));
        const { error: tcInsErr } = await supabase.from("test_cases").insert(tcRows);
        if (tcInsErr) console.error(`  test_cases insert failed: ${tcInsErr.message}`);
        else console.log(`  exercise "${ex.title}" + ${tcRows.length} test cases`);
      }
    }
    pushed++;
  }

  console.log(`\nDone. pushed=${pushed} skipped=${skipped}`);
}

main();

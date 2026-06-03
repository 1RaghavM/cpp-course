/**
 * push_regenerated.ts — Push regenerated lesson content to Supabase.
 *
 * Usage: npx tsx scripts/push_regenerated.ts
 *
 * Reads summary .md and exercises .json from scripts/regenerated/,
 * updates the lesson summary, deletes old exercises + test_cases,
 * and inserts the new ones.
 *
 * Requires env vars (from .env):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { config } from "dotenv";

config({ path: resolve(__dirname, "..", ".env") });

function deterministicUUID(lessonNumber: string): string {
  const hash = createHash("sha256").update(`cpproad-lesson:${lessonNumber}`).digest("hex");
  const uuid = [
    hash.slice(0, 8),
    hash.slice(8, 12),
    "4" + hash.slice(13, 16),
    ((parseInt(hash[16]!, 16) & 0x3) | 0x8).toString(16) + hash.slice(17, 20),
    hash.slice(20, 32),
  ].join("-");
  return uuid;
}

interface ExerciseData {
  title: string;
  prompt_md: string;
  starter_code: string;
  solution_code: string | null;
  difficulty: string;
  test_cases: {
    label: string;
    is_sample: boolean;
    stdin: string;
    expected_stdout: string;
  }[];
}

async function main(): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const regenDir = resolve(__dirname, "regenerated");

  const summaryFiles = readdirSync(regenDir).filter((f) => f.endsWith("_summary.md"));
  const lessonNumbers = summaryFiles.map((f) => f.replace("_summary.md", ""));

  console.log(`Found ${lessonNumbers.length} lessons to update: ${lessonNumbers.join(", ")}`);

  for (const lessonNum of lessonNumbers) {
    const lessonId = deterministicUUID(lessonNum);
    console.log(`\n--- Lesson ${lessonNum} (id: ${lessonId}) ---`);

    // Read regenerated content
    const summaryMd = readFileSync(resolve(regenDir, `${lessonNum}_summary.md`), "utf-8");
    const exercisesRaw = readFileSync(resolve(regenDir, `${lessonNum}_exercises.json`), "utf-8");
    const exercises: ExerciseData[] = JSON.parse(exercisesRaw);

    // Step 1: Verify lesson exists
    const { data: lesson, error: lessonError } = await supabase
      .from("lessons")
      .select("id, learncpp_title, number")
      .eq("id", lessonId)
      .single();

    if (lessonError || !lesson) {
      console.error(`  Lesson ${lessonNum} not found in DB (id=${lessonId}): ${lessonError?.message}`);
      continue;
    }
    console.log(`  Found: "${lesson.learncpp_title}"`);

    // Step 2: Delete old test_cases for this lesson's exercises
    const { data: oldExercises } = await supabase
      .from("exercises")
      .select("id")
      .eq("lesson_id", lessonId);

    if (oldExercises && oldExercises.length > 0) {
      const oldExIds = oldExercises.map((e) => e.id);
      const { error: tcDelErr } = await supabase
        .from("test_cases")
        .delete()
        .in("exercise_id", oldExIds);
      if (tcDelErr) {
        console.error(`  Failed to delete old test_cases: ${tcDelErr.message}`);
      } else {
        console.log(`  Deleted test_cases for ${oldExIds.length} old exercises`);
      }
    }

    // Step 3: Delete old exercises
    const { error: exDelErr } = await supabase
      .from("exercises")
      .delete()
      .eq("lesson_id", lessonId);
    if (exDelErr) {
      console.error(`  Failed to delete old exercises: ${exDelErr.message}`);
    } else {
      console.log(`  Deleted old exercises`);
    }

    // Step 4: Update lesson summary
    const { error: updateErr } = await supabase
      .from("lessons")
      .update({
        summary_md: summaryMd,
        summary_generated_at: new Date().toISOString(),
        summary_model: "claude-opus-4-6",
      })
      .eq("id", lessonId);

    if (updateErr) {
      console.error(`  Failed to update summary: ${updateErr.message}`);
      continue;
    }
    console.log(`  Updated summary (${summaryMd.length} chars)`);

    // Step 5: Insert new exercises + test_cases
    for (let i = 0; i < exercises.length; i++) {
      const ex = exercises[i]!;

      const { data: insertedEx, error: exInsertErr } = await supabase
        .from("exercises")
        .insert({
          lesson_id: lessonId,
          title: ex.title,
          prompt_md: ex.prompt_md,
          starter_code: ex.starter_code,
          solution_code: ex.solution_code,
          difficulty: ex.difficulty,
          sort_order: i + 1,
          generated_model: "claude-opus-4-6",
        })
        .select("id")
        .single();

      if (exInsertErr || !insertedEx) {
        console.error(`  Failed to insert exercise "${ex.title}": ${exInsertErr?.message}`);
        continue;
      }

      const tcRows = ex.test_cases.map((tc, j) => ({
        exercise_id: insertedEx.id,
        label: tc.label,
        is_sample: tc.is_sample,
        stdin: tc.stdin,
        expected_stdout: tc.expected_stdout,
        sort_order: j + 1,
      }));

      const { error: tcInsertErr } = await supabase
        .from("test_cases")
        .insert(tcRows);

      if (tcInsertErr) {
        console.error(`  Failed to insert test_cases for "${ex.title}": ${tcInsertErr.message}`);
      } else {
        console.log(`  Inserted exercise "${ex.title}" with ${tcRows.length} test cases`);
      }
    }
  }

  console.log("\nDone.");
}

main();

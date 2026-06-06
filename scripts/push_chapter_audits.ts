/**
 * push_chapter_audits.ts — Push fixed chapter content from ch_X.json files to Supabase.
 *
 * Usage:
 *   npx tsx scripts/push_chapter_audits.ts                    # push all modified chapters
 *   npx tsx scripts/push_chapter_audits.ts --chapter 1 13 25  # push specific chapters
 *   npx tsx scripts/push_chapter_audits.ts --dry-run           # preview without changes
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { config } from "dotenv";

config({ path: resolve(__dirname, "..", ".env") });

const DRY_RUN = process.argv.includes("--dry-run");
const CHAPTER_FILTER = (() => {
  const idx = process.argv.indexOf("--chapter");
  if (idx < 0) return null;
  const chapters: string[] = [];
  for (let i = idx + 1; i < process.argv.length; i++) {
    if (process.argv[i]!.startsWith("--")) break;
    chapters.push(process.argv[i]!);
  }
  return chapters.length > 0 ? chapters : null;
})();

const CHAPTERS_TO_PUSH = CHAPTER_FILTER || [
  "0", "1", "13", "17", "18", "19", "20", "21", "22", "23", "24", "25",
];

function deterministicUUID(lessonNumber: string): string {
  const hash = createHash("sha256")
    .update(`cpproad-lesson:${lessonNumber}`)
    .digest("hex");
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
  difficulty?: string;
  test_cases: TestCase[];
}

interface LessonData {
  number: string;
  title: string;
  sort_order: number;
  summary_md: string;
  exercises: ExerciseData[];
}

async function pushLesson(
  supabase: SupabaseClient,
  lesson: LessonData
): Promise<{ ok: boolean; message: string }> {
  const lessonId = deterministicUUID(lesson.number);

  const { data: existing, error: findErr } = await supabase
    .from("lessons")
    .select("id, learncpp_title")
    .eq("id", lessonId)
    .single();

  if (findErr || !existing) {
    return { ok: false, message: `Not found in DB (id=${lessonId})` };
  }

  const actions: string[] = [];

  // Update summary
  if (lesson.summary_md) {
    if (!DRY_RUN) {
      const { error } = await supabase
        .from("lessons")
        .update({
          summary_md: lesson.summary_md,
          summary_generated_at: new Date().toISOString(),
          summary_model: "claude-opus-4-6",
        })
        .eq("id", lessonId);

      if (error) return { ok: false, message: `Summary update failed: ${error.message}` };
    }
    actions.push(`summary (${lesson.summary_md.length} chars)`);
  }

  // Replace exercises
  if (lesson.exercises && lesson.exercises.length > 0) {
    if (!DRY_RUN) {
      // Delete old test_cases → submissions → exercises
      const { data: oldExercises } = await supabase
        .from("exercises")
        .select("id")
        .eq("lesson_id", lessonId);

      if (oldExercises && oldExercises.length > 0) {
        const oldIds = oldExercises.map((e) => e.id);

        await supabase.from("submissions").delete().in("exercise_id", oldIds);
        const { error: tcErr } = await supabase
          .from("test_cases")
          .delete()
          .in("exercise_id", oldIds);
        if (tcErr) return { ok: false, message: `Delete test_cases failed: ${tcErr.message}` };
      }

      const { error: exDelErr } = await supabase
        .from("exercises")
        .delete()
        .eq("lesson_id", lessonId);
      if (exDelErr) return { ok: false, message: `Delete exercises failed: ${exDelErr.message}` };

      // Insert new exercises
      for (let i = 0; i < lesson.exercises.length; i++) {
        const ex = lesson.exercises[i]!;
        const { data: inserted, error: insErr } = await supabase
          .from("exercises")
          .insert({
            lesson_id: lessonId,
            title: ex.title,
            prompt_md: ex.prompt_md,
            starter_code: ex.starter_code,
            solution_code: ex.solution_code,
            difficulty: ex.difficulty || "practice",
            sort_order: i + 1,
            generated_model: "claude-opus-4-6",
          })
          .select("id")
          .single();

        if (insErr || !inserted) {
          return { ok: false, message: `Insert exercise "${ex.title}" failed: ${insErr?.message}` };
        }

        if (ex.test_cases && ex.test_cases.length > 0) {
          const tcRows = ex.test_cases.map((tc, j) => ({
            exercise_id: inserted.id,
            label: tc.label,
            is_sample: tc.is_sample,
            stdin: tc.stdin,
            expected_stdout: tc.expected_stdout,
            sort_order: j + 1,
          }));

          const { error: tcErr } = await supabase.from("test_cases").insert(tcRows);
          if (tcErr) {
            return { ok: false, message: `Insert test_cases for "${ex.title}" failed: ${tcErr.message}` };
          }
        }
      }
    }

    const tcCount = lesson.exercises.reduce((s, e) => s + (e.test_cases?.length || 0), 0);
    actions.push(`${lesson.exercises.length} exercises (${tcCount} test cases)`);
  }

  return {
    ok: true,
    message: actions.length > 0 ? actions.join(" + ") : "no changes",
  };
}

async function main(): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }

  if (DRY_RUN) console.log("=== DRY RUN MODE ===\n");

  const supabase = createClient(supabaseUrl, supabaseKey);
  const chaptersDir = resolve(__dirname, "regenerated", "chapters");

  let totalLessons = 0;
  let success = 0;
  let failed = 0;

  for (const chNum of CHAPTERS_TO_PUSH) {
    const filePath = resolve(chaptersDir, `ch_${chNum}.json`);
    let data: { chapter?: { title?: string }; lessons: LessonData[] };

    try {
      data = JSON.parse(readFileSync(filePath, "utf-8"));
    } catch {
      console.error(`\nChapter ${chNum}: file not found at ${filePath}`);
      continue;
    }

    const chTitle = data.chapter?.title || `Chapter ${chNum}`;
    console.log(`\n${"=".repeat(60)}`);
    console.log(`Chapter ${chNum}: ${chTitle} (${data.lessons.length} lessons)`);
    console.log("=".repeat(60));

    for (const lesson of data.lessons) {
      totalLessons++;
      const result = await pushLesson(supabase, lesson);

      if (result.ok) {
        console.log(`  ${lesson.number}: ✓ ${result.message}`);
        success++;
      } else {
        console.error(`  ${lesson.number}: ✗ ${result.message}`);
        failed++;
      }
    }
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(
    `Done: ${success} succeeded, ${failed} failed (${totalLessons} lessons across ${CHAPTERS_TO_PUSH.length} chapters)`
  );
  if (DRY_RUN) console.log("(dry run — no changes were made)");
}

main();

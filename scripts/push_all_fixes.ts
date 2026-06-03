/**
 * push_all_fixes.ts — Push ALL corrected lesson content from scripts/regenerated/fixes/ to Supabase.
 *
 * Usage: npx tsx scripts/push_all_fixes.ts [--dry-run] [--chapter 7]
 *
 * Handles the heterogeneous file formats produced by the fix agents:
 *   Format A (ch2):     X.Y_exercises.json (array) + X.Y_summary.md (raw)
 *   Format B (ch3):     lesson_X_Y.json → { number, title, sort_order, summary_md, exercises }
 *   Format C (ch4,8):   X.Y.json → { number, title, sort_order, summary_md, exercises }
 *   Format D (ch5,6):   X.Y.json → { lesson, title, fixes, summary_md, exercises }
 *   Format E (ch9):     X.Y.json → { lesson: { number, title, ..., summary_md, exercises }, fixes_applied }
 *   Format F (ch7):     X.Y_exN.json (single exercise) + X.Y_summary.json
 *   Format G (ch10-16,F): ch_XX.json → { chapter, lessons: [...] }
 *   Format H (ch12):    MANIFEST.json + individual exercise files
 *
 * For partial exercise replacements (single exercise files), fetches current exercises
 * from DB, merges fixes, then pushes the full set.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { createHash } from "node:crypto";
import { config } from "dotenv";

config({ path: resolve(__dirname, "..", ".env") });

const DRY_RUN = process.argv.includes("--dry-run");
const CHAPTER_FILTER = (() => {
  const idx = process.argv.indexOf("--chapter");
  return idx >= 0 ? process.argv[idx + 1] : null;
})();

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

interface ExerciseData {
  title: string;
  prompt_md: string;
  starter_code: string;
  solution_code: string | null;
  difficulty?: string;
  test_cases: {
    label: string;
    is_sample: boolean;
    stdin: string;
    expected_stdout: string;
  }[];
}

interface LessonFix {
  lessonNumber: string;
  summary_md?: string;
  exercises?: ExerciseData[];
  partialExercises?: { index: number; exercise: ExerciseData }[];
}

function loadFixesFromDir(dirPath: string, chapterName: string): LessonFix[] {
  const fixes: LessonFix[] = [];
  const files = readdirSync(dirPath);

  // Format G: Combined chapter JSON (ch10, ch11, ch14, ch15, ch16, chF)
  const combinedFile = files.find(
    (f) =>
      (f.startsWith("ch_") && f.endsWith(".json") && !f.includes("changelog")) ||
      (f.startsWith("ch_") && f.endsWith("_fixed.json"))
  );
  if (combinedFile) {
    const data = JSON.parse(readFileSync(join(dirPath, combinedFile), "utf-8"));
    if (data.lessons && Array.isArray(data.lessons)) {
      for (const lesson of data.lessons) {
        const fix: LessonFix = { lessonNumber: lesson.number };
        if (lesson.summary_md) fix.summary_md = lesson.summary_md;
        if (lesson.exercises && lesson.exercises.length > 0) {
          fix.exercises = lesson.exercises.map((ex: ExerciseData) => ({
            title: ex.title,
            prompt_md: ex.prompt_md,
            starter_code: ex.starter_code,
            solution_code: ex.solution_code ?? null,
            difficulty: ex.difficulty ?? "practice",
            test_cases: ex.test_cases,
          }));
        }
        fixes.push(fix);
      }
      return fixes;
    }
  }

  // Format H: MANIFEST-based (ch12)
  if (files.includes("MANIFEST.json")) {
    const manifest = JSON.parse(
      readFileSync(join(dirPath, "MANIFEST.json"), "utf-8")
    );
    for (const entry of manifest.fixes || []) {
      const filePath = join(dirPath, entry.file);
      if (!existsSync(filePath)) continue;
      const data = JSON.parse(readFileSync(filePath, "utf-8"));

      if (data.exercises && Array.isArray(data.exercises)) {
        fixes.push({
          lessonNumber: data.lesson || entry.lesson,
          exercises: data.exercises,
        });
      } else if (data.exercise && data.exercise_index !== undefined) {
        const existing = fixes.find(
          (f) => f.lessonNumber === (data.lesson || entry.lesson)
        );
        if (existing) {
          if (!existing.partialExercises) existing.partialExercises = [];
          existing.partialExercises.push({
            index: data.exercise_index,
            exercise: data.exercise,
          });
        } else {
          fixes.push({
            lessonNumber: data.lesson || entry.lesson,
            partialExercises: [
              { index: data.exercise_index, exercise: data.exercise },
            ],
          });
        }
      }
    }
    return fixes;
  }

  // Per-file formats
  const lessonMap = new Map<string, LessonFix>();

  for (const file of files) {
    if (file.endsWith("_changelog.md") || file.endsWith("_changelog.txt")) continue;
    const filePath = join(dirPath, file);

    // Format A: X.Y_summary.md
    if (file.endsWith("_summary.md")) {
      const lessonNum = file.replace("_summary.md", "");
      const fix = lessonMap.get(lessonNum) || { lessonNumber: lessonNum };
      fix.summary_md = readFileSync(filePath, "utf-8");
      lessonMap.set(lessonNum, fix);
      continue;
    }

    // Format A: X.Y_exercises.json (plain array)
    if (file.endsWith("_exercises.json")) {
      const lessonNum = file.replace("_exercises.json", "");
      const data = JSON.parse(readFileSync(filePath, "utf-8"));
      const fix = lessonMap.get(lessonNum) || { lessonNumber: lessonNum };
      if (Array.isArray(data)) {
        fix.exercises = data;
      } else if (data.exercises) {
        fix.exercises = data.exercises;
      }
      lessonMap.set(lessonNum, fix);
      continue;
    }

    if (!file.endsWith(".json")) continue;

    // Format F: X.Y_exN.json (single exercise replacement) or X.Y_summary.json
    const exMatch = file.match(/^(\d+\.\d+)_ex(\d+)\.json$/);
    if (exMatch) {
      const [, lessonNum, exIdx] = exMatch;
      const data = JSON.parse(readFileSync(filePath, "utf-8"));
      const fix = lessonMap.get(lessonNum!) || { lessonNumber: lessonNum! };
      if (!fix.partialExercises) fix.partialExercises = [];
      const exerciseData = data.exercise || data;
      const index = data.exercise_index ?? parseInt(exIdx!, 10) - 1;
      fix.partialExercises.push({ index, exercise: exerciseData });
      lessonMap.set(lessonNum!, fix);
      continue;
    }

    const summaryJsonMatch = file.match(/^(\d+\.\d+)_summary\.json$/);
    if (summaryJsonMatch) {
      const lessonNum = summaryJsonMatch[1]!;
      const data = JSON.parse(readFileSync(filePath, "utf-8"));
      const fix = lessonMap.get(lessonNum) || { lessonNumber: lessonNum };
      fix.summary_md = data.summary_md;
      lessonMap.set(lessonNum, fix);
      continue;
    }

    // Format B: lesson_X_Y.json
    const lessonFileMatch = file.match(/^lesson_(\d+)_(\d+|x)\.json$/);
    if (lessonFileMatch) {
      const lessonNum = `${lessonFileMatch[1]}.${lessonFileMatch[2]}`;
      const data = JSON.parse(readFileSync(filePath, "utf-8"));
      const fix: LessonFix = { lessonNumber: data.number || lessonNum };
      if (data.summary_md) fix.summary_md = data.summary_md;
      if (data.exercises) fix.exercises = data.exercises;
      lessonMap.set(fix.lessonNumber, fix);
      continue;
    }

    // Format C/D/E: X.Y.json (lesson number as filename)
    const numMatch = file.match(/^(\d+\.\d+|[\d]+\.x)\.json$/);
    if (numMatch) {
      const data = JSON.parse(readFileSync(filePath, "utf-8"));

      // Format E (ch9): { lesson: { number, summary_md, exercises, ... } }
      if (data.lesson && typeof data.lesson === "object" && data.lesson.number) {
        const lesson = data.lesson;
        const fix: LessonFix = { lessonNumber: lesson.number };
        if (lesson.summary_md) fix.summary_md = lesson.summary_md;
        if (lesson.exercises) fix.exercises = lesson.exercises;
        lessonMap.set(fix.lessonNumber, fix);
        continue;
      }

      // Format C/D: { number|lesson, summary_md, exercises }
      const lessonNum = data.number || data.lesson || numMatch[1]!;
      const fix: LessonFix = { lessonNumber: lessonNum };
      if (data.summary_md) fix.summary_md = data.summary_md;
      if (data.exercises) fix.exercises = data.exercises;
      lessonMap.set(fix.lessonNumber, fix);
      continue;
    }
  }

  return Array.from(lessonMap.values());
}

async function fetchExistingExercises(
  supabase: SupabaseClient,
  lessonId: string
): Promise<ExerciseData[]> {
  const { data: exercises } = await supabase
    .from("exercises")
    .select("title, prompt_md, starter_code, solution_code, difficulty, sort_order")
    .eq("lesson_id", lessonId)
    .order("sort_order", { ascending: true });

  if (!exercises || exercises.length === 0) return [];

  const result: ExerciseData[] = [];
  for (const ex of exercises) {
    const { data: testCases } = await supabase
      .from("test_cases")
      .select("label, is_sample, stdin, expected_stdout")
      .eq("exercise_id", ex.sort_order) // we'll need to re-fetch by exercise id
      .order("sort_order", { ascending: true });

    result.push({
      title: ex.title,
      prompt_md: ex.prompt_md,
      starter_code: ex.starter_code,
      solution_code: ex.solution_code,
      difficulty: ex.difficulty,
      test_cases: testCases || [],
    });
  }
  return result;
}

async function fetchExistingExercisesById(
  supabase: SupabaseClient,
  lessonId: string
): Promise<ExerciseData[]> {
  const { data: exercises } = await supabase
    .from("exercises")
    .select("id, title, prompt_md, starter_code, solution_code, difficulty, sort_order")
    .eq("lesson_id", lessonId)
    .order("sort_order", { ascending: true });

  if (!exercises || exercises.length === 0) return [];

  const result: ExerciseData[] = [];
  for (const ex of exercises) {
    const { data: testCases } = await supabase
      .from("test_cases")
      .select("label, is_sample, stdin, expected_stdout, sort_order")
      .eq("exercise_id", ex.id)
      .order("sort_order", { ascending: true });

    result.push({
      title: ex.title,
      prompt_md: ex.prompt_md,
      starter_code: ex.starter_code,
      solution_code: ex.solution_code,
      difficulty: ex.difficulty,
      test_cases: (testCases || []).map((tc) => ({
        label: tc.label,
        is_sample: tc.is_sample,
        stdin: tc.stdin,
        expected_stdout: tc.expected_stdout,
      })),
    });
  }
  return result;
}

async function pushLessonFix(
  supabase: SupabaseClient,
  fix: LessonFix
): Promise<{ ok: boolean; message: string }> {
  const lessonId = deterministicUUID(fix.lessonNumber);

  // Verify lesson exists
  const { data: lesson, error: lessonError } = await supabase
    .from("lessons")
    .select("id, learncpp_title, number")
    .eq("id", lessonId)
    .single();

  if (lessonError || !lesson) {
    return {
      ok: false,
      message: `Lesson ${fix.lessonNumber} not found (id=${lessonId}): ${lessonError?.message}`,
    };
  }

  // Resolve partial exercises into a full exercises array
  let exercises = fix.exercises;
  if (!exercises && fix.partialExercises && fix.partialExercises.length > 0) {
    const existing = await fetchExistingExercisesById(supabase, lessonId);
    if (existing.length === 0) {
      return {
        ok: false,
        message: `Lesson ${fix.lessonNumber}: need to merge partial exercises but no existing exercises found in DB`,
      };
    }
    exercises = [...existing];
    for (const partial of fix.partialExercises) {
      if (partial.index >= 0 && partial.index < exercises.length) {
        exercises[partial.index] = partial.exercise;
      } else {
        exercises.push(partial.exercise);
      }
    }
  }

  const actions: string[] = [];

  // Update summary if provided
  if (fix.summary_md) {
    if (DRY_RUN) {
      actions.push(`Would update summary (${fix.summary_md.length} chars)`);
    } else {
      const { error: updateErr } = await supabase
        .from("lessons")
        .update({
          summary_md: fix.summary_md,
          summary_generated_at: new Date().toISOString(),
          summary_model: "claude-opus-4-6",
        })
        .eq("id", lessonId);

      if (updateErr) {
        return { ok: false, message: `Failed to update summary: ${updateErr.message}` };
      }
      actions.push(`Updated summary (${fix.summary_md.length} chars)`);
    }
  }

  // Replace exercises if provided
  if (exercises && exercises.length > 0) {
    if (DRY_RUN) {
      actions.push(`Would replace ${exercises.length} exercises`);
    } else {
      // Delete old test_cases
      const { data: oldExercises } = await supabase
        .from("exercises")
        .select("id")
        .eq("lesson_id", lessonId);

      if (oldExercises && oldExercises.length > 0) {
        const oldExIds = oldExercises.map((e) => e.id);

        // Delete submissions referencing these exercises first
        const { error: subDelErr } = await supabase
          .from("submissions")
          .delete()
          .in("exercise_id", oldExIds);
        if (subDelErr) {
          console.warn(
            `    Warning: Failed to delete submissions: ${subDelErr.message}`
          );
        }

        const { error: tcDelErr } = await supabase
          .from("test_cases")
          .delete()
          .in("exercise_id", oldExIds);
        if (tcDelErr) {
          return {
            ok: false,
            message: `Failed to delete old test_cases: ${tcDelErr.message}`,
          };
        }
      }

      // Delete old exercises
      const { error: exDelErr } = await supabase
        .from("exercises")
        .delete()
        .eq("lesson_id", lessonId);
      if (exDelErr) {
        return {
          ok: false,
          message: `Failed to delete old exercises: ${exDelErr.message}`,
        };
      }

      // Insert new exercises + test_cases
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
            difficulty: ex.difficulty || "practice",
            sort_order: i + 1,
            generated_model: "claude-opus-4-6",
          })
          .select("id")
          .single();

        if (exInsertErr || !insertedEx) {
          return {
            ok: false,
            message: `Failed to insert exercise "${ex.title}": ${exInsertErr?.message}`,
          };
        }

        if (ex.test_cases && ex.test_cases.length > 0) {
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
            return {
              ok: false,
              message: `Failed to insert test_cases for "${ex.title}": ${tcInsertErr.message}`,
            };
          }
        }
      }
      actions.push(
        `Replaced ${exercises.length} exercises (${exercises.reduce((sum, ex) => sum + (ex.test_cases?.length || 0), 0)} test cases)`
      );
    }
  }

  return {
    ok: true,
    message: actions.length > 0 ? actions.join("; ") : "No changes needed",
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
  const fixesDir = resolve(__dirname, "regenerated", "fixes");

  const chapterDirs = readdirSync(fixesDir)
    .filter((d) => d.startsWith("ch"))
    .sort((a, b) => {
      const numA = a.replace("ch", "").replace("F", "99");
      const numB = b.replace("ch", "").replace("F", "99");
      return parseInt(numA) - parseInt(numB);
    });

  let totalLessons = 0;
  let totalSuccess = 0;
  let totalFailed = 0;
  let totalSkipped = 0;

  // Ch1 exercise-only fixes live in scripts/regenerated/1.X_exercises.json (no fixes/ subdir)
  if (!CHAPTER_FILTER || CHAPTER_FILTER === "1") {
    const regenDir = resolve(__dirname, "regenerated");
    const ch1Files = readdirSync(regenDir).filter((f) =>
      /^1\.\d+_exercises\.json$/.test(f)
    );
    if (ch1Files.length > 0) {
      console.log(`\n${"=".repeat(60)}`);
      console.log(`Chapter 1`);
      console.log(`${"=".repeat(60)}`);
      console.log(`  Found ${ch1Files.length} lesson exercise fixes`);

      for (const f of ch1Files.sort()) {
        const lessonNum = f.replace("_exercises.json", "");
        const exercises: ExerciseData[] = JSON.parse(
          readFileSync(join(regenDir, f), "utf-8")
        );
        const fix: LessonFix = { lessonNumber: lessonNum, exercises };
        totalLessons++;
        const result = await pushLessonFix(supabase, fix);
        if (result.ok) {
          console.log(`  ${fix.lessonNumber}: ✓ ${result.message}`);
          totalSuccess++;
        } else {
          console.error(`  ${fix.lessonNumber}: ✗ ${result.message}`);
          totalFailed++;
        }
      }
    }
  }

  for (const chDir of chapterDirs) {
    const chNum = chDir.replace("ch", "");
    if (CHAPTER_FILTER && chNum !== CHAPTER_FILTER) continue;

    const dirPath = join(fixesDir, chDir);
    console.log(`\n${"=".repeat(60)}`);
    console.log(`Chapter ${chNum}`);
    console.log(`${"=".repeat(60)}`);

    const fixes = loadFixesFromDir(dirPath, chDir);
    if (fixes.length === 0) {
      console.log("  No fixes found.");
      continue;
    }

    fixes.sort((a, b) => {
      const [aMaj, aMin] = a.lessonNumber.split(".");
      const [bMaj, bMin] = b.lessonNumber.split(".");
      const aVal = parseInt(aMaj!) * 100 + (aMin === "x" ? 99 : parseInt(aMin!));
      const bVal = parseInt(bMaj!) * 100 + (bMin === "x" ? 99 : parseInt(bMin!));
      return aVal - bVal;
    });

    console.log(`  Found ${fixes.length} lesson fixes`);

    for (const fix of fixes) {
      totalLessons++;
      const hasContent =
        fix.summary_md ||
        (fix.exercises && fix.exercises.length > 0) ||
        (fix.partialExercises && fix.partialExercises.length > 0);

      if (!hasContent) {
        console.log(`  ${fix.lessonNumber}: skipped (no content)`);
        totalSkipped++;
        continue;
      }

      const result = await pushLessonFix(supabase, fix);
      if (result.ok) {
        console.log(`  ${fix.lessonNumber}: ✓ ${result.message}`);
        totalSuccess++;
      } else {
        console.error(`  ${fix.lessonNumber}: ✗ ${result.message}`);
        totalFailed++;
      }
    }
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`Summary: ${totalSuccess} succeeded, ${totalFailed} failed, ${totalSkipped} skipped (${totalLessons} total)`);
  if (DRY_RUN) console.log("(dry run — no changes were made)");
}

main();

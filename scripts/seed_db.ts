/**
 * seed_db.ts — Load curriculum_seed.json into Supabase Postgres.
 *
 * Usage: npx tsx scripts/seed_db.ts
 *
 * Requires env vars:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Idempotent — safe to re-run without duplicating data.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";

// ---------------------------------------------------------------------------
// Types for curriculum_seed.json
// ---------------------------------------------------------------------------

interface SeedLesson {
  number: string;
  learncpp_title: string;
  learncpp_url: string;
  chapter_sort_order: number;
  global_sort_order: number;
}

interface SeedChapter {
  number: string;
  learncpp_title: string;
  sort_order: number;
  lessons: SeedLesson[];
}

interface SeedData {
  chapters: SeedChapter[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert lesson number to URL-friendly slug: "1.5" → "1-5", "F.3" → "f-3", "13.x" → "13-x" */
function toSlug(lessonNumber: string): string {
  return lessonNumber.toLowerCase().replace(/\./g, "-");
}

/**
 * Generate a deterministic UUID from the lesson number.
 * Hashing ensures re-runs produce the same IDs so upserts work correctly.
 */
function deterministicUUID(lessonNumber: string): string {
  const hash = createHash("sha256")
    .update(`cpproad-lesson:${lessonNumber}`)
    .digest("hex");
  // Format as UUID v4 shape (with version nibble set to 4, variant bits set)
  const uuid = [
    hash.slice(0, 8),
    hash.slice(8, 12),
    "4" + hash.slice(13, 16), // version 4
    ((parseInt(hash[16], 16) & 0x3) | 0x8).toString(16) + hash.slice(17, 20), // variant
    hash.slice(20, 32),
  ].join("-");
  return uuid;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Read seed data
  const seedPath = resolve(__dirname, "..", "curriculum_seed.json");
  const raw = readFileSync(seedPath, "utf-8");
  const data: SeedData = JSON.parse(raw);

  // -------------------------------------------------------------------------
  // Upsert chapters
  // -------------------------------------------------------------------------
  const chapterRows = data.chapters.map((ch) => ({
    id: ch.sort_order, // id = sort_order as specified
    number: ch.number,
    learncpp_title: ch.learncpp_title,
    sort_order: ch.sort_order,
  }));

  const { error: chapterError } = await supabase
    .from("chapters")
    .upsert(chapterRows, { onConflict: "id" });

  if (chapterError) {
    console.error("Failed to upsert chapters:", chapterError.message);
    process.exit(1);
  }

  // -------------------------------------------------------------------------
  // Upsert lessons
  // -------------------------------------------------------------------------
  const lessonRows = data.chapters.flatMap((ch) =>
    ch.lessons.map((lesson) => ({
      id: deterministicUUID(lesson.number),
      chapter_id: ch.sort_order, // matches chapter.id = sort_order
      number: lesson.number,
      slug: toSlug(lesson.number),
      learncpp_title: lesson.learncpp_title,
      learncpp_url: lesson.learncpp_url,
      sort_order: lesson.global_sort_order,
    })),
  );

  // Supabase has a row limit per request; batch in chunks of 500
  const BATCH_SIZE = 500;
  for (let i = 0; i < lessonRows.length; i += BATCH_SIZE) {
    const batch = lessonRows.slice(i, i + BATCH_SIZE);
    const { error: lessonError } = await supabase
      .from("lessons")
      .upsert(batch, { onConflict: "id" });

    if (lessonError) {
      console.error(
        `Failed to upsert lessons (batch ${i / BATCH_SIZE + 1}):`,
        lessonError.message,
      );
      process.exit(1);
    }
  }

  console.log(`Seeded ${chapterRows.length} chapters, ${lessonRows.length} lessons`);
}

main();

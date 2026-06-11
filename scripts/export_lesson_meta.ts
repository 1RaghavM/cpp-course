/**
 * export_lesson_meta.ts — Export per-lesson briefing metadata for generation agents.
 *
 * Zero LLM calls. Reads chapters + lessons from Supabase and writes
 * scripts/regenerated/v2/_meta/ch_<number>.json — one file per chapter, each an
 * array of briefing objects consumed by content-generation agents.
 *
 * Usage:
 *   npx tsx scripts/export_lesson_meta.ts                  # all chapters
 *   npx tsx scripts/export_lesson_meta.ts --chapters 13
 *
 * Env (.env / .env.local): NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";
import { shouldGenerateExercises, type Exercise2Format } from "../lib/anthropic/prompts";

config({ path: resolve(__dirname, "..", ".env") });
config({ path: resolve(__dirname, "..", ".env.local") });

const META_DIR = resolve(__dirname, "regenerated", "v2", "_meta");

interface LessonMeta {
  number: string;
  title: string;
  chapterNumber: string;
  chapterTitle: string;
  priorTitles: string[];
  tags: string[];
  withContent: boolean;
  exercise2Format: Exercise2Format;
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
  const ci = args.indexOf("--chapters");
  const chapterFilter =
    ci !== -1 && args[ci + 1] ? args[ci + 1]!.split(",").map((s) => s.trim()) : null;

  const { data: chapters, error: chErr } = await supabase
    .from("chapters")
    .select("id, number, learncpp_title, my_title, sort_order")
    .order("sort_order");
  if (chErr || !chapters) throw new Error(`chapters query failed: ${chErr?.message}`);

  const { data: lessons, error: lsErr } = await supabase
    .from("lessons")
    .select("id, chapter_id, number, learncpp_title, my_title, tags, sort_order")
    .order("sort_order");
  if (lsErr || !lessons) throw new Error(`lessons query failed: ${lsErr?.message}`);

  mkdirSync(META_DIR, { recursive: true });

  for (const chapter of chapters) {
    if (chapterFilter && !chapterFilter.includes(chapter.number)) continue;
    const chapterLessons = lessons.filter((l) => l.chapter_id === chapter.id);
    const chapterTitle = chapter.my_title ?? chapter.learncpp_title;

    const metas: LessonMeta[] = chapterLessons.map((lesson, idx) => ({
      number: lesson.number,
      title: lesson.my_title ?? lesson.learncpp_title,
      chapterNumber: chapter.number,
      chapterTitle,
      priorTitles: chapterLessons.slice(0, idx).map((l) => l.my_title ?? l.learncpp_title),
      tags: lesson.tags ?? [],
      withContent: shouldGenerateExercises(chapter.number),
      exercise2Format: idx % 2 === 0 ? "fix_the_bug" : "complete_the_function",
    }));

    const outPath = resolve(META_DIR, `ch_${chapter.number}.json`);
    writeFileSync(outPath, JSON.stringify(metas, null, 2));
    console.log(`ch ${chapter.number}: ${metas.length} lessons → ${outPath}`);
  }
}

main();

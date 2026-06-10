/**
 * validate_v2.ts — Mechanical validation gate for Phase A generated content.
 *
 * Per lesson dir under scripts/regenerated/v2/:
 *   - summary.md: word count 700-1400 (warn outside), has the four required ## sections
 *   - boundary lint: code in summary/checks/exercises must not use concepts
 *     introduced in a later chapter (coarse, per-chapter token rules)
 *   - checks.json: 3-5 items, valid kinds, option/answer consistency
 *   - exercises.json: starter_code and solution_code compile with
 *     g++ -std=c++20 -Wall -Wextra; solution passes all test cases
 *
 * Usage:
 *   npx tsx scripts/validate_v2.ts                 # validate everything in v2/
 *   npx tsx scripts/validate_v2.ts --lessons 13.7
 *
 * Outputs: v2/validation_report.md, v2/validation_status.json
 * Exit code 1 if any lesson has errors (warnings don't fail).
 */

import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const V2_ROOT = resolve(__dirname, "regenerated", "v2");
const BUILD_DIR = resolve(V2_ROOT, ".build");

// ---------------------------------------------------------------------------
// Concept-boundary token rules (coarse, per-chapter; finer checks live in
// validate_curriculum.ts). A token is a violation if the lesson's chapter
// number is LESS than introducedInChapter.
// ---------------------------------------------------------------------------

interface TokenRule {
  pattern: RegExp;
  name: string;
  introducedInChapter: number;
}

const TOKEN_RULES: TokenRule[] = [
  { pattern: /\bif\s*\(/, name: "if statement", introducedInChapter: 4 },
  { pattern: /\bconst\b/, name: "const", introducedInChapter: 5 },
  { pattern: /\bconstexpr\b/, name: "constexpr", introducedInChapter: 5 },
  { pattern: /std::string\b/, name: "std::string", introducedInChapter: 5 },
  { pattern: /std::string_view\b/, name: "std::string_view", introducedInChapter: 5 },
  { pattern: /\?\s*[^:]+\s*:/, name: "ternary operator", introducedInChapter: 6 },
  { pattern: /\bfor\s*\(/, name: "for loop", introducedInChapter: 8 },
  { pattern: /\bwhile\s*\(/, name: "while loop", introducedInChapter: 8 },
  { pattern: /\bswitch\s*\(/, name: "switch", introducedInChapter: 8 },
  { pattern: /\bauto\b/, name: "auto", introducedInChapter: 10 },
  { pattern: /\btemplate\b/, name: "template", introducedInChapter: 11 },
  { pattern: /\benum\b/, name: "enum", introducedInChapter: 13 },
  { pattern: /\bstruct\b/, name: "struct", introducedInChapter: 13 },
  { pattern: /\bclass\b/, name: "class", introducedInChapter: 14 },
  { pattern: /std::vector\b/, name: "std::vector", introducedInChapter: 16 },
  { pattern: /std::array\b/, name: "std::array", introducedInChapter: 17 },
  { pattern: /\bnew\b/, name: "dynamic allocation (new)", introducedInChapter: 19 },
];

const REQUIRED_SECTIONS = ["## The idea", "## How it works", "## Common mistakes", "## When to use this"];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface Issue {
  severity: "error" | "warning";
  message: string;
}

function normalise(value: string): string {
  return value
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .trim();
}

function extractCppBlocks(markdown: string): string[] {
  const blocks: string[] = [];
  const re = /```cpp\n([\s\S]*?)```/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(markdown)) !== null) blocks.push(m[1]!);
  return blocks;
}

function chapterOf(lessonNumber: string): number {
  const n = parseInt(lessonNumber.split(".")[0]!, 10);
  return Number.isNaN(n) ? 0 : n;
}

function lintCode(code: string, chapterNum: number, context: string, issues: Issue[]): void {
  for (const rule of TOKEN_RULES) {
    if (chapterNum < rule.introducedInChapter && rule.pattern.test(code)) {
      issues.push({
        severity: "error",
        message: `${context}: uses ${rule.name} (chapter ${rule.introducedInChapter} concept) in chapter ${chapterNum}`,
      });
    }
  }
}

function compileCpp(code: string, label: string, issues: Issue[]): string | null {
  mkdirSync(BUILD_DIR, { recursive: true });
  const src = resolve(BUILD_DIR, `${label}.cpp`);
  const bin = resolve(BUILD_DIR, `${label}.out`);
  writeFileSync(src, code);
  const result = spawnSync("g++", ["-std=c++20", "-Wall", "-Wextra", "-o", bin, src], {
    encoding: "utf-8",
    timeout: 30_000,
  });
  if (result.status !== 0) {
    issues.push({ severity: "error", message: `${label}: compile failed:\n${result.stderr.slice(0, 800)}` });
    return null;
  }
  if (result.stderr.trim()) {
    issues.push({ severity: "warning", message: `${label}: compiler warnings:\n${result.stderr.slice(0, 400)}` });
  }
  return bin;
}

function runBinary(bin: string, stdin: string): string {
  const result = spawnSync(bin, [], { input: stdin, encoding: "utf-8", timeout: 5_000 });
  return result.stdout ?? "";
}

// ---------------------------------------------------------------------------
// Per-lesson validation
// ---------------------------------------------------------------------------

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
  test_cases: Array<{ label: string; is_sample: boolean; stdin: string; expected_stdout: string }>;
}

function validateLesson(lessonNumber: string): Issue[] {
  const issues: Issue[] = [];
  const dir = resolve(V2_ROOT, lessonNumber);
  const chapterNum = chapterOf(lessonNumber);
  const safe = lessonNumber.replace(/[^a-zA-Z0-9]/g, "_");

  // --- summary.md ---
  const summaryPath = resolve(dir, "summary.md");
  if (!existsSync(summaryPath)) {
    issues.push({ severity: "error", message: "summary.md missing" });
    return issues;
  }
  const summary = readFileSync(summaryPath, "utf-8");
  const words = summary.split(/\s+/).length;
  if (words < 700 || words > 1400) {
    issues.push({ severity: "warning", message: `summary is ${words} words (target 800-1200)` });
  }
  for (const section of REQUIRED_SECTIONS) {
    if (!summary.includes(section)) {
      issues.push({ severity: "error", message: `summary missing required section "${section}"` });
    }
  }
  if (summary.includes("|--") || /\n\|.*\|\n/.test(summary)) {
    issues.push({ severity: "error", message: "summary contains a markdown table" });
  }
  extractCppBlocks(summary).forEach((code, i) => lintCode(code, chapterNum, `summary example ${i + 1}`, issues));

  // --- checks.json (optional for intro chapters) ---
  const checksPath = resolve(dir, "checks.json");
  if (existsSync(checksPath)) {
    let checks: CheckItem[];
    try {
      checks = JSON.parse(readFileSync(checksPath, "utf-8")) as CheckItem[];
    } catch (err) {
      issues.push({ severity: "error", message: `checks.json unparseable: ${String(err)}` });
      checks = [];
    }
    if (checks.length > 0 && (checks.length < 3 || checks.length > 5)) {
      issues.push({ severity: "error", message: `checks.json has ${checks.length} items (expected 3-5)` });
    }
    checks.forEach((c, i) => {
      const label = `check ${i + 1} (${c.kind})`;
      if (!["predict_output", "spot_bug", "mcq"].includes(c.kind)) {
        issues.push({ severity: "error", message: `${label}: invalid kind` });
      }
      if (c.kind === "predict_output" && c.options !== null) {
        issues.push({ severity: "error", message: `${label}: predict_output must have null options` });
      }
      if (c.kind !== "predict_output") {
        if (!c.options || !(c.answer in c.options)) {
          issues.push({ severity: "error", message: `${label}: answer key not present in options` });
        }
      }
      if (!c.explanation_md) {
        issues.push({ severity: "error", message: `${label}: missing explanation_md` });
      }
      extractCppBlocks(c.prompt_md).forEach((code, j) =>
        lintCode(code, chapterNum, `${label} snippet ${j + 1}`, issues),
      );
    });
  }

  // --- exercises.json (optional for intro chapters) ---
  const exercisesPath = resolve(dir, "exercises.json");
  if (existsSync(exercisesPath)) {
    let exercises: ExerciseItem[];
    try {
      exercises = JSON.parse(readFileSync(exercisesPath, "utf-8")) as ExerciseItem[];
    } catch (err) {
      issues.push({ severity: "error", message: `exercises.json unparseable: ${String(err)}` });
      exercises = [];
    }
    exercises.forEach((ex, i) => {
      const label = `exercise ${i + 1} "${ex.title}"`;
      lintCode(ex.starter_code, chapterNum, `${label} starter`, issues);
      lintCode(ex.solution_code, chapterNum, `${label} solution`, issues);
      extractCppBlocks(ex.prompt_md).forEach((code, j) =>
        lintCode(code, chapterNum, `${label} prompt snippet ${j + 1}`, issues),
      );

      compileCpp(ex.starter_code, `${safe}_ex${i + 1}_starter`, issues);
      const bin = compileCpp(ex.solution_code, `${safe}_ex${i + 1}_solution`, issues);
      if (bin) {
        ex.test_cases.forEach((tcase, j) => {
          const actual = normalise(runBinary(bin, tcase.stdin));
          const expected = normalise(tcase.expected_stdout);
          if (actual !== expected) {
            issues.push({
              severity: "error",
              message: `${label} test ${j + 1} "${tcase.label}": expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
            });
          }
        });
      }
    });
  }

  return issues;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  // Fail fast if g++ is unavailable.
  execFileSync("g++", ["--version"], { encoding: "utf-8" });

  const args = process.argv.slice(2);
  const li = args.indexOf("--lessons");
  const filter = li !== -1 && args[li + 1] ? args[li + 1]!.split(",").map((s) => s.trim()) : null;

  // Ensure V2_ROOT exists so a fresh checkout doesn't crash on readdirSync.
  mkdirSync(V2_ROOT, { recursive: true });

  const lessonDirs = readdirSync(V2_ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== ".build" && d.name !== "_meta")
    .map((d) => d.name)
    .filter((name) => !filter || filter.includes(name))
    .sort();

  const status: Record<string, "pass" | "fail"> = {};
  const reportLines: string[] = ["# Phase A validation report", ""];
  let failed = 0;

  for (const lessonNumber of lessonDirs) {
    const issues = validateLesson(lessonNumber);
    const errors = issues.filter((i) => i.severity === "error");
    status[lessonNumber] = errors.length > 0 ? "fail" : "pass";
    if (errors.length > 0) failed++;

    console.log(`[${lessonNumber}] ${status[lessonNumber]} (${errors.length} errors, ${issues.length - errors.length} warnings)`);
    if (issues.length > 0) {
      reportLines.push(`## ${lessonNumber} — ${status[lessonNumber]}`);
      for (const issue of issues) reportLines.push(`- **${issue.severity}**: ${issue.message}`);
      reportLines.push("");
    }
  }

  writeFileSync(resolve(V2_ROOT, "validation_report.md"), reportLines.join("\n"));
  writeFileSync(resolve(V2_ROOT, "validation_status.json"), JSON.stringify(status, null, 2));
  console.log(`\n${lessonDirs.length} lessons, ${failed} failed. Report: v2/validation_report.md`);
  if (failed > 0) process.exit(1);
}

main();

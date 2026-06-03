/**
 * compute_ch8_outputs.ts — Run ch8 random-number exercise solutions through the
 * real Judge0 instance to capture exact, deterministic stdout, then rewrite each
 * test case to use exact `expected_stdout` (dropping contains/regex matchers the
 * platform does not support).
 *
 * Usage: npx tsx scripts/compute_ch8_outputs.ts
 *
 * Safe to re-run: it overwrites expected_stdout from fresh Judge0 output.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";
import { submitCode } from "../lib/judge0/client";

config({ path: resolve(__dirname, "..", ".env") });

const FILES = [
  resolve(__dirname, "regenerated", "fixes", "ch8", "8.14.json"),
  resolve(__dirname, "regenerated", "fixes", "ch8", "8.15.json"),
];

interface TestCase {
  label: string;
  stdin: string;
  is_sample: boolean;
  expected_stdout?: string;
  expected_stdout_contains?: string;
  expected_stdout_regex?: string;
}

interface Exercise {
  title: string;
  solution_code: string;
  test_cases: TestCase[];
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function run(): Promise<void> {
  for (const file of FILES) {
    const data = JSON.parse(readFileSync(file, "utf-8"));
    console.log(`\n=== ${data.number} ===`);

    for (const ex of data.exercises as Exercise[]) {
      console.log(`  Exercise: ${ex.title}`);
      for (const tc of ex.test_cases) {
        const res = await submitCode({
          sourceCode: ex.solution_code,
          stdin: tc.stdin,
          languageStd: "c++20",
        });

        if (!res.ok) {
          throw new Error(`Judge0 error for "${tc.label}": ${res.error}`);
        }
        if (res.data.status !== "accepted" && res.data.status !== "wrong_answer") {
          throw new Error(
            `Solution did not run cleanly for "${tc.label}": status=${res.data.status}, ` +
              `compile=${res.data.compileOutput}, stderr=${res.data.stderr}`
          );
        }

        const stdout = res.data.stdout ?? "";
        tc.expected_stdout = stdout;
        delete tc.expected_stdout_contains;
        delete tc.expected_stdout_regex;

        console.log(`    [${tc.label}] -> ${JSON.stringify(stdout)}`);
        // Be polite to the free-tier rate limit.
        await sleep(1200);
      }
    }

    writeFileSync(file, JSON.stringify(data, null, 2) + "\n", "utf-8");
    console.log(`  Wrote ${file}`);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

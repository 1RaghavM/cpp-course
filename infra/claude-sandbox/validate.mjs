#!/usr/bin/env node
// Self-test tool for the agent: compile each exercise's solution_code and run it
// against its test_cases. Difficulty changes must NOT break the solution.
//
//   node infra/claude-sandbox/validate.mjs scripts/regenerated/1.4_exercises.json [more.json ...]
//
// Exit 0 = all solutions compile and produce expected_stdout; non-zero = failures.
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

let failures = 0;
for (const file of process.argv.slice(2)) {
  const exercises = JSON.parse(readFileSync(file, 'utf8'));
  for (const ex of exercises) {
    const dir = mkdtempSync(join(tmpdir(), 'ex-'));
    const src = join(dir, 'main.cpp');
    const bin = join(dir, 'a.out');
    writeFileSync(src, ex.solution_code ?? '');
    try {
      execFileSync('g++', ['-std=c++20', '-O0', src, '-o', bin], { stdio: 'pipe' });
    } catch (e) {
      console.error(`COMPILE FAIL  ${file} :: ${ex.title}\n${e.stderr}`);
      failures++;
      continue;
    }
    for (const tc of ex.test_cases ?? []) {
      let out;
      try {
        out = execFileSync(bin, { input: tc.stdin ?? '', timeout: 5000 }).toString();
      } catch (e) {
        console.error(`RUNTIME FAIL  ${file} :: ${ex.title} :: ${tc.label}\n${e.message}`);
        failures++;
        continue;
      }
      if (out !== tc.expected_stdout) {
        console.error(
          `WRONG OUTPUT  ${file} :: ${ex.title} :: ${tc.label}\n` +
            `  expected ${JSON.stringify(tc.expected_stdout)}\n` +
            `  got      ${JSON.stringify(out)}`
        );
        failures++;
      }
    }
  }
}
console.log(failures ? `\n${failures} failure(s)` : 'all solutions compile and pass');
process.exit(failures ? 1 : 0);

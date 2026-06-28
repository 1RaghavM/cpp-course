#!/usr/bin/env node
// Guard: confirm that ONLY prompt_md and starter_code changed vs git HEAD.
// Protected fields (must be byte-identical to HEAD): title, difficulty,
// solution_code, test_cases. Also checks the exercise count is unchanged.
//
//   node infra/claude-sandbox/guard.mjs scripts/regenerated/*_exercises.json
//
// Exit 0 = every file only touched the two allowed fields; non-zero = drift.
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const PROTECTED = ['title', 'difficulty', 'solution_code', 'test_cases'];
let problems = 0;

for (const file of process.argv.slice(2)) {
  let head;
  try {
    head = execFileSync('git', ['show', `HEAD:${file}`], { stdio: 'pipe' }).toString();
  } catch {
    console.error(`NO HEAD VERSION  ${file} (new file — skipping protected-field check)`);
    continue;
  }
  const before = JSON.parse(head);
  const after = JSON.parse(readFileSync(file, 'utf8'));

  if (before.length !== after.length) {
    console.error(`COUNT CHANGED  ${file}: ${before.length} -> ${after.length}`);
    problems++;
    continue;
  }
  for (let i = 0; i < before.length; i++) {
    for (const key of PROTECTED) {
      const a = JSON.stringify(before[i][key]);
      const b = JSON.stringify(after[i][key]);
      if (a !== b) {
        console.error(`PROTECTED FIELD CHANGED  ${file} :: ex[${i}] "${before[i].title}" :: ${key}`);
        problems++;
      }
    }
    // sanity: the two editable fields should also still exist
    for (const key of ['prompt_md', 'starter_code']) {
      if (typeof after[i][key] !== 'string' || after[i][key].length === 0) {
        console.error(`MISSING/EMPTY  ${file} :: ex[${i}] :: ${key}`);
        problems++;
      }
    }
  }
}
console.log(problems ? `\n${problems} guard problem(s)` : 'guard OK: only prompt_md/starter_code changed');
process.exit(problems ? 1 : 0);

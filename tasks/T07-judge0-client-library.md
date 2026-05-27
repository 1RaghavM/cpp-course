# T07: Judge0 Client Library

## Wave: 1 (depends on T01)

## Dependencies

- **T01** — project scaffolded

## Objective

Create the client library for communicating with the Judge0 code execution API and the verdict logic that evaluates test case results. Used by T11 (Code Execution Feature).

## Files to create

```
lib/judge0/client.ts        # HTTP client for Judge0 API
lib/judge0/verdict.ts       # test-case evaluation logic (diff stdout vs expected)
```

## Implementation

### lib/judge0/client.ts

HTTP client that submits code to the Judge0 instance and retrieves results.

```typescript
interface SubmissionParams {
  sourceCode: string;
  stdin?: string;
  languageStd?: 'c++17' | 'c++20' | 'c++23';
  cpuTimeLimit?: number;      // seconds, default 5
  memoryLimit?: number;       // KB, default 256000
}

interface SubmissionResult {
  stdout: string | null;
  stderr: string | null;
  compileOutput: string | null;
  exitCode: number | null;
  status: JudgeStatus;
  wallTimeMs: number;
}
```

Logic:
1. **`submitCode(params)`** — POST to `${JUDGE0_URL}/submissions?wait=true`
   - Base64-encode the source code
   - Set language ID for C++ (check Judge0 docs: typically 54 for C++17, 76 for C++20)
   - Include `X-Auth-Token` header from `JUDGE0_AUTH_TOKEN` env var
   - Use `wait=true` for synchronous execution (no polling — single user, acceptable latency)
   - Enforce source code size limit: reject if > 50KB before sending
   - Map compiler flags based on `languageStd`: `-std=c++20 -Wall -Wextra` by default

2. **Status mapping** — Map Judge0 status codes to app-level status:
   - Status 3 (Accepted) → check stdout match in verdict.ts
   - Status 4 (Wrong Answer) → `failed`
   - Status 5 (Time Limit Exceeded) → `tle`
   - Status 6 (Compilation Error) → `compile_error`
   - Status 7-12 (Runtime errors) → `runtime_error`
   - Status 13 (Internal Error) → `error`
   - Status 14+ → `mle` (memory)

3. **Error handling** — If Judge0 is unreachable, return a structured error (don't crash the route handler). Timeout after 10s for the HTTP call itself.

### lib/judge0/verdict.ts

Evaluates a submission against test cases by comparing stdout.

```typescript
interface TestCaseResult {
  label: string;
  passed: boolean;
  expected: string;
  actual: string;
}

export function evaluateTestCases(
  testCases: Array<{ label: string; stdin: string; expectedStdout: string }>,
  results: Array<{ stdout: string | null; status: string }>,
): { overallStatus: string; testResults: TestCaseResult[] }
```

Logic:
- Compare `stdout.trim()` to `expectedStdout.trim()` for each test case
- A submission "passes" only if ALL test cases pass
- Return per-case results with diffs (expected vs actual)
- If any single test case has a non-Accepted status (TLE, runtime error, etc.), use that status as the overall status

**Edge cases:**
- Trailing whitespace/newline differences: strip before comparing
- Empty stdout vs null stdout: treat both as empty string
- Partial execution: if test case 2 TLEs, report TLE and include results for test cases that did run

## Skills to reference

- `/project:security-verify` — Part 1: Judge0 auth token must be included in every request
- `/project:scope-check` — single `main.cpp` per exercise, no multi-file support

## Acceptance criteria

- [ ] `submitCode()` sends a C++ source to Judge0 and returns structured results
- [ ] Source code > 50KB is rejected before hitting Judge0
- [ ] `X-Auth-Token` header is included in every request
- [ ] Judge0 status codes are correctly mapped to app-level status strings
- [ ] `evaluateTestCases()` correctly diffs stdout vs expected for each test case
- [ ] Whitespace normalization works (trailing newlines don't cause false failures)
- [ ] Unit tests for `evaluateTestCases()` cover: all pass, some fail, TLE, compile error, empty stdout
- [ ] Judge0 unreachable returns a structured error, not an unhandled exception

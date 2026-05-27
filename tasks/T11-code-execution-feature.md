# T11: Code Execution Feature

## Wave: 3 (depends on T04, T05, T07)

## Dependencies

- **T04** — Supabase client library (for saving submissions)
- **T05** — Auth system (middleware protects routes)
- **T07** — Judge0 client library (for code execution + verdict logic)

## Objective

Build the exercise page with a Monaco editor, Run/Submit buttons, and output display. This is where the user writes C++ code, compiles it against Judge0, and sees test case results.

## Files to create

```
app/api/submissions/route.ts               # POST /api/submissions
app/(app)/exercises/[id]/page.tsx           # exercise page
components/editor/MonacoEditor.tsx          # Monaco editor wrapper
```

## Implementation

### app/api/submissions/route.ts

**POST /api/submissions**

Request body:
```typescript
{
  exercise_id: string;
  source_code: string;
  mode: 'run' | 'submit';
  language_std?: 'c++17' | 'c++20' | 'c++23';  // default: c++20
}
```

Response shape:
```typescript
{
  status: string;            // compile_error | passed | failed | tle | mle | runtime_error | error
  stdout: string | null;
  stderr: string | null;
  compileOutput: string | null;
  exitCode: number | null;
  wallTimeMs: number;
  testResults?: Array<{      // only for mode: 'submit'
    label: string;
    passed: boolean;
    expected: string;
    actual: string;
  }>;
}
```

Logic:

**Mode: `run`**
1. Validate input (source_code is non-empty, <= 50KB)
2. Call `submitCode()` from T07 with the user's code and empty stdin
3. Save the submission to the `submissions` table
4. Return stdout/stderr/status

**Mode: `submit`**
1. Validate input
2. Load test cases for the exercise from DB
3. For each test case: call `submitCode()` with the test case's stdin
4. Call `evaluateTestCases()` from T07 to diff results
5. Save the submission with `test_results` JSONB
6. If all tests pass: update progress to `completed` for this lesson (FR-082)
7. Return results with per-test-case verdicts

**Validation:**
- Reject source code > 50KB (NFR-046)
- Reject empty source code
- Validate exercise_id exists

### app/(app)/exercises/[id]/page.tsx

The exercise page. Mixed server/client component.

Server part:
- Load exercise data (prompt, starter code, test cases where `is_sample = true`)
- Load last passing submission if exists (P1, FR-049)

Client part (`'use client'` wrapper):
- Monaco editor with the exercise's starter code
- Run button (Cmd/Ctrl+Enter shortcut) → calls POST /api/submissions with mode: 'run'
- Submit button (Cmd/Ctrl+Shift+Enter shortcut) → calls POST /api/submissions with mode: 'submit'
- Reset to starter code button (with confirmation dialog) (FR-044)
- C++ standard dropdown (C++17 / C++20 / C++23, default C++20) (FR-045)
- Output panel below the editor showing stdout, stderr, compile errors
- Test results panel (for submit mode) showing pass/fail per case with diffs
- Loading spinner while code is executing

Layout:
- Exercise prompt (markdown) on the left or top
- Monaco editor on the right or bottom
- Output panel below the editor
- On narrow viewports (< 768px): editor is read-only with a "use desktop" message (NFR-081)

### components/editor/MonacoEditor.tsx

Client component wrapping `@monaco-editor/react`.

Props:
```typescript
{
  defaultValue: string;      // starter code
  onChange: (value: string) => void;
  language: string;          // 'cpp'
  readOnly?: boolean;
}
```

Features:
- C++ syntax highlighting
- Basic editor settings: font size 14, minimap off, line numbers on
- Auto-save content to `localStorage` keyed by exercise ID (FR-041) — on every change, debounced
- On mount: check localStorage for saved content, restore if exists
- Expose `getValue()` and `resetToDefault()` methods via ref or callbacks

## Skills to reference

- `/project:new-route` — follow the route handler pattern for POST /api/submissions
- `/project:security-verify` — Part 1: submissions go through Judge0 with auth token
- `/project:scope-check` — single `main.cpp` only, no multi-file, no debugger, no IntelliSense

## Acceptance criteria

- [ ] Monaco editor renders with C++ syntax highlighting
- [ ] Typing in the editor auto-saves to localStorage
- [ ] Page refresh restores editor content from localStorage
- [ ] "Run" button sends code to Judge0 and displays stdout/stderr
- [ ] "Submit" button runs all test cases and shows pass/fail per case
- [ ] Cmd/Ctrl+Enter triggers Run, Cmd/Ctrl+Shift+Enter triggers Submit
- [ ] "Reset to starter code" works with confirmation
- [ ] C++ standard dropdown switches between c++17/20/23
- [ ] Source code > 50KB is rejected with an error message
- [ ] Submissions are persisted to the `submissions` table
- [ ] Passing all tests on a submit auto-marks the lesson as completed
- [ ] Last passing submission is displayed (if exists)
- [ ] Compile errors display clearly with the compiler output
- [ ] Loading state shown during execution
- [ ] Mobile viewports show read-only editor with "use desktop" message

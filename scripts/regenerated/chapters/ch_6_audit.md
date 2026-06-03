# Chapter 6 Audit: Operators

## Summary
Chapter 6 contains 8 lessons (6.1 through 6.x) with 12 exercises total (across 6 lessons; lessons 6.3 and 6.5 have no exercises). The audit found 14 issues, including 3 critical wrong test-case expected outputs that would cause correct solutions to fail, 4 hard forward references to loops (Ch 8) in exercise code, and multiple uses of `auto` (Ch 10) in lesson summaries.

---

## Issues Found

### [CRITICAL] Lesson 6.1, Exercise 1 — "Predict Arithmetic Expression Results"
- **Type**: wrong test-case expected output
- **Location**: sample test case (stdin `2 3 4 5`)
- **Details**: Two of the four expected values are mathematically wrong.
  - `expr1: a + b * c - d = 2 + 3*4 - 5 = 2 + 12 - 5 = 9`. Expected output says `12`.
  - `expr2: a * b + c * d = 2*3 + 4*5 = 6 + 20 = 26`. Expected output says `22`.
  - `expr3` and `expr4` are correct.
  - The solution code computes `(a + b * c - d)` and `(a * b + c * d)`, which would produce `9` and `26` for the sample input, not `12` and `22`. The solution would **fail its own sample test case**.
  - The error for `expr2` looks like the author computed `b*c + a*d` (= 3*4 + 2*5 = 22) instead of `a*b + c*d` (= 2*3 + 4*5 = 26), suggesting a variable-ordering mistake during test authoring.
- **Fix needed**: Change the sample expected output to:
  ```
  expr1: 9
  expr2: 26
  expr3: -5
  expr4: 4
  ```

### [CRITICAL] Lesson 6.1, Exercise 2 — "Boolean Expression Evaluator with Bitwise Trap"
- **Type**: wrong test-case expected output
- **Location**: sample test case (stdin `12 3 10`)
- **Details**: `check1` expected output is `false`, but the correct result is `true`.
  - `check1` is defined as `(x & mask) == 0`. With x=12 (binary 1100) and mask=3 (binary 0011): `12 & 3 = 0`. Then `0 == 0` is `true`.
  - The expected output says `check1: false`. This is incorrect.
  - The error appears to have been computed **without** the parentheses required in the problem statement: `x & mask == 0` parses as `x & (mask == 0)` = `12 & 0` = `0` which is falsy. The very precedence trap the lesson warns about was accidentally applied when authoring the test case.
  - The solution code `((x & mask) == 0)` correctly produces `true`, so the solution would **fail its own sample test case**.
- **Fix needed**: Change the sample expected output line 1 to `check1: true`.

### [CRITICAL] Lesson 6.x, Exercise 2 — "Prefix vs Postfix Increment in a Grade Table"
- **Type**: wrong test-case expected output
- **Location**: hidden test case 3 (stdin `4\n80\n95\n70\n88`)
- **Details**: The expected `Remainder` is `3`, but the correct value is `1`.
  - Sum = 80 + 95 + 70 + 88 = 333. `333 % 4 = 1` (since 4 * 83 = 332, and 333 - 332 = 1).
  - The expected output says `Remainder: 3`.
  - The solution code `sum % n` would produce `1`, not `3`. The solution would **fail this hidden test case**.
- **Fix needed**: Change the expected output to `Remainder: 1`.

### [MODERATE] Lesson 6.4, Exercise 2 — "Safe Increment Loop with Running Product"
- **Type**: forward-reference (hard)
- **Location**: exercise prompt, starter code, and solution
- **Details**: The exercise requires a `while` loop. The prompt explicitly says "Use a `while` loop (not a `for` loop)." While loops are not introduced until Chapter 8. Students have never seen loop syntax at this point in the curriculum. This is not a soft mention in a summary — the student must write a loop to complete the exercise.
- **Fix needed**: Replace with a non-loop exercise. For example, read a fixed number of values (e.g., exactly 3) and compute a running product across three explicit multiply-and-print statements. Alternatively, move this exercise to after Ch 8.

### [MODERATE] Lesson 6.6, Exercise 2 — "Absolute Difference Table"
- **Type**: forward-reference (hard)
- **Location**: starter code and solution
- **Details**: The starter code includes a `for` loop (`for (int i = 0; i < n; ++i)`). For loops are Ch 8 material. Students cannot write or reason about this construct yet. The exercise also requires `std::format` from `<format>` (C++20), which may not be available on all compilers and has not been formally introduced.
- **Fix needed**: Replace the loop with a fixed number of input pairs (e.g., exactly 2 or 3), or move the exercise to after Ch 8. Replace `std::format` with `<iostream>` and `<iomanip>` formatting (which have been used in prior exercises).

### [MODERATE] Lesson 6.x, Exercise 2 — "Prefix vs Postfix Increment in a Grade Table"
- **Type**: forward-reference (hard)
- **Location**: starter code and solution
- **Details**: The starter code provides a `for` loop (`for (int i = 0; i < n; ++i)`) and an `if`/`else` block. While `if`/`else` is available (Ch 4.10), `for` loops are Ch 8. The student is expected to complete code inside a for loop they have not been taught.
- **Fix needed**: Since this is a chapter summary exercise meant to integrate concepts, using a loop is somewhat justifiable as a preview. However, the for loop should either be fully provided (no TODOs inside the loop body that require understanding the loop) or the exercise should be restructured to avoid loops.

### [MINOR] Lesson 6.2 — "Arithmetic operators" summary
- **Type**: forward-reference (soft)
- **Location**: summary code example
- **Details**: The code example uses `auto` for variable declarations: `auto int_div = a / b;`, `auto float_div = a / 2.0;`, `auto remainder = a % b;`. `auto` type deduction is a Chapter 10 topic. While the exercises correctly avoid `auto`, students reading the summary will encounter an unexplained keyword.
- **Fix needed**: Replace `auto` with explicit types (`int int_div`, `double float_div`, `int remainder`) in the summary code example.

### [MINOR] Lesson 6.5 — "The comma operator" summary
- **Type**: forward-reference (soft)
- **Location**: summary text and code example
- **Details**: The summary extensively discusses `for` loops (Ch 8) as the primary use case for the comma operator: "The comma operator appears most often in the update expression of a `for` loop." It includes a full `for` loop code example. While the lesson has no exercises, students will encounter unexplained syntax.
- **Fix needed**: Add a brief note that `for` loops are covered in Chapter 8 and the example is shown for context. Alternatively, provide a non-loop example as the primary use case (e.g., comma in a parenthesized expression for variable initialization).

### [MINOR] Lesson 6.6 — "The conditional operator" summary
- **Type**: forward-reference (soft)
- **Location**: summary code example
- **Details**: The code example uses a range-based `for` loop: `for (int n : {-3, 0, 7})`. Range-based for loops are introduced even later than regular for loops (Ch 8+). Students have not seen this syntax. The example also uses `std::format` from `<format>`.
- **Fix needed**: Replace the range-based for loop with three separate `std::cout` statements showing the conditional operator applied to different values (e.g., -3, 0, 7 as separate variables). Replace `std::format` with `<iostream>` formatting.

### [MINOR] Summaries across multiple lessons (6.1, 6.2, 6.3, 6.4, 6.8, 6.x)
- **Type**: forward-reference / compilation concern
- **Location**: summary code examples
- **Details**: Six lesson summaries use `<print>` and `std::println` (C++23 features). If students attempt to compile these examples, they will fail on most compilers and on the Judge0 sandbox. The exercises correctly use `<iostream>`, creating an inconsistency between what the summary teaches and what the exercises allow.
- **Fix needed**: Replace `std::println` with `std::cout <<` in all summary code examples, or add a note explaining that `std::println` is C++23 and the exercises use `<iostream>` for compatibility.

### [MINOR] Lesson 6.x — "Chapter 6 summary and quiz" summary
- **Type**: inconsistency in epsilon approach
- **Location**: summary code and exercise 1
- **Details**: The summary and exercise 1 use a simple absolute epsilon comparison (`std::abs(a - b) < 1e-9`), while lessons 6.7 exercises use a scaled epsilon formula (`std::abs(a - b) <= eps * std::max(1.0, std::max(std::abs(a), std::abs(b)))`). The summary lesson should reinforce the better approach taught in 6.7, not regress to the simpler (and less robust) version.
- **Fix needed**: Either use the scaled epsilon in the 6.x exercise/summary to match 6.7, or explicitly note that the simpler version is used here for brevity and the scaled version is preferred in practice.

### [INFO] Lessons 6.3 and 6.5 have no exercises
- **Type**: coverage gap
- **Location**: lessons 6.3 ("Remainder and Exponentiation") and 6.5 ("The comma operator")
- **Details**: These lessons have empty exercise arrays. Lesson 6.3 content (remainder, `std::pow`) is partially covered by exercises in other lessons (6.2 uses `%`, 6.x uses `%`). Lesson 6.5 (comma operator) is niche and arguably doesn't need an exercise. However, `std::pow` from 6.3 is never exercised.
- **Fix needed**: Consider adding a short exercise to 6.3 that uses `std::pow` for integer exponentiation and demonstrates the need to cast the result back to `int`.

### [INFO] Exercise progression
- **Type**: observation
- **Location**: chapter-wide
- **Details**: The progression across exercises is generally logical when forward-reference issues are set aside:
  1. 6.1: Operator precedence (arithmetic, then boolean/bitwise)
  2. 6.2: Integer vs float division, digit extraction
  3. 6.4: Prefix/postfix semantics, then loop application (but loop is a forward ref)
  4. 6.6: Conditional operator for classification, then formatted tables
  5. 6.7: Epsilon comparisons, then triangle classification combining multiple concepts
  6. 6.8: Logical operators for eligibility checks, then compound discount rules
  7. 6.x: Integrative exercises combining multiple chapter concepts
  
  The build-up within each lesson is good (simple-to-complex). The main structural problem is exercises in 6.4, 6.6, and 6.x requiring loops that students haven't learned yet.

---

## Corrected Test Cases

### 6.1 Exercise 1 — sample test case
```json
{
  "label": "sample — small positive values",
  "stdin": "2 3 4 5",
  "expected_stdout": "expr1: 9\nexpr2: 26\nexpr3: -5\nexpr4: 4\n",
  "is_sample": true
}
```

### 6.1 Exercise 2 — sample test case
```json
{
  "label": "sample — typical bitmask scenario",
  "stdin": "12 3 10",
  "expected_stdout": "check1: true\ncheck2: true\ncheck3: true\ncheck4: true\ncheck5: true\n",
  "is_sample": true
}
```

### 6.x Exercise 2 — hidden test case 3
```json
{
  "label": "hidden — all passing, non-zero remainder",
  "stdin": "4\n80\n95\n70\n88",
  "expected_stdout": "Pass: 4\nFail: 0\nAverage: 83\nRemainder: 1\n",
  "is_sample": false
}
```

---

## Issue Counts by Severity

| Severity | Count |
|----------|-------|
| CRITICAL | 3 |
| MODERATE | 3 |
| MINOR    | 6 |
| INFO     | 2 |
| **Total** | **14** |

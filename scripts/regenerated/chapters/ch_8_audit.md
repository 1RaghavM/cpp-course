# Chapter 8 Audit: Control Flow

**Auditor:** Claude Opus 4.6
**Date:** 2026-06-03
**Lessons reviewed:** 8.1 through 8.x (16 lessons total)

---

## Legend

| Severity | Meaning |
|----------|---------|
| CRITICAL | Blocks the learner -- code won't compile, test will never pass, or teaches something wrong |
| HIGH | Confuses the learner or introduces a concept not yet available at that lesson's position |
| MEDIUM | Pedagogical concern, minor inaccuracy, or style issue that should be fixed |
| LOW | Nitpick or suggestion for improvement |

---

## Internal Lesson Order (for forward-reference checking)

| Lesson | Construct introduced |
|--------|---------------------|
| 8.1 | Control flow overview (no new syntax) |
| 8.2 | if/else, blocks |
| 8.3 | Common if pitfalls |
| 8.4 | constexpr if |
| 8.5 | switch basics |
| 8.6 | switch fallthrough and scoping |
| 8.7 | goto |
| 8.8 | while loops |
| 8.9 | do-while loops |
| 8.10 | for loops |
| 8.11 | break and continue |
| 8.12 | Halts (std::exit) |
| 8.13 | Random number generation intro |
| 8.14 | Mersenne Twister details |
| 8.15 | Global random (Random.h) |
| 8.x | Chapter summary and quiz |

---

## Lesson 8.1 -- Control flow introduction

### Finding 8.1-F1: Forward reference to `for` loop in summary code example [HIGH]

The summary includes a `for` loop in its "A first look at the three forms" code block:
```cpp
for (int i = 0; i < n; ++i)
    std::cout << i << ' ';
```
`for` loops are not taught until lesson 8.10. Students seeing this in 8.1 have not yet learned `for` syntax. As an introductory overview, a brief preview may be acceptable, but the code is presented without any "you'll learn this later" caveat -- it reads as if the student already knows `for`.

**Recommendation:** Add an explicit note that `for` loops will be covered in 8.10, or replace the preview with pseudocode.

### Finding 8.1-F2: Exercise "Sum to N" uses for-loop before it is taught [HIGH]

The "Sum to N" exercise prompt says "Use a for-loop (or while-loop)" and the solution uses a `for` loop. At this point in the chapter, neither `while` (8.8) nor `for` (8.10) loops have been taught. The student has no loop construct available yet.

This exercise is premature at lesson 8.1. It belongs after lesson 8.8 at the earliest (or after 8.10 if a for-loop is the intended approach).

**Recommendation:** Replace with a branching-only exercise (e.g., classify two numbers, nested if challenge), or move this exercise to lesson 8.8 or 8.10.

### Finding 8.1-F3: Python comparison claim about for-variable scope is incorrect [LOW]

The summary states: "Loop variables like `i` above are scoped to the loop body, just like Python's `for` variables are scoped to the comprehension."

This is misleading. Python `for` loop variables are NOT scoped to the loop -- they leak into the enclosing scope. Only list comprehension variables (in Python 3) are scoped. The analogy is wrong.

**Recommendation:** Remove or correct the comparison. The C++ scoping behavior should be described on its own merits.

---

## Lesson 8.2 -- If statements and blocks

### No issues found [PASS]

Content correctly covers if/else syntax, blocks, chaining, nesting, and common pitfalls. Exercises ("Grade Classifier" and "Temperature Advisor") are well-structured. Test cases verified correct. No forward references.

---

## Lesson 8.3 -- Common if statement problems

### Finding 8.3-F1: Starter code `if (n % 2 = 0)` is a compile error, not a runtime bug [CRITICAL]

The exercise prompt says the program "always prints 'Even' because of a common if pitfall." However, `n % 2 = 0` will NOT compile because `n % 2` produces an rvalue (a temporary), and you cannot assign to an rvalue. The compiler will emit an error like "lvalue required as left operand of assignment."

The lesson summary correctly demonstrates the bug with `if (x = 10)` where `x` is an lvalue, which DOES compile and silently misbehaves. But the exercise starter code uses an rvalue target for the assignment, which is a different (and compile-time-caught) error.

**Recommendation:** Change the starter code condition to use an lvalue, e.g.:
```cpp
int remainder = n % 2;
if (remainder = 0) {   // assignment bug -- always true
```
Or restructure to `if (n = 0)` with a different exercise scenario. The point is the bug must compile silently to match the prompt's description.

---

## Lesson 8.4 -- Constexpr if statements

### Finding 8.4-F1: Uses templates and concepts -- both are forward references [HIGH]

The entire lesson is built around `template <typename T>` and `std::integral<T>` / `std::floating_point<T>` concepts. Templates are Chapter 11. Concepts are an advanced C++20 feature not in the prior_lesson_titles at all.

Students at this point have completed only Chapters 0-7 (fundamentals, functions, debugging, data types, constants, operators, scope). They have zero experience with templates or type-parameterized code.

Both exercises require writing function templates:
- "Type Classifier Template": `template <typename T> void classify(T value)`
- "Compile-Time Size Reporter": `template <typename T> void sizeReport()`

These are impossible for students to complete without template knowledge.

**Recommendation:** Either (a) defer this lesson to after Chapter 11, (b) replace the exercises with non-template constexpr-if examples using `sizeof` on known types or `constexpr` bool flags, or (c) add a substantial template primer to the summary.

### Finding 8.4-F2: Hidden test cases expect hardcoded values but solution is parameterized [CRITICAL]

Both exercises have hidden test cases that expect specific values (e.g., "integral: -7\nfloating: 2.5\nother: hello") but the solution code hardcodes `classify(42)`, `classify(3.14)`, `classify(std::string{"cpp"})`. The hidden test cases expect DIFFERENT values (-7, 2.5, "hello" and 0, 0, "world") that the solution code does not produce.

The sample test passes, but the hidden tests will ALWAYS fail because the values are baked into main() -- there is no stdin input to change them.

**Recommendation:** Either (a) make all test cases match the hardcoded values in the solution, or (b) redesign the exercise to read input values from stdin so different test cases can pass.

### Finding 8.4-F3: Same problem for "Compile-Time Size Reporter" hidden tests [CRITICAL]

Hidden tests expect output for `short, float, long long` and `signed char, unsigned int, double` but the solution only calls `sizeReport<char>()`, `sizeReport<int>()`, `sizeReport<double>()`. The hidden test cases are untestable -- they would require different source code.

---

## Lesson 8.5 -- Switch statement basics

### No issues found [PASS]

Content is accurate. Switch anatomy, fallthrough warning, variable declaration rules, and comparison to if/else are all correct. The "Day-of-Week Classifier" and "Simple Calculator" exercises are appropriate. Test cases verified correct.

---

## Lesson 8.6 -- Switch fallthrough and scoping

### Finding 8.6-F1: Inconsistent input format between exercises in 8.5 and 8.6 [LOW]

Exercise 8.5 "Simple Calculator" reads input as one-per-line (`\n` separated). Exercise 8.6 "Scoped Switch Calculator" reads input space-separated. Both are calculators with identical structure. The inconsistency may confuse students.

**Recommendation:** Unify the input format or explicitly call out the difference.

### No other issues [PASS]

The "Traffic Light Phases" exercise correctly demonstrates `[[fallthrough]]`. Test cases are accurate.

---

## Lesson 8.7 -- Goto statements

### Finding 8.7-F1: Exercise "Rewrite a goto loop" uses while/do-while before those are taught [HIGH]

The exercise asks students to "replace the logic using a while loop" and says "A do-while loop is also acceptable." However, while loops are taught in lesson 8.8 and do-while in 8.9 -- both AFTER 8.7.

Students at this point have only seen if/else, switch, and goto. They cannot write a while or do-while loop yet.

**Recommendation:** Reorder lessons so that 8.7 (goto) comes AFTER 8.9 (do-while), or change the exercises to only use constructs available at this point (if/else, switch, or restructured goto-free logic using only branching).

### Finding 8.7-F2: Summary references "range-for" which hasn't been taught [LOW]

The C++20 picture section mentions "range-for" which is not taught in this chapter or any prior chapter.

---

## Lesson 8.8 -- Introduction to loops and while statements

### Finding 8.8-F1: Summary mentions `break` and `continue` before they are formally taught [MEDIUM]

The last paragraph says: "`break` exits a loop immediately (same keyword used in switch from lesson 8-5). `continue` skips the rest of the current iteration..." While `break` has been seen in switch context, `continue` is entirely new and not taught until lesson 8.11.

This is a minor forward reference since it is a brief mention, but it could confuse students who try to use `continue` in their exercises.

**Recommendation:** Move the `break`/`continue` mention to a "coming up" note, or remove it entirely and let lesson 8.11 introduce both in loop context.

### No exercise issues [PASS]

"Countdown Timer" and "Sum of Digits" both correctly use while loops. Test cases verified correct. The Sum of Digits solution's special-case for `n == 0` is unnecessary (sum starts at 0 and the while condition `n > 0` is false, so sum stays 0), but it produces correct output.

---

## Lesson 8.9 -- Do while statements

### No issues found [PASS]

Content is accurate. The semicolon requirement is correctly highlighted. The scope gotcha for variables declared inside the do block is correctly explained. Both exercises are appropriate and test cases are correct.

---

## Lesson 8.10 -- For statements

### No issues found [PASS]

Content is accurate. Init/condition/end expression are correctly explained. Off-by-one discussion is helpful. "Multiplication Table Row" and "Sum of Integers in Range" exercises are well-designed. Test cases verified correct.

---

## Lesson 8.11 -- Break and continue

### No issues found [PASS]

Content accurately describes `break` and `continue` semantics. The note about `break` only exiting one nesting level is important. Both exercises are appropriate and test cases are mathematically verified correct.

---

## Lesson 8.12 -- Halts (exiting your program early)

### Finding 8.12-F1: Summary code uses `const std::string&` -- references are Ch 12 [MEDIUM]

The `openFile` function signature uses `const std::string& path`, introducing reference syntax. References and pass-by-reference are not taught until Chapter 12. Students will not understand the `&` in the parameter.

**Recommendation:** Change to `std::string path` (pass by value) in the example, or add a brief note that references will be covered later.

### Finding 8.12-F2: "Safe Division with Early Exit" tests stderr output but test harness checks stdout [LOW]

The exercise says the error message goes to `std::cerr`, and the hidden test case for division-by-zero expects `expected_stdout: ""`. This means the test framework must NOT capture stderr as stdout. This is likely fine with Judge0 (which separates the two), but the exercise description could be clearer about what the test harness actually checks.

### No other issues [PASS]

Both exercises are correct and exercise the intended concepts.

---

## Lesson 8.13 -- Introduction to random number generation

### Finding 8.13-F1: C-style array `int counts[7]{}` is a forward reference to Ch 16 [MEDIUM]

Both the exercise starter code and solution use `int counts[7]{}`. C-style arrays are not taught until Chapter 16/17. Students have not seen array declaration syntax.

**Recommendation:** Use six individual `int` variables (count1 through count6) and an if/else chain to increment, or add a note explaining the array syntax.

### Finding 8.13-F2: Die Roller hidden test case for seed=0, n=12 is almost certainly wrong [CRITICAL]

The hidden test case expects perfectly uniform output:
```
Face 1: 2
Face 2: 2
Face 3: 2
Face 4: 2
Face 5: 2
Face 6: 2
```

This claims that `std::mt19937` seeded with 0, generating 12 values from `uniform_int_distribution{1,6}`, produces exactly 2 of each face. This is extraordinarily unlikely and is almost certainly a fabricated expected output. While `std::mt19937` engine output is standardized, `std::uniform_int_distribution`'s mapping algorithm is implementation-defined (not standardized until the C++26 proposal). Different standard library implementations (libstdc++, libc++, MSVC STL) may produce different sequences for the same seed.

**Recommendation:** Remove this test case or verify it against the specific compiler/stdlib used by the Judge0 instance. All PRNG-dependent test cases in this chapter have the same portability risk.

### Finding 8.13-F3: All PRNG test cases are non-portable across stdlib implementations [HIGH]

The C++ standard specifies the mt19937 engine output for a given seed, but `std::uniform_int_distribution` is NOT required to use any particular algorithm. The test expected outputs will only be correct for ONE specific standard library implementation.

This affects:
- 8.13 "Fixed-Seed Die Roller" (all test cases)
- 8.13 "Seed Sequence Comparator" (same-seed test is fine; different-seed tests are technically correct but for the wrong reason)
- 8.14 "Dice Roller" (all test cases)
- 8.14 "Random Range Generator" (all test cases)
- 8.15 "Roll dice and report stats" (all test cases)
- 8.15 "Random number in a custom range" (all test cases)

**Recommendation:** Either (a) verify all expected outputs against the exact compiler used by Judge0 and document that dependency, (b) rewrite exercises to test properties rather than exact sequences (e.g., "all values in range", "same seed produces same output"), or (c) implement a custom distribution function with a specified algorithm so results are truly portable.

---

## Lesson 8.14 -- Generating random numbers using Mersenne Twister

### Finding 8.14-F1: PRNG portability issue (same as 8.13-F3) [HIGH]

See finding 8.13-F3. All test cases with hardcoded expected PRNG outputs are at risk.

### Finding 8.14-F2: `std::uniform_int_distribution die{ 1, 6 }` uses CTAD [LOW]

The solution uses class template argument deduction (CTAD): `std::uniform_int_distribution die{ 1, 6 }` without the `<int>` template parameter. CTAD is a C++17 feature that hasn't been explicitly taught. While it compiles fine, it may confuse students who see inconsistency with the explicitly-typed version used elsewhere.

**Recommendation:** Be consistent -- either always use `std::uniform_int_distribution<int>` or explicitly teach CTAD.

---

## Lesson 8.15 -- Global random numbers (Random.h)

### Finding 8.15-F1: Uses `std::array` from Ch 16 [MEDIUM]

The solution uses `std::array<int, 7> counts{};` which requires `<array>` and `std::array` -- taught in Chapter 16.

**Recommendation:** Use `int counts[7]{};` (C-style array, still a forward reference but simpler) or individual variables.

### Finding 8.15-F2: Uses `static_cast<std::size_t>(roll)` but `std::size_t` indexing hasn't been taught [LOW]

The solution casts to `std::size_t` for array indexing. While technically correct and avoids signed/unsigned warnings, students haven't been taught about `std::size_t` as an array index type.

### Finding 8.15-F3: PRNG portability issue (same as 8.13-F3) [HIGH]

All test cases depend on specific PRNG output. See finding 8.13-F3.

---

## Lesson 8.x -- Chapter 8 summary and quiz

### Finding 8.x-F1: Summary references wrong lesson numbers [HIGH]

The summary contains several incorrect lesson number references:
- "goto (8.4)" -- goto is lesson **8.7**. Lesson 8.4 is constexpr-if.
- "Halts (8.13)" -- halts are lesson **8.12**. Lesson 8.13 is random number generation intro.
- "8.14 introduced `<random>`" -- `<random>` is introduced in **8.13**. Lesson 8.14 covers Mersenne Twister in more depth.

These incorrect cross-references will confuse students trying to review specific topics.

**Recommendation:** Fix all lesson number references to match actual lesson numbering.

### Finding 8.x-F2: Summary misattributes content to wrong lesson numbers throughout [HIGH]

The full list of incorrect attributions:
- "If/else (8.1-8.3)" -- should be 8.1-8.3 (this one is correct)
- "Switch (8.5-8.6)" -- correct
- "while (8.8)" -- correct
- "do-while (8.9)" -- correct
- "for (8.10)" -- correct
- "break/continue covered in 8.12" -- should be **8.11**. Lesson 8.12 is halts.
- "goto (8.4)" -- should be **8.7**
- "Halts (8.13)" -- should be **8.12**

### Finding 8.x-F3: Solution uses lambdas -- a forward reference [MEDIUM]

The "Grade Histogram" solution uses:
```cpp
auto printRow = [](char grade, int count) { ... };
```

This uses `auto` (Ch 10) and lambda expressions (Ch 20+). Students at this point have not learned either concept.

**Recommendation:** Replace with a regular helper function or inline the printing logic in a simple loop.

### Finding 8.x-F4: Collatz exercise prompt example omits final "1" but test expects it [MEDIUM]

The prompt example shows:
```
6
3
10
5
16
8
4
2
Steps: 8
```

But the test case expects the output to include "1" before "Steps: 8":
```
6\n3\n10\n5\n16\n8\n4\n2\n1\nSteps: 8\n
```

The starter code comment says "Don't forget to print the final value (1)" which matches the test, but contradicts the prompt example. Students will follow the example and get the wrong answer.

**Recommendation:** Update the prompt example to include the final "1":
```
6
3
10
5
16
8
4
2
1
Steps: 8
```

---

## Summary of Findings

| Severity | Count | Key themes |
|----------|-------|------------|
| CRITICAL | 4 | Non-compilable starter code (8.3), untestable hidden test cases (8.4 x2), fabricated PRNG output (8.13) |
| HIGH | 7 | Forward references to for/while before taught (8.1, 8.7), templates before Ch 11 (8.4), PRNG non-portability (8.13-8.15), wrong lesson numbers in summary (8.x) |
| MEDIUM | 5 | Forward references to references/arrays/lambdas (8.12, 8.13, 8.15, 8.x), prompt/test mismatch (8.x Collatz), break/continue preview (8.8) |
| LOW | 5 | Python comparison error (8.1), input format inconsistency (8.6), range-for mention (8.7), CTAD inconsistency (8.14), size_t casting (8.15) |

### Top 5 Actions (ordered by impact)

1. **Fix 8.3 starter code** -- change `if (n % 2 = 0)` to use an lvalue so it compiles and demonstrates the intended bug.
2. **Fix 8.4 hidden test cases** -- make them match the hardcoded solution values, or redesign exercises to use stdin input.
3. **Reorder or rework 8.1 and 8.7 exercises** -- "Sum to N" at 8.1 needs loops that aren't taught yet; 8.7 exercises need while/do-while that aren't taught yet.
4. **Address PRNG test portability** across lessons 8.13-8.15 -- verify against Judge0's compiler or redesign exercises to test properties.
5. **Fix lesson number references in 8.x summary** -- goto is 8.7 not 8.4, halts are 8.12 not 8.13, break/continue is 8.11 not 8.12.

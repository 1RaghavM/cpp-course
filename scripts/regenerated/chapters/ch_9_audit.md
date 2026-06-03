# Chapter 9 Audit: Error Detection and Handling

**Auditor:** Claude Opus 4.6
**Date:** 2026-06-03
**Chapter lessons:** 9.1 -- 9.6, 9.x (summary/quiz)

---

## Lesson 9.1: Introduction to testing your code

### Summary audit

1. **Forward references:**
   - Summary uses `<format>` and `std::println` in the code example. `std::println` requires `<print>` (C++23). The `#include <format>` is present but `std::println` is not in `<format>` -- it is in `<print>`. However, `<print>` is not included. **BUG: The code example includes `<format>` but uses `std::println` which lives in `<print>`. Should include `<print>` instead of (or in addition to) `<format>`.** Actually, re-reading: `<string>` and `<format>` are included but `std::println` is called without `#include <print>`. The `<format>` include is also unused since only `std::println` is called.
   - No forward references to later-chapter concepts (no auto, references, pointers, classes, templates, arrays, vectors). PASS.

2. **Factual accuracy:**
   - Correctly states `assert` is stripped out in release builds when `NDEBUG` is defined. PASS.
   - Correctly describes the line-number diagnostic behavior. PASS.

### Exercise 9.1.1: Assert a Temperature Converter

| Check | Status | Notes |
|---|---|---|
| Forward references | PASS | Uses only `<cassert>`, `<cmath>`, `<iostream>`. No vectors, classes, templates, auto, references. |
| Factual correctness | PASS | Formula F = C * 9.0 / 5.0 + 32.0 is correct. approxEqual with abs tolerance 0.001 is valid for these values. |
| Code compiles | PASS | Standard headers, correct signatures. |
| Test cases | **MINOR** | All three test cases have identical stdin ("") and identical expected_stdout. The hidden tests are effectively duplicates and provide zero additional coverage. This is a no-stdin exercise, so this is inherent to the design, but the hidden tests are meaningless. |
| Exercise progression | PASS | Good first exercise -- simple formula + assert pattern. |

### Exercise 9.1.2: Test a Safe Integer Divider

| Check | Status | Notes |
|---|---|---|
| Forward references | PASS | Uses only `<cassert>`, `<iostream>`. |
| Factual correctness | PASS | safeDivide logic is correct. Integer division -18/3 = -6 is correct. 0/5 = 0 is correct. |
| Code compiles | PASS | |
| Test cases | **MINOR** | Same issue as 9.1.1 -- all hidden test cases produce the exact same output as the sample case. They provide no additional signal. |
| Exercise progression | PASS | Builds on 9.1.1 by introducing a fallback value pattern and a separate test function. |

---

## Lesson 9.2: Code coverage

### Summary audit

1. **Forward references:**
   - No code uses vectors, auto, references, pointers, classes, templates, or exceptions. PASS.
   - References `[Introduction to testing your code]` -- this is lesson 9.1, which precedes it. PASS.

2. **Factual accuracy:** PASS. Correctly describes line, branch, and function coverage. The 75% branch coverage example is accurate.

### Exercise 9.2.1: Identify Uncovered Branches in a Grading Function

| Check | Status | Notes |
|---|---|---|
| Forward references | PASS | Uses only `<iostream>` and `<string>`. `std::string` was introduced in Ch 5.7. |
| Factual correctness | PASS | Grade boundaries (90+, 80-89, 70-79, 60-69, 0-59) are standard and correctly implemented in the solution. |
| Code compiles | PASS | |
| Test cases | PASS | Good variety: all branches hit, only F hit, boundary scores (60, 90, 100). |
| Exercise progression | PASS | Nicely extends 9.1's assert-based testing into coverage tracking. |
| **Global variables** | **NOTE** | Uses global bool variables. While the lesson is specifically about tracking coverage state, this is fine pedagogically since Ch 7.8 already warned about global variables. The exercise prompt explicitly says to use globals or local bools. |

### Exercise 9.2.2: Triangle Classifier with Branch Coverage Report

| Check | Status | Notes |
|---|---|---|
| Forward references | PASS | Same headers as 9.2.1. |
| Factual correctness | PASS | Triangle inequality and classification logic are correct. The comment about sides <= 0 being caught implicitly is accurate for positive inputs. |
| Code compiles | PASS | |
| Test cases | PASS | Covers all four branches, only-invalid, and T=1 scalene. |
| Exercise progression | PASS | Good escalation from simple grade ranges to geometry + validation. |
| **Overlap with 9.4** | **WARNING** | Exercise 9.4.1 is also a triangle classifier using `std::expected`. The logic is nearly identical (same triangle inequality, same equilateral/isosceles/scalene classification). Students will encounter the same problem twice in the same chapter. Consider differentiating the domain (e.g., use a different classification problem in 9.2.2 or 9.4.1). |

---

## Lesson 9.3: Common semantic errors in C++

### Summary audit

1. **Forward references:**
   - **VIOLATION: `std::vector`** -- The summary code example uses `std::vector<int>` and `#include <vector>`. Vectors are not introduced until Ch 16/17. The summary text also references `vec.size()`, `std::ssize()`, and vector iteration patterns. While these are used to illustrate semantic errors, this is a forward reference to a data structure the student has not learned.
   - **VIOLATION: `std::println` and `<print>`** -- Uses `#include <print>` and `std::println` with format specifiers. `std::println` is C++23 and `<print>` is not available in all compilers. This is a C++ standard version concern rather than a curriculum ordering concern, but worth noting.
   - References to ranges (`C++20 ranges`) are a forward reference (not covered in prior chapters). Minor, since it's mentioned in passing.
   - `[[assume]]` is mentioned -- this is a C++23 attribute not covered anywhere in the curriculum. Minor note.

2. **Factual accuracy:**
   - `static_assert` is attributed to this lesson ("covered in *Common semantic errors in C++*") in the 9.4 summary, but `static_assert` is NOT actually discussed in lesson 9.3's summary. **BUG in 9.4 summary cross-reference**: 9.4 claims static_assert was "covered in Common semantic errors in C++," but it was not. `static_assert` is first covered in lesson 9.6.
   - The claim about `std::ssize()` being C++20 is correct. PASS.

### Exercise 9.3.1: Diagnose and Fix a Running Total with Semantic Bugs

| Check | Status | Notes |
|---|---|---|
| Forward references | **VIOLATION: `std::vector`** | Uses `const std::vector<int>&` as the function parameter. Vectors (Ch 16/17) and references (Ch 12) are both forward references. The exercise requires `#include <vector>` and `<print>`. |
| Forward references | **VIOLATION: `const` reference parameter** | `const std::vector<int>&` uses a const reference, which is not introduced until Ch 12. |
| Forward references | **VIOLATION: `std::println` / `<print>`** | Solution uses `std::println` from `<print>` (C++23). |
| Factual correctness | PASS | The sum/average logic is correct. `std::ssize` returns a signed type. |
| Code compiles | **CONCERN** | Requires C++23 for `<print>` and `std::println`. The Judge0 sandbox must support this. Also requires `std::ssize` (C++20). |
| Test cases | PASS | Good coverage: normal case, single element, sum-to-zero. |
| Exercise progression | **ISSUE** | This exercise tests vector manipulation and reference parameters, which the student hasn't learned yet. The semantic-error lesson is about recognizing bug patterns, but the exercise forces use of unknown constructs. |

### Exercise 9.3.2: Flag Out-of-Range Scores Using Bitwise Check Without Precedence Bugs

| Check | Status | Notes |
|---|---|---|
| Forward references | **VIOLATION: `std::vector`** | Same as 9.3.1 -- uses `const std::vector<int>&`. |
| Forward references | **VIOLATION: `const` reference parameter** | Same as 9.3.1. |
| Forward references | **VIOLATION: `std::println` / `<print>`** | Same as 9.3.1. |
| Factual correctness | PASS | The bitwise `|` vs logical `||` distinction is valid and the parenthesization is correct. The expression `((score < 60) | (score > 100)) != 0` correctly identifies out-of-range scores. |
| Code compiles | **CONCERN** | Same C++23 requirement as 9.3.1. |
| Test cases | PASS | Good boundary testing: exactly 60, all-fail cases. |
| **Pedagogical concern** | **NOTE** | Using bitwise OR (`|`) instead of logical OR (`||`) for a boolean condition is not idiomatic C++. While the exercise is specifically about operator precedence, it teaches a pattern that students should never use in practice. The exercise should at least note that `||` would be preferred in real code. |

---

## Lesson 9.4: Detecting and handling errors

### Summary audit

1. **Forward references:**
   - **Uses `std::expected` (C++23)** -- `<expected>` is a C++23 feature. This is a language standard concern. The lesson introduces it as a C++23 feature, which is fine pedagogically, but it may not compile on all student setups.
   - **Uses `std::println`** without including `<print>` in the `parse_positive` example. The function calls `std::println` but includes `<expected>`, `<format>`, `<string>`. **BUG: Missing `#include <print>` in the summary code example.**
   - **Uses `auto` return type** (`auto parse_positive(int n) -> std::expected<int, std::string>`) -- trailing return type with `auto` keyword. `auto` is not introduced until Ch 10. However, this is trailing return type syntax, which is distinct from `auto` type deduction. **BORDERLINE**: The trailing return type (`auto f() -> T`) is syntactically different from `auto` type deduction, but students encountering `auto` for the first time here will be confused. The exercises use this syntax too.
   - **Exceptions (try/catch/throw)** -- The summary introduces exceptions. Per the audit rules, exceptions are Ch 27 "unless introduced within Ch 9 itself." The summary introduces them here, so this is the introduction point. PASS (self-contained introduction).
   - Cross-references to `static_assert` as "covered in *Common semantic errors in C++*" -- but 9.3 does NOT cover `static_assert`. **BUG in cross-reference** (as noted under 9.3 audit).

2. **Factual accuracy:**
   - Exception handling advice (catch by const reference) is correct. PASS.
   - `std::expected` description is accurate. PASS.

### Exercise 9.4.1: Validate Triangle Sides with Assertions and Return Values

| Check | Status | Notes |
|---|---|---|
| Forward references | **VIOLATION: `auto` trailing return type** | Uses `auto classify_triangle(...) -> std::expected<std::string, std::string>`. `auto` is Ch 10 material. |
| Forward references | **NOTE: `std::expected` (C++23)** | Requires `<expected>` header. This is a C++23 feature; may not compile on all setups. |
| Factual correctness | PASS | Triangle inequality and classification logic are correct. |
| Code compiles | **CONCERN** | Requires C++23 support (`<expected>`). |
| Test cases | PASS | Covers scalene, degenerate (1,2,3), and equilateral. |
| **Overlap** | **WARNING (repeated)** | Nearly identical problem to Exercise 9.2.2 (Triangle Classifier with Branch Coverage Report). Same domain, same classification logic, same edge cases. |

### Exercise 9.4.2: Safe Integer Division with std::expected and Exceptions

| Check | Status | Notes |
|---|---|---|
| Forward references | **VIOLATION: `auto` trailing return type** | Same as 9.4.1. |
| Forward references | **VIOLATION: Exceptions (try/catch/throw)** | Uses `throw std::runtime_error(...)` and `try`/`catch`. Exceptions are Ch 27 material. However, they are introduced in the 9.4 summary, so this is internally consistent within Ch 9. This is acceptable IF the curriculum intends Ch 9 to introduce exceptions. |
| Forward references | **NOTE: `std::expected` (C++23)** | Same as 9.4.1. |
| Forward references | **NOTE: `std::format` (C++20)** | Uses `std::format` in the solution for exception message construction. |
| Factual correctness | **DESIGN CONCERN** | Throwing an exception for a negative divisor is a pedagogically questionable design choice. In real code, a negative divisor is a perfectly normal input -- not an "exceptional condition." The exercise is contrived to demonstrate both `std::expected` and exceptions in one function, but it teaches students to throw exceptions for routine input validation, which contradicts the summary's own advice ("exceptions are best reserved for errors that are truly exceptional"). |
| Code compiles | **CONCERN** | Requires C++23 (`<expected>`) and C++20 (`<format>`). |
| Test cases | PASS | Covers all three branches in various orders. |

---

## Lesson 9.5: std::cin and handling invalid input

### Summary audit

1. **Forward references:**
   - Uses `std::format` from `<format>` in the code example. This is C++20 and is fine.
   - No vectors, classes, templates, auto, references, or pointers. PASS.

2. **Factual accuracy:**
   - Correctly describes `std::cin.fail()`, `std::cin.clear()`, `std::cin.ignore()`. PASS.
   - Correctly explains the leftover newline problem. PASS.
   - The code example's `getPositiveInt` function is correct. PASS.

### Exercise 9.5.1: Validated Integer Input with Retry

| Check | Status | Notes |
|---|---|---|
| Forward references | PASS | Uses only `<iostream>` and `<limits>`. No advanced features. |
| Factual correctness | PASS | The solution correctly handles fail state and out-of-range separately. |
| Code compiles | PASS | |
| Test cases | PASS | Good variety: non-integer input, immediately valid, out-of-range then non-integer then valid. |
| **Output format subtlety** | **NOTE** | The expected output has prompt text and error messages on the same line (e.g., `Enter an integer between 1 and 10: Invalid input. Please try again.\n`). This is because `std::cout` does not insert a newline before the error message, and the prompt uses `<<` without `\n`. The prompt text ends with `: ` (colon-space), then the user types (not shown in stdout), then the error message prints. This is correct behavior for interactive I/O but may confuse students reviewing expected output. |

### Exercise 9.5.2: Sum of N Valid Integers with Input Recovery

| Check | Status | Notes |
|---|---|---|
| Forward references | PASS | Uses only `<iostream>` and `<limits>`. |
| Factual correctness | PASS | The solution correctly uses a non-advancing loop (slot not incremented on failure). |
| Code compiles | PASS | |
| Test cases | PASS | |
| **Output format subtlety** | **NOTE** | Same interactive I/O output concatenation as 9.5.1. Expected output like `"How many integers? Enter integer 1/3: Bad input, skipping.\n"` has the prompt and next prompt on the same line, which is correct but potentially confusing. |

---

## Lesson 9.6: Assert and static_assert

### Summary audit

1. **Forward references:**
   - Summary mentions "verifying that a pointer is non-null before dereferencing it" -- pointers are Ch 12. This is a description, not code, so it is a minor forward reference.
   - Summary mentions "templates and type traits" -- templates are Ch 11. Again descriptive only.
   - Uses `auto result = divide(10.0, 2.0);` in the code example -- `auto` is Ch 10. **VIOLATION: uses `auto` in code example.**
   - Uses `<format>` and `<string_view>` in includes but neither is actually used in the code. Harmless but sloppy.

2. **Factual accuracy:**
   - Correctly describes `assert` behavior, NDEBUG, and side-effect warning. PASS.
   - Correctly describes `static_assert` with optional message. PASS.
   - The `&& "message"` idiom explanation is accurate. PASS.

### Exercise 9.6.1: Assert Array Index Access

| Check | Status | Notes |
|---|---|---|
| Forward references | **MINOR: `const int*` pointer parameter** | Uses `const int* arr` pointer parameter. Pointers are Ch 12. However, the student only needs to add assert lines and does not need to understand pointer mechanics -- the starter code handles the pointer usage. Still, the function signature exposes pointer syntax. |
| Factual correctness | PASS | Assert idiom with string literal message is correct. |
| Code compiles | PASS | |
| Test cases | PASS | Covers middle, first, and single-element cases. |
| **Fixed array size** | **NOTE** | Uses `int arr[10]{};` with a hardcoded max size of 10. This is a C-style array, not a vector. Since vectors aren't available yet, this is the correct approach. The constraint N <= 10 matches. |

### Exercise 9.6.2: Compile-Time Power Validator

| Check | Status | Notes |
|---|---|---|
| Forward references | **VIOLATION: Function template** | Uses `template <int E> void power2Info()` -- a non-type template parameter. Templates are Ch 11 material. The student must write the template and `static_assert` inside it. |
| Factual correctness | PASS | `compileTimePow` using a loop is correct for non-negative exponents. `static_assert` constraints are valid. |
| Code compiles | PASS | |
| Test cases | PASS | Covers positive, zero, and large negative runtime values. The compile-time behavior (E=3) is fixed. |
| **Pedagogical concern** | **NOTE** | The exercise requires understanding templates to write the solution, but templates aren't taught until Ch 11. A student encountering this for the first time would struggle. The `static_assert` concept could be demonstrated without templates (e.g., `static_assert(sizeof(int) >= 4, "...")` at namespace scope). |

---

## Lesson 9.x: Chapter 9 summary and quiz

### Summary audit

1. **Forward references:**
   - Summary code example uses `constexpr double circle_area(double radius)` with `static_assert(sizeof(double) >= 8, ...)` inside a `constexpr` function. **BUG: `static_assert` inside a `constexpr` function is valid in C++14+, but the `static_assert` checks `sizeof(double) >= 8` which is a compile-time check unrelated to the function's constexpr-ness.** This is technically correct but misleading -- it suggests `static_assert` should go inside constexpr functions, when in practice it would go at namespace or class scope.
   - Uses `std::format` and `std::println` -- includes `<format>` and `<print>`. Both are used. PASS.
   - No forward references to later chapters in the summary text. PASS.

2. **Factual accuracy:** PASS. The summary correctly recaps the chapter topics.

### Exercise 9.x.1: Safe Integer Division with cin Recovery

| Check | Status | Notes |
|---|---|---|
| Forward references | PASS | Uses only `<cassert>`, `<iostream>`, `<limits>`. |
| Factual correctness | PASS | Correctly combines assert (for programmer guarantee), cin recovery, and division-by-zero handling. |
| Code compiles | PASS | |
| Test cases | **POTENTIAL ISSUE** | Test case "Hidden -- all error cases" has `"0 0"` as first input, which should print `"Error: division by zero"`, then `"abc def"` which should fail extraction, then `"5 0"` which should print division by zero. BUT: after `"abc def"`, the `std::cin >> a >> b` fails on `"abc"`, so `a` and `b` retain their previous values (0, 0). The solution prints `"Error: invalid input"` because extraction fails, which is correct. However, the leftover `"def"` is in the buffer and is consumed by `ignore`. On the next iteration, `"5 0"` is read, giving `a=5, b=0`, so `"Error: division by zero"` prints. The expected output matches. PASS. |
| **Design quality** | **NOTE** | The exercise says "A line may contain non-integer tokens" but the extraction `std::cin >> a >> b` reads two integers from one line. If the first token is non-integer, the extraction fails immediately. If only the second token is non-integer, `a` gets the first value but `b`'s extraction fails, and the solution prints "Error: invalid input" for the whole line. This is slightly simplistic but acceptable for the lesson scope. |

### Exercise 9.x.2: Compile-Time Buffer Validator with Runtime Bounds Check

| Check | Status | Notes |
|---|---|---|
| Forward references | **VIOLATION: struct template** | Uses `template <typename T, int N> struct FixedBuffer` -- a class/struct template with both type and non-type parameters. Structs are Ch 13/14 and templates are Ch 11. |
| Forward references | **VIOLATION: `T data[N]{}`** | Uses a member array inside a struct, combining struct members (Ch 13) with template parameters (Ch 11). |
| Factual correctness | PASS | `static_assert` usage is correct. The bounds checking pattern is valid. |
| Code compiles | PASS | Uses aggregate initialization with `{}`. |
| Test cases | PASS | Good coverage: mixed valid/invalid, all-in-range, all-out-of-range. |
| **Pedagogical concern** | **SIGNIFICANT** | This exercise requires understanding struct templates, member variables, and non-type template parameters -- none of which have been taught. A student at Ch 9 would not be able to complete this without external help. |

---

## Summary of Findings

### Critical Issues (should be fixed before shipping)

| ID | Lesson | Issue |
|---|---|---|
| C1 | 9.3 (both exercises) | **Forward reference: `std::vector` (Ch 16/17) and `const` references (Ch 12)** used as function parameters. Students have not learned either concept. Both exercises should be rewritten to use C-style arrays or plain parameters. |
| C2 | 9.6.2 | **Forward reference: function templates (Ch 11)** required to complete the exercise. Should be replaced with a non-template `static_assert` exercise. |
| C3 | 9.x.2 | **Forward reference: struct templates (Ch 11 + Ch 13/14)** required to complete the exercise. Students cannot write a `template <typename T, int N> struct` without prior exposure. Should be simplified. |

### Moderate Issues (should be addressed)

| ID | Lesson | Issue |
|---|---|---|
| M1 | 9.4 (both exercises) | **Forward reference: `auto` trailing return type (Ch 10)** used in function signatures. Could be replaced with explicit return types, though `std::expected` return types are long. |
| M2 | 9.4.1 + 9.2.2 | **Duplicate domain**: Triangle classification appears in both 9.2.2 and 9.4.1 with nearly identical logic. Change one of them to a different problem domain. |
| M3 | 9.4.2 | **Bad design teaching**: Throwing an exception for a negative divisor contradicts the lesson's own guidance that exceptions are for "truly exceptional" conditions. A negative divisor is routine input. |
| M4 | 9.3 summary | **Incorrect cross-reference from 9.4**: The 9.4 summary says `static_assert` was "covered in *Common semantic errors in C++*" (9.3), but 9.3 does not mention `static_assert`. It is first covered in 9.6. |
| M5 | 9.6 summary | **Forward reference: `auto` keyword** used in code example (`auto result = divide(10.0, 2.0);`). Ch 10 material. Use explicit type `double result = ...` instead. |

### Minor Issues (nice to fix)

| ID | Lesson | Issue |
|---|---|---|
| m1 | 9.1 summary | Code example includes `<format>` and `<string>` but uses `std::println` which requires `<print>` (not included). |
| m2 | 9.4 summary | `parse_positive` example uses `std::println` without `#include <print>`. |
| m3 | 9.1 (both exercises) | Hidden test cases are identical to the sample test case (same stdin, same expected output). They add zero test coverage. |
| m4 | 9.6 summary | Includes `<format>` and `<string_view>` in the divide example but neither is used in the code. |
| m5 | 9.6.1 | Uses `const int*` pointer parameter (Ch 12), but students only add assert lines and don't interact with the pointer directly. Minimal exposure. |
| m6 | 9.3.2 | Uses bitwise OR (`|`) instead of logical OR (`||`) for a boolean expression. While pedagogically intentional (operator precedence lesson), the exercise should note this is not idiomatic and `||` is preferred in practice. |

### Exercise Progression Assessment

The intended progression is:
1. 9.1: Basic assert testing (GOOD)
2. 9.2: Coverage tracking via bools (GOOD)
3. 9.3: Semantic error awareness (GOOD concept, BAD execution -- vectors/references are forward refs)
4. 9.4: Error handling mechanisms -- expected + exceptions (GOOD concept, introduces new C++23 features)
5. 9.5: cin recovery (GOOD -- well-scaffolded, no forward references)
6. 9.6: assert + static_assert (GOOD concept, exercises use templates before Ch 11)
7. 9.x: Capstone combining patterns (GOOD concept, last exercise has struct template problem)

**Overall: Lessons 9.1, 9.2, 9.5 are clean. Lessons 9.3, 9.6, and 9.x have forward reference violations in their exercises. Lesson 9.4 introduces C++23 features and uses `auto` from Ch 10.**

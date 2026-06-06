# Chapter 20 ("Functions") — Audit Report

Audited against: Chapters 0–19 known, Chapters 21+ forbidden.
Students know: all types, control flow, templates, references, pointers, pointer arithmetic, new/delete, enums, structs, classes, destructors, std::vector, std::array, iterators, algorithms (including lambda usage with algorithms from Ch 18).
Students do NOT yet know: operator overloading (detailed, Ch 21), move semantics (Ch 22), smart pointers (Ch 22), std::initializer_list (Ch 23), inheritance (Ch 24), virtual functions (Ch 25).

---

## 20.1 — Function Pointers

### Forward-Reference Violations
- **NONE.** Summary and exercises use only function pointers, type aliases, basic types, and `std::cout`. All concepts are within scope.

### Within-Chapter Ordering Issues
- **NONE.** This is the first lesson; it introduces function pointers and callbacks, which are prerequisites for later lessons.

### Code Correctness / Test Case Issues
- **NONE.** Exercise 1 ("Apply an Operation"): Test cases match solution output. Addition and subtraction logic is correct.
- **NONE.** Exercise 2 ("Transform and Sum an Array"): Test cases verified:
  - `{3, -2, 5, -1}`: squares = 9+4+25+1 = 39, absolutes = 3+2+5+1 = 11. Correct.
  - `{-4, -6, -2}`: squares = 16+36+4 = 56, absolutes = 4+6+2 = 12. Correct.
  - `{0}`: both 0. Correct.

### Pedagogical Notes
- Clean introduction. Good use of type aliases. No issues.

---

## 20.2 — The stack and the heap

### Forward-Reference Violations
- **[MINOR] Summary mentions "smart pointers, covered later"** — The phrase "or via smart pointers, covered later" in the stack-vs-heap comparison is acceptable as a forward teaser (does not teach the concept), but should be verified it does not confuse students. No actionable fix needed.

### Within-Chapter Ordering Issues
- **NONE.** Properly placed after 20.1. Does not depend on lambdas or recursion.

### Code Correctness / Test Case Issues
- **NONE.** Exercise 1 ("Stack frame reporter"): Simple call chain, output matches expected for all test cases.
- **NONE.** Exercise 2 ("Heap array statistics"): Test cases verified:
  - `{3, -1, 4, 0, 2}`: sum=8, positives=3. Correct.
  - `{-5}`: sum=-5, positives=0. Correct.
  - `{10, 20, 30, 40}`: sum=100, positives=4. Correct.
  - Proper use of `new[]`/`delete[]`.

### Pedagogical Notes
- Good lesson placement. Stack/heap knowledge helps contextualize recursion (20.3).

---

## 20.3 — Recursion

### Forward-Reference Violations
- **NONE.** Uses only basic recursion, arithmetic, and `std::cout`. No references to Ch 21+ topics.

### Within-Chapter Ordering Issues
- **NONE.** Comes after stack/heap (20.2) which explains stack frames — good sequencing since recursion relies on understanding stack frames.

### Code Correctness / Test Case Issues
- **NONE.** Exercise 1 ("Sum of Digits"): Test cases verified:
  - 123: 1+2+3 = 6. Correct.
  - 0: returns 0. Correct.
  - 999999999: 9*9 = 81. Correct.
- **NONE.** Exercise 2 ("Recursive Power"): Test cases verified:
  - `power(2, 10)` = 1024. Correct.
  - `power(5, 0)` = 1. Correct.
  - `power(-3, 7)` = -2187. Correct.
  - Fast exponentiation logic is correct (even: half*half, odd: base*recurse).

### Pedagogical Notes
- Clean lesson. No issues.

---

## 20.4 — Command line arguments

### Forward-Reference Violations
- **NONE.** Uses `argc`, `argv`, `std::string`, `std::stoi`, `std::sstream` (mentioned in summary code includes). All within scope.

### Within-Chapter Ordering Issues
- **NONE.** Independent topic, properly placed before ellipsis.

### Code Correctness / Test Case Issues
- **[INFO] Summary includes `<sstream>` but never uses it.** The summary code block has `#include <sstream>` but the example only uses `argc`/`argv` with `std::cout`. The include is unnecessary and potentially confusing, though not technically wrong.
- **NONE.** Exercise 1 ("Greeting by name"): Test cases match solution output.
- **NONE.** Exercise 2 ("Sum of numeric arguments"): Test cases verified:
  - 10+20+30 = 60. Correct.
  - 5+(-3)+8+(-10) = 0. Correct.
  - Empty: sum=0. Correct.

### Pedagogical Notes
- **[MINOR] Exercises simulate argv via stdin.** The prompt explains why clearly ("Our sandbox cannot pass real command line arguments"), which is good. However, the exercises don't actually exercise `argc`/`argv` parsing at all — they're just stdin-reading exercises. Students don't practice the actual `char* argv[]` parsing that the lesson teaches. This is a sandbox limitation, not a bug.

---

## 20.5 — Ellipsis (and why to avoid them)

### Forward-Reference Violations
- **[MEDIUM] Summary mentions `std::initializer_list` as an alternative.** The text says: "For genuinely variable argument counts, `std::initializer_list` and templates (covered in later chapters) solve the problem." `std::initializer_list` is introduced in Chapter 23. While this is framed as a forward-looking mention rather than teaching the concept, it names a specific type students have not seen. Consider changing to: "For genuinely variable argument counts, **templates and other modern alternatives** (covered in later chapters) solve the problem." This avoids naming `std::initializer_list` prematurely.

### Within-Chapter Ordering Issues
- **NONE.** Properly placed after command line arguments, before lambdas.

### Code Correctness / Test Case Issues
- **NONE.** Exercise 1 ("Variadic Integer Sum"): Test cases verified:
  - 10+20+30 = 60. Correct.
  - -42 = -42. Correct.
  - 100+(-50)+25+(-75)+0 = 0. Correct.
- **NONE.** Exercise 2 ("Variadic Minimum Finder"): Test cases verified:
  - min(7,2,9,4) = 2. Correct.
  - min(-3,-8,-1) = -8. Correct.
  - min(500) = 500. Correct.

### Pedagogical Notes
- Good emphasis on why to avoid ellipsis. The if/else chain for calling with variable arguments is ugly but necessary and honestly demonstrates the limitation.

---

## 20.6 — Introduction to lambdas (anonymous functions)

### Forward-Reference Violations
- **NONE.** Uses lambdas with `std::sort`, `std::count_if`, `std::vector`, `auto` — all previously taught (Ch 18 algorithms, Ch 16 vectors, Ch 10 auto).

### Within-Chapter Ordering Issues
- **NONE.** Properly placed after function pointers (20.1). The summary explicitly references "In lesson 20.1, you learned about function pointers."

### Code Correctness / Test Case Issues

#### Exercise 1 — "Count Matching Elements"
- **[BUG — PEDAGOGICAL CONTORTION] The exercise forces an unnatural pattern to avoid captures.** The prompt says the lambda cannot capture `T` (because empty capture `[]` is required), so the student must subtract `T` from every element first and then use a lambda checking `> 0`. This is unnecessarily convoluted. The lesson is about *introducing* lambdas — forcing students to work around the capture limitation before they've even learned captures creates confusion. A simpler exercise using only lambda parameters (e.g., sorting, or checking a property intrinsic to the element like even/odd) would be more appropriate.
  - The code itself is correct: the subtraction approach works. But the pedagogical value is questionable.

#### Exercise 2 — "Custom Sort with Lambdas"
- **NONE.** Test cases verified:
  - `{3, -1, -3, 2, -2, 1}` sorted by abs ascending, negative first on tie: `-1 1 -2 2 -3 3`. Correct.
  - `{10, 5, 1, 8}` all positive: `1 5 8 10`. Correct.
  - `{0, -4, 4, 0, -1}` sorted: `0 0 -1 -4 4`. Correct.
  - Lambda comparator logic is correct.

### Pedagogical Notes
- Good lesson overall. Exercise 1 is the only concern — see above.

---

## 20.7 — Lambda captures

### Forward-Reference Violations
- **NONE.** Uses lambda captures, `std::vector`, range-based for loops — all within scope.

### Within-Chapter Ordering Issues
- **NONE.** Correctly follows 20.6 which introduced lambdas without captures.

### Code Correctness / Test Case Issues

#### Exercise 1 — "Apply Offset and Scale"
- **NONE.** Test cases verified:
  - offset=10, scale=3, x=5: 5*3+10 = 25. Correct.
  - offset=0, scale=1, x=42: 42*1+0 = 42. Correct.
  - offset=-5, scale=-2, x=7: 7*(-2)+(-5) = -19. Correct.
- **[INFO] Return type of `applyTransform` is `auto`.** The solution uses `auto` return type deduction for a function returning a lambda. This is valid C++14+ and `auto` return types were covered in Ch 10.9. No issue.

#### Exercise 2 — "Counting Filter"
- **[BUG — PROMPT/SOLUTION MISMATCH] The prompt says "mutable lambda" but the solution lambda is NOT mutable.** The prompt text says: "Create a lambda that captures `threshold` by value and a `count` variable by value, marked `mutable`." and "Since mutable value captures do not propagate back, also capture a `totalCount` variable by reference." However, the solution captures `threshold` by value and `totalCount` by **reference** — there is no `mutable` keyword anywhere in the solution code. The solution lambda is `[threshold, &totalCount](int val) { ... }` which does not need `mutable` because it only modifies `totalCount` (captured by reference, so modification is allowed without `mutable`). The prompt's instruction to use `mutable` is misleading/incorrect for the actual solution approach.
  - **Fix:** Either (a) update the prompt to remove mention of `mutable` and just say "capture `threshold` by value and `totalCount` by reference", or (b) redesign the exercise to actually use a mutable lambda (e.g., capture a `count` by value, mark `mutable`, increment it, and then find another way to get the count out after the loop — which is awkward and bad practice, so option (a) is preferred).
- **[INFO] Starter code references `filter` but doesn't define it.** The starter code has `filter(val);` in the for loop but no `filter` variable is declared. This is intentional — the student is supposed to create the `filter` lambda — but it may cause initial confusion. Not a bug per se, but worth noting.

### Pedagogical Notes
- Exercise 2's prompt needs cleanup to align with the actual solution pattern. The mutable-vs-reference confusion undermines the lesson's credibility on captures.

---

## 20.x — Chapter 20 summary and quiz

### Forward-Reference Violations
- **[MINOR] Summary mentions `std::initializer_list` as an alternative to ellipsis.** Under the Ellipsis section: "Prefer variadic templates or `std::initializer_list`." Same issue as 20.5 — `std::initializer_list` is Ch 23 material. This is a summary, so it repeats the 20.5 issue. Should be: "Prefer variadic templates or other modern alternatives."
- **[MINOR] Summary mentions "variadic templates"** — The curriculum reference for Ch 20 does not list variadic templates as an introduced topic (they're not formally covered in any listed chapter). The mention is as a recommendation ("Prefer variadic templates or..."), not as a teaching point. This is a minor forward reference to an advanced topic not in the curriculum. Consider replacing with "Prefer templates or other type-safe alternatives."

### Within-Chapter Ordering Issues
- **NONE.** Summary/quiz is properly last.

### Code Correctness / Test Case Issues

#### Exercise 1 — "Filter and Sort with Lambdas"
- **[BUG — MISSING INCLUDE] Solution uses `std::back_inserter` which requires `<iterator>`.** The solution code uses `std::back_inserter(filtered)` but only includes `<algorithm>`, `<iostream>`, and `<vector>`. The `std::back_inserter` function is defined in `<iterator>`. While many implementations include it transitively through `<algorithm>` or `<vector>`, this is not guaranteed by the standard. The prompt says "You may include `<vector>`, `<algorithm>`, `<iostream>`" — `<iterator>` is not listed. **Fix:** Add `#include <iterator>` to the solution and add `<iterator>` to the permitted includes list.
- Test cases verified (assuming the code compiles):
  - `{3, 7, 1, 9, 5}` with T=4: count=3, filtered descending = `9 7 5`. Correct.
  - `{10, 20, 30, 40}` with T=25: count=2, filtered descending = `40 30`. Correct.
  - `{1, 2, 3}` with T=10: count=0, filtered empty. Output: `Filtered:`. Correct.

#### Exercise 2 — "Recursive Reduce with Function Pointer"
- **NONE.** Test cases verified:
  - sum of {3,5,2,7} = 17. Correct.
  - product of {4,3,2} = 24. Correct.
  - sum of {-1,10,-3,4,-2} = 8. Correct.
  - Good combination of recursion + function pointers — ties together two earlier lessons.
- **[INFO] Solution uses `data.data()`.** The `.data()` method on `std::vector` returns a raw pointer, which was available since Ch 16. No issue.

### Pedagogical Notes
- Good quiz exercises that combine multiple chapter topics (lambdas + algorithms, recursion + function pointers).

---

## Global Assessment

### Within-Chapter Lesson Ordering
The lesson order is well-structured:
1. **20.1** Function Pointers (foundational)
2. **20.2** Stack and Heap (memory model)
3. **20.3** Recursion (depends on stack understanding from 20.2)
4. **20.4** Command Line Arguments (independent topic)
5. **20.5** Ellipsis (independent topic, contrasts with safer alternatives)
6. **20.6** Lambdas (builds on function pointers from 20.1)
7. **20.7** Lambda Captures (builds on 20.6)
8. **20.x** Summary and Quiz

No lesson uses concepts from a later lesson in the same chapter. Function pointers (20.1) come before lambdas (20.6), which is correct. Stack/heap (20.2) comes before recursion (20.3), which is correct.

### Forward-Reference Summary

| Severity | Lesson | Issue |
|----------|--------|-------|
| MEDIUM | 20.5 | Names `std::initializer_list` (Ch 23) as an alternative to ellipsis |
| MINOR | 20.x | Repeats `std::initializer_list` mention from 20.5 in summary |
| MINOR | 20.x | Mentions "variadic templates" which are not in the curriculum |
| MINOR | 20.2 | Mentions "smart pointers, covered later" (acceptable teaser) |

No references to operator overloading, move semantics, inheritance, or virtual functions were found.

### Code Bugs Summary

| Severity | Lesson | Exercise | Issue |
|----------|--------|----------|-------|
| BUG | 20.7 | "Counting Filter" | Prompt says to use `mutable` lambda but solution does not use `mutable`; prompt/solution mismatch |
| BUG | 20.x | "Filter and Sort with Lambdas" | Missing `#include <iterator>` for `std::back_inserter` |
| PEDAGOGICAL | 20.6 | "Count Matching Elements" | Forces unnatural subtract-then-check pattern to avoid captures; poor first lambda exercise |
| INFO | 20.4 | Summary | Unnecessary `#include <sstream>` in example code |

### Test Case Verification
All test cases across all exercises produce outputs matching the expected values when run through the solution code logic. No arithmetic errors or output format mismatches found.

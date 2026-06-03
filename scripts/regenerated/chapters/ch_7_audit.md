# Chapter 7 Audit: Scope, Duration, and Linkage

## Summary
Chapter 7 contains 14 lessons (7.1-7.14 plus 7.x) with 20 exercises total. The summaries are mostly accurate and well-structured. However, there are several forward-reference violations (loops, vectors, auto, structs, switch, lambdas, ranges), a critical code bug in lesson 7.5 exercise 2, factual inaccuracies in summary code examples, and a few starter-code/prompt inconsistencies.

## Issues Found

### [CRITICAL] Lesson 7.1 — "Compound statements (blocks)"
- **Type**: forward-reference
- **Location**: summary (code example)
- **Details**: The summary code example uses `std::println("x inside block: {}", x)` which requires `<print>` and `std::println` with format strings. While `<print>` is C++23, this is used consistently across the course as a teaching tool in summaries. However, the summary also mentions `for` loops ("Function bodies, if/else branches, loop bodies, and switch cases are all blocks"), RAII, and lock guards — these are all forward references to later chapters. The mention of `for` and `switch` in passing context (not as something the student must use) is borderline acceptable as foreshadowing.
- **Fix needed**: Minor — consider softening "loop bodies, and switch cases" to just reference "if/else branches" since those are covered. RAII mention is fine as "covered in later chapters" disclaimer is present.

### [CRITICAL] Lesson 7.1 — "Compound statements (blocks)", Exercise 2
- **Type**: forward-reference
- **Location**: exercise 2 ("Scoped Accumulator with Shadow Detection")
- **Details**: The exercise requires reading N values and iterating over them multiple times. Both the starter code and solution code use `std::vector<int>`, `for` loops, and `#include <vector>`. `std::vector` is Ch 16/17 material and `for` loops are Ch 8 material. The starter code explicitly includes `<vector>` and the solution uses `std::vector<int> values(n)` with indexed for-loop iteration.
- **Fix needed**: Rewrite this exercise to avoid vectors and loops entirely. Use a fixed small number of inputs with individual variables and nested blocks, or defer this exercise to after Ch 8.

### [HIGH] Lesson 7.1 — "Compound statements (blocks)", Exercise 1
- **Type**: forward-reference (minor)
- **Location**: exercise 1 ("Track Variable Lifetime with Nested Blocks")
- **Details**: This exercise is clean of forward references — it uses only `std::cin`, `std::cout`, integer arithmetic, and nested blocks. No issues.
- **Fix needed**: None.

### [MEDIUM] Lesson 7.2 — "User-defined namespaces and the scope resolution operator"
- **Type**: forward-reference
- **Location**: summary (code example)
- **Details**: The summary example uses `struct Point { double x, y; };` (Ch 13), `auto [dx, dy] = std::pair{...}` (structured bindings, Ch 10+), and `std::sqrt` — all forward references. The struct and structured bindings are particularly problematic as they haven't been taught yet.
- **Fix needed**: Replace the summary code example with one that uses only functions, doubles, and basic operations without structs or structured bindings.

### [LOW] Lesson 7.2, Exercise 2
- **Type**: forward-reference (minor)
- **Location**: exercise 2 ("Nested Namespace Variable Lookup")
- **Details**: Uses `inline constexpr int DEFAULT_TIMEOUT = 30;` — the exercise notes acknowledge this ("treat them like const int for this exercise"), which is acceptable. The concept is formally covered in lesson 7.9/7.10 later in the chapter.
- **Fix needed**: None — the disclaimer is adequate, though ideally a simpler `const int` could be used instead since `inline constexpr` is a later-chapter topic.

### [HIGH] Lesson 7.3 — "Local variables"
- **Type**: forward-reference
- **Location**: summary (code example)
- **Details**: The summary code uses `std::vector<int>`, range-based `for` loop (`for (const auto score : scores)`), `auto` type deduction, ternary with `auto` (`auto label{score >= 90 ? "excellent" : "passing"}`), and `scores.size()`. Vectors are Ch 16/17, `auto` is Ch 10, and range-based for is an advanced loop form.
- **Fix needed**: Replace the summary code example with one using only local variables, if/else, and basic types already covered.

### [HIGH] Lesson 7.3, Exercise 1
- **Type**: forward-reference
- **Location**: exercise 1 ("Classify Temperatures Using Block-Scoped Labels")
- **Details**: The solution uses a `for` loop (`for (int i{0}; i < n; ++i)`), `std::string`, and if/else-if chains. `for` loops are Ch 8. However, `std::string` was covered in Ch 5.7. The `for` loop in the starter code is already provided, which somewhat mitigates this.
- **Fix needed**: Either replace the for loop with a concept available to the student (though there's no good alternative without loops for N items), or note that this exercise should be repositioned after Ch 8. Alternatively, reduce to a fixed number of inputs (e.g., always exactly 3 temperatures) to avoid needing loops.

### [HIGH] Lesson 7.3, Exercise 2
- **Type**: forward-reference
- **Location**: exercise 2 ("Per-Student Grade Summary")
- **Details**: Uses nested `for` loops and `std::string`. Same `for` loop forward-reference issue as exercise 1. More complex loop nesting makes this worse.
- **Fix needed**: Same as exercise 1 — loops are Ch 8 content.

### [HIGH] Lesson 7.4 — "Introduction to global variables", Exercises 1 & 2
- **Type**: forward-reference
- **Location**: both exercises
- **Details**: Both exercises use `for` loops in their solutions and starter code. Exercise 1 ("Track a Running Total") has a for loop in the starter code. Exercise 2 ("Count Positives and Negatives") same issue.
- **Fix needed**: Same pattern — `for` loops are Ch 8 material. These exercises require iteration over N values.

### [CRITICAL] Lesson 7.5 — "Variable shadowing (name hiding)", Exercise 2
- **Type**: code-bug
- **Location**: exercise 2 ("Shadowing Counter Variables"), solution_code
- **Details**: The solution contains `int i = (i == 0 ? 0 : i) * 10;` inside the inner block. This is **undefined behavior**: the inner `i` is being initialized using itself (reading an uninitialized variable). The declaration `int i = ...` creates a new `i` that shadows the outer `i`, but the initializer expression `(i == 0 ? 0 : i)` refers to the **new, not-yet-initialized** inner `i`, not the outer loop counter. This will not produce the expected output. The correct solution should capture the outer `i` before shadowing, e.g.: `int outer_i = i; int i = outer_i * 10;` or avoid shadowing by using a different variable name.
- **Fix needed**: Fix the solution to correctly capture the outer loop variable's value. For example: store the outer value first, then create the shadowing variable. The expected test case outputs (`inner: 0`, `inner: 10`, `inner: 20`) assume the outer `i` value is accessible during initialization of the inner `i`, which is not how C++ shadowing works.

### [HIGH] Lesson 7.5, Exercise 2
- **Type**: forward-reference
- **Location**: exercise 2 ("Shadowing Counter Variables")
- **Details**: Uses `for` loops (Ch 8 material).
- **Fix needed**: Loops not yet covered.

### [MEDIUM] Lesson 7.5 — "Variable shadowing (name hiding)"
- **Type**: forward-reference
- **Location**: summary
- **Details**: Summary recommends "Prefer `const` and `auto`" and mentions "Structured bindings and `auto`". `auto` is Ch 10 material, structured bindings are even later. These appear in prevention strategies list item 5.
- **Fix needed**: Remove or replace the `auto` and structured bindings recommendation. Replace with advice that uses only concepts covered so far.

### [MEDIUM] Lesson 7.5
- **Type**: scope-creep
- **Location**: summary (code example)
- **Details**: The summary code uses `using namespace std;` which, while it illustrates the point, is discouraged by the project's own CLAUDE.md conventions and the later lesson 7.13 explicitly warns against it. Teaching by anti-example is fine here, but it's worth noting.
- **Fix needed**: None — the example serves a pedagogical purpose.

### [HIGH] Lesson 7.6 — "Internal linkage", Exercise 1
- **Type**: forward-reference
- **Location**: exercise 1 ("Classify Linkage of File-Scope Declarations")
- **Details**: The solution uses a `switch` statement (`switch (kind) { case 's': ... }`). `switch` is Ch 8 material. The prompt says "using a switch or if-else chain" so if-else is an option, but the provided solution uses switch.
- **Fix needed**: Change the solution to use if/else-if chain instead of switch. The prompt allowing switch is also a forward reference — remove "switch or" from the prompt.

### [HIGH] Lesson 7.6, Exercise 1
- **Type**: forward-reference
- **Location**: exercise 1, starter code and solution
- **Details**: Uses `for` loop in main.
- **Fix needed**: for loops are Ch 8.

### [HIGH] Lesson 7.6, Exercise 2
- **Type**: forward-reference
- **Location**: exercise 2, solution
- **Details**: Uses `for` loop and `std::string` comparison (`word == "internal"`). The for loop is Ch 8.
- **Fix needed**: for loops are Ch 8.

### [HIGH] Lesson 7.7, Exercises 1 & 2
- **Type**: forward-reference
- **Location**: both exercises
- **Details**: Neither exercise uses loops. Exercise 1 is clean. Exercise 2 is clean — reads two values and uses blocks. Both are well-designed for the available concepts.
- **Fix needed**: None — these are good exercises.

### [HIGH] Lesson 7.8, Exercise 1
- **Type**: forward-reference (minor)
- **Location**: exercise 1 ("Refactor Hidden Global Side-Effect")
- **Details**: No loops used in the solution. Clean of forward references. Well-designed exercise focusing on function parameters vs globals.
- **Fix needed**: None.

### [HIGH] Lesson 7.8, Exercise 2
- **Type**: forward-reference
- **Location**: exercise 2 ("Local-Scope Accumulator with Function Linkage")
- **Details**: Uses `for` loop in solution.
- **Fix needed**: for loops are Ch 8.

### [MEDIUM] Lesson 7.9 — "Inline functions and variables"
- **Type**: forward-reference (minor)
- **Location**: summary (code example)
- **Details**: Uses `std::format` and `std::string` in the example. `std::format` is C++20 and not explicitly taught in prior chapters, though `std::string` is (Ch 5.7). The summary also mentions "static data members defined directly in a class" which is Ch 13/14.
- **Fix needed**: Minor — could replace `std::format` example with simpler code. Class mention should note "covered in later chapters".

### [LOW] Lesson 7.9, Exercise 1
- **Type**: forward-reference (very minor)
- **Location**: exercise 1 ("Inline Header Utility: Circle Geometry")
- **Details**: Clean exercise — no loops, no advanced features. Uses `double`, `inline`, `constexpr`, and formatted output. Well-designed.
- **Fix needed**: None.

### [LOW] Lesson 7.9, Exercise 2
- **Type**: forward-reference (very minor)
- **Location**: exercise 2 ("Inline Converter")
- **Details**: Clean exercise, no loops. Well-designed.
- **Fix needed**: None.

### [LOW] Lesson 7.10, Exercise 1
- **Type**: clean
- **Location**: exercise 1 ("Inline Constexpr Constants: Unit Converter")
- **Details**: No forward references. Well-designed.
- **Fix needed**: None.

### [HIGH] Lesson 7.10, Exercise 2
- **Type**: forward-reference
- **Location**: exercise 2 ("Inline Constants + Internal Linkage: Physics Query Filter")
- **Details**: Uses `for` loop and `std::abs` from `<cmath>`. The for loop is Ch 8.
- **Fix needed**: for loops are Ch 8.

### [LOW] Lesson 7.11 — "Static local variables"
- **Type**: forward-reference
- **Location**: summary (code example)
- **Details**: Uses `for` loop and `std::println`. The for loop mention is in the context of demonstrating the feature. No exercises for this lesson (exercises array is empty), which is actually appropriate given the loop dependency.
- **Fix needed**: None critical — the summary is explanatory.

### [MEDIUM] Lesson 7.12 — "Scope, duration, and linkage summary"
- **Type**: forward-reference
- **Location**: summary (code example)
- **Details**: Uses `std::format`, `std::println`, `for` loop, and `auto` return type (`auto make_id() -> int`). Trailing return type syntax hasn't been formally taught.
- **Fix needed**: Simplify the code example to use only covered syntax.

### [HIGH] Lesson 7.12, Exercise 1
- **Type**: forward-reference
- **Location**: exercise 1 ("Classify Variable Properties")
- **Details**: The solution uses `struct Props` (Ch 13/14) and array indexing (Ch 16). It also uses aggregate initialization. The exercise could be solved with if/else, but the provided solution uses structs and arrays.
- **Fix needed**: Rewrite the solution to use if/else-if chain instead of struct array lookup. Also uses a `for` loop in main (Ch 8).

### [HIGH] Lesson 7.12, Exercise 2
- **Type**: forward-reference
- **Location**: exercise 2 ("Static Call Counter with Shadowing Detection")
- **Details**: Uses `for` loop (Ch 8).
- **Fix needed**: for loops are Ch 8.

### [HIGH] Lesson 7.13, Exercise 1
- **Type**: forward-reference
- **Location**: exercise 1 ("Format a Receipt Using Using-Declarations")
- **Details**: Uses `for` loop (Ch 8), `std::string` (OK — Ch 5.7), `std::setw`/`std::setfill` (new but reasonable).
- **Fix needed**: for loops are Ch 8.

### [HIGH] Lesson 7.13, Exercise 2
- **Type**: forward-reference
- **Location**: exercise 2 ("Scoped Using-Declarations and Block Scope")
- **Details**: Uses `for` loops (Ch 8).
- **Fix needed**: for loops are Ch 8.

### [HIGH] Lesson 7.14, Exercise 1
- **Type**: forward-reference (minor)
- **Location**: exercise 1 ("Unnamed Namespace: Internal Helper Functions")
- **Details**: No loops. Clean exercise. Well-designed.
- **Fix needed**: None.

### [HIGH] Lesson 7.14, Exercise 2
- **Type**: forward-reference
- **Location**: exercise 2 ("Inline Namespace Versioning")
- **Details**: Solution uses `std::transform` with a **lambda** (`[](unsigned char c){ return static_cast<char>(std::tolower(c)); }`). Lambdas are Ch 12+ material. Also uses `<algorithm>` which hasn't been covered.
- **Fix needed**: Replace the lambda-based solution with a manual character-by-character conversion using a for loop (though loops themselves are Ch 8), or simplify the exercise to avoid string transformation entirely.

### [HIGH] Lesson 7.x, Exercise 1
- **Type**: forward-reference
- **Location**: exercise 1 ("Static Local Call Counter")
- **Details**: Uses `for` loop (Ch 8).
- **Fix needed**: for loops are Ch 8.

### [HIGH] Lesson 7.x, Exercise 2
- **Type**: forward-reference
- **Location**: exercise 2 ("Namespace-Scoped Running Statistics")
- **Details**: Uses `for` loop (Ch 8), `static_cast<double>` (OK — Ch 4.12), and a complex helper pattern with out-parameters that are essentially reference-like but passed by reference (`int& out_count, int& out_sum`). References are Ch 12 material.
- **Fix needed**: The solution uses pass-by-reference (`int&`) which is Ch 12 material. The for loop is Ch 8. Both are forward references.

### [MEDIUM] Lesson 7.2, Exercise 1
- **Type**: code-bug (minor)
- **Location**: exercise 1, starter_code
- **Details**: The starter code comment for the celsius namespace says `// TODO: define namespace celsius containing void display(double temp) that prints "Celsius: <temp> F"` — note the **F** unit label is wrong. It should say "C" not "F". The fahrenheit comment also says "F" which is correct for that one.
- **Fix needed**: Fix the starter code comment to say `"Celsius: <temp> C"` instead of `"Celsius: <temp> F"`.

### [MEDIUM] Lesson 7.12, Exercise 1
- **Type**: factual-error (debatable)
- **Location**: exercise 1 ("Classify Variable Properties")
- **Details**: Code 6 (`inline constexpr` global variable) is classified as having external linkage. This is correct for C++17 and later where `inline` implies external linkage even for `constexpr` variables. However, the teaching in lesson 7.9 says "constexpr implies const, enables compile-time evaluation, and, at namespace scope, also implies inline in C++17 and later". This is slightly misleading because `constexpr` at namespace scope does NOT imply `inline` — `inline constexpr` must be written explicitly. What is true is that `constexpr` implies `const`. The combination `inline constexpr` does have external linkage, so the classification answer is correct.
- **Fix needed**: None for the exercise answer, but lesson 7.9 summary should be corrected: remove the claim that `constexpr` implies `inline` at namespace scope (it doesn't — only `constexpr static` data members in classes get implicit `inline`).

### [LOW] Lesson 7.11
- **Type**: progression
- **Location**: lesson 7.11 (no exercises)
- **Details**: This lesson has zero exercises. While the summary mentions the topic depends on loops (which are Ch 8), having no exercises at all is a gap. The chapter quiz (7.x) does test static locals, so coverage exists but is deferred.
- **Fix needed**: Acceptable as-is since the quiz covers it, but consider adding a simple exercise that uses static locals without loops (e.g., calling a function a fixed number of times).

## Systemic Issue: Pervasive For-Loop Forward Reference

The most significant systemic problem is that **16 out of 20 exercises use `for` loops**, which are Ch 8 material. Since Chapter 7 comes before Chapter 8 in the curriculum, students have not yet learned loops. This affects exercises in lessons 7.1 (ex2), 7.3 (ex1, ex2), 7.4 (ex1, ex2), 7.5 (ex2), 7.6 (ex1, ex2), 7.8 (ex2), 7.10 (ex2), 7.12 (ex1, ex2), 7.13 (ex1, ex2), 7.x (ex1, ex2).

**Recommendation**: Either (a) redesign exercises to use a fixed/known number of inputs so loops are unnecessary, (b) reorder chapters so loops come before scope/linkage, or (c) explicitly note that basic loop syntax is provided in starter code as scaffolding and students should treat it as given.

## Lessons Verified Clean
- **7.7 Exercise 1** — "Forward-Declare a Global Counter": No forward references, correct code, correct test cases.
- **7.7 Exercise 2** — "Namespace-Scoped External Global with Block-Scope Shadowing": Clean, well-designed.
- **7.8 Exercise 1** — "Refactor Hidden Global Side-Effect": Clean, no loops, good pedagogical value.
- **7.9 Exercise 1** — "Inline Header Utility: Circle Geometry": Clean, correct test cases.
- **7.9 Exercise 2** — "Inline Converter with File-Scope Constant": Clean, correct test cases.
- **7.10 Exercise 1** — "Inline Constexpr Constants: Unit Converter": Clean, correct test cases.
- **7.14 Exercise 1** — "Unnamed Namespace: Internal Helper Functions": Clean, correct test cases.
- **7.1 Exercise 1** — "Track Variable Lifetime with Nested Blocks": Clean, no forward references.

## Test Case Verification Notes
- **7.1 Ex1**: 100C = 212F (correct: 100*9/5+32=212), 0C = 32F (correct), -40C = -40F (correct: -40*9/5+32=-72+32=-40). Kelvin: 100+273=373, 0+273=273, -40+273=233. All correct.
- **7.9 Ex1**: r=5: circumference=2*PI*5=31.4159...(31.42), area=PI*25=78.5398...(78.54), diameter=10.00. All correct.
- **7.9 Ex2**: c=25: F=77.00, K=298.15, R=298.15*9/5=536.67. c=-273.15: F=-459.67, K=0.00, R=0.00. c=100: F=212.00, K=373.15, R=671.67. All correct.
- **7.10 Ex1**: 10km*0.621371=6.21371 (6.2137), 100C*9/5+32=212.0000. All correct.
- **7.5 Ex2 test cases**: The expected outputs assume correct shadowing capture, but the solution code has UB. Test cases would not match actual compiled output.

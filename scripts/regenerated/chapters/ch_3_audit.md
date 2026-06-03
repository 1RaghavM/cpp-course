# Chapter 3 Audit: Debugging C++ Programs

## Summary
Chapter 3 has pervasive forward-reference violations. Nearly every lesson summary and the majority of exercises use C++ features not yet introduced in Chapters 0-2: `std::vector`, `std::format`/`std::println`, `double`/`float`/`bool`, `if`/`else`, `for` loops, range-based `for`, `const` references, `auto`, structured bindings, `if constexpr`, `constexpr`, arrays, `std::string`, `std::swap`, `<cassert>`, `assert()`, `size_t`, templates, and `enum class`. Every exercise requires `if`/`else` and/or loops, which are not taught until Chapter 4 (if/else at 4.10) and Chapter 8 (loops). The summaries are conceptually reasonable for a debugging chapter but the code examples and exercises are essentially unusable at this point in the curriculum.

## Issues Found

### [CRITICAL] Lesson 3.1 -- "Syntax and semantic errors"
- **Type**: forward-reference
- **Location**: summary
- **Details**: The summary code example uses `#include <vector>`, `std::vector<int>`, `std::format`, brace-enclosed initializer lists, `if` with declaration (`if (int x = 5)`), and the `.size()` member function. None of these have been taught. `std::vector` is Ch 16/17, `std::format` is not in Ch 0-2, `if` is Ch 4.10, and brace initialization of containers is far later. The prose also references `std::string`, `bool` (implicit in discussion), and "buffer overflows in arrays" (arrays not taught until Ch 16/17). References to "AddressSanitizer" and "gdb" are acceptable for a debugging chapter conceptual overview, but the code sample is completely beyond the student's knowledge.
- **Fix needed**: Replace the code example with one using only `int` variables, `std::cout`, `std::cin`, and simple arithmetic/assignment -- the only constructs covered so far. For example, show the `x = 5` vs `x == 5` error using a plain `int` variable printed with `std::cout`, and show an uninitialized variable as the semantic error example. Remove mentions of `std::string`, `std::format`, and vectors from the summary.

### [CRITICAL] Lesson 3.1 -- "Syntax and semantic errors", Exercise 2 ("Detecting Semantic Errors in Grade Validator")
- **Type**: forward-reference
- **Location**: exercise 2
- **Details**: Uses `if`/`else` (not taught until 4.10), C-style arrays (`int grades[3] = {85, 90, 88};` -- arrays not until Ch 16/17), and array indexing (`grades[5]`). The entire exercise logic depends on `if`/`else`, which the student has never seen. The starter code also uses aggregate initialization with braces on an array.
- **Fix needed**: Redesign to use only constructs from Ch 0-2. A semantic-error exercise at this stage should focus on things like operator precedence bugs in arithmetic, assignment vs comparison in a simple expression (without `if`), or incorrect function return values. For example: a function that is supposed to return `a + b` but returns `a - b`.

### [MODERATE] Lesson 3.1 -- "Syntax and semantic errors", Exercise 1 ("Finding and Fixing Syntax Errors in Calculator")
- **Type**: forward-reference (minor)
- **Location**: exercise 1
- **Details**: The exercise itself (missing semicolons) is appropriate for the level. However, the exercise uses `std::endl` which was covered in 1.5 -- this is fine. The multiple `int` declarations on one line and the `>>` extraction operator were covered. This exercise is mostly clean, but it does assume the student can recognize `std::cin >> a >> b` input for two variables on one line, which was covered in 1.5. **No critical issues -- this exercise is acceptable.**
- **Fix needed**: None for exercise 1 itself.

### [CRITICAL] Lesson 3.2 -- "The debugging process"
- **Type**: forward-reference
- **Location**: summary
- **Details**: Code example uses `#include <format>`, `std::format`, `#include <vector>`, `std::vector<int>`, and brace initialization of a vector. The prose mentions "pointer dereferencing" and "container access beyond bounds" -- pointers are Ch 12, containers Ch 16/17. The code is completely beyond what students know.
- **Fix needed**: Replace `std::format` with `std::cout <<` chains. Remove vector usage entirely. Replace with simple `int` variable print-debugging examples using only `std::cout`.

### [CRITICAL] Lesson 3.3 -- "A strategy for debugging"
- **Type**: forward-reference
- **Location**: summary
- **Details**: Multiple violations:
  1. `std::vector<int>` and `assert(!data.empty())` -- vectors not taught, `assert()` not taught (introduced conceptually here but `<cassert>` header never covered).
  2. Range-based `for` loop (`for (auto& val : data)`) -- `auto` is Ch 10, range-based for is Ch 16+, references are Ch 12.
  3. `assert(val >= 0)` inside a loop -- loops not taught until Ch 8.
  4. Structured bindings: `auto [x, y] = get_coords();` -- not covered until much later.
  5. `std::println("Position: x={}, y={}", x, y);` -- `<print>` header and `std::println` are C++23 features, definitely not yet covered.
  6. Prose mentions "iterators" and "lifetime match scope" -- iterators are Ch 16+, object lifetime/scope beyond local scope is later.
- **Fix needed**: Rewrite all code examples using only `int` variables, `std::cout`, simple functions (Ch 2), and basic arithmetic. Show the strategy concepts (assert, logging, narrowing) with trivially simple code that a Ch 2 student can read.

### [CRITICAL] Lesson 3.4 -- "Basic debugging tactics"
- **Type**: forward-reference
- **Location**: summary
- **Details**:
  1. `#include <format>` and `std::format` -- not yet taught.
  2. `std::swap(x, y)` -- the `<algorithm>` or `<utility>` swap function has not been introduced.
  3. `#include <cassert>` and `assert(b != 0.0)` -- not yet taught, and uses `double` parameters (Ch 4).
  4. The `divide` function uses `double` parameters and return type -- `double` is not introduced until Ch 4.
- **Fix needed**: Replace `std::format` with `std::cout <<` chains. Replace `std::swap` example with manual swap using a temp variable (or just a different example). Replace `double` with `int` in the assert/divide example since `double` is Ch 4.

### [CRITICAL] Lesson 3.4, Exercise 1 ("Debug a Calculation Function with Print Statements")
- **Type**: forward-reference
- **Location**: exercise 1
- **Details**: Uses `double` type throughout (parameters, variables, input). `double` is not introduced until Chapter 4. Also uses `#include <iomanip>`, `std::fixed`, and `std::setprecision(2)` which are not covered in Chapters 0-2. The function parameter syntax (`double a, double b, double c, double d`) is fine structurally (Ch 2 covered parameters), but the type itself is premature.
- **Fix needed**: Change all `double` to `int` and remove the fixed/setprecision formatting (just print plain integers). Adjust the formula and test cases accordingly, or defer this exercise.

### [CRITICAL] Lesson 3.4, Exercise 2 ("Use Assertions to Validate Function Preconditions")
- **Type**: forward-reference
- **Location**: exercise 2
- **Details**: Uses `double` type, `#include <iomanip>`, `std::fixed`, `std::setprecision(2)`, and `#include <cassert>` with `assert()`. While `assert` is discussed conceptually in this lesson, `double` is Ch 4. The test case with `0.5 2.5` also requires floating-point input parsing. Additionally, the `assert` usage with `>` comparison operator -- comparison operators have been mentioned in context of expressions (1.9, 1.10) but `if`-like behavior of assert is conceptually new.
- **Fix needed**: Change to `int` types, remove floating-point formatting. Keep `assert()` since this lesson explicitly teaches it, but document that this is the first introduction of `<cassert>`.

### [CRITICAL] Lesson 3.5 -- "More debugging tactics"
- **Type**: forward-reference
- **Location**: summary
- **Details**:
  1. `const std::vector<int>&` -- `const` is Ch 5, references are Ch 12, vectors are Ch 16/17.
  2. `size_t` -- not yet introduced.
  3. Range-based `for` with `auto&` -- auto Ch 10, references Ch 12, range-for Ch 16+.
  4. `std::format` -- not yet taught.
  5. `if (data[i] < 0)` inside a loop -- `if` is Ch 4.10, loops are Ch 8.
  6. Structured bindings: `auto [success, value] = parseInput(input);` -- much later.
  7. Discussion of "iterators", "lifetime", "copying vs referencing" -- all future topics.
- **Fix needed**: Rewrite examples using only Ch 0-2 constructs. The tactical concepts (conditional breakpoints, watchpoints, minimal reproducers) can be explained in prose without advanced code.

### [CRITICAL] Lesson 3.6 -- "Using an integrated debugger: Stepping"
- **Type**: forward-reference
- **Location**: summary
- **Details**:
  1. `const std::vector<int>&` parameter -- const (Ch 5), references (Ch 12), vectors (Ch 16/17).
  2. Range-based `for` loop: `for (int n : nums)` -- Ch 16+.
  3. `if (n > 0)` -- `if` is Ch 4.10.
  4. `std::vector nums{-5, 10, 3, -2, 8}` with CTAD (class template argument deduction) -- very advanced.
  5. `std::format("Sum: {}\n", result)` -- not yet taught.
- **Fix needed**: Replace with a simple example using `int` variables and `std::cout`. For example, step through a multi-step arithmetic calculation across several lines.

### [CRITICAL] Lesson 3.6, Exercise 1 ("Debugging a Function's Calculation with Stepping")
- **Type**: forward-reference
- **Location**: exercise 1
- **Details**: Uses `std::vector<int>`, `const std::vector<int>&`, range-based `for` loop (`for (int n : nums)`), `if (square > 0)`, and a traditional `for` loop (`for (int i = 0; i < n; ++i)`). Vectors are Ch 16/17, `if` is Ch 4.10, and `for` loops are Ch 8. The entire exercise is impossible for a student at this point in the curriculum.
- **Fix needed**: Redesign without vectors, loops, or if statements. Could use a multi-step calculation in a function with a bug, where the student traces through simple sequential statements.

### [CRITICAL] Lesson 3.6, Exercise 2 ("Stepping Through a Loop: Finding the Off-by-One Error")
- **Type**: forward-reference
- **Location**: exercise 2
- **Details**: Uses `std::vector<int>`, `const std::vector<int>&`, `for` loop with `.size()`, `if (scores[i] >= 60)`, and `++i`. Same issues as exercise 1. Additionally, the title mentions "Off-by-One Error" but there is no actual off-by-one error in the code -- the starter code and solution code are identical, making this a non-exercise. The student has nothing to fix.
- **Fix needed**: This exercise is broken in two ways: (1) it uses constructs far beyond the student's knowledge, and (2) the starter code has no actual bug to fix (starter == solution). Completely redesign.

### [HIGH] Lesson 3.6, Exercise 2 -- "Stepping Through a Loop"
- **Type**: code-bug / progression
- **Location**: exercise 2
- **Details**: The starter_code and solution_code are character-for-character identical (ignoring TODO comments). There is no bug to find or fix. The exercise title claims an "Off-by-One Error" but none exists. This renders the exercise completely non-functional as a learning activity.
- **Fix needed**: Either introduce an actual off-by-one bug in the starter code (e.g., `i <= scores.size()` or `i = 1` start), or replace the exercise entirely.

### [CRITICAL] Lesson 3.7 -- "Using an integrated debugger: Running and breakpoints"
- **Type**: forward-reference
- **Location**: summary
- **Details**:
  1. `std::vector<int> values{10, 20, 30}` -- vectors Ch 16/17.
  2. `for (int i = 0; i < values.size(); ++i)` -- loops Ch 8, `.size()` is a member function on vector.
  3. `std::format("Result: {}\n", result)` -- not yet taught.
- **Fix needed**: Replace with a simple sequential program (no loops, no vectors) that demonstrates setting a breakpoint and inspecting `int` variables.

### [CRITICAL] Lesson 3.7, Exercise 1 ("Finding the Calculation Error with Breakpoints")
- **Type**: forward-reference
- **Location**: exercise 1
- **Details**: Uses `double` (Ch 4), `#include <iomanip>`, `std::fixed`, `std::setprecision`, and a `for` loop (`for (int year = 1; year <= years; ++year)`) which is Ch 8. The entire exercise depends on loops.
- **Fix needed**: Redesign without loops and `double`. Could use a sequential multi-step integer calculation with a bug, where the student uses breakpoints to find where the value diverges from expectations.

### [CRITICAL] Lesson 3.7, Exercise 2 ("Temperature Conversion Loop with Breakpoint Inspection")
- **Type**: forward-reference
- **Location**: exercise 2
- **Details**: Uses `for` loop (Ch 8), `double` (Ch 4), `#include <iomanip>`, `std::fixed`, `std::setprecision`, and integer division bug (`celsius * 9 / 5`). The integer division issue is actually a reasonable thing to teach but requires understanding of `double` vs `int` division, which is Ch 4 material.
- **Fix needed**: Redesign without loops and double. Use only Ch 0-2 constructs.

### [CRITICAL] Lesson 3.8 -- "Using an integrated debugger: Watching variables"
- **Type**: forward-reference
- **Location**: summary
- **Details**:
  1. `std::string name;` in the `Player` struct -- `std::string` is Ch 5, structs are Ch 13.
  2. `float speed;` -- `float` is Ch 4.
  3. Mentions "objects and structs" with tree view inspection -- structs not until Ch 13.
  4. Discussion of `std::vector` size/capacity inspection -- vectors Ch 16/17.
  5. Mentions watching expressions like `health < 50` and `position.x * 2` -- implies struct member access (Ch 13).
- **Fix needed**: Replace struct/object examples with simple `int` variable watching. Show watching multiple `int` variables through a calculation sequence.

### [CRITICAL] Lesson 3.9 -- "Using an integrated debugger: The call stack"
- **Type**: forward-reference
- **Location**: summary
- **Details**:
  1. `#include <print>` and `std::println` -- C++23 features, not covered.
  2. The `divide` and `process` example is actually reasonable in terms of function calls (Ch 2 covers functions), but `std::println("{}", process(5))` uses format strings and `<print>`.
- **Fix needed**: Replace `std::println` with `std::cout <<`. The function call chain example is otherwise appropriate since functions were covered in Ch 2.

### [MODERATE] Lesson 3.10 -- "Finding issues before they become problems"
- **Type**: forward-reference
- **Location**: summary
- **Details**:
  1. Template usage: `template<typename T, std::size_t N>` with `struct FixedBuffer` -- templates are Ch 11, structs Ch 13, `std::size_t` not yet covered.
  2. `static_assert` -- not previously introduced, though arguably appropriate to mention here conceptually.
  3. `T data[N]{};` -- arrays Ch 16/17, templates Ch 11.
  4. `std::println` -- C++23, not taught.
  5. `sizeof` operator usage -- not covered in Ch 0-2.
  6. Mentions `const`, `constexpr`, `enum class` -- `const`/`constexpr` are Ch 5, `enum class` is Ch 13.
  7. Mentions "strong types" and the type system in depth -- beyond current scope.
- **Fix needed**: Replace the `static_assert` template example with a simpler compile-time check or just describe `static_assert` in prose without templates. Replace `std::println` with `std::cout`. Remove mentions of `enum class` and templates. Keep `const`/`constexpr` mentions minimal and forward-looking ("you'll learn about these soon").

### [MODERATE] Lesson 3.x -- "Chapter 3 summary and quiz"
- **Type**: forward-reference
- **Location**: summary
- **Details**:
  1. `#include <format>` and `std::format` -- not yet taught.
  2. `if constexpr (DEBUG)` -- `if` is Ch 4.10, `constexpr` is Ch 5, `if constexpr` is C++17 and much later.
  3. `constexpr bool DEBUG = true;` -- `constexpr` is Ch 5 (though `const` behavior is somewhat intuitive).
  4. `std::cerr` -- not formally introduced in Ch 0-2 (only `std::cout` and `std::cin` in 1.5).
  5. The `divide(10, 0)` example involves division by zero UB, which is fine conceptually but the code style uses features not yet taught.
- **Fix needed**: Replace `std::format` with `std::cout <<`. Replace `if constexpr` with a comment or simple preprocessor `#ifdef DEBUG`. Note that `std::cerr` should be briefly introduced if used (or reference that it works like `std::cout` but for error output).

### [CRITICAL] Lesson 3.x, Exercise 1 ("Trace the Bug: Semantic Error Detective")
- **Type**: forward-reference
- **Location**: exercise 1
- **Details**: Uses `constexpr bool DEBUG = true` (constexpr Ch 5), and the solution uses `if constexpr (DEBUG)` which requires both `if` (Ch 4.10) and `if constexpr` (much later). The exercise itself requires `if` statements. Also uses `std::cerr` which hasn't been formally introduced. However, `std::cerr` is closely related to `std::cout` from 1.5, so that's a minor issue. The core problem is the `if`/`if constexpr` requirement.
- **Fix needed**: Remove the `if constexpr` requirement. Either always print debug output (no conditional), or use a preprocessor `#ifdef` approach (preprocessor was covered in 2.10). Change `constexpr` to `const` or remove the flag entirely.

### [MODERATE] Lesson 3.x, Exercise 2 ("Call Stack Simulator")
- **Type**: forward-reference
- **Location**: exercise 2
- **Details**: Uses `if (value == 0)` which requires `if` statements (Ch 4.10) and recursion. However, recursion is a natural extension of functions (Ch 2), and this is a chapter summary exercise. The `if` usage is the primary concern. Also uses `==` comparison operator which was introduced in 1.9 (operators) but `if` control flow was not.
- **Fix needed**: This is a borderline case. The exercise is well-designed for its purpose (demonstrating call stacks). The `if` statement is the only forward reference. Options: (a) accept the minor forward reference since `if` is arguably intuitive, (b) restructure to avoid `if` (difficult for recursion), or (c) add a brief note that `if` will be formally covered in Ch 4. Recommend option (c) as least disruptive.

---

## Cross-Cutting Issues

### `std::format` / `std::println` used throughout (CRITICAL)
Every lesson from 3.1 through 3.x uses `std::format` (from `<format>`) or `std::println` (from `<print>`, C++23) in code examples. These are never introduced in Chapters 0-2. The curriculum teaches `std::cout` with `<<` operators in lesson 1.5. All formatted output should use `std::cout <<` chains instead.

**Affected lessons**: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.9, 3.10, 3.x

### `std::vector` used throughout (CRITICAL)
Vectors appear in summaries for lessons 3.1, 3.2, 3.3, 3.5, 3.6, 3.7, 3.8 and in exercises for 3.6. `std::vector` is not introduced until Chapter 16/17. All vector usage should be replaced with simple `int` variables or C-style constructs already taught.

**Affected lessons**: 3.1, 3.2, 3.3, 3.5, 3.6 (summary + both exercises), 3.7, 3.8

### `if`/`else` and loops used in exercises (CRITICAL)
Every exercise in this chapter requires `if`/`else` (not taught until 4.10) and/or `for` loops (not taught until Ch 8). This makes every exercise except 3.1-Ex1 (the syntax error fix) impossible for a student who has only completed Chapters 0-2.

**Affected exercises**: 3.1-Ex2, 3.4-Ex1 (uses functions with `double`), 3.4-Ex2, 3.6-Ex1, 3.6-Ex2, 3.7-Ex1, 3.7-Ex2, 3.x-Ex1, 3.x-Ex2

### `double`/`float` types used before Chapter 4 (HIGH)
Multiple exercises use `double` for parameters and variables. Floating-point types are introduced in Chapter 4.

**Affected**: 3.4-Ex1, 3.4-Ex2, 3.7-Ex1, 3.7-Ex2, lesson 3.8 summary (uses `float`)

---

## Lessons Verified Clean
- **Lesson 3.1, Exercise 1** ("Finding and Fixing Syntax Errors in Calculator") -- Uses only `int`, `std::cin`, `std::cout`, `std::endl`, and basic arithmetic. Appropriate for Ch 0-2 knowledge level. Test cases are correct.

## Exercises Where Starter == Solution (No Bug to Fix)
- **Lesson 3.6, Exercise 2** ("Stepping Through a Loop") -- The starter code and solution code are functionally identical. There is no bug for the student to find or fix, contradicting the exercise prompt which claims incorrect output.

## Test Case Verification
All test cases that I was able to verify against their solution code appear arithmetically correct. No test case mismatches were found in the solutions that do contain the intended fix.

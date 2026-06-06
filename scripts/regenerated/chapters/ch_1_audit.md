# Chapter 1 Audit: C++ Basics

## Summary

Chapter 1 has pervasive forward-reference violations. The chapter summary/quiz lesson (1.x) is the worst offender, with all four exercises requiring `double`, `char`, and `if`/`else` (Ch 4). Multiple earlier lessons also violate: lesson 1.6 exercises use `for` loops (Ch 8), `if`/`else` (Ch 4), and `++`/`+=`/`*=` (Ch 6); lesson 1.5 and 1.8 exercises use `std::string` (Ch 5); and the `%` operator (Ch 6, but taught in lesson 1.9's summary) appears in exercises before lesson 1.9. One critical test-case mismatch was found in lesson 1.10, and two critical output mismatches exist in lesson 1.x where solutions print prompt text not present in `expected_stdout`.

## Issues Found

---

### [MEDIUM] Lesson 1.5 — "Introduction to iostream: cout, cin, and endl"
- **Type**: forward-reference
- **Location**: summary
- **Details**: The summary text mentions `double` as a type: "a `double` causes it to parse a floating-point number." `double` is not introduced until Chapter 4.
- **Fix needed**: Remove or rephrase the `double` mention. Stick to `int` examples only, noting that `std::cin >>` parses based on the variable's type, and that `int` variables parse integers.

---

### [MEDIUM] Lesson 1.5 — "Introduction to iostream: cout, cin, and endl"
- **Type**: forward-reference
- **Location**: exercise 1 ("Unit Converter") — solution_code, prompt_md
- **Details**: Uses the `%` (remainder) operator. According to the curriculum reference, `%` is not listed among Ch 1's operators (`+`, `-`, `*`, `/`). Within Ch 1 itself, `%` is first taught in lesson 1.9's summary, but this is lesson 1.5 — a within-chapter forward reference.
- **Fix needed**: Either (a) move the `%` introduction to lesson 1.5's summary, (b) replace this exercise with one that only uses `+`, `-`, `*`, `/`, or (c) reorder exercises so this comes after lesson 1.9.

---

### [HIGH] Lesson 1.5 — "Introduction to iostream: cout, cin, and endl"
- **Type**: forward-reference
- **Location**: exercise 2 ("Greeting Card") — starter_code, solution_code
- **Details**: Uses `std::string` (`#include <string>`, `std::string name{};`). `std::string` is not introduced until Chapter 5. This is a major forward reference — students in Ch 1 have never seen `std::string`.
- **Fix needed**: Replace the name with an `int` variable (e.g., read an ID number), or remove this exercise entirely and replace with one that only uses `int` and `std::cout`/`std::cin`.

---

### [HIGH] Lesson 1.6 — "Uninitialized variables and undefined behavior"
- **Type**: forward-reference
- **Location**: summary
- **Details**: The summary code example uses `#include <format>` and `std::format("a={} b={}\n", a, b)`. While `std::format` was "shown but not formally taught" in Ch 0, `<format>` is not listed as an available header in Ch 1. More critically, the summary also includes `double celsius {}` in its second exercise, which is a Ch 4 type.
- **Fix needed**: Replace `std::format` with `std::cout << "a=" << a << " b=" << b << '\n';` using only Ch 1's `<iostream>`. Remove `double` references.

---

### [HIGH] Lesson 1.6 — "Uninitialized variables and undefined behavior"
- **Type**: forward-reference
- **Location**: exercise 1 ("Initialize Variables Correctly") — starter_code, solution_code
- **Details**: Uses `for (int i = 0; i < n; i++)` loop (Ch 8), `+=` compound assignment (Ch 8), `*=` compound assignment (Ch 8), `++` increment operator (Ch 6), and `using namespace std;` (contradicts lesson 1.5's explicit advice against it). This exercise requires knowledge from 5 chapters ahead.
- **Fix needed**: Completely rewrite this exercise to use only Ch 1 concepts. For example: declare three `int` variables with and without initialization, read values from `std::cin`, and print results — demonstrating the importance of initialization without requiring loops or compound operators.

---

### [HIGH] Lesson 1.6 — "Uninitialized variables and undefined behavior"
- **Type**: forward-reference
- **Location**: exercise 2 ("Safe Temperature Converter") — starter_code, solution_code
- **Details**: Uses `double` type (Ch 4), floating-point literals (`5.0`, `273.15`, `32`), `#include <format>`, and `std::format("{:.2f}", ...)` with floating-point format specifiers. All of these are far beyond Ch 1.
- **Fix needed**: Rewrite to use only `int` arithmetic. For example, an integer-only temperature approximation, or replace with a different exercise that demonstrates initialization without requiring `double`.

---

### [HIGH] Lesson 1.6 — "Uninitialized variables and undefined behavior"
- **Type**: forward-reference
- **Location**: exercise 3 ("Detect Uninitialized Variable Usage") — starter_code, solution_code
- **Details**: Uses `if`/`else if`/`else` (Ch 4), `++` increment operator (Ch 6), `==` comparison operator (Ch 6), and `using namespace std;`. The core concept being taught (initialization) is buried under multiple untaught control flow constructs.
- **Fix needed**: Rewrite to avoid `if`/`else` and `++`. A simpler exercise could have students fix uninitialized variables that feed into `std::cout` output, demonstrating UB risk without control flow.

---

### [MEDIUM] Lesson 1.7 — "Keywords and naming identifiers"
- **Type**: forward-reference
- **Location**: summary
- **Details**: States "Common keywords you have already seen include `int`, `double`, `return`, and `const`." Students have NOT seen `double` (Ch 4) or `const` (Ch 5) yet — these have not been formally introduced or used in any prior Ch 1 lesson.
- **Fix needed**: Change to "Common keywords you have already seen include `int` and `return`." Optionally mention that the full keyword list includes many more they will encounter later.

---

### [MEDIUM] Lesson 1.7 — "Keywords and naming identifiers"
- **Type**: forward-reference
- **Location**: exercise 2 ("Coin Counter") — solution_code, prompt_md
- **Details**: Uses the `%` (remainder) operator, which is taught in lesson 1.9 but this is lesson 1.7 — a within-chapter forward reference.
- **Fix needed**: Same as lesson 1.5 exercise 1. Either teach `%` earlier, reorder exercises, or replace with an exercise that uses only `+`, `-`, `*`, `/`.

---

### [HIGH] Lesson 1.8 — "Whitespace and basic formatting"
- **Type**: forward-reference
- **Location**: exercise 2 ("Receipt Printer") — starter_code, solution_code
- **Details**: Uses `std::string` (Ch 5), `#include <string>`, `#include <iomanip>` (not in Ch 1 curriculum), `std::setw`, `std::left`, `std::right`. The exercise is essentially an `<iomanip>` formatting tutorial, which is well beyond Ch 1's scope.
- **Fix needed**: Replace with a simpler formatting exercise that uses only `std::cout`, `<<`, and `'\n'` to demonstrate whitespace and indentation concepts — e.g., printing a simple aligned table using string literals and tab characters, or printing a box pattern.

---

### [HIGH] Lesson 1.9 — "Introduction to literals and operators"
- **Type**: forward-reference
- **Location**: summary
- **Details**: The summary code example uses `double exact = static_cast<double>(apples) / bags;` which requires both `double` (Ch 4) and `static_cast` (Ch 4). The literal type table lists `float`, `double`, `bool`, `char`, `unsigned int`, `long` types and their literal suffixes — all of which are Ch 4+ concepts. The text also mentions `std::pow` from `<cmath>`.
- **Fix needed**: Remove the `double`/`static_cast` code example. Simplify the literal table to show only integer literals and mention that other literal types exist but will be covered later. Remove or defer the `std::pow` mention.

---

### [HIGH] Lesson 1.9 — "Introduction to literals and operators"
- **Type**: forward-reference
- **Location**: exercise 1 ("Fruit Basket Division") — starter_code, solution_code
- **Details**: Uses `double exact = static_cast<double>(fruit) / workers;` requiring both `double` (Ch 4) and `static_cast<double>` (Ch 4). Also uses `#include <format>` and `std::format("{:.2f}", ...)` with floating-point format specifiers.
- **Fix needed**: Remove the floating-point "exact per worker" requirement. The exercise works perfectly as an integer-division-and-remainder exercise without the `double` conversion.

---

### [MEDIUM] Lesson 1.10 — "Introduction to expressions"
- **Type**: forward-reference
- **Location**: summary
- **Details**: The code example uses `#include <print>` and `std::println()` which are C++23 features, not mentioned anywhere in the curriculum. The summary also references `&&` and `||` short-circuit evaluation (Ch 6) and mentions "function calls" as expressions (functions beyond `main` are Ch 2).
- **Fix needed**: Replace `std::println` with `std::cout <<`. Remove or defer the `&&`/`||` mention. Rephrase the function call reference to avoid implying students can write their own functions.

---

### [CRITICAL] Lesson 1.10 — "Introduction to expressions"
- **Type**: test-mismatch
- **Location**: exercise 2 ("Subexpression Breakdown") — test_cases[1]
- **Details**: Hidden test input `0 -2 5` expects `expected_stdout: "29\n15\n-10\n"` but the solution computes:
  - `x*x + y*y + z*z = 0 + 4 + 25 = 29` (correct)
  - `(x + y) * (y + z) = (0 + (-2)) * ((-2) + 5) = (-2) * 3 = -6` (expected says `15`, WRONG)
  - `x*y + y*z - x*z = 0 + (-10) - 0 = -10` (correct)
  
  The expected value `15` for the second expression is incorrect; the actual result is `-6`.
- **Fix needed**: Change `expected_stdout` for this test case from `"29\n15\n-10\n"` to `"29\n-6\n-10\n"`.

---

### [HIGH] Lesson 1.x — "Chapter 1 summary and quiz"
- **Type**: forward-reference
- **Location**: summary
- **Details**: The summary code example uses `double price{ 0.0 };` which is a Ch 4 type. The summary text also mentions `if` (Ch 4) in the keywords section. While the summary is meant to review the chapter, introducing `double` in a code example implies students should know it.
- **Fix needed**: Replace `double price{ 0.0 }` with `int price{ 0 }` or `int price_cents{ 0 }` in the example code.

---

### [CRITICAL] Lesson 1.x — "Chapter 1 summary and quiz"
- **Type**: test-mismatch
- **Location**: exercise 1 ("Temperature Converter", first) — solution_code vs test_cases
- **Details**: The solution prints prompt text (`"Enter temperature: "` and `"Enter unit (C/F): "`) to stdout via `std::cout`, but `expected_stdout` for the sample test case is just `"77.0 F\n"`. The actual solution output would be `"Enter temperature: Enter unit (C/F): 77.0 F\n"`. The prompts appear in the solution but not in the expected output.
- **Fix needed**: Either (a) remove the `std::cout` prompt lines from the solution, or (b) add the prompt text to `expected_stdout` in all test cases.

---

### [HIGH] Lesson 1.x — "Chapter 1 summary and quiz"
- **Type**: forward-reference
- **Location**: exercise 1 ("Temperature Converter", first) — starter_code, solution_code
- **Details**: Uses `double` (Ch 4), `char` (Ch 4), `if`/`else if` (Ch 4), `std::setprecision` and `std::fixed` from `<iomanip>` (not in Ch 1). This is a chapter summary exercise but requires knowledge from 3 chapters ahead.
- **Fix needed**: Rewrite as an integer-only converter (like lesson 1.11's temperature exercise), or accept that quiz exercises may preview upcoming concepts and clearly label them as stretch/bonus.

---

### [HIGH] Lesson 1.x — "Chapter 1 summary and quiz"
- **Type**: forward-reference
- **Location**: exercise 2 ("Rectangle Geometry") — starter_code, solution_code
- **Details**: Uses `std::string` (Ch 5), `#include <string>`, C-style string array `std::string labels[]{"no","yes"}` (arrays are Ch 17, but the concept of array indexing is also untaught), and the `==` comparison operator (formally Ch 6). The prompt says "Do not use if/else" but the array-indexing workaround requires knowledge of arrays which are far beyond Ch 1.
- **Fix needed**: Either allow `if`/`else` and accept the Ch 4 forward reference, or remove the "Is square" line entirely and make it a pure perimeter/area exercise using only `int` and `std::cout`.

---

### [CRITICAL] Lesson 1.x — "Chapter 1 summary and quiz"
- **Type**: test-mismatch
- **Location**: exercise 3 ("Simple Banking Transaction") — solution_code vs test_cases
- **Details**: The solution prints prompt text (`"Current balance: $1000.00\n"`, `"Enter amount: "`, `"Enter type (D/W): "`) to stdout, but `expected_stdout` only includes the balance line and the transaction result — omitting `"Enter amount: "` and `"Enter type (D/W): "`. The solution output will not match `expected_stdout`.
- **Fix needed**: Either (a) remove all `std::cout` prompt lines from the solution, or (b) include them in `expected_stdout`.

---

### [HIGH] Lesson 1.x — "Chapter 1 summary and quiz"
- **Type**: forward-reference
- **Location**: exercise 3 ("Simple Banking Transaction") — starter_code, solution_code
- **Details**: Uses `double` (Ch 4), `char` (Ch 4), `if`/`else if` (Ch 4), nested `if` (`if (amount <= balance)` inside an `else if`), `<=` comparison operator (Ch 6), `std::setprecision`/`std::fixed` from `<iomanip>` (not in Ch 1), and `std::endl` (though the lesson advises `'\n'`).
- **Fix needed**: Replace with an integer-only exercise that tests Ch 1 concepts. A banking exercise could work with cents (int) and without branching.

---

### [HIGH] Lesson 1.x — "Chapter 1 summary and quiz"
- **Type**: forward-reference
- **Location**: exercise 4 ("Temperature Converter", second) — starter_code, solution_code
- **Details**: Uses `double` (Ch 4), `char` (Ch 4), `if`/`else` (Ch 4), `std::setprecision`/`std::fixed` from `<iomanip>` (not in Ch 1). This is a near-duplicate of exercise 1 in the same lesson, with the same forward-reference issues.
- **Fix needed**: Remove this duplicate or replace with a unique integer-only exercise that synthesizes Ch 1 concepts (variables, initialization, cin/cout, integer arithmetic, expressions).

---

### [LOW] Lesson 1.6 — "Uninitialized variables and undefined behavior"
- **Type**: forward-reference
- **Location**: exercises 1, 3 — starter_code, solution_code
- **Details**: Both exercises use `using namespace std;` which lesson 1.5's summary explicitly warns against: "Avoid `using namespace std;` in files you'll maintain." While not a concept violation per se, it contradicts earlier teaching within the same chapter.
- **Fix needed**: Replace `using namespace std;` with explicit `std::` prefixes in both exercises.

---

### [LOW] Lesson 1.x — "Chapter 1 summary and quiz"
- **Type**: ordering
- **Location**: exercises 1 and 4
- **Details**: Both exercises are titled "Temperature Converter" and solve essentially the same problem (Celsius/Fahrenheit conversion with `double`, `char`, `if`/`else`). Having two near-duplicate exercises in the same lesson wastes the quiz slot.
- **Fix needed**: Remove one of the duplicates and replace with a distinct exercise that tests different Ch 1 concepts.

---

## Lessons Verified Clean

- **Lesson 1.1** — "Statements and the structure of a program": Summary and both exercises use only `int main()`, `return`, variables, `+` operator, and no library includes. Clean.
- **Lesson 1.2** — "Comments": Summary and both exercises use only `int main()`, `return`, and `//`/`/* */` comments. Clean.
- **Lesson 1.3** — "Introduction to objects and variables": Summary and both exercises use only `int` variables, `*`, `+`, `return`. Clean.
- **Lesson 1.4** — "Variable assignment and initialization": Summary and both exercises use only `int` variables, copy/direct/brace initialization, `+`, `-`, `=`, `return`. Clean.
- **Lesson 1.8 exercise 1** — "Format the Mess": Uses only `int`, `std::cin`, `std::cout`, `*`, `'\n'`. Clean.
- **Lesson 1.10 exercise 1** — "Expression Type Detective": Uses only `int`, `std::cin`, `std::cout`, `+`, `-`, `*`, `/`. Clean.
- **Lesson 1.11** — "Developing your first program": Summary is clean (integer-only code example aside from mentioning `std::format`). Exercise 1 uses integer-only arithmetic and `std::format` (borderline but `std::format` was shown in Ch 0). Exercise 2 uses `%` (taught in 1.9, before 1.11) and `std::format`. Mostly clean within chapter.

## Summary Statistics

| Severity | Count |
|----------|-------|
| CRITICAL | 3 |
| HIGH | 12 |
| MEDIUM | 4 |
| LOW | 2 |
| **Total** | **21** |

| Category | Count |
|----------|-------|
| Forward-reference (to Ch 2+) | 13 |
| Forward-reference (within Ch 1) | 3 |
| Test-case mismatch | 3 |
| Ordering/duplication | 2 |

### Affected lessons breakdown

| Lesson | Issues | Clean exercises |
|--------|--------|-----------------|
| 1.1 | 0 | 2/2 |
| 1.2 | 0 | 2/2 |
| 1.3 | 0 | 2/2 |
| 1.4 | 0 | 2/2 |
| 1.5 | 2 | 0/2 |
| 1.6 | 5 | 1/4 (only ex4 "Swap Without a Temporary" is clean aside from using `std::format`) |
| 1.7 | 2 | 1/2 |
| 1.8 | 1 | 1/2 |
| 1.9 | 2 | 1/2 (ex2 "Ticket Price Calculator" is clean within chapter) |
| 1.10 | 2 | 1/2 |
| 1.11 | 0 | 2/2 (borderline `std::format` usage) |
| 1.x | 7 | 0/4 |

## Recurring Patterns

1. **`double` and `static_cast<double>` used freely**: At least 7 exercises use `double` despite it being a Ch 4 topic. This is the single most common violation. All floating-point exercises should be rewritten with integer-only arithmetic or deferred.

2. **`if`/`else` used in Ch 1 exercises**: 5 exercises use conditional branching (`if`/`else if`/`else`), which is introduced in Ch 4, lesson 4.10. Every exercise requiring branching should be redesigned to work with pure expressions and integer arithmetic.

3. **`char` type used for unit selection**: 4 exercises read a `char` for unit/operation selection (e.g., `'C'`/`'F'`, `'D'`/`'W'`). `char` is introduced in Ch 4. These exercises inherently require both `char` and `if`/`else`.

4. **`std::string` used before Ch 5**: 3 exercises use `std::string` (`#include <string>`), which is a Ch 5 topic. Students in Ch 1 have no knowledge of string types.

5. **`%` operator used before lesson 1.9**: The remainder operator is used in exercises for lessons 1.5 and 1.7, but is not taught until lesson 1.9's summary. Within Ch 1, exercise ordering should respect the lesson teaching order.

6. **Solution output includes prompts not in `expected_stdout`**: Two exercises in lesson 1.x have solutions that print interactive prompts (`"Enter temperature: "`, `"Enter amount: "`, etc.) but the test cases expect output without those prompts. This will cause every test case to fail.

7. **`<iomanip>` and `<format>` headers used without introduction**: Multiple exercises use `std::setw`, `std::setprecision`, `std::fixed`, and `std::format`, none of which are part of the Ch 1 curriculum. While `std::format` was shown in Ch 0 examples, `<iomanip>` has no introduction at all.

8. **Lesson 1.x exercises are far too advanced**: All four quiz exercises require concepts from Ch 4-5 at minimum. A chapter summary quiz should test only the concepts taught in that chapter. These should be replaced with exercises combining `int` variables, `std::cin`/`std::cout`, arithmetic operators, and expressions.

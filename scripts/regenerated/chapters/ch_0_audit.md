# Chapter 0 Audit: Introduction / Getting Started

## Summary
13 lessons audited, 0 exercises found (all lessons have empty exercise arrays). 7 lessons contain forward-reference issues in their summary code snippets, ranging from minor (using `auto` as a preview) to moderate (structured bindings, `if constexpr`, `std::string_view`, `static_cast`). No critical issues exist since there are no exercises that require students to write code. The chapter is generally well-structured for an introduction, but several illustrative code examples go beyond "taste" previews by using concepts that are formally taught much later.

## Issues Found

### [LOW] Lesson 0.1 — "Introduction to these tutorials"
- **Type**: forward-reference
- **Location**: summary — code snippet
- **Details**: The illustrative code uses `auto name = "C++"` and `auto year = 2024`. The `auto` keyword for type deduction is not introduced until Chapter 10 (lesson 10.8). While this is a preview snippet, using `auto` here sets an expectation that students understand type deduction before it is taught. The curriculum reference lists `auto` under "Syntax shown (but not formally taught)" only for `#include <iostream>`, `int main()`, `std::cout << "text"`, `return 0;`, and `std::format`. `auto` is not on that list.
- **Fix needed**: Replace `auto name = "C++"` with a C-string literal assigned without `auto`, or simply use `std::cout` directly. For example: `std::cout << std::format("Welcome to {}! ({})\n", "C++", 2024);` which avoids introducing variables entirely.

### [LOW] Lesson 0.3 — "Introduction to C/C++"
- **Type**: forward-reference
- **Location**: summary — code snippet
- **Details**: The code includes `#include <string>` and uses `std::string language = "C++";`. `std::string` is not introduced until Chapter 5. As a preview snippet this is borderline acceptable, but it goes beyond the "syntax shown but not formally taught" list in the curriculum reference (which does not include `std::string`).
- **Fix needed**: Replace `std::string language = "C++"` with a string literal used directly in the `std::format` call, or use `const char* language = "C++"` — though that also introduces pointers (Ch 12). Simplest fix: inline the string literal into the format call.

### [LOW] Lesson 0.4 — "Introduction to C++ development"
- **Type**: forward-reference
- **Location**: summary — code snippet
- **Details**: The code uses `int x = 42;` (variables not taught until Ch 1) and `auto msg = std::format(...)` (`auto` not taught until Ch 10). Variables and `auto` are both beyond Chapter 0's scope per the curriculum reference. The `int x = 42` is marginal since Ch 0 can show basic syntax, but `auto msg = ...` is a stronger forward reference.
- **Fix needed**: Simplify to `std::cout << std::format("The answer is {}", 42) << '\n';` which avoids both variable declarations and `auto`.

### [HIGH] Lesson 0.5 — "Introduction to the compiler, linker, and libraries"
- **Type**: forward-reference
- **Location**: summary — code snippet (linker example)
- **Details**: The forward declaration example uses `void greet(std::string_view name);`. `std::string_view` is not introduced until Chapter 5. Forward declarations themselves are not introduced until Chapter 2 (lesson 2.7). The example simultaneously uses two concepts from later chapters in a way that looks like it's teaching them rather than previewing. The code also calls `greet("world")` without a definition, which would cause a linker error — this is intentional (demonstrating linker errors), but the use of `std::string_view` as a parameter type is an unnecessary forward reference.
- **Fix needed**: Change the parameter type to something simpler, or remove the parameter entirely: `void greet();` with `greet();` in main. This preserves the linker-error teaching point without introducing `std::string_view`.

### [HIGH] Lesson 0.8 — "A few common C++ problems"
- **Type**: forward-reference
- **Location**: summary — code snippet and prose
- **Details**: Multiple forward references in a single lesson:
  1. `#include <print>` and `std::println` — C++23 features, not in the curriculum's "syntax shown" list for Ch 0.
  2. `double exact = static_cast<double>(a) / b;` — `double` (Ch 4), `static_cast` (Ch 4/10).
  3. `int a = 7, b = 2;` — multiple variable declaration on one line; variables not taught until Ch 1.
  4. The prose section on `=` vs `==` references `if (x = 5)` which requires knowledge of `if` statements (Ch 4, lesson 4.10).
  5. `unsigned int count = 10;` in the warning flags example in lesson 0.11 — `unsigned` is Ch 4.
  
  While these appear in an "illustrative problems" context, the code snippet is presented as runnable code with `int main()` and specific output, making it feel like a teaching example rather than a pure preview.
- **Fix needed**: Replace `std::println` with `std::cout <<`. Remove the `double`/`static_cast` example entirely or replace it with a prose-only description ("dividing two integers discards the remainder — you'll learn how to handle this in Chapter 4"). Use `std::cout` for output.

### [HIGH] Lesson 0.9 — "Configuring your compiler: Build configurations"
- **Type**: forward-reference
- **Location**: summary — code snippet
- **Details**: The code example uses several advanced features:
  1. `auto [x, y] = std::pair{10, 2};` — structured bindings (C++17), never explicitly named in the curriculum reference as a taught topic. `std::pair` is introduced in the context of Chapter 13 (structs). This is a very advanced forward reference for the very first chapter.
  2. `std::println("{}", divide(x, y));` — `std::println` (C++23), not in Ch 0's allowed syntax.
  3. `#include <print>` — C++23 header.
  4. `assert(b != 0)` — `assert()` is introduced in Chapter 9.
  5. User-defined function `int divide(int a, int b)` — user-defined functions are not introduced until Chapter 2.
  
  This is the most problematic snippet in the chapter. A complete beginner would encounter structured bindings, std::pair, assertions, user-defined functions, and C++23 printing all in a lesson about build configurations.
- **Fix needed**: Replace the entire example with a simpler one that only uses `#include <iostream>`, `int main()`, `std::cout`, and `return 0` — concepts within Ch 0's allowed preview syntax. For example, show `#ifdef NDEBUG` / `#ifndef NDEBUG` with `std::cout` to illustrate how debug/release differs, without user-defined functions or structured bindings.

### [LOW] Lesson 0.11 — "Configuring your compiler: Warning and error levels"
- **Type**: forward-reference
- **Location**: summary — code snippet
- **Details**: The code uses:
  1. `#include <print>` and `std::println("less")` — C++23 features.
  2. `unsigned int count = 10;` — `unsigned` is introduced in Chapter 4.
  3. `int result;` (uninitialized) and `if (result < count)` — `if` statements are Ch 4, and the signed/unsigned comparison requires understanding of type system concepts from Ch 4.
  4. `int add(int a, int b);` — forward declaration of a user-defined function (Ch 2).
  
  The intent is to show what warnings look like, which is valid for this lesson. However, the specific code constructs used require knowledge from much later chapters.
- **Fix needed**: Replace `std::println` with `std::cout <<`. Remove the `unsigned int` example or simplify the warning-triggering code to use only `int` types and `std::cout`. The unused function declaration can remain as it's just illustrating a warning scenario.

### [LOW] Lesson 0.12 — "Configuring your compiler: Choosing a language standard"
- **Type**: forward-reference
- **Location**: summary — code snippet
- **Details**: The code uses `std::string_view name = "cpproad"` (`std::string_view` is Ch 5, `#include <string_view>` is Ch 5) and `std::println` (C++23). While the lesson is specifically about language standards and showing C++20/23 features is contextually relevant, `std::string_view` as a variable type goes beyond a preview.
- **Fix needed**: Replace `std::string_view name = "cpproad"` with a direct string literal in the format call: `std::println("Learning C++{} with cpproad", 20);`. This still demonstrates the C++20/23 feature point without introducing `std::string_view`.

### [LOW] Lesson 0.13 — "What language standard is my compiler using?"
- **Type**: forward-reference
- **Location**: summary — code snippet
- **Details**: The code uses `if constexpr` (C++17 feature, formally taught in Ch 8 under control flow). The lesson itself acknowledges this ("This is a C++17 feature, meaning the snippet itself requires at least C++17 to compile"), which is good, but it's still using a concept from 8 chapters ahead. The `else if constexpr` chain also requires understanding of `if`/`else` (Ch 4).
- **Fix needed**: This is the most defensible forward reference in the chapter since the lesson is specifically about detecting the language standard, and `if constexpr` is the idiomatic way to do it. Consider adding a simpler alternative first (just printing `__cplusplus` with `std::cout << __cplusplus`) and then showing the `if constexpr` version as "a more readable approach you'll understand after Chapter 8."

## Lessons Verified Clean

- **0.2** — "Introduction to programs and programming languages": Only uses `#include <iostream>`, `int main()`, `std::cout`, `return 0` — all within the allowed preview syntax.
- **0.6** — "Installing an Integrated Development Environment (IDE)": Only uses `#include <iostream>`, `int main()`, `std::cout`, `return 0` — all within the allowed preview syntax.
- **0.7** — "Compiling your first program": Only uses `#include <iostream>`, `int main()`, `std::cout`, `return 0` — all within the allowed preview syntax. Prose discussion of return values is appropriate.
- **0.10** — "Configuring your compiler: Compiler extensions": Uses `int n = 5; int arr[n];` which involves a variable declaration (Ch 1), but the point is to show what a compiler extension looks like and the code is explicitly labeled as non-standard C++ that would be rejected. This is acceptable in context.

## Summary Statistics
- **Total lessons**: 13 (0.1 through 0.13)
- **Total exercises**: 0 (all lessons have empty exercise arrays)
- **Lessons with issues**: 9
- **Lessons fully clean**: 4 (0.2, 0.6, 0.7, 0.10)
- **Critical**: 0
- **High**: 3 (lessons 0.5, 0.8, 0.9)
- **Low**: 6 (lessons 0.1, 0.3, 0.4, 0.11, 0.12, 0.13)

## Recurring Patterns

1. **`std::println` / `#include <print>` usage (C++23)**: Appears in lessons 0.8, 0.9, 0.11, and 0.12. The curriculum reference lists `std::cout << "text"` as the allowed output syntax for Ch 0 previews. `std::println` is a C++23 feature not mentioned anywhere in the curriculum reference. Every instance should be replaced with `std::cout <<`.

2. **`auto` keyword in code snippets**: Appears in lessons 0.1 and 0.4. `auto` for type deduction is formally introduced in Chapter 10. It is not listed in Ch 0's "syntax shown but not formally taught" list.

3. **`std::string_view` in code snippets**: Appears in lessons 0.5 and 0.12. `std::string_view` is introduced in Chapter 5. Not on Ch 0's allowed preview list.

4. **User-defined functions in examples**: Lessons 0.5 (`greet`), 0.9 (`divide`), and 0.11 (`add`) all declare or define user-defined functions, which are not introduced until Chapter 2.

5. **Variables used before Ch 1 teaches them**: Nearly every code snippet declares variables (`int x = 42`, `int a = 7`, `std::string language = ...`), but Ch 0 does not formally teach variables. This is borderline since seeing `int x = 42` in a preview is reasonable, but the curriculum reference's "syntax shown" list is narrower than what the lessons actually show.

6. **No exercises in any lesson**: The entire chapter has zero exercises, which means there are no code-correctness or test-mismatch issues to find. This is appropriate for an introductory/setup chapter.

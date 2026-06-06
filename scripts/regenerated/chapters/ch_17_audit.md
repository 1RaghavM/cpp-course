# Chapter 17 Audit: Fixed-size arrays: std::array and C-style arrays

## Summary

Reviewed all 14 lessons (17.1 through 17.x) covering summaries (14 total) and exercises (28 total). Chapter 17 is in **good shape** overall: no uses of `std::sort`, `std::find`, or other `<algorithm>` functions; no lambdas; no `new`/`delete`; no inheritance or virtual functions. A small number of issues were found, mostly low severity. One incorrect within-chapter cross-reference and a few pedagogical/code-style issues are the most notable findings.

## Issues Found

### [MEDIUM] Lesson 17.6 — "std::array and enumerations"
- **Type**: forward-reference
- **Location**: summary — "For scoped enums" paragraph
- **Details**: The summary mentions `std::underlying_type_t<MyEnum>` as a helper for converting scoped enums to indices. `std::underlying_type_t` requires `<type_traits>`, which is never formally introduced in the curriculum through Chapter 17. While it is only mentioned as an example (not required in exercises), students encountering this unexplained type trait may be confused.
- **Fix needed**: Replace the `std::underlying_type_t` example with a simpler `static_cast<std::size_t>` approach, which is already shown in the same paragraph, or note that `std::underlying_type_t` is an advanced utility shown here only for completeness.

### [MEDIUM] Lesson 17.9 — "Pointer arithmetic and subscripting"
- **Type**: ordering (incorrect cross-reference)
- **Location**: summary — opening paragraph
- **Details**: The summary states "When a C-style array decays to a pointer (lesson 17.7)..." but lesson 17.7 is "Introduction to C-style arrays." Array **decay** is the topic of lesson 17.8 ("C-style array decay"). The cross-reference points to the wrong lesson.
- **Fix needed**: Change "(lesson 17.7)" to "(lesson 17.8)".

### [LOW] Lesson 17.4 — "std::array of class types, and brace elision"
- **Type**: code-bug (misleading, not compilation failure)
- **Location**: exercise 1 ("Student Roster Lookup") — solution code
- **Details**: The prompt says "Use brace elision (single outer braces) when initializing the array." However, the solution code uses explicit type naming (`Student{"Alice", 92}`) rather than true brace elision. True brace elision would look like: `std::array<Student, 4> roster { {"Alice", 92}, {"Bob", 85}, {"Carol", 97}, {"Dave", 78} };` (no `Student` prefix on each element). The solution's approach works correctly but does not demonstrate the brace elision concept the lesson teaches.
- **Fix needed**: Either change the solution to use actual brace elision (remove the `Student` prefix from each initializer element), or change the prompt requirement to say "Use explicit type naming for clarity" instead of "Use brace elision."

### [LOW] Lesson 17.4 — "std::array of class types, and brace elision"
- **Type**: code-bug (misleading)
- **Location**: exercise 2 ("Rectangle Area Report") — solution code
- **Details**: Same issue as exercise 1. The prompt says "Use brace elision (single outer braces)" but the solution uses `Rect{"A", 3, 4}` with explicit type naming instead of true brace elision `{"A", 3, 4}`.
- **Fix needed**: Same as above — either use actual brace elision in the solution or update the prompt.

### [LOW] Lesson 17.3 — "Passing and returning std::array"
- **Type**: forward-reference (within-chapter)
- **Location**: summary — "Why std::array beats C-style arrays here" section
- **Details**: The summary discusses C-style array decay ("C-style arrays silently decay to pointers when passed to a function, losing their length information entirely") as a contrast. C-style arrays are introduced in 17.7 and decay is covered in 17.8 — both are later in the chapter. While this is used as motivational contrast (not teaching the concept), students who have not yet encountered C-style arrays may find this confusing.
- **Fix needed**: Consider adding a brief parenthetical like "(C-style arrays are covered later in this chapter)" or reword to focus on the `std::array` advantages without detailing how C-style arrays fail.

### [LOW] Lesson 17.7 — "Introduction to C-style arrays"
- **Type**: forward-reference (minor)
- **Location**: summary — "`sizeof` on C-style Arrays" section
- **Details**: The summary mentions `std::size(arr)` from `<iterator>` as a preferred alternative for getting element count. While `std::size` is available in C++17 and the curriculum targets C++17+, the `<iterator>` header and `std::size` are not formally introduced in any lesson through Chapter 17. The curriculum reference for Chapter 18 introduces iterators and `<algorithm>` but does not explicitly list `std::size`. This is mentioned as a tip, not required in exercises.
- **Fix needed**: Either remove the `std::size` recommendation or add a note that it is a standard utility they may encounter but that the `sizeof` approach is sufficient for now.

### [LOW] Lesson 17.6 — "std::array and enumerations"
- **Type**: code-bug (compiler warnings)
- **Location**: exercise 2 ("Student Grade Report Using Enum-Indexed Arrays") — solution code
- **Details**: The solution uses `int i` as a loop variable and `Subject subj` (unscoped enum) to index into `std::array`. The `std::array::operator[]` parameter type is `std::size_t` (unsigned). Using `int` or an unscoped enum value as an index involves a signed-to-unsigned implicit conversion. With `-Wsign-conversion` (which strict teaching environments often enable), this generates warnings. The solution should use `std::size_t` for the loop and cast the enum when indexing, or use `static_cast<std::size_t>(subj)`.
- **Fix needed**: Change the loop to use `std::size_t` and add `static_cast<std::size_t>()` when indexing with the enum, consistent with how the lesson summary recommends converting scoped enums.

### [LOW] Lesson 17.9 — "Pointer arithmetic and subscripting"
- **Type**: forward-reference (minor)
- **Location**: summary — "Iterating with Pointer Arithmetic" section, final paragraph
- **Details**: The summary states "This begin/end pattern is exactly what range-based `for` loops and the standard library algorithms use under the hood." It mentions "standard library algorithms" and "iterators" which are Ch 18 concepts. However, this is purely motivational/explanatory context and does not teach or require students to use these concepts.
- **Fix needed**: No change strictly necessary. Optionally, replace "the standard library algorithms" with "many standard library features" to be less specific about Ch 18 content.

## Lessons Verified Clean

The following lessons had no issues in either their summary or exercises:

- **17.1** — "Introduction to std::array": Summary correctly introduces `std::array`. Both exercises (Sum and Average, Count Elements Above Threshold) use only `std::array`, range-based for, and `<iomanip>` — all available. Test cases match solution output.
- **17.2** — "std::array length and indexing": Summary correctly covers `.size()`, `operator[]`, `.at()`. Exercise 1 (Array Stats Reporter) test cases verified correct. Exercise 2 (Safe Element Lookup) uses try/catch with `std::out_of_range` — exceptions are part of core C++ available since Ch 9's error handling, and `<stdexcept>` is standard; test cases verified correct.
- **17.3** — "Passing and returning std::array": Both exercises (Sum and Average via Const Reference, Build and Return a Multiplication Table Row) use function templates with `T` and `N` correctly. Test cases verified correct. (Minor forward-reference noted separately above.)
- **17.5** — "Arrays of references via std::reference_wrapper": Summary correctly introduces `std::reference_wrapper`, `std::ref`, `std::cref` from `<functional>`. Exercise 1 (Double Selected Values) test cases verified correct. Exercise 2 (Sort Three Variables) implements a manual bubble sort — no `std::sort` or `<algorithm>` usage. Test cases verified correct.
- **17.7** — "Introduction to C-style arrays": Summary and both exercises (Array Statistics Reporter, Reverse and Count) are clean. No forward references to decay or pointer arithmetic. Test cases for sizeof values (32 bytes for `int[8]`, 8 elements) are correct for the Judge0 platform (4-byte int). (Minor `std::size` mention noted separately.)
- **17.8** — "C-style array decay": Summary correctly covers decay. Exercise 1 (Sum a Decayed Array) test cases verified correct. Exercise 2 (Find the Maximum via Decayed Array) test cases depend on platform-specific sizeof values (40 for `int[10]`, 8 for pointer) — correct for Judge0's x86_64 environment with 4-byte int and 8-byte pointer.
- **17.10** — "C-style strings": Summary correctly introduces null-terminated char arrays and `<cstring>` functions. Exercise 1 (Reverse a C-style String) test cases verified correct. Exercise 2 (Compare and Concatenate C-style Strings) test cases verified correct.
- **17.11** — "C-style string symbolic constants": Summary correctly covers `const char*`, string literals, and arrays of string literal pointers. Exercise 1 (Day Name Lookup) test cases verified correct. Exercise 2 (Longest String Literal in Array) test cases verified correct (orange and yellow both have length 6; tie-breaking picks the first, which is orange).
- **17.12** — "Multidimensional C-style arrays": Summary and both exercises (Row Sum Calculator, Matrix Column Maximum) are clean. No forward references. Test cases verified correct.
- **17.13** — "Multidimensional std::array": Summary correctly uses alias templates (taught in 13.15). Exercise 1 (Print a 2D Grid with Row and Column Sums) test cases verified correct. Exercise 2 (Transpose a Matrix Using an Alias Template) test cases verified correct.
- **17.x** — "Chapter 17 summary and quiz": Summary is a review of chapter content. Exercise 1 (Reverse and Rotate) uses manual reverse and rotate — no `<algorithm>`. Test cases verified correct. Exercise 2 (Copy Between C-style Array and std::array) combines pointer arithmetic with `std::array` — uses only concepts from within Ch 17. Test cases verified correct.

## Summary Statistics

| Severity | Count |
|----------|-------|
| CRITICAL | 0 |
| HIGH     | 0 |
| MEDIUM   | 2 |
| LOW      | 6 |
| **Total**| **8** |

- **Lessons with issues**: 4 of 14 (17.3, 17.4, 17.6, 17.7, 17.9)
- **Lessons verified clean**: 10 of 14
- **Exercises with issues**: 3 of 28 (17.4 ex1, 17.4 ex2, 17.6 ex2)
- **Exercises verified clean**: 25 of 28
- **Forward-reference violations (Ch 18+)**: 0 major, 2 minor (motivational mentions)
- **Code bugs that prevent compilation**: 0
- **Test case mismatches**: 0
- **Wrong output from solution code**: 0

## Recurring Patterns

1. **Brace elision vs explicit type naming**: Both exercises in 17.4 ask for brace elision but the solutions use explicit type construction (`Student{...}`, `Rect{...}`). The solutions compile and produce correct output, but they don't demonstrate the concept the prompt asks for. This is a consistent pedagogical mismatch in that lesson.

2. **Signed/unsigned index conversions**: Several solutions use `int` loop variables or unscoped enum values to index into `std::array` (which expects `std::size_t`). The lesson summaries correctly warn about this pitfall but some exercise solutions don't follow their own advice. The 17.6 exercise 2 solution is the clearest example. This is not a compilation error on default compiler settings but would warn with `-Wsign-conversion`.

3. **Forward-looking motivational references**: Lessons 17.3, 17.7, and 17.9 mention later concepts (C-style decay, `std::size`, standard algorithms/iterators) as motivation or contrast. These are not teaching forward concepts but may confuse students who haven't reached those topics yet. All are minor and don't affect exercise correctness.

4. **Platform-dependent test cases**: Lesson 17.8 exercise 2 has test cases that depend on `sizeof(int) == 4` and `sizeof(int*) == 8`. These are correct for the Judge0 (x86_64 Linux) environment but would fail on other platforms. This is acknowledged in the exercise notes and is acceptable given the fixed deployment target.

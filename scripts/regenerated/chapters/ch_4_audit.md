# Chapter 4 Audit: Fundamental Data Types

## Summary
Chapter 4 contains 12 lessons (4.1 through 4.x) with 18 exercises total. The audit found 17 issues ranging from critical forward references (loops and if/else used before they are taught, std::string before Ch 5) to factual inaccuracies, scope creep, and code bugs in test cases and solutions.

## Issues Found

### [CRITICAL] Lesson 4.1 — "Introduction to fundamental data types"
- **Type**: scope-creep / forward-reference
- **Location**: summary
- **Details**: The summary introduces `auto` with a full code example (`auto x = 3.14; auto n = 100;`) and a subsection titled "Type Deduction with `auto`". According to the curriculum, `auto` is a Chapter 10 topic. While a brief mention might be acceptable, a dedicated subsection with code examples teaches the concept prematurely.
- **Fix needed**: Remove the "Type Deduction with `auto`" subsection entirely, or reduce it to a single sentence noting that C++ has type deduction features covered in a later chapter.

### [CRITICAL] Lesson 4.2 — "Void"
- **Type**: forward-reference
- **Location**: exercise 1 ("Function Return Type Validation")
- **Details**: The exercise starter code and prompt require a **loop** (`cin >> n`, then "Calls getUserInput() N times"). Loops (while/for) are not taught until Chapter 8. The starter code includes `#include <string>` and `using namespace std;` with `const string& msg` parameter, but `std::string` is not introduced until Chapter 5.
- **Fix needed**: Redesign the exercise to use a fixed number of calls (e.g., exactly 2 or 3 calls hardcoded in main) instead of an N-iteration loop. Replace `std::string` parameter with `int` parameter and print the integer directly.

### [CRITICAL] Lesson 4.2 — "Void"
- **Type**: forward-reference
- **Location**: exercise 2 ("Void Function with Side Effects")
- **Details**: The exercise requires a **loop** ("Reads K integers") and uses **if/else** to determine sign (POSITIVE/NEGATIVE/ZERO). Loops are Ch 8 and if/else is not introduced until lesson 4.10. Both the prompt and starter code explicitly reference looping K times.
- **Fix needed**: Redesign to process a fixed number of values (e.g., exactly one integer). Remove the loop requirement and either remove the sign classification (which requires if/else) or move this exercise to after lesson 4.10.

### [CRITICAL] Lesson 4.2 — "Void"
- **Type**: forward-reference
- **Location**: summary
- **Details**: The summary uses `const std::string&` in a code example. `std::string` is Chapter 5 material. It also mentions `std::optional<T>`, `std::any`, and `std::variant`, which are advanced topics well beyond Chapter 4 scope.
- **Fix needed**: Replace the `std::string` code example with a simpler type (e.g., `int`). Remove or minimize mentions of `std::optional`, `std::any`, and `std::variant` — a brief "covered later" note is sufficient.

### [CRITICAL] Lesson 4.3 — "Object sizes and the sizeof operator"
- **Type**: forward-reference
- **Location**: exercise 1 ("Type Size Reporter")
- **Details**: The exercise uses `std::string` (includes `<string>`, reads into `std::string typeName`) and uses **if/else if/else** chains. `std::string` is Ch 5 and if/else is lesson 4.10 (9 lessons later). The solution code contains a full if/else if chain.
- **Fix needed**: Redesign to avoid string comparison and if/else. One option: read an integer code (1-7) mapped to types, and use a simpler dispatch mechanism. Alternatively, move this exercise to after lesson 4.10 and use `char` input instead of `std::string`.

### [CRITICAL] Lesson 4.3 — "Object sizes and the sizeof operator"
- **Type**: forward-reference
- **Location**: exercise 2 ("Bytes Needed Calculator")
- **Details**: Same as exercise 1 — uses `std::string` and an if/else if/else chain. The solution code also uses `if (!known)` branching.
- **Fix needed**: Same as exercise 1 — redesign to avoid `std::string` and if/else, or move to later in the chapter.

### [MODERATE] Lesson 4.3 — "Object sizes and the sizeof operator"
- **Type**: forward-reference
- **Location**: summary
- **Details**: The summary code example uses `auto` (`auto sizes = {...}; for (auto [name, bytes] : sizes)`), structured bindings, `std::pair`, and range-based for loops. `auto` is Ch 10, loops are Ch 8, structured bindings are advanced. This contradicts the lesson's own scope.
- **Fix needed**: Replace the code example with simpler `std::println` calls showing `sizeof` on individual types without loops, auto, or structured bindings.

### [CRITICAL] Lesson 4.4 — "Signed integers"
- **Type**: forward-reference
- **Location**: exercise 1 ("Integer Range Inspector")
- **Details**: The solution uses **if/else** statements to check range membership. If/else is not introduced until lesson 4.10, which is 6 lessons later. The exercise prompt says "Check if it fits" which inherently requires conditional logic.
- **Fix needed**: Either move this exercise to after lesson 4.10, or redesign it to use boolean expressions with `std::boolalpha` output (e.g., `bool fits16 = (value >= -32768 && value <= 32767); std::cout << std::boolalpha << fits16;`). This avoids if/else and only requires relational operators.

### [CRITICAL] Lesson 4.4 — "Signed integers"
- **Type**: forward-reference
- **Location**: exercise 2 ("Digit-Separated Big Number Arithmetic")
- **Details**: The solution uses **if** statements to find min/max. The prompt explicitly says "implement the comparisons yourself with `if` statements." If/else is not taught until lesson 4.10.
- **Fix needed**: Either move this exercise to after lesson 4.10, or redesign to avoid needing min/max (e.g., focus purely on arithmetic with long long — sum, product, difference — without comparisons requiring if/else).

### [CRITICAL] Lesson 4.6 — "Fixed-width integers and size_t"
- **Type**: forward-reference
- **Location**: exercise 1 ("Byte Budget Tracker")
- **Details**: The solution uses a **for loop** (`for (int i{1}; i <= n; ++i)`) and an **if/else if** chain. The starter code already provides the for-loop structure. Loops are Ch 8 and if/else is lesson 4.10.
- **Fix needed**: Redesign to process a fixed number of fields (e.g., exactly one field) to avoid the loop. Use a simpler dispatch mechanism or move to after lesson 4.10.

### [CRITICAL] Lesson 4.6 — "Fixed-width integers and size_t"
- **Type**: forward-reference
- **Location**: exercise 2 ("Unsigned Overflow Detector")
- **Details**: The solution uses a **ternary operator** (`? "overflow" : "ok"`) which is conceptually equivalent to if/else. The ternary operator has not been introduced at this point in the curriculum. While the starter code does not contain it, the solution relies on it.
- **Fix needed**: If keeping the exercise before 4.10, restructure to print boolean results using `std::boolalpha` instead of string labels requiring conditional selection. If after 4.10, the ternary is still borderline but if/else would be available.

### [MODERATE] Lesson 4.6 — "Fixed-width integers and size_t"
- **Type**: forward-reference
- **Location**: summary
- **Details**: The summary code example uses `std::vector`, a range-based for loop with `size_t` index, and container `.size()`. Vectors are not introduced until much later in the curriculum, and loops are Ch 8.
- **Fix needed**: Replace the code example with direct `sizeof` calls on fixed-width types without containers or loops.

### [MODERATE] Lesson 4.8 — "Floating point numbers"
- **Type**: forward-reference
- **Location**: exercise 2 ("Nearly Equal")
- **Details**: The solution and starter code use **for loops** (`for (int i{ 0 }; i < n; ++i)`). Loops are Ch 8 material. The exercise fundamentally requires repeated addition, which needs a loop.
- **Fix needed**: Redesign the exercise to demonstrate floating-point imprecision without loops. For example, use a single expression like `0.1 + 0.2` vs `0.3`, or `1.0/3.0 * 3.0` vs `1.0`. This still teaches the epsilon comparison concept without requiring iteration.

### [MODERATE] Lesson 4.8 — "Floating point numbers"
- **Type**: forward-reference
- **Location**: summary
- **Details**: The summary uses `constexpr double epsilon = 1e-9;`. The `constexpr` keyword is Ch 5 material ("Constants and constexpr"). While `const` might be acceptable from general knowledge, `constexpr` is specifically a later topic.
- **Fix needed**: Change `constexpr` to `const` in the code example, or simply use a plain `double epsilon = 1e-9;`.

### [MODERATE] Lesson 4.11 — "Chars"
- **Type**: forward-reference
- **Location**: exercise 2 ("Shift Characters by an Integer Offset")
- **Details**: The starter code and solution use a **for loop** (`for (int i { 0 }; i < n; ++i)`). Loops are Ch 8. The exercise processes N characters sequentially, which inherently requires iteration.
- **Fix needed**: Redesign to process exactly one character (remove the loop and the N input), which still teaches static_cast between char and int. Or process a fixed small number (e.g., 3) with repeated code blocks.

### [LOW] Lesson 4.10 — "Introduction to if statements"
- **Type**: forward-reference
- **Location**: exercise 2 ("Letter Grade from a Numeric Score")
- **Details**: The exercise uses `std::string` to read the student's name (`#include <string>`, `std::string name{};`). `std::string` is Ch 5 material. While this is a minor usage (just reading a single word), it introduces a type not yet covered.
- **Fix needed**: Remove the name input — just read the score and output the letter grade. Or replace with a `char` initial (single character).

### [LOW] Lesson 4.x — "Chapter 4 summary and quiz"
- **Type**: code-bug
- **Location**: exercise 1 ("ASCII Inspector")
- **Details**: The test case for space character (`' '`, ASCII 32) uses `std::cin >> ch` to read input. However, `operator>>` with `char` **skips whitespace by default**, so a space character cannot be read this way. The hidden test with stdin `" "` (space) would actually block waiting for a non-whitespace character, or read nothing useful. The test would fail or hang.
- **Fix needed**: Either remove the space test case (replace with another printable non-alphanumeric character like `@` or `#`), or change the read method to `std::cin.get(ch)` which does not skip whitespace (but this introduces a concept not yet taught).

## Lessons Verified Clean

- **4.5 — "Unsigned integers, and why to avoid them"**: Summary is well-scoped, no exercises (empty array), no forward references. Content correctly references prior lessons.
- **4.7 — "Introduction to scientific notation"**: Summary is clean. Both exercises ("Scientific Notation Converter" and "Planet Distance Calculator") use only `double`, `std::cin`, `std::println` with format specifiers — no loops, no if/else, no std::string. Test cases are arithmetically correct.
- **4.9 — "Boolean values"**: Summary is clean and well-referenced. Exercise 1 ("Boolean Gate Checker") uses only `std::format` with bools and logical operators. Exercise 2 ("Integer Range Membership Tester") uses relational and logical operators stored in bools without if/else. Both are appropriate for their position before lesson 4.10.
- **4.12 — "Introduction to type conversion and static_cast"**: Summary is clean. Exercise 1 ("Character Arithmetic with static_cast") is clean — no loops or forbidden constructs. Exercise 2 ("Integer vs Floating-Point Division Comparison") correctly uses if/else since it comes after lesson 4.10.
- **4.x exercise 2 — "Float Breakdown"**: Uses only static_cast, uint32_t, boolalpha — all concepts taught by this point. No loops. Test cases are arithmetically verified correct.

## Statistics
- **Total lessons**: 12
- **Total exercises**: 18
- **Issues found**: 17 (9 critical, 5 moderate, 3 low)
- **Lessons fully clean**: 4 (4.5, 4.7, 4.9, 4.12)
- **Most common issue**: Forward references to loops (Ch 8) and if/else (lesson 4.10)

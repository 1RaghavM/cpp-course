# Chapter 2 Audit: C++ Basics: Functions and Files

## Summary
Chapter 2 has **17 issues** across its 14 lessons, ranging from severe forward references (using `std::string`, `double`, `bool`, `if/else`, `for` loops, `struct`, ternary operator, and `const` references before they are taught) to code bugs in solution files that will not compile. Nearly every lesson has at least one forward-reference violation. The code quality of solutions is generally correct where they do compile, and test cases match expected output, but the pervasive use of untaught concepts undermines the pedagogical ordering.

## Issues Found

### [CRITICAL] Lesson 2.1 — "Introduction to functions"
- **Type**: forward-reference
- **Location**: summary
- **Details**: The summary code example uses `int add(int a, int b)` with parameters, return values, and the `void` keyword in explanatory text — but parameters are not formally taught until lesson 2.4, return values until 2.2, and void until 2.3. The lesson text says it covers "Anatomy of a function" including all of these. This is arguably intentional as a preview, but it front-loads concepts the curriculum structures as separate lessons.
- **Fix needed**: Either restructure so 2.1 is truly introductory (only `main`, calling existing functions), or acknowledge this is a deliberate overview that subsequent lessons will deepen. Minor issue.

- **Type**: forward-reference
- **Location**: exercise 1 ("Greet by Name") — starter_code, solution_code, prompt
- **Details**: Uses `std::string` (requires `#include <string>`) which is not taught until Chapter 5. Also uses `std::cin >> name` with a string variable. Students at this point have only seen `int` variables from Chapter 1. The `std::string` type, its header, and how `cin >>` works with strings are all forward references.
- **Fix needed**: Replace with an `int` or `char`-based exercise, or simply print a fixed greeting. At minimum, change the parameter to `int` (e.g., greet with a number/ID).

- **Type**: forward-reference
- **Location**: exercise 2 ("Rectangle Area and Perimeter") — solution_code
- **Details**: Uses multiple parameters and return values, which is fine for lesson 2.1 (they are defined in the summary), but `return` semantics are formally covered in 2.2. Minor — acceptable as the summary covers `return`.
- **Fix needed**: None critical; the summary does cover `return`.

### [HIGH] Lesson 2.2 — "Function return values (value-returning functions)"
- **Type**: forward-reference
- **Location**: summary
- **Details**: The `max` function example in the summary uses `if (a > b) return a;` — an `if` statement. `if/else` is not taught until Chapter 4 (lesson 4.10). Students have not seen conditional branching yet.
- **Fix needed**: Use a simpler example that does not require `if` statements (e.g., a function that doubles a number, or computes a formula).

- **Type**: forward-reference
- **Location**: exercise 1 ("Temperature Converter") — starter_code, solution_code, prompt
- **Details**: Uses `double` data type and `#include <iomanip>` with `std::fixed` and `std::setprecision(1)`. The `double` type is not introduced until Chapter 4. `<iomanip>` formatters have not been taught at all by this point.
- **Fix needed**: Change to an `int`-based exercise (e.g., return `a + b`, or compute `a * a`). If floating-point must be used, it needs a Chapter 4 prerequisite note.

- **Type**: forward-reference
- **Location**: exercise 2 ("Absolute Difference") — solution_code, prompt
- **Details**: Uses `if (a >= b) return a - b;` — the `if` statement is not covered until Chapter 4. The prompt explicitly says "compute the result using an `if` statement."
- **Fix needed**: Rephrase to avoid `if` (could use arithmetic: `return (a - b) * ((a >= b) * 2 - 1)`) or acknowledge this is a forward reference. Better: replace the exercise entirely with one that returns a computed value without conditionals.

### [HIGH] Lesson 2.3 — "Void functions (non-value returning functions)"
- **Type**: forward-reference
- **Location**: summary
- **Details**: The `printTemperature` function uses `double` parameters and local variables. The `printPositive` early-return example uses `if (n <= 0) return;`. Both `double` and `if` are not yet taught.
- **Fix needed**: Use `int` parameters in examples. Replace the early-return example with one that doesn't need `if`, or flag it as a preview.

- **Type**: forward-reference
- **Location**: exercise 1 ("Formatted Receipt Printer") — starter_code, solution_code, prompt
- **Details**: Uses `std::string`, `double`, `#include <iomanip>`, `std::fixed`, and `std::setprecision(2)`. `std::string` is Ch 5, `double` is Ch 4, `<iomanip>` is not yet introduced.
- **Fix needed**: Use `int` types for prices (cents) and `std::string` should be replaced or the exercise should be moved later.

- **Type**: forward-reference
- **Location**: exercise 2 ("Countdown with Early Exit") — solution_code
- **Details**: Uses `if (start < 1)` (if-statement, Ch 4) and `for (int i = start; i >= 1; --i)` (for-loop, Ch 8). Both are major forward references. Students have not seen loops or conditionals.
- **Fix needed**: This exercise is fundamentally incompatible with the lesson ordering. Replace with a void function that prints a fixed sequence or takes `int` parameters and prints them in a format.

### [MEDIUM] Lesson 2.4 — "Introduction to function parameters and arguments"
- **Type**: forward-reference
- **Location**: summary
- **Details**: The `power` function example uses a `for` loop (`for (int i{0}; i < exponent; ++i)`) which is not taught until Chapter 8. Also mentions `std::string name` in the void function example, which is Ch 5. The summary text also says "Like Python's arguments, but every parameter needs an explicit type" which references `std::string` in a `printGreeting` example.
- **Fix needed**: Replace `power` example with simple arithmetic (e.g., `add`, `multiply`). Remove `std::string` mention.

- **Type**: forward-reference
- **Location**: exercise 2 ("Clamp a Value") — solution_code
- **Details**: Uses `if (value < low) return low;` and `if (value > high) return high;` — if-statements not yet taught (Ch 4).
- **Fix needed**: Replace with an exercise that doesn't require conditionals.

### [LOW] Lesson 2.5 — "Introduction to local scope"
- **Type**: forward-reference
- **Location**: exercise 1 ("Scoped Counters") — solution_code
- **Details**: Uses `for (int i { 1 }; i <= n; ++i)` — for-loops are Ch 8. Also uses `sum += i` compound assignment, which may not be formally covered yet (operators are in 1.9 but compound assignment is typically Ch 6).
- **Fix needed**: Replace with an exercise that demonstrates scope without loops (e.g., nested blocks with variable declarations and prints).

- **Type**: forward-reference
- **Location**: exercise 2 ("Lifetime Reporter") — solution_code
- **Details**: The solution uses `int a { ::a * 2 };` — the global scope resolution operator `::a` used to access the outer `a` from within the inner block. However, `::a` refers to a *namespace-scope* (global) variable named `a`, not the outer block's local `a`. Since `a` is a local in `main`, `::a` would be a compilation error (no global `a` exists). The solution itself contains a comment acknowledging this is wrong ("Alternative without :::"). **This solution will not compile.**
- **Fix needed**: Fix the solution to use a temporary variable before the inner block: `int outer_a = a;` then inside the block `int a { outer_a * 2 };`. Or restructure to avoid shadowing entirely.

### [HIGH] Lesson 2.6 — "Why functions are useful, and how to use them effectively"
- **Type**: forward-reference
- **Location**: summary
- **Details**: Uses `constexpr double pi { 3.14159265358979 };` — `constexpr` is not taught until approximately Ch 5-6. Also uses `double` (Ch 4).
- **Fix needed**: Use `int` examples or plain `const int` if constant is needed.

- **Type**: forward-reference
- **Location**: exercise 1 ("Temperature Converter") — solution_code, prompt
- **Details**: Uses `double` (Ch 4) and `<iomanip>` with `std::fixed`/`std::setprecision(2)`.
- **Fix needed**: Replace with `int`-based exercise.

- **Type**: forward-reference
- **Location**: exercise 2 ("Rectangle Calculator") — solution_code
- **Details**: Uses `double` parameters (Ch 4), `bool` return type (Ch 4), `<iomanip>` formatters, and the ternary operator `? :` in `(isSquare(width, height) ? "yes" : "no")` — the ternary/conditional operator is typically Ch 6. Also, comparing floating-point numbers with `==` (`return width == height;`) is a well-known pitfall that should be flagged.
- **Fix needed**: Use `int` parameters instead of `double`. Remove `bool` return type or replace with `int` (returning 0/1). Replace ternary with if/else — but that's also a forward reference. The exercise needs a fundamental redesign for this lesson position.

### [LOW] Lesson 2.7 — "Forward declarations and definitions"
- **Type**: forward-reference
- **Location**: exercise 2 ("Mutual Recursion with Forward Declarations") — solution_code
- **Details**: Uses `bool` return type (`bool isEven(int n)` / `bool isOdd(int n)`). `bool` is not formally introduced until Chapter 4. Also uses `if` statements.
- **Fix needed**: Change return type to `int` (0/1) to avoid `bool`, though `if` is still a forward reference. Consider replacing with a non-recursive exercise.

### [MEDIUM] Lesson 2.9 — "Naming collisions and an introduction to namespaces"
- **Type**: forward-reference
- **Location**: exercise 1 ("Namespace Arithmetic") — solution_code
- **Details**: Uses `double` (Ch 4), `<iomanip>`, `std::fixed`, `std::setprecision(2)`.
- **Fix needed**: Use only `int` types in both namespaces.

- **Type**: forward-reference
- **Location**: exercise 2 ("Scoped Greetings") — solution_code, starter_code
- **Details**: Uses `std::string` (Ch 5) and `const std::string&` (const reference — Ch 12 for references, Ch 5 for const). References are not taught until Chapter 12. The exercise prompt and starter code explicitly use `const std::string& name` as function parameters.
- **Fix needed**: Replace `std::string` with `int` (e.g., greet by number). Remove reference parameters.

### [MEDIUM] Lesson 2.11 — "Header files"
- **Type**: forward-reference
- **Location**: exercise 2 ("Header Guard Reconstruction") — starter_code, solution_code
- **Details**: Uses `struct Point { int x; int y; };` — structures are not taught until a later chapter (approximately Ch 13). Students have no concept of user-defined types at this point. Also, the `print_point` function takes a `Point` by value.
- **Fix needed**: Replace `struct` with plain function declarations (e.g., `int add(int, int);`). The exercise can demonstrate header guards without introducing structs.

### [MEDIUM] Lesson 2.12 — "Header guards"
- **Type**: forward-reference
- **Location**: exercise 1 ("Simulating Include Guard Behavior") — solution_code
- **Details**: Uses `namespace _greeter_init { inline int _x = (std::cout << "Header loaded\n", 0); }` — this uses the comma operator, inline variables (C++17), and a namespace with a side-effecting initializer. These are all advanced concepts well beyond Chapter 2. The technique of using a global initializer for a side effect is not something a student at this level can understand or reproduce.
- **Fix needed**: The exercise concept (printing from within a guarded block at file scope) is fundamentally problematic because you can't execute `std::cout` at file scope without advanced tricks. Redesign the exercise: have the guard protect a `const int` definition, and in `main`, print the constant. Remove the "Header loaded" print requirement, or move it into `main` with a flag variable.

- **Type**: forward-reference
- **Location**: exercise 2 ("ODR Violation Detector") — solution_code
- **Details**: Uses `struct Point` (later chapter), `std::string` return type (Ch 5), `std::to_string()` (Ch 5+), and string concatenation with `+`. Multiple forward references.
- **Fix needed**: Replace with `int`-based functions and remove struct/string usage.

### [MEDIUM] Lesson 2.13 — "How to design your first programs"
- **Type**: forward-reference
- **Location**: exercise 2 ("Odd/Even Counter") — solution_code
- **Details**: Uses `bool` return type for `isOdd` (Ch 4), `if` statements inside `countOdd` (Ch 4), and the `%` modulo operator (likely introduced in Ch 1.9 with operators, so this may be acceptable). The `bool` type and `if` are the main concerns.
- **Fix needed**: Use `int` return type for isOdd (return 0 or 1). If `if` is unavoidable, acknowledge the forward reference or restructure.

### [LOW] Lesson 2.x — "Chapter 2 summary and quiz"
- **Type**: forward-reference
- **Location**: exercise 1 ("Mini Calculator") — solution_code
- **Details**: Uses `if`/`else if` chain and `char` type. `char` is formally Ch 4; `if/else` is Ch 4. However, as a chapter summary quiz, some synthesis with slightly advanced constructs may be intentional.
- **Fix needed**: Consider adding a note that this is a stretch exercise, or replace the operator selection with a fixed operation.

- **Type**: progression
- **Location**: exercise 2 ("Function Chain")
- **Details**: This exercise is clean in concept (forward declarations + chained calls). Uses only `int` and basic arithmetic. However, the function name `negate` could potentially shadow `std::negate` if `using namespace std;` were used — minor concern since the code correctly uses `std::` prefix.
- **Fix needed**: None — this exercise is well-designed.

## Detailed Code Bug

### [CRITICAL] Lesson 2.5, Exercise 2 — "Lifetime Reporter" solution will not compile
- **Type**: code-bug
- **Location**: exercise 2 solution_code
- **Details**: The solution contains `int a { ::a * 2 };`. The `::` (global scope resolution) operator looks for a variable `a` in the global namespace. But `a` is a local variable inside `main()`, not a global. There is no global `a`, so `::a` is an undefined identifier. This code will fail to compile with an error like "use of undeclared identifier 'a' in global scope." The solution's own comment acknowledges this problem but doesn't fix it.
- **Fix needed**: Replace with:
  ```cpp
  int outer_a = a;  // capture before shadowing
  {
      int a { outer_a * 2 };
      std::cout << "inner a = " << a << '\n';
      std::cout << "inner b = " << b << '\n';
  }
  ```

## Lessons Verified Clean
- **Lesson 2.7, Exercise 1** ("Fix the Order with a Forward Declaration") — Uses only `int`, basic I/O, and forward declarations. Clean.
- **Lesson 2.8** ("Programs with multiple code files") — Both exercises use only `int` types, forward declarations, and basic arithmetic. Clean.
- **Lesson 2.10** ("Introduction to the preprocessor") — Both exercises use only preprocessor directives and `std::cout`. Clean.
- **Lesson 2.11, Exercise 1** ("Declare Before You Call") — Uses only `int` and forward declarations. Clean. (Note: uses ternary `x < 0 ? -x : x` in the definition of `absolute_value`, which is a minor forward reference to Ch 6 ternary operator, but the student doesn't write it — it's pre-written.)
- **Lesson 2.13, Exercise 1** ("Rectangle Calculator") — Uses only `int`, basic I/O, and simple functions. Clean.
- **Lesson 2.x, Exercise 2** ("Function Chain") — Uses only `int`, forward declarations, and basic arithmetic. Clean.

## Summary Statistics
- **Total lessons**: 14 (2.1 through 2.x)
- **Lessons with issues**: 12
- **Lessons fully clean**: 2 (2.8, 2.10)
- **Critical issues**: 2 (solution won't compile in 2.5 Ex2; pervasive std::string usage in 2.1 Ex1)
- **High issues**: 5 (double/if/for forward references in 2.2, 2.3, 2.4, 2.6, 2.7)
- **Medium issues**: 5 (forward references in 2.4, 2.9, 2.11, 2.12, 2.13)
- **Low issues**: 3 (minor forward references in 2.5, 2.7, 2.x)

## Recurring Patterns
1. **`double` used before Ch 4**: Lessons 2.2, 2.3, 2.4 summary, 2.6 (both exercises), 2.9
2. **`if/else` used before Ch 4**: Lessons 2.2 (both summary and exercises), 2.3, 2.4, 2.6, 2.7, 2.13, 2.x
3. **`std::string` used before Ch 5**: Lessons 2.1 Ex1, 2.3 Ex1, 2.4 summary, 2.9 Ex2, 2.12 Ex2
4. **`for` loops used before Ch 8**: Lessons 2.3 Ex2, 2.4 summary, 2.5 Ex1
5. **`bool` used before Ch 4**: Lessons 2.6 Ex2, 2.7 Ex2, 2.13 Ex2
6. **`struct` used before its chapter**: Lessons 2.11 Ex2, 2.12 Ex2
7. **`const` references used before Ch 12**: Lesson 2.9 Ex2

## The idea

When writing a function, you often have assumptions that must be true for the function to work correctly — for example, "the denominator is never zero" or "the count is always positive." Rather than silently proceeding when these assumptions are violated, you can enforce them explicitly using assertions. An assertion is a runtime check that immediately terminates the program with a diagnostic message when a condition is false.

The intuition is this: an assertion says "I, the programmer, guarantee this is always true here. If it ever isn't, there is a bug in my code." It is not error handling for expected bad input from users — it is a debugging tool for catching programming mistakes. Assertions answer the question: "Does this invariant hold?" If it doesn't, you want to know immediately, loudly, and with a location.

`static_assert` is a related but different tool: it checks conditions at compile time rather than run time. For things that can be known before the program starts — like the size of a type — `static_assert` catches mistakes before you ever run the code.

## How it works

**Example 1 — basic `assert`:**

```cpp
#include <iostream>
#include <cassert>

int divide(int a, int b) {
    assert(b != 0);   // terminates with diagnostic if b == 0
    return a / b;
}

int main() {
    std::cout << divide(10, 2) << '\n';  // prints 5
    std::cout << divide(10, 0) << '\n';  // assertion fails here
    return 0;
}
```

When `b == 0`, `assert(b != 0)` fires. The program prints a message like:
```
Assertion failed: (b != 0), function divide, file example.cpp, line 5.
```
and terminates. The message includes the failed expression, the function name, the file name, and the line number — everything you need to locate the bug.

**Example 2 — asserting a precondition:**
Assertions are best placed at the top of a function to document and enforce preconditions — the conditions that must be true when the function is called.

```cpp
#include <cassert>
#include <iostream>

// Precondition: n must be non-negative.
int factorial(int n) {
    assert(n >= 0);
    int result = 1;
    for (int i = 2; i <= n; ++i)
        result *= i;
    return result;
}

int main() {
    std::cout << factorial(5)  << '\n';  // prints 120
    std::cout << factorial(-1) << '\n';  // assertion fires
    return 0;
}
```

Without the assertion, `factorial(-1)` would silently return `1` (the loop never runs). With the assertion, the bug is caught at the point of the call, not in some distant downstream check.

**Example 3 — `static_assert`:**

```cpp
#include <iostream>

// Verify at compile time that int is at least 4 bytes on this platform.
static_assert(sizeof(int) >= 4, "int must be at least 4 bytes");

int main() {
    // This compile-time check runs before the program ever starts.
    static_assert(sizeof(int) == sizeof(long) || sizeof(int) == 4,
                  "unexpected int size");
    std::cout << "sizeof(int) = " << sizeof(int) << '\n';
    return 0;
}
```

`static_assert(condition, "message")` is evaluated by the compiler. If `condition` is false, the compilation fails with the given message. If `condition` is true, there is no runtime cost whatsoever. Use `static_assert` for size, alignment, or compile-time constant checks.

## Common mistakes

**Mistake 1 — using assertions for expected runtime errors:**

```cpp
// WRONG: user input can legitimately be negative
int score;
std::cin >> score;
assert(score >= 0);   // crashes the program instead of recovering gracefully
```

Assertions are for programmer errors, not user input errors. If a user can type a negative score, that is an expected case to handle with validation and an error message, not an assertion that terminates the process. Assertions should document invariants that are always true if your code is correct.

**Mistake 2 — putting side effects inside `assert`:**

```cpp
// WRONG: when NDEBUG is defined, the entire expression is removed
assert(++counter > 0);   // counter is only incremented in debug builds
```

Assertions can be compiled out with the `NDEBUG` preprocessor flag (a common performance optimization). Any expression inside `assert` that has a side effect (modifying variables, calling functions that change state) will behave differently in release builds. Only use pure boolean expressions inside `assert`.

**Mistake 3 — confusing `assert` with `static_assert`:**
`assert` checks a condition at runtime and terminates the program if it is false. `static_assert` checks a condition at compile time and causes a compile error if it is false. If the condition you need to check involves a value that isn't known until the program runs (like a user input), only `assert` applies. If the condition involves compile-time constants or type properties (like `sizeof`), `static_assert` is preferred because it has zero runtime cost and catches the mistake earlier.

## When to use this

Place `assert` at the start of every function that has preconditions — conditions the caller must satisfy for the function to behave correctly. Write the assertion immediately, not as an afterthought. For conditions involving type sizes, compile-time integer constants, or `constexpr` values, use `static_assert` instead, as it costs nothing at runtime. Never use `assert` to handle errors that the user can cause — use the error-handling strategies from the prior lesson (sentinel values, `std::exit`, or stream fail checks) for those cases.

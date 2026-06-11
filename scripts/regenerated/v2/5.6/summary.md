## The idea

From the previous lesson you know that a constant expression is one whose value the compiler can compute at build time. You also know that some `const` variables qualify as constant expressions (those with compile-time initializers) and some do not (those initialized from runtime values). But until now, you have had no way to *demand* that a variable be a constant expression. If you accidentally initialize a `const` variable from a runtime value, the compiler silently allows it.

The `constexpr` keyword closes this gap. It is a guarantee, not just a request: declaring a variable `constexpr` tells the compiler "this value must be computable at compile time." If it is not — if the initializer depends on any runtime information — the compiler refuses to compile. You get an error immediately at the point of declaration, not a silent runtime behavior.

Think of `const` as "promise not to change" and `constexpr` as "promise not to change, and computed before the program runs." Every `constexpr` variable is automatically `const`, but not every `const` variable is `constexpr`.

## How it works

**Example 1 — basic `constexpr` variable**

```cpp
#include <iostream>

int main() {
    constexpr int max_score = 100;
    constexpr int passing_score = max_score / 2;
    std::cout << passing_score << "\n";
    return 0;
}
```

Both variables are evaluated at compile time. `max_score` is `100`, `passing_score` is `50`. The compiler can verify both initializers are constant expressions and will embed the values directly in the executable. This prints `50`.

**Example 2 — `constexpr` catches a mistake `const` would miss**

```cpp
#include <iostream>

int getLimit() {
    return 50;
}

int main() {
    // const int limit = getLimit();  // would compile — no error
    constexpr int limit = getLimit(); // COMPILE ERROR — not a constant expression
    std::cout << limit << "\n";
    return 0;
}
```

With `const`, the initialization from `getLimit()` silently succeeds — `limit` is a runtime constant. With `constexpr`, the compiler immediately flags the problem: `getLimit()` is a regular (non-`constexpr`) function and its return value is not a constant expression. The error is caught at the source.

**Example 3 — choosing between `const` and `constexpr`**

```cpp
#include <iostream>

int main() {
    constexpr int board_size = 8;           // compile-time: fixed game constant
    constexpr double pi_approx = 3.14159;   // compile-time: mathematical constant

    int user_input;
    std::cin >> user_input;
    const int clamped = user_input;         // runtime const: can't use constexpr here
    std::cout << board_size << " " << pi_approx << " " << clamped << "\n";
    return 0;
}
```

`board_size` and `pi_approx` are genuine compile-time constants and benefit from `constexpr`. `clamped` depends on user input and must stay `const` — attempting `constexpr` here would be a compile error.

## Common mistakes

**Mistake 1 — using `constexpr` with a runtime initializer**

```cpp
#include <iostream>

int main() {
    int x;
    std::cin >> x;
    constexpr int doubled = x * 2;  // ERROR: x is not a constant expression
    std::cout << doubled << "\n";
    return 0;
}
```

The compiler error will say something like "expression must have a constant value" or "the value of 'x' is not usable in a constant expression." The fix is to use `const` instead of `constexpr` if runtime values are involved, or to redesign so the value is computable at compile time.

**Mistake 2 — thinking `constexpr` is only for performance**

Some learners treat `constexpr` as a mere hint to the optimizer. In fact, `constexpr` is a correctness guarantee. Its primary benefit is that it catches mistakes early: if you declare something `constexpr` and accidentally feed it a runtime value, you find out at compile time rather than potentially much later. Performance is a bonus, not the goal.

**Mistake 3 — forgetting that `constexpr` implies `const`**

A `constexpr` variable cannot be modified after initialization — it is automatically `const`. Attempting to assign to it later is a compile error:

```cpp
constexpr int limit = 100;
limit = 200;  // ERROR: assignment to a constexpr (const) variable
```

This is not a special rule for `constexpr`; it follows directly from `constexpr` implying `const`.

## When to use this

Prefer `constexpr` over plain `const` whenever the value is genuinely known at compile time: mathematical constants, array dimensions, game configuration values, physical constants. This documents intent — any reader (and the compiler) immediately knows the value is a compile-time fact. A good habit is to reach for `constexpr` first when defining a named constant and only fall back to `const` when the initializer cannot be resolved at compile time.

Use `const` when the value is fixed after initialization but depends on runtime data (user input, file contents, function results from non-`constexpr` functions). Using `constexpr` there would produce a compile error. For example, a maximum score that the player enters at the start of a game must be `const`, not `constexpr`, because the program cannot know it until the game starts.

The combination of `const` (from the "Constant variables" lesson) and `constexpr` (this lesson) gives you the full toolkit for expressing read-only data at both the compile-time and runtime level. As you encounter later chapters — fixed-size arrays, `static_assert`, and eventually `constexpr` functions — you will see that the `constexpr` guarantee becomes a prerequisite for several powerful language features rather than just a style choice.

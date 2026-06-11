## The idea

`if` statements look simple, but several common patterns produce confusing or outright wrong behavior that trips up even experienced programmers. This lesson catalogs those patterns so you can recognize and avoid them: null statements, implicit conversions in conditions, misplaced semicolons, and the temptation to simplify conditions in ways that silently break them. None of these are compiler errors — they are logic problems that produce code that runs but does the wrong thing.

## How it works

**Null statements** — a semicolon standing alone — are a legal C++ statement that does nothing. They become a trap when accidentally placed after an `if` condition:

```cpp
#include <iostream>

int main()
{
    int x { 5 };

    if (x > 0);          // semicolon here ends the if — body is empty
        std::cout << "Positive\n";   // always runs, not conditional!

    return 0;
}
```

The `cout` is not inside the `if`. The semicolon is the entire body of the `if`, so the condition controls nothing. The output is always `Positive` regardless of `x`. GCC with `-Wall` warns about this; that is one more reason to compile with warnings on.

**Integer values as conditions.** Any expression that converts to `bool` is valid as an `if` condition. Non-zero integers are `true`; zero is `false`. This is intentional and useful, but it interacts badly with relational operators in a way beginners do not expect:

```cpp
#include <iostream>

int main()
{
    int x { 5 };

    if (x)                // true: x is non-zero
        std::cout << "x is non-zero\n";

    if (x = 0)            // assignment, not comparison! x becomes 0, condition is false
        std::cout << "never printed\n";

    std::cout << "x is now " << x << '\n';  // prints 0

    return 0;
}
```

The double-equals (`==`) vs single-equals (`=`) confusion is especially dangerous because the expression `x = 0` is valid C++ — it assigns 0 to `x` and then evaluates to 0, which is `false`. The program compiles and runs without crashing; it just does something completely different from what was intended.

**Redundant bool comparisons** introduce the opposite problem — over-clarifying a condition in a way that reverses its logic:

```cpp
#include <iostream>

bool isValid(int n)
{
    return n > 0;
}

int main()
{
    int n { 5 };

    // Correct — reads naturally:
    if (isValid(n))
        std::cout << "Valid\n";

    // Also correct but verbose:
    if (isValid(n) == true)
        std::cout << "Valid\n";

    // Accidental negation — programmer meant to check validity,
    // but mistakenly wrote == false:
    if (isValid(n) == false)   // only true when n <= 0
        std::cout << "This fires when invalid, not valid!\n";

    return 0;
}
```

Comparing a `bool` to `true` adds no information and invites a typo. Prefer `if (isValid(n))` and `if (!isValid(n))` over the `== true` / `== false` forms.

## Common mistakes

**The accidental null statement.** The semicolon-after-condition trap (shown above) is the most frequent. The tell is that the indented statement beneath the `if` always runs regardless of the condition. Remove the stray semicolon and, while there, add braces.

**Accidental assignment in a condition.** `if (x = 5)` compiles cleanly but assigns 5 to `x` and always evaluates to true (because 5 is non-zero). Enable `-Wall`: GCC and Clang produce a `suggest parentheses around assignment used as truth value` warning. If you genuinely mean "assign and test", write `if ((x = getValue()) != 0)` — the double parens signal intent and silence the warning.

**Testing a floating-point value for exact equality.** This is a broader topic covered in the lesson on floating-point numbers, but it appears most visibly inside `if` statements:

```cpp
double d { 0.1 + 0.2 };

if (d == 0.3)            // almost certainly false due to rounding
    std::cout << "Equal\n";
```

`0.1 + 0.2` in IEEE 754 arithmetic is `0.30000000000000004...`, not exactly `0.3`. Use a tolerance comparison (`std::abs(d - 0.3) < 1e-9`) when checking floating-point values.

## When to use this

These are not obscure edge cases — every C++ programmer encounters the accidental-semicolon and the `=` vs `==` trap within their first few hundred lines. The lesson to take away is defensive: enable `-Wall -Wextra`, fix all warnings before running, and prefer `if (condition)` and `if (!condition)` over `if (condition == true)` and `if (condition == false)`.

When reading other people's code, a semicolon on the same line as an `if` condition or a bare assignment inside a condition is always worth a second look — it is either intentional (and deserves a comment) or a bug.

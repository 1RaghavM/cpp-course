## The idea

An `if` statement gives your program the ability to make choices. Before now, every line of code you wrote executed unconditionally — the program marched straight through from top to bottom. With `if`, you can say "run this block of code only when some condition is true, and run a different block when it is false." That one capability — conditional execution — is what turns a calculator into something that can actually respond to the world.

Think of it like a railroad switch. A train (your program's execution flow) arrives and the switch checks a condition. If the condition holds, the train takes the left track; otherwise it takes the right track. Both tracks rejoin later, or one of them ends at a terminal. The `if/else` construct is that switch.

## How it works

**Basic if statement**

```cpp
#include <iostream>

int main()
{
    int temperature { 15 };

    if (temperature < 0)
        std::cout << "Below freezing\n";

    std::cout << "Done\n";
    return 0;
}
```

The condition `temperature < 0` is `false` (15 is not less than 0), so the line "Below freezing" is skipped. "Done" always prints. The single statement after `if (...)` is the *controlled statement* — it only runs when the condition is true.

**if/else for two-way branching**

```cpp
#include <iostream>

int main()
{
    int score {};
    std::cin >> score;

    if (score >= 60)
        std::cout << "Pass\n";
    else
        std::cout << "Fail\n";

    return 0;
}
```

When `score >= 60` is true, "Pass" prints and the else branch is skipped. When the condition is false, "Fail" prints and the if branch is skipped. Exactly one of the two branches executes — never both, never neither.

**Blocks as the controlled statement**

When you need more than one statement to execute conditionally, wrap them in curly braces to form a *block*. Without braces, only the very next statement is controlled:

```cpp
#include <iostream>

int main()
{
    int voltage { 250 };

    if (voltage > 240)
    {
        std::cout << "Warning: high voltage\n";
        std::cout << "Value: " << voltage << '\n';
    }
    else
    {
        std::cout << "Voltage normal\n";
    }

    return 0;
}
```

Both lines inside the first block print when voltage exceeds 240. Using braces even for single-statement branches is a common style recommendation because it prevents accidental bugs when someone adds a second statement later without realising braces are missing.

**Conditions are boolean expressions**

The condition inside `if (...)` is any expression that evaluates to a `bool` (or to something that converts to `bool`). You already know comparison operators (`<`, `>`, `<=`, `>=`, `==`, `!=`) and logical operators (`&&`, `||`, `!`) from the lesson on boolean values. All of them work directly as if conditions:

```cpp
int x { 42 };

if (x > 0 && x < 100)
    std::cout << "Single digit or double digit or triple\n";

if (x == 42)
    std::cout << "The answer\n";
```

**Nested if/else (if-else-if)**

You can place an `if` statement inside the `else` branch to test a second condition only when the first was false:

```cpp
int n { 0 };
std::cin >> n;

if (n > 0)
    std::cout << "Positive\n";
else if (n < 0)
    std::cout << "Negative\n";
else
    std::cout << "Zero\n";
```

Only one of the three messages prints. The second `if` is only reached when `n > 0` is false. The final `else` is a catch-all for everything else (zero, in this case). Chains of `else if` are the right tool when you have multiple mutually exclusive cases.

## Common mistakes

**Mistake 1: Forgetting braces and accidentally controlling too many statements**

```cpp
if (x > 0)
    std::cout << "Positive\n";
    std::cout << "Processing...\n";   // always executes — NOT inside the if!
```

Without braces, only the first statement is controlled by the `if`. The second line prints regardless of `x`. This is one of the most common C++ bugs for newcomers. The fix is always to add braces:

```cpp
if (x > 0)
{
    std::cout << "Positive\n";
    std::cout << "Processing...\n";
}
```

**Mistake 2: Using `=` instead of `==` in a condition**

```cpp
int result { 5 };
if (result = 10)   // ASSIGNS 10 to result, then evaluates to 10 (truthy)
    std::cout << "Ten\n";
```

This always prints "Ten" because the assignment `result = 10` evaluates to 10, which converts to `true`. The original value of `result` is also destroyed. Many compilers warn about this pattern (`-Wall` flags it). The correct test is `result == 10`.

**Mistake 3: Dangling else ambiguity without braces**

```cpp
int a { 5 };
int b { 3 };
if (a > 0)
    if (b > 10)
        std::cout << "B is large\n";
else
    std::cout << "A is not positive\n";  // this belongs to the inner if, NOT the outer!
```

The `else` attaches to the nearest preceding `if`, which is `if (b > 10)`, not `if (a > 0)`. The message "A is not positive" will actually print when `a > 0 && b <= 10`. Using braces for every `if` and `else` block eliminates this ambiguity entirely.

## When to use this

Use `if/else` whenever your program needs to take different actions based on a runtime value. That covers almost everything: grading systems, range checks, error handling, choosing which formula to apply. If you have exactly two outcomes (pass/fail, yes/no, valid/invalid), `if/else` is the natural fit.

When you have more than two mutually exclusive cases, a chain of `else if` branches (shown above) keeps the logic flat and readable. Later in the curriculum you will meet `switch` statements (Chapter 8), which handle many integer cases more concisely. Booleans from the previous lesson ("Boolean values") become the natural input to `if` conditions — you can compute a `bool` once and test it multiple times without recalculating the expression.

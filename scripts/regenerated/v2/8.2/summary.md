## The idea

An `if` statement lets a program take one of two paths based on a condition: if the condition is true, execute the "then" branch; otherwise, optionally execute the "else" branch. You have already used the single-statement form from chapter 4. This lesson focuses on the *block* form — wrapping multiple statements inside `{ }` — and explains why you almost always want the braces even when the body is a single line.

Think of the braces as a pair of parentheses for statements rather than expressions. Just as `(a + b) * c` groups an addition so the multiplication applies to the whole result, `{ stmt1; stmt2; }` groups statements so the `if` controls all of them, not just the first one.

## How it works

The minimal `if` with no `else`:

```cpp
#include <iostream>

int main()
{
    int n {};
    std::cin >> n;

    if (n < 0)
    {
        std::cout << "Negative\n";
        std::cout << "n = " << n << '\n';
    }

    return 0;
}
```

Both `cout` lines are inside the block, so both execute when `n < 0` and neither executes when `n >= 0`. Without the braces, only the first `cout` would be conditional — the second would always run.

Adding an `else` branch:

```cpp
#include <iostream>

int main()
{
    int score {};
    std::cin >> score;

    if (score >= 60)
    {
        std::cout << "Pass\n";
        std::cout << "Score: " << score << '\n';
    }
    else
    {
        std::cout << "Fail\n";
        std::cout << "Score: " << score << '\n';
    }

    return 0;
}
```

Exactly one branch runs. The compiler generates code for both, but the CPU visits only one on any given execution.

**Chaining with `else if`** handles more than two cases. Each `else if` is just an `else` whose body is another `if`:

```cpp
#include <iostream>

int main()
{
    int x {};
    std::cin >> x;

    if (x > 0)
        std::cout << "Positive\n";
    else if (x < 0)
        std::cout << "Negative\n";
    else
        std::cout << "Zero\n";

    return 0;
}
```

Only one branch fires. The conditions are tested top to bottom; the first true one wins. This is a chain of two `if`/`else` statements, not a separate construct.

**Blocks are also used without `if`** to limit variable scope. A variable declared inside `{ }` is destroyed when the block ends. This is a general C++ rule, not specific to `if` — but `if` blocks are the place beginners first notice it. There is no code example here because bare blocks are rarely written in practice; the rule matters most when you see a variable declared inside an `if` branch and wonder why it is not visible after the closing brace.

## Common mistakes

**Omitting braces on a single-statement body, then later adding a second statement:**

```cpp
// Original intent:
if (error)
    std::cout << "Error!\n";

// Bug after "adding a line":
if (error)
    std::cout << "Error!\n";
    return 1;       // always runs — NOT part of the if!
```

`return 1` is at the same indentation as the `cout`, but indentation is cosmetic; the compiler only sees the single statement after `if`. The fix is to add braces from the start. Many style guides mandate braces unconditionally for exactly this reason.

**Dangling else — which `if` does an `else` belong to?**

```cpp
int x { 5 };
int y { 4 };

if (x > 0)
    if (y > 0)
        std::cout << "Both positive\n";
else
    std::cout << "x not positive\n";  // actually belongs to the inner if!
```

C++ attaches `else` to the nearest unmatched `if`, so this `else` pairs with `if (y > 0)`, not `if (x > 0)`. The indentation lies. The fix is braces:

```cpp
if (x > 0)
{
    if (y > 0)
        std::cout << "Both positive\n";
}
else
    std::cout << "x not positive\n";  // now clearly belongs to the outer if
```

**Using `=` instead of `==` in the condition:**

```cpp
if (x = 5)   // assignment, not comparison — always true (5 is non-zero)
    std::cout << "x is 5\n";
```

The compiler may warn about this (`-Wall` catches it), but it is valid C++ and silently changes `x`. Use `==` for comparison.

## When to use this

Use the block form of `if`/`else` whenever the branch body contains more than one statement — or whenever there is any chance it ever will. The cost of an extra pair of braces is zero; the cost of forgetting them when you later add a statement can be a hard-to-find logic bug.

Prefer `else if` chains over nested `if` statements when the conditions are mutually exclusive and you want the structure to read as a decision tree. If you have more than three or four cases keyed on a single integer or character value, the `switch` statement (lesson 8.5) is more readable than a long `else if` chain.

For single conditions that just gate a warning message or early `return`, the brace-less single-statement form is widely used and accepted — but be consistent with whatever style your team or project adopts.

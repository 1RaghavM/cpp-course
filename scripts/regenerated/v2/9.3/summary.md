## The idea

A semantic error is a bug where your program compiles and runs, but does the wrong thing. The compiler is silent about semantic errors because the code is syntactically legal — it just doesn't mean what you intended. Understanding the most common categories of semantic errors gives you a checklist to consult when something looks wrong and the compiler isn't helping.

Unlike syntax errors (where the compiler tells you exactly which line to fix) or logic errors introduced by mistyped operator symbols, semantic errors often hide in assumptions the programmer made and the compiler had no reason to challenge. Knowing their names and patterns lets you spot them faster during testing.

## How it works

**Conditional logic errors** happen when the wrong operator is used in a condition, causing the branch to fire at the wrong time.

```cpp
#include <iostream>

int main() {
    int x = 5;
    // Intended: print only when x is between 1 and 10 (exclusive)
    // Bug: uses || instead of &&; this is always true
    if (x > 1 || x < 10)
        std::cout << "in range\n";
    return 0;
}
```

`x > 1 || x < 10` is true for every integer, because any number is either greater than 1 or less than 10. The correct condition is `x > 1 && x < 10`.

**Off-by-one errors** arise from using `<` when `<=` was needed, or starting a count at 1 when it should start at 0.

```cpp
#include <iostream>

int main() {
    // Intended: print 1, 2, 3, 4, 5
    // Bug: loop stops one iteration too early
    for (int i = 1; i < 5; ++i)
        std::cout << i << '\n';
    return 0;
}
```

The loop prints 1 through 4, not 1 through 5. The fix is `i <= 5`. Off-by-one errors are among the most frequent bugs in programs that count things or work with ranges.

**Integer division truncation** occurs when two integers are divided but a fractional result was expected.

```cpp
#include <iostream>

int main() {
    int total = 7;
    int count = 2;
    // Intended: 3.5
    // Bug: integer division truncates toward zero
    double average = total / count;
    std::cout << average << '\n';  // prints 3, not 3.5
    return 0;
}
```

`7 / 2` in integer arithmetic is `3`, not `3.5`. Assigning it to `double` happens after the truncation — the damage is already done. The fix is to cast one operand: `static_cast<double>(total) / count`.

**Uninitialized variable reads** produce garbage values because the variable was declared but never assigned before use.

```cpp
#include <iostream>

int main() {
    int result;          // uninitialized
    result = result + 1; // reads garbage
    std::cout << result << '\n';
    return 0;
}
```

The output is whatever happens to be in memory at `result`'s address. In debug builds this is often zero, but in release builds it can be any value, causing different behavior depending on the compiler and system.

## Common mistakes

**Mistake 1 — misreading `=` vs `==` in conditions:**

```cpp
int x = 5;
if (x = 0)           // assigns 0 to x, then evaluates x (which is now 0 → false)
    std::cout << "zero\n";
```

The assignment `x = 0` is legal in a condition. The compiler may warn about it, but it still compiles. The `if` never fires, and `x` is now `0` throughout the rest of the program — a silent double bug.

**Mistake 2 — integer division when expecting a decimal result:**

```cpp
// BUG: Both operands are int, so division truncates
double half = 1 / 2;     // half == 0.0, not 0.5
```

This is one of the most common surprises for programmers coming from Python, where `/` always performs floating-point division. In C++, if both operands are integers, `/` is integer division. Use `1.0 / 2` or `static_cast<double>(1) / 2`.

**Mistake 3 — using `||` where `&&` was needed in range checks:**
A condition like "x is between lo and hi" requires `&&` (both must be true), not `||` (either is true). Writing `x > lo || x < hi` is almost always true for any `x`, making the guard useless.

## When to use this

When a function produces a wrong answer and the compiler offers no help, scan for these five patterns in order: wrong operator in a condition (`||`/`&&`, `>`/`>=`), off-by-one in a loop bound or a boundary check, integer division where a `double` was expected, an uninitialized variable, and accidental assignment in a condition. These patterns account for the vast majority of semantic bugs in early C++ programs. Testing with boundary values (as covered in the prior lesson on code coverage) surfaces most of them.

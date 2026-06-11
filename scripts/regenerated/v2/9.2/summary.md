## The idea

Writing a few test cases and checking whether they pass is a start, but how do you know you have tested enough? Code coverage is the idea of tracking which parts of your code are actually exercised by your tests. A line or branch that no test ever reaches is untested territory — you have no idea whether it works.

Think of your code like a building with many rooms. Testing is the act of walking through it. If you only walk down the main corridor, you haven't checked the side rooms. Some of those rooms might have broken floors. Code coverage is asking: "Did I walk through every room at least once?"

There are several levels of coverage. Statement coverage means every line of code ran during testing. Branch coverage goes further: it means every possible outcome of every conditional statement was taken. Branch coverage is more thorough because a line can execute without exposing a bug hidden in the opposite branch.

## How it works

**Example 1 — a function with an untested branch:**

```cpp
#include <iostream>

// Returns the absolute value of n.
int absolute(int n) {
    if (n < 0)
        return -n;
    return n;
}

int main() {
    // Only tests positive input.
    std::cout << absolute(5) << '\n';   // exercises the 'return n' branch
    return 0;
}
```

Running this test achieves statement coverage of `return n` but never reaches `return -n`. The negative branch is completely untested. A typo like `return n` in the `if` block would not be caught.

**Example 2 — improving to full branch coverage:**

```cpp
int main() {
    std::cout << absolute(5)  << '\n';  // takes the 'return n' branch
    std::cout << absolute(-3) << '\n';  // takes the 'return -n' branch
    std::cout << absolute(0)  << '\n';  // boundary: zero is not negative
    return 0;
}
```

Now both branches of the `if` are exercised, and the boundary value zero is also tested. This is branch coverage. If either `return` statement were wrong, at least one test would produce unexpected output.

**Example 3 — a function with multiple branches:**

```cpp
#include <iostream>

// Classifies a temperature (Celsius) as cold, warm, or hot.
// cold: below 15, warm: 15 to 29, hot: 30 and above
int classify(int temp) {
    if (temp < 15)
        return 0;   // cold
    if (temp < 30)
        return 1;   // warm
    return 2;       // hot
}

int main() {
    // Need at least one input per branch + boundaries.
    std::cout << classify(5)  << '\n';  // cold
    std::cout << classify(15) << '\n';  // warm (boundary: exactly 15)
    std::cout << classify(20) << '\n';  // warm (interior)
    std::cout << classify(29) << '\n';  // warm (boundary: exactly 29)
    std::cout << classify(30) << '\n';  // hot (boundary: exactly 30)
    std::cout << classify(40) << '\n';  // hot
    return 0;
}
```

There are three possible outcomes (`return 0`, `return 1`, `return 2`) and three boundary values (`14`/`15`, `29`/`30`) where the classification changes. Testing those boundaries catches off-by-one errors in the conditions.

## Common mistakes

**Mistake 1 — confusing "it ran" with "it worked":**

```cpp
// Tests classify but doesn't inspect the result:
classify(5);   // ← runs the code but checks nothing
```

Statement coverage only tells you that lines of code executed — it says nothing about whether the output was correct. Always compare the return value against an expected result:

```cpp
std::cout << (classify(5) == 0 ? "PASS" : "FAIL") << '\n';
```

**Mistake 2 — ignoring the branch where a condition is false:**
Suppose you have:

```cpp
if (n > 0)
    result = n;
```

If your tests only use positive values for `n`, the assignment is always reached. You have never tested what happens when `n <= 0`. For statement coverage that is fine (the `if` line ran), but branch coverage requires at least one test where `n <= 0` so the false-branch path is confirmed safe.

**Mistake 3 — skipping boundary values between branches:**
A condition like `temp < 15` changes behavior at exactly `14` and `15`. Testing only `5` and `20` leaves a gap. The off-by-one error `temp <= 15` instead of `temp < 15` would produce the wrong classification for exactly one value, which you would miss if you never test `15` directly.

## When to use this

Aim for branch coverage on every function that contains conditional logic. For each `if`/`else if`/`else` chain, create at least one test that takes each branch, plus at least one test at every boundary where the branch selection changes. Statement coverage is a floor — it catches obviously unreachable dead code — but branch coverage is the practical target for catching real logic bugs. When a function has no branches (it always executes the same path), one test per distinct category of input is sufficient.

## The idea

The compiler is not obligated to execute your program exactly the way you wrote it. As long as the visible effects — what gets printed, what gets written to files, what the user observes — remain identical, the compiler is free to rearrange, remove, or precompute anything it likes. This freedom is called the **as-if rule**: the program must behave *as if* it followed your source code, but the machine instructions underneath can differ dramatically.

The as-if rule is what makes optimization possible. Without it, a compiler could never fold `2 + 3` into `5` at build time, never eliminate a variable that is computed but never used, and never rearrange arithmetic to exploit a CPU's instruction pipeline. The rule grants the compiler a safe contract: "We guarantee the final behavior. You figure out the fastest path to get there."

This matters for learners because it closes a subtle mental model gap. Beginners often assume that every line of source code corresponds to exactly one machine operation, executed in order. That mental model is useful for learning, but incorrect for predicting performance or for understanding why the debugger sometimes skips lines or why unused code simply vanishes.

## How it works

**Example 1 — constant folding**

```cpp
#include <iostream>

int main() {
    const int seconds_per_day = 60 * 60 * 24;
    std::cout << seconds_per_day << "\n";
    return 0;
}
```

You wrote `60 * 60 * 24`. The compiler evaluates that at build time and embeds `86400` directly in the executable. At runtime, no multiplication ever happens. The output is still `86400`, so the observable behavior is identical — the as-if rule is satisfied.

**Example 2 — dead-code elimination**

```cpp
#include <iostream>

int main() {
    int x = 10;
    int y = x * 2;   // computed but never used
    std::cout << x << "\n";
    return 0;
}
```

The variable `y` is computed but never read. The compiler can remove the multiplication entirely because removing it cannot change what the program prints. The output is `10` whether or not `y` is computed, so the as-if rule permits the optimizer to drop it.

**Example 3 — instruction reordering**

```cpp
#include <iostream>

int main() {
    int a = 3;
    int b = 4;
    int sum = a + b;
    int product = a * b;
    std::cout << sum << " " << product << "\n";
    return 0;
}
```

Nothing in the language requires the addition to execute before the multiplication. The compiler (or the CPU itself) may compute both simultaneously, reorder them, or fold both into constants (`7` and `12`). The user sees `7 12` either way, so the as-if rule is satisfied.

The key insight: the *abstract machine* described by the C++ standard always executes statements in order with the values you specified. The *real machine* is free to deviate as long as the observable outputs match.

## Common mistakes

**Mistake 1 — assuming a variable must exist in memory**

Beginners sometimes write code like this and expect to watch a variable being "stored" and then "read back":

```cpp
int main() {
    const int x = 42;
    // assume x occupies a register or a stack slot
    return x - x;  // always 0
}
```

The optimizer sees `x - x` is always `0` and may replace the entire function body with `return 0;`, removing `x` entirely. There is no bug here — the behavior is correct — but the assumption that `x` necessarily occupies memory is wrong. Under the as-if rule, `x` can be eliminated if the optimizer can prove it is not needed.

**Mistake 2 — expecting compile-time computation to require `constexpr`**

Some learners believe constant folding only happens when you explicitly write `constexpr`. In fact, the as-if rule allows the compiler to fold any expression whose value it can determine at compile time, even without `constexpr`:

```cpp
const int a = 5;
const int b = a * 3;   // compiler may fold this to 15 even without constexpr
```

However, `constexpr` (covered in a later lesson) gives you a *guarantee* that the evaluation happens at compile time. Without it, folding is a permitted optimization, not a requirement. The lesson on constant expressions will make this distinction precise.

**Mistake 3 — relying on the order of side-effect-free subexpressions**

If two subexpressions have no side effects (no I/O, no writes to shared memory), the compiler may evaluate them in any order or in parallel. Code that silently depends on a particular evaluation order can behave unexpectedly once optimization is enabled. For now this is mostly a mental model note — the kinds of programs you are writing are simple enough that ordering rarely matters — but it becomes important later when functions have side effects.

## When to use this

You do not "use" the as-if rule the way you use a language feature. It is a rule the compiler follows. Understanding it helps you write cleaner code: you do not need to manually precompute constants like `86400` when the compiler will do it for you. You do not need to remove intermediate variables for performance — the optimizer already does that.

The as-if rule also motivates the `const` keyword from the "Constant variables" lesson. Marking a variable `const` signals to both the compiler and the reader that the value will not change, giving the compiler more freedom to optimize. It is also the conceptual foundation for `constexpr`, which takes compile-time evaluation from an optional optimization to a language-level guarantee.

## The idea

So far, every program you have written runs from top to bottom exactly once. Each statement executes once, and then it is done. But many real tasks require doing the same thing many times: read ten numbers from the user, count down from ten to zero, keep asking for input until the user enters something valid. A loop is the construct that lets you repeat a block of statements automatically, without copying the code over and over.

A `while` loop is the most fundamental loop in C++. The mental model is simple: check a condition, and if it is true, execute the body; check again; repeat until the condition becomes false. Picture a security guard checking badges at a door — as long as someone is in line, check the next badge and repeat. When the line is empty, stop. The condition is the badge check; the loop body is the check-and-admit action; the loop stops when the queue is empty (condition false).

## How it works

The syntax is `while (condition) { body }`. After each time the body runs, the condition is re-evaluated. If it is still true, the body runs again. When the condition is false on any evaluation (including the very first one), execution jumps past the closing brace of the loop.

```cpp
#include <iostream>

int main() {
    int count = 1;
    while (count <= 5) {
        std::cout << count << "\n";
        ++count;
    }
    return 0;
}
```

Output:
```
1
2
3
4
5
```

`count` starts at 1. Each iteration checks `count <= 5`, prints `count`, and increments it. When `count` reaches 6, the condition is false and the loop exits. A variable like `count` that controls a loop is called a loop counter or loop variable.

If the condition is false before the loop body ever runs, the body is skipped completely — the loop executes zero times:

```cpp
#include <iostream>

int main() {
    int x = 10;
    while (x < 5) {
        std::cout << "never printed\n";
        ++x;
    }
    std::cout << "done\n";
    return 0;
}
```

Output: `done`. `x` is already 10, which is not less than 5, so the body never runs.

A common loop pattern accumulates a running total:

```cpp
#include <iostream>

int main() {
    int sum = 0;
    int n = 1;
    while (n <= 100) {
        sum += n;
        ++n;
    }
    std::cout << "Sum 1-100: " << sum << "\n";
    return 0;
}
```

Output: `Sum 1-100: 5050`. `sum` is initialized to 0 before the loop and updated each iteration. After the loop, it holds the result. This pattern — initialize outside, update inside, use after — is the standard way to accumulate values.

**Infinite loops**

If the condition never becomes false, the loop runs forever. `while (true)` is a deliberate infinite loop — it will not stop on its own. You need a `break` statement (covered in a later lesson) or an early `return` to exit it. Accidentally writing an infinite loop (because you forgot to update the loop variable) is a very common beginner bug:

```cpp
int x = 0;
while (x < 5) {
    std::cout << x << "\n";
    // BUG: forgot ++x — runs forever printing 0
}
```

## Common mistakes

**Forgetting to update the loop variable.** If the variable that makes the condition eventually false never changes inside the loop body, the loop runs forever. Always verify that at least one statement in the body modifies the condition expression:

```cpp
int count = 0;
while (count < 3) {
    std::cout << "hello\n";
    // Missing ++count — infinite loop
}
```

**Off-by-one errors.** A loop that should print 1 through 5 but uses `count < 5` instead of `count <= 5` prints only 1 through 4. Similarly, starting `count` at 0 instead of 1 with `count <= 5` prints 0 through 5 (six values). Test the first and last expected values mentally before running.

**Placing the semicolon immediately after the `while` condition.** A semicolon turns the while into an empty loop body — the loop spins on the condition (possibly forever) and the actual block below it runs only once afterward:

```cpp
int i = 0;
while (i < 5);   // BUG: semicolon here — infinite empty loop
{
    std::cout << i << "\n";
    ++i;
}
```

The `{...}` block below runs as a separate statement after the loop. With `i` never incremented inside the loop, this spins forever. The fix is to remove the semicolon.

## When to use this

Use `while` when you need to repeat something but the number of repetitions is not known in advance — for example, reading input until a sentinel value, counting occurrences of something, or searching until a condition is met. When you know the exact number of repetitions ahead of time, a `for` loop (covered later) is usually more idiomatic because it groups the initialization, condition, and update in one line.

Compared to `goto`-based loops (which you saw in the previous lesson), `while` is unambiguously better: the condition is right there at the top, the body is a clearly delimited block, and there are no labels to track. Modern C++ code never simulates loops with `goto`.

## The idea

Most loops in programs fall into one of two patterns: "keep going until some condition changes" or "do this exactly N times." The `while` and `do-while` loops are well-suited to the first pattern. The `for` loop is the language's answer to the second: when you know the number of iterations up front, or when you need a counter that starts at one value, changes by a fixed amount each iteration, and stops at another value, the `for` loop packages all of that into a single readable line.

Think of the `for` loop as a compact checklist: set up, check, do the work, update — repeated until the check fails. Nothing about that logic is new; it is exactly what you would write with a `while` loop. The `for` loop simply gives each part its own designated slot so a reader can see the entire iteration contract at a glance without scanning through the body.

## How it works

A `for` loop has three clauses inside its parentheses, separated by semicolons:

```
for (init-statement; condition; end-expression) {
    body
}
```

- **init-statement** runs once before the first iteration. It is typically a variable declaration.
- **condition** is checked before each iteration (including the first). If false, the loop exits immediately.
- **end-expression** runs after each iteration, before the condition is re-evaluated. It is typically an increment or decrement.

```cpp
#include <iostream>

int main() {
    for (int i{1}; i <= 5; ++i) {
        std::cout << i << "\n";
    }
    return 0;
}
```

This prints 1 through 5. `int i{1}` is the init-statement; `i <= 5` is the condition; `++i` is the end-expression. After printing 5, `++i` makes `i` equal to 6, the condition is false, and the loop exits. The variable `i` is scoped to the loop — it cannot be accessed after the closing brace.

The clauses are flexible. You can count downward, use a different step size, or leave clauses empty:

```cpp
#include <iostream>

int main() {
    for (int i{10}; i >= 1; i -= 3) {
        std::cout << i << " ";
    }
    std::cout << "\n";
    return 0;
}
```

This prints `10 7 4 1`. The step is `-3`; the loop stops when `i` drops below 1.

An off-scope counter: sometimes you need the counter's final value after the loop. Declare it before the `for`:

```cpp
#include <iostream>

int main() {
    int count{0};
    for (count = 1; count <= 100; ++count) {
        if (count * count > 50) {
            break;
        }
    }
    std::cout << "Stopped at: " << count << "\n";
    return 0;
}
```

Here `count` is declared outside the loop so it remains accessible after the loop body exits. This is the exception, not the rule — prefer keeping the counter scoped to the loop whenever the post-loop value is not needed.

## Common mistakes

**Off-by-one errors.** The most frequent `for` loop mistake is using `<` when you want `<=` (or vice versa):

```cpp
// Intended: print 1 through 10
for (int i{1}; i < 10; ++i) {   // prints 1 through 9 — off by one
    std::cout << i << " ";
}

// Correct
for (int i{1}; i <= 10; ++i) {
    std::cout << i << " ";
}
```

When starting at 0 and targeting N elements, `i < N` is correct. When starting at 1 and targeting N, `i <= N` is correct. Read both aloud before writing: "while i is less than N" versus "while i is less than or equal to N."

**Modifying the loop counter inside the body.** Changing `i` inside the body in addition to the end-expression creates a double-step that is hard to reason about and often produces an infinite loop or skips values:

```cpp
for (int i{0}; i < 10; ++i) {
    ++i;  // increments again — prints only 0, 2, 4, 6, 8
    std::cout << i << " ";
}
```

Unless you deliberately want a non-unit step, keep all counter modifications in the end-expression and leave the body free of counter changes.

**Expecting the loop variable to be accessible after the loop.** When declared in the init-statement, the variable's scope ends with the loop:

```cpp
for (int i{0}; i < 5; ++i) { /* ... */ }
std::cout << i;  // compile error: 'i' was not declared in this scope
```

If you need the value after the loop, declare the variable before the `for` statement as shown in the third example above.

## When to use this

Use a `for` loop whenever the iteration count is known in advance or the loop is driven by a counter that starts, steps, and stops at defined values. It is the standard tool for counting from A to B, iterating over index ranges, and repeating an action exactly N times.

When the number of iterations depends on runtime state that can change unpredictably mid-loop — such as reading until end-of-input or waiting for a condition that is hard to pre-compute — a `while` loop (from "Introduction to loops and while statements") is usually clearer. The `do-while` (from "Do while statements") remains the right choice whenever the body must run at least once before the condition is evaluated.

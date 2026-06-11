## The idea

Every loop you have written so far runs from start to finish according to its condition. Sometimes a loop needs to exit the moment a particular condition is met, without finishing the current iteration or re-checking the loop condition. Other times a loop should skip the rest of one iteration and move straight to the next. C++ provides two keywords for these two needs: `break` and `continue`.

Think of a `break` as a fire exit: no matter where you are in the building (the loop body), you walk straight out and the loop is over. Think of `continue` as skipping a floor: you stop what you are doing on the current floor, go back to the elevator (the condition check), and move to the next floor. Both keywords work inside `for`, `while`, and `do-while` loops, as well as inside `switch` statements.

## How it works

**break** exits the innermost enclosing loop (or switch) immediately. Execution resumes at the first statement after the loop's closing brace.

```cpp
#include <iostream>

int main() {
    for (int i{1}; i <= 10; ++i) {
        if (i == 5) {
            break;
        }
        std::cout << i << " ";
    }
    std::cout << "\n";
    return 0;
}
```

Output: `1 2 3 4` (the loop exits before printing 5). When `i` reaches 5, `break` fires, the for loop ends, and control jumps to `std::cout << "\n"`.

**continue** skips the rest of the current loop body and jumps to the end-expression (in a `for` loop) or back to the condition check (in a `while` or `do-while`).

```cpp
#include <iostream>

int main() {
    for (int i{1}; i <= 8; ++i) {
        if (i % 2 == 0) {
            continue;
        }
        std::cout << i << " ";
    }
    std::cout << "\n";
    return 0;
}
```

Output: `1 3 5 7`. When `i` is even, `continue` skips `std::cout`, then `++i` runs, then the condition is rechecked — so even numbers are never printed.

**break and continue in while loops** work the same way. In a `while` loop, `continue` jumps to the condition check at the top; in a `do-while`, it jumps to the condition at the bottom:

```cpp
#include <iostream>

int main() {
    int n{0};
    while (n < 20) {
        ++n;
        if (n % 3 == 0) {
            continue;  // skip multiples of 3
        }
        if (n > 10) {
            break;     // stop once past 10
        }
        std::cout << n << " ";
    }
    std::cout << "\n";
    return 0;
}
```

Output: `1 2 4 5 7 8 10`. Multiples of 3 are skipped by `continue`; once `n` exceeds 10 the `break` fires and the loop ends.

## Common mistakes

**break only exits the innermost loop.** If you have nested loops and use `break` inside the inner loop, only the inner loop exits. The outer loop keeps running:

```cpp
#include <iostream>

int main() {
    for (int i{1}; i <= 3; ++i) {
        for (int j{1}; j <= 3; ++j) {
            if (j == 2) {
                break;  // exits the INNER loop only
            }
            std::cout << i << "," << j << " ";
        }
    }
    std::cout << "\n";
    return 0;
}
```

Output: `1,1 2,1 3,1`. Each time `j` reaches 2 the inner loop breaks, but the outer loop continues with the next value of `i`. Many beginners expect this to stop all printing after the first `break`.

**Using continue in a while loop without updating the counter.** Forgetting to advance the loop variable before `continue` in a `while` loop creates an infinite loop:

```cpp
int i{0};
while (i < 10) {
    if (i % 2 == 0) {
        continue;    // i is never incremented when even → infinite loop
    }
    ++i;
    std::cout << i << "\n";
}
```

The `continue` jumps back to the condition check, but `i` is still 0, so the condition is still true, and the loop runs forever. In a `for` loop this is not a problem because `continue` always runs the end-expression (`++i`) before re-checking the condition. In `while` loops, make sure all paths through the body update the loop variable.

**Overusing break and continue.** A single `break` or `continue` per loop is usually fine and clear. Multiple `break` or `continue` statements scattered through a loop body make it hard to trace execution. When the logic becomes complex, restructuring the condition or splitting into smaller functions is often cleaner.

## When to use this

Use `break` when you are searching for something and can stop as soon as you find it — scanning values, reading input until a sentinel, or exiting after the first error. Use `continue` when most iterations are normal but a handful should be skipped — filtering out unwanted values without nesting the main logic inside an extra `if` block.

Both keywords connect naturally to loops introduced in "Introduction to loops and while statements," "Do while statements," and "For statements." They can also exit a `switch` case, which was covered in "Switch statement basics." Avoid using them as a substitute for clear conditional logic; a loop with a well-written condition is almost always more readable than one peppered with `break` and `continue`.

## The idea

Finding a bug is not random luck — it is a repeatable process. Professional programmers follow a consistent sequence of steps every time something goes wrong, just like a doctor follows a diagnostic procedure rather than guessing at treatments. The debugging process is that procedure applied to code.

The key insight is that bugs do not hide. A program is deterministic: given the same inputs and the same state, it always does the same thing. A bug is a place where the program's actual behavior diverges from what you expected. Your job is to find that divergence. You do it by forming a hypothesis about what the code does, testing that hypothesis against the program's actual behavior, and narrowing down the location of the disagreement until you find the exact statement that is wrong.

This lesson names the steps so you can apply them consciously instead of thrashing.

## How it works

The debugging process has four steps, applied repeatedly until the bug is found:

**Step 1: Reproduce the problem.** You must be able to trigger the bug reliably before you can investigate it. A bug you cannot reproduce is nearly impossible to fix because you have no way to know when it is gone. Find the smallest input that causes the wrong behavior — this is your test case.

**Step 2: Narrow down the location.** Most programs are longer than the bug. You need to isolate which part of the code is responsible. This usually means identifying what the program *should* compute at various points, then checking whether it *actually* computes that.

```cpp
#include <iostream>

int square(int n)
{
    return n + n;   // bug: should be n * n
}

int main()
{
    int x = 5;
    std::cerr << "x = " << x << "\n";             // expect: 5
    int result = square(x);
    std::cerr << "result = " << result << "\n";    // expect: 25
    std::cout << result << "\n";
    return 0;
}
```

By printing intermediate values to `std::cerr`, you can see that `x` is correct but `result` is `10` instead of `25`. The bug must be inside `square`, not in `main`. You have narrowed it down.

`std::cerr` is the right output stream for diagnostic messages. It goes to the same terminal as `std::cout` but is a separate stream — it is not buffered the same way and is considered the "error" channel, so your debug output does not mix with the real program output.

**Step 3: Fix the bug.** Once you know which statement is wrong, fix it. This step sounds obvious but has a subtle trap: fix one thing at a time. If you change three things simultaneously and the bug disappears, you do not know which change fixed it, or whether two of the changes introduced new problems.

**Step 4: Verify the fix.** Run your test case again. Verify the output is now correct. Then think about whether your fix could have broken something else, and test those paths too.

These four steps cycle. Sometimes fixing one bug reveals another. The process repeats until all known failures are gone.

```cpp
#include <iostream>

int double_value(int n)
{
    return n * 2;
}

int main()
{
    int input;
    std::cin >> input;
    std::cerr << "[debug] input = " << input << "\n";
    int result = double_value(input);
    std::cerr << "[debug] result = " << result << "\n";
    std::cout << result << "\n";
    return 0;
}
```

This pattern — adding `std::cerr` checkpoints, observing values, removing the checkpoints once the bug is found — is the most common form of manual debugging.

## Common mistakes

**Changing code before reproducing the bug.** Beginners often read the code, guess at what seems wrong, and start changing things. This is backwards. If you have not confirmed that you can reproduce the problem with a specific input, you have no way to verify your fix. Always establish a reliable failing case first.

**Fixing the symptom instead of the cause.** Suppose `double_value` returns `0` and you "fix" this by printing a hardcoded value. The underlying mistake — perhaps the variable was never initialized correctly — still exists. A real fix must address the root cause. The four-step process guards against this by requiring you to understand the location and nature of the bug before touching the code.

**Removing debug output before the bug is confirmed fixed.** It is tempting to clean up `std::cerr` statements as you go, but if you remove them prematurely and the bug was only partially fixed, you lose visibility. Leave all debug output in place until the final test passes, then remove it all at once.

## When to use this

Apply the four-step process every time a program behaves unexpectedly — both during early practice exercises and in larger programs. The discipline of reproducing first, then narrowing, then fixing one thing at a time, then verifying, is what separates debugging that works from debugging that takes an hour and leaves you less certain than when you started.

In the next few lessons you will see specific tactics for Step 2 (narrowing down), including more structured use of `std::cerr` output, commenting out code, and interactive debuggers. All of those tools are ways to execute the same four-step process more efficiently.

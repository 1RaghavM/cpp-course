## The idea

Knowing that you should follow a debugging process does not tell you *how* to narrow down a bug's location in a program of any real size. A strategy for debugging answers that question: it gives you a principled way to close in on the defective code without reading every line from top to bottom and hoping inspiration strikes.

The core idea is binary search applied to code. You do not need to examine every statement — you need to find the boundary between "code that behaves correctly" and "code that does not." Every check you perform eliminates roughly half the remaining possibilities. Starting from a known good state and working forward toward the bad output, or starting from the bad output and tracing backward toward the source, both converge faster than linear reading.

## How it works

**Reproduce with the smallest possible input.** Before you start tracing, reduce the failing case to its minimal form. A program that breaks on 10 lines of input probably also breaks on 1 line. The smaller the input, the fewer branches of logic are active, so there is less to examine.

**Add diagnostic output at midpoints.** Once you have a failing test case, print intermediate values — particularly values that should be correct at a given checkpoint. If the value is correct at the midpoint, the bug is in the second half. If it is already wrong at the midpoint, the bug is in the first half. Repeat.

```cpp
#include <iostream>

int scale(int n)
{
    return n * 3;
}

int offset(int n)
{
    return n - 10;   // bug: should be n + 10
}

int main()
{
    int x;
    std::cin >> x;
    int after_scale = scale(x);
    std::cerr << "after scale: " << after_scale << "\n";   // midpoint check
    int final_val = offset(after_scale);
    std::cerr << "final: " << final_val << "\n";
    std::cout << final_val << "\n";
    return 0;
}
```

For input `5`, the expected output is `25` (5 * 3 + 10). Running this, you see `after scale: 15` (correct) and `final: 5` (wrong). The midpoint check confirms `scale` is fine. The bug must be in `offset`. You look at `offset` and see `n - 10` where it should be `n + 10`.

**Comment out sections of code.** Sometimes a function produces the wrong output but the bug could be in the function itself or in the value it receives. Temporarily replacing the function body with a hardcoded known-good return value lets you test whether the rest of the program works correctly, ruling out the rest and confirming the bug is local to that function.

```cpp
#include <iostream>

int compute(int a, int b)
{
    // temporarily return a known value to isolate the caller
    return 15;   // hardcoded for testing
    // return a * b + a;  // the real body — commented out while testing
}

int main()
{
    int a;
    int b;
    std::cin >> a >> b;
    int result = compute(a, b);
    std::cout << result << "\n";   // should print 15 if main is correct
    return 0;
}
```

If the program prints `15` when you hardcode the return, you have confirmed `main` is not corrupting the value. The bug is inside `compute`, not in how `main` calls it.

**Read error messages to the end.** Compiler error messages are long but not random. The first line names the file and line number. Subsequent lines explain why that line is wrong. Beginners often read the first line and start guessing; the actual explanation — "expected `;` before `return`" or "no matching function for call to `foo`" — is on the lines that follow.

## Common mistakes

**Starting at the wrong end.** When a program prints the wrong final answer, beginners often start reading from the output statement backward, examining only the immediate calculation. But the wrong value might have been computed three function calls earlier and simply passed through. Always start the diagnostic output at the beginning of the computation pipeline, not at the end.

**Removing diagnostic output too early.** You add `std::cerr` lines to narrow down the bug, find it, fix it — and immediately delete all the debug output before rerunning the test. If the fix was incomplete, you have lost your instrumentation and must add it again. Keep all diagnostic output in place until the final test passes cleanly, then delete it all at once.

**Assuming the simplest explanation.** Sometimes two bugs exist simultaneously, and fixing the obvious one reveals a second problem underneath. Seeing the wrong output change but remain wrong after a fix is a sign of this. The strategy still applies: confirm the first fix is correct at its checkpoint, then continue the search for the second defect.

## When to use this

Use this strategy from the moment a program produces wrong output — not just for the exercises in this chapter, but every time. Programs that seem "too small to bother" with a systematic strategy are the ones where beginners spend 40 minutes staring at code that has a two-character typo in the middle.

The midpoint-check pattern is the same skill that grows into using a debugger's breakpoints later in this chapter, and into writing unit tests in professional code. Understanding it now as a manual process makes the automated tooling that comes later much easier to understand.

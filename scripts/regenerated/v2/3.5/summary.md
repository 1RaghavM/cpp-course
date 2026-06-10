## The idea

When a program produces wrong output and you cannot immediately spot the cause, you need a systematic way to narrow down where things go wrong. In the previous lesson ("Basic debugging tactics") you learned to add `std::cerr` statements to print variable values while the program runs. This lesson extends that toolkit with two complementary techniques: using `std::cerr` to trace *which code path* was actually taken, and commenting out sections of code to isolate a problem. Together these tactics let you shrink the suspicious region of code until the bug has nowhere left to hide.

Think of it like a plumber tracking a leak. You can't see inside the walls, so you shut off one branch of pipes at a time until the dripping stops. The branch you shut off last is the one with the hole. Commenting out code and strategically placed `std::cerr` messages are your shutoff valves.

## How it works

### Technique 1 — tracing execution flow with `std::cerr`

You already know that `std::cerr` prints to the error stream without buffering. Beyond printing variable values, you can also print short *trace messages* — labels that tell you which function was called and with what arguments. This is especially useful when you suspect a function is being called with the wrong value, or is never called at all.

```cpp
#include <iostream>

int addTwo(int x) {
    std::cerr << "[trace] addTwo called x=" << x << "\n";
    return x + 2;
}

int main() {
    std::cerr << "[trace] entering main\n";
    int result = addTwo(5);
    std::cerr << "[trace] addTwo returned " << result << "\n";
    std::cout << result << "\n";
    return 0;
}
```

Each `[trace]` line goes to `stderr`. If `addTwo` never appeared in the trace output, you would know the function is never being called and you could look at the call site instead of the function body.

### Technique 2 — printing intermediate values at multiple checkpoints

You can instrument several points in a computation to see how a value changes as it moves through the program. This is often faster than reading the code because it shows you exactly where a value becomes wrong.

```cpp
#include <iostream>

int scale(int value, int factor) {
    std::cerr << "[debug] scale: value=" << value
              << " factor=" << factor << "\n";
    int result = value * factor;
    std::cerr << "[debug] scale: result=" << result << "\n";
    return result;
}

int main() {
    int x = 3;
    std::cerr << "[debug] main: x before scale=" << x << "\n";
    int y = scale(x, 4);
    std::cerr << "[debug] main: y after scale=" << y << "\n";
    std::cout << y << "\n";
    return 0;
}
```

Running this prints to stderr: the value of `x` before the call, both arguments inside `scale`, the intermediate result, and then `y` in main. If the output had been `9` instead of `12`, you could immediately see that `factor` was `3` when it should have been `4`.

### Technique 3 — commenting out code to narrow the suspect region

If you have a block of code you suspect is causing a problem, comment it out and re-run. If the bug disappears, the bug is inside the commented block. If the bug remains, the bug is elsewhere. Repeat with smaller and smaller sections until you have isolated the exact line.

```cpp
#include <iostream>

int compute(int a, int b) {
    int step1 = a * 2;
    // int step2 = step1 / b;    // commented out to test if this caused wrong output
    int step3 = step1 + b;
    return step3;
}

int main() {
    std::cout << compute(3, 4) << "\n";
    return 0;
}
```

With `step2` commented out, the program runs without it. If the output is now correct, you have confirmed that `step2` (or the way its result was used) was the problem. Be careful: commenting out a variable declaration can cause compile errors on lines that reference that variable below — start with statements that have no dependents.

## Common mistakes

**Mistake 1 — Using `std::cout` for trace messages instead of `std::cerr`**

It is tempting to use `std::cout` for debug messages because it's familiar, but `std::cout` is buffered. If your program crashes before flushing the buffer, the debug message never appears. Worse, `std::cout` output mixes with your real output, making it impossible to tell diagnostic messages from program output.

```cpp
// Wrong — debug noise mixed with real output, may not appear on crash
std::cout << "DEBUG: x = " << x << "\n";
std::cout << x << "\n";  // real output
```

```cpp
// Correct — debug on stderr, real output on stdout
std::cerr << "DEBUG: x = " << x << "\n";
std::cout << x << "\n";
```

**Mistake 2 — Commenting out too much at once**

It feels efficient to comment out half the function in one shot, but this can break the code in ways that have nothing to do with your bug — a variable declared inside the commented block may be referenced below it, causing a new compile error. Start with small, self-contained sections to avoid generating new, misleading errors.

**Mistake 3 — Forgetting to remove debug statements after fixing the bug**

After a debugging session, it is easy to leave `std::cerr` trace lines scattered throughout the code. Those lines are not wrong in a correctness sense, but they are noise that makes real error messages harder to spot later. Establish a habit: once you have found and fixed the bug, search for `[trace]` or `[debug]` markers and remove them all.

## When to use this

Use `std::cerr` trace messages any time a program produces wrong results and you cannot immediately see why. They are especially valuable when a function is called multiple times and you need to know which particular call produces the bad value. Commenting out code is most useful when you have a long section of statements and need to narrow down which statement is responsible — it is faster than adding and removing individual `std::cerr` lines.

Both techniques are search strategies, not a substitute for reading and understanding the code. Once you have identified exactly which line contains the bug, you switch back to careful code reading to understand *why* that line is wrong. These tactics are covered in "Basic debugging tactics" and "A strategy for debugging"; master them before moving on to the interactive debugger lessons.

## The idea

Debugging is reactive — you fix bugs after they surface. A smarter strategy is to prevent bugs from reaching your program in the first place, or to catch them so early that fixing them costs almost nothing. "Finding issues before they become problems" is the shift from reactive to proactive: you design and write code in ways that make errors impossible, obvious, or immediately visible rather than letting them hide until they cause mysterious failures.

Think of it like smoke detectors versus fire brigades. Both deal with fires, but a smoke detector alerts you the moment something smolders, when the damage is still tiny. Waiting for a raging fire (a crash or wrong output in production) means much more work to diagnose and repair. Proactive coding practices are your smoke detectors.

This lesson covers two complementary tools in that spirit: compiler warnings (the compiler as an automated code reviewer) and defensive programming via `std::cerr` statements placed at key checkpoints, both working together before you ever step through a debugger.

## How it works

**Compiler warnings: turning the compiler into a reviewer**

By default, `g++` will compile many dubious-but-legal programs without comment. Enable warnings with `-Wall -Wextra` and those programs generate diagnostic messages before they even run. Treating warnings as a mandatory review step is one of the highest-leverage habits a beginner can build.

```cpp
#include <iostream>

int main()
{
    int x;
    std::cout << x << '\n';  // uninitialized read
    return 0;
}
```

Compiled with `g++ -std=c++20 -Wall -Wextra`, this emits something like:

```
warning: 'x' is used uninitialized [-Wuninitialized]
```

The program would have compiled silently without `-Wall -Wextra` and printed garbage or crashed — only at runtime and only sometimes, making the bug difficult to reproduce. The warning surfaces the problem at compile time, immediately.

**`std::cerr` checkpoints: visibility into live values**

Even with warnings clean, logic bugs slip through. Placing `std::cerr` lines at the entry and exit points of functions — printing arguments and results — gives you a live trace without a debugger session. `std::cerr` is the right stream for this: it is unbuffered (writes appear immediately, even if the program crashes before flushing `std::cout`) and it goes to a separate stream so it does not contaminate your output.

```cpp
#include <iostream>

int computeArea(int width, int height)
{
    std::cerr << "[computeArea] width=" << width
              << " height=" << height << '\n';
    int area = width * height;
    std::cerr << "[computeArea] returning " << area << '\n';
    return area;
}

int main()
{
    int result = computeArea(4, 5);
    std::cout << result << '\n';
    return 0;
}
```

The `std::cerr` lines cost nothing in correctness — they print to stderr, not stdout — and they are easy to remove or comment out once the function is verified. Running this, you see on stderr:

```
[computeArea] width=4 height=5
[computeArea] returning 20
```

And on stdout: `20`. Separate streams, no pollution.

**Combining both: a discipline, not a one-time act**

Warnings and `std::cerr` checkpoints complement each other. Compiler warnings catch structural problems before the program runs; `std::cerr` tracing catches wrong runtime values that no compiler can detect. Apply them together from the start of a new function, not as a rescue operation after something has already broken.

```cpp
#include <iostream>

int tripleValue(int n)
{
    std::cerr << "[tripleValue] n=" << n << '\n';
    int result = n + n + n;
    std::cerr << "[tripleValue] result=" << result << '\n';
    return result;
}

int main()
{
    int x = 0;
    std::cin >> x;
    std::cout << tripleValue(x) << '\n';
    return 0;
}
```

Compiling this with `-Wall -Wextra` produces no warnings. Running it with input `4` shows `[tripleValue] n=4` and `[tripleValue] result=12` on stderr, and `12` on stdout. If the result were wrong, the trace would immediately show where the calculation diverged.

## Common mistakes

**Mistake 1 — compiling without `-Wall -Wextra` and missing silent errors**

Many beginners compile with just `g++ file.cpp` and see no messages, assuming the code is clean. The compiler's default warning level is very low. An uninitialized variable, a signed/unsigned comparison, or an unused parameter compiles silently. Adding `-Wall -Wextra` instantly reveals a category of errors that would otherwise only surface as intermittent runtime bugs.

```cpp
// Compiles with no message under default settings, but -Wall -Wextra warns:
// warning: unused variable 'temp' [-Wunused-variable]
int main()
{
    int temp = 42;
    return 0;
}
```

**Mistake 2 — using `std::cout` instead of `std::cerr` for debug output**

`std::cout` is buffered. If a program crashes before flushing its buffer, debug print statements that used `std::cout` may never appear on screen. `std::cerr` is unbuffered: each write goes directly to the terminal. Using `std::cout` for debug traces also mixes debug output with the program's actual output, making test-case comparisons fail. Always use `std::cerr` for diagnostic traces.

**Mistake 3 — leaving `std::cerr` traces in production code**

`std::cerr` traces are a temporary scaffold, not permanent infrastructure. Beginners sometimes forget to remove them; the program then dumps diagnostic noise every time it runs, cluttering the user's terminal and mixing with real output if they redirect stderr. The standard practice is to comment out or delete `std::cerr` lines once a function is confirmed correct. Some teams wrap them in `#ifdef DEBUG` guards, but for now, a simple comment-out is the right move.

## When to use this

Enable `-Wall -Wextra` on every compilation from the very first line you write — not just when something seems wrong. This is a habit, not a debugging technique. Add `std::cerr` checkpoints whenever you write a new function that transforms data and you are not completely sure the transformation is correct, or when an existing function starts producing output you cannot explain. The combination is most valuable in the early stages of a program, before a test harness or debugger session exists. Once a function passes all its test cases and its `std::cerr` traces look clean, remove the traces and rely on the debugger (covered in lessons "Using an integrated debugger: Stepping" through "Using an integrated debugger: The call stack") for deeper investigations.

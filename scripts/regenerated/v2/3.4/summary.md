## The idea

You have a failing program and a strategy for finding the bug. Now you need the actual tools to execute that strategy. Basic debugging tactics are the hands-on techniques you reach for first, before any special tooling is needed: printing intermediate values to `std::cerr`, adding diagnostic labels to your output, and commenting out code to isolate the problem to a smaller region. These three tactics are sufficient to debug most early-chapter programs and are the direct mechanical implementation of the strategy from the previous lesson.

Think of them as breadcrumbs: you drop checkpoints into the code to create a trail showing exactly what the program computed and in what order. When the trail diverges from your expectations, you have found the section that needs closer inspection.

## How it works

**Tactic 1: Print intermediate values with `std::cerr`.**

The most direct tactic is printing the values your program holds at key moments. Use `std::cerr` rather than `std::cout` so the debug output is on a separate stream and does not corrupt the program's real output.

```cpp
#include <iostream>

int area(int width, int height)
{
    std::cerr << "[area] width=" << width << " height=" << height << "\n";
    int result = width * height;
    std::cerr << "[area] returning " << result << "\n";
    return result;
}

int main()
{
    int w;
    int h;
    std::cin >> w >> h;
    std::cout << area(w, h) << "\n";
    return 0;
}
```

The `[area]` prefix tags each debug line with the function it came from. When you have several functions printing debug output simultaneously, these tags let you identify which function produced each line without ambiguity. This is a discipline worth building from the start: unlabeled debug output becomes impossible to read in any program longer than twenty lines.

**Tactic 2: Print a function's name at entry.**

When a program misbehaves and you are not sure which functions are even being called, printing a message at the top of each function entry is faster than reading the call logic.

```cpp
#include <iostream>

int double_it(int n)
{
    std::cerr << "[double_it] called with n=" << n << "\n";
    return n * 2;
}

int main()
{
    int x;
    std::cin >> x;
    int result = double_it(x);
    std::cout << result << "\n";
    return 0;
}
```

If you expected `double_it` to be called twice but see only one `[double_it]` line in the cerr output, you immediately know the second call is not happening — the bug is in the call logic, not inside `double_it`.

**Tactic 3: Comment out code to isolate the problem.**

When you suspect a particular section of code is introducing the bug, commenting it out and replacing it with a known-good stub confirms or refutes that suspicion without deleting anything.

```cpp
#include <iostream>

int mystery(int n)
{
    // return n * n - n;   // real body — commented out for testing
    return n;              // stub: identity, definitely not wrong
}

int main()
{
    int x;
    std::cin >> x;
    std::cerr << "[main] calling mystery with " << x << "\n";
    int r = mystery(x);
    std::cerr << "[main] got back " << r << "\n";
    std::cout << r * 2 << "\n";   // main's own computation
    return 0;
}
```

With the stub in place, if the output is still wrong, the bug must be in `main` itself. If the output is now correct, the bug is inside `mystery`. You restore the real body, narrow within it, and continue.

## Common mistakes

**Mixing debug output and real output on `std::cout`.** Printing debug messages to `std::cout` instead of `std::cerr` corrupts the program's output. Any test that checks `stdout` will fail even when the logic is correct. Always send diagnostic messages to `std::cerr`.

**Forgetting to remove debug output before final submission.** `std::cerr` output does not appear in `stdout`, so it will not break automated test cases — but it leaves clutter in the code. After a bug is confirmed fixed, delete all `std::cerr` statements. They are scaffolding, not permanent code.

**Commenting out too much at once.** If you comment out half the program looking for a bug, you are essentially doing a linear search from the top again. Comment out or stub one section at a time, verify the hypothesis for that section, then move forward. Each step should either confirm or refute one specific suspicion.

## When to use this

These tactics are always available, require no special tooling, and work in any C++ environment — an online judge, a server, an embedded system with no graphical debugger. They are the fallback when interactive debuggers are unavailable or inconvenient, and they remain useful even when an interactive debugger is at hand because inserting a `std::cerr` line is often faster than setting a breakpoint and navigating to the inspection panel.

In the following lessons you will use an interactive debugger, which automates much of what `std::cerr` does manually: it stops execution at chosen points and lets you inspect variable values without recompiling. The manual tactics from this lesson give you the mental model for what the interactive debugger is doing under the hood.

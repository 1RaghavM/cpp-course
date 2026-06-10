## The idea

An integrated debugger is a tool built into your development environment (like Visual Studio, VS Code, or CLion) that lets you pause a running program, examine variable values, and advance the program one step at a time. The most fundamental debugger operation is *stepping* — moving forward through your code in slow motion so you can watch exactly what happens on each line.

Think of it like a film editor scrubbing through footage frame by frame instead of watching it play at full speed. At normal speed you might miss a single bad frame; at one-frame-at-a-time you can spot exactly where the picture goes wrong.

Stepping does not change what the program does. It only changes *when* you can look at it. The program still executes every instruction in the same order; you just have the ability to pause between instructions and inspect state.

## How it works

### Starting a debug session

In most IDEs you start the debugger by clicking "Start Debugging" (often F5) rather than "Run". Before the first line of `main` executes, the debugger pauses and waits for you. At this point no user code has run yet.

### Three step commands

Every debugger offers three variations of stepping:

- **Step Over** (usually F10 or the "next" button): Execute the current line. If the line calls a function, the function runs completely and you land on the *next* line in the current function. You see the function's effect but not its internals.
- **Step Into** (usually F11): Execute the current line. If the line calls a function, the debugger follows the call *inside* that function and pauses at its first line. Use this when you suspect the bug is inside the called function.
- **Step Out** (usually Shift+F11): Continue running until the current function returns, then pause in the caller. Use this to escape from a function once you have seen enough.

### Watching what changes as you step

As you step, the debugger updates a *variables* panel showing every local variable's current value. You can see a variable go from uninitialised to 0 to 7 as you step through assignments. This is the core insight: you no longer need to mentally trace the program — you observe it directly.

Consider this program:

```cpp
#include <iostream>

int square(int n) {
    int result = n * n;
    return result;
}

int main() {
    int x = 4;
    int y = square(x);
    std::cout << y << "\n";
    return 0;
}
```

If you start the debugger and step over every line in `main`:
1. Pause before `int x = 4;` — `x` is uninitialized.
2. Step Over — `x` becomes `4`.
3. On `int y = square(x);` — Step Into to follow the call.
4. Inside `square`, step over `int result = n * n;` — `result` becomes `16`.
5. Step Out — you return to `main`, `y` is now `16`.
6. Step Over the `std::cout` line — output `16` appears.

### Stepping to find a bug

Suppose the same program had `n * 2` instead of `n * n`. Stepping into `square` would show `result` becoming `8`, not `16`. That single observation — the wrong value appearing at a specific step — tells you exactly which line caused the problem.

```cpp
#include <iostream>

int square(int n) {
    int result = n * 2;   // bug: should be n * n
    return result;
}

int main() {
    int x = 4;
    int y = square(x);
    std::cout << y << "\n";
    return 0;
}
```

Without the debugger you might stare at this for minutes. With stepping you see `result = 8` after stepping over that line, and you know immediately that the formula is wrong.

## Common mistakes

**Mistake 1 — Always using Step Over when the bug is inside a function**

If a function returns a wrong value and you step over the call, you only see the bad return value — you do not see *why* it is wrong. Step Into the function to watch its internal computation. Many beginners step over everything and then wonder why they cannot find the bug.

**Mistake 2 — Starting the debugger without a build that includes debug information**

Compilers can optimize code in ways that make debugger output confusing — lines skip around, variables appear to have nonsense values. Make sure you compile with debug symbols. In most IDEs the "Debug" build configuration handles this automatically. If you run the "Release" build in the debugger, values may not match the source code.

**Mistake 3 — Stepping line by line through code that is clearly correct**

Stepping is slow. If the first ten lines of `main` just initialize variables you already understand, step over them quickly. Place a breakpoint (covered in the next lesson) near the suspected problem instead of stepping from the very beginning every time. Stepping through a 200-line function one line at a time wastes time and is mentally exhausting.

## When to use this

Use the step-by-step debugger when `std::cerr` trace messages have narrowed your investigation down to one function, but you still cannot see which exact line produces the wrong value. Stepping inside that function is faster than adding ten more cerr messages and recompiling. It is also the right tool when a program crashes and you want to see which line triggers the crash — step forward until the program dies and you know exactly which statement caused it.

When the bug is in a tight loop that runs thousands of times, plain stepping becomes tedious. In that case you want breakpoints with conditions (next lesson) rather than stepping from the beginning.

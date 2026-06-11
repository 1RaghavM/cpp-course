## The idea

Stepping through code one line at a time is powerful, but it is slow. When you have a program with hundreds of lines and you know the bug is somewhere in the middle, stepping from line one would waste minutes. Breakpoints solve this problem. A *breakpoint* is a marker you place on a specific line of source code that tells the debugger: "pause here before executing this line." When you press Run (or Continue), the program runs at full speed until it reaches a breakpoint, then stops and gives you control.

Think of breakpoints like checkpoints in a race. Instead of watching every centimeter of the track, you place an official at a specific point and only pay attention when a runner crosses that mark. You get the normal speed of a real race everywhere else, but precise observation exactly where you need it.

Breakpoints and stepping are complementary: you use breakpoints to jump quickly to the region you care about, then use stepping to examine that region in detail.

## How it works

### Setting a breakpoint

In most IDEs you set a breakpoint by clicking in the margin to the left of a line number. A red dot (or similar marker) appears. When you start the debugger and press Run (F5/Continue), the program runs until that line is about to execute, then pauses.

Consider a program that computes a running total across several calls:

```cpp
#include <iostream>

int accumulate(int running, int next) {
    return running + next;
}

int main() {
    int total = 0;
    total = accumulate(total, 10);
    total = accumulate(total, 20);
    total = accumulate(total, 30);
    std::cout << total << "\n";
    return 0;
}
```

If you suspect the second call to `accumulate` is wrong, you place a breakpoint on the *third* `accumulate` call (the one with `30`). When you press Run, the program executes the first two calls at full speed, then pauses right before the third. You can now inspect `total` — if it is `30` at that point (it should be), the first two calls were correct.

### Continue (Run)

Once paused at a breakpoint, you can either step (one line at a time) or press **Continue** to run until the next breakpoint or the end of the program. You can set multiple breakpoints and use Continue to jump between them.

### The run-to-cursor shortcut

Some debuggers let you right-click a line and choose "Run to cursor" — this acts as a temporary one-shot breakpoint. The program runs until it reaches that line, then pauses. Nothing is left behind when you stop the session.

### Using `std::cerr` to narrow down *where* to set a breakpoint

Before reaching for the debugger, you can use `std::cerr` trace messages (from the previous lessons) to figure out roughly where the bug is. Once you know which function is misbehaving, you set a breakpoint at its first line and use stepping to examine it precisely. The two techniques work best together.

```cpp
#include <iostream>

int multiply(int x, int factor) {
    std::cerr << "[debug] multiply x=" << x << " factor=" << factor << "\n";
    return x * factor;
}

int main() {
    int a = multiply(5, 3);
    std::cerr << "[debug] a=" << a << "\n";
    int b = multiply(a, 2);
    std::cerr << "[debug] b=" << b << "\n";
    std::cout << b << "\n";
    return 0;
}
```

If the cerr output shows that `a` is already wrong, you know to set a breakpoint inside `multiply` and step through it. If `a` is correct but `b` is wrong, your breakpoint goes on the second `multiply` call.

## Common mistakes

**Mistake 1 — Setting a breakpoint on the wrong line**

A breakpoint pauses *before* the line executes. If you set a breakpoint on `int y = square(x);`, the debugger stops before that assignment runs, so `y` is still uninitialized at that moment. If you want to see the value of `y` after the assignment, you must step one line forward (or set the breakpoint on the *next* line). Beginners often look at a variable immediately after setting a breakpoint on the assignment line and see a garbage value, incorrectly concluding the assignment is broken.

**Mistake 2 — Forgetting to remove breakpoints between sessions**

Breakpoints persist in your IDE between sessions. If you add five breakpoints while investigating a bug and then move on, those breakpoints will stop your next debugging session at irrelevant points. After fixing a bug, delete or disable the breakpoints you no longer need.

**Mistake 3 — Relying on breakpoints instead of understanding the program**

A breakpoint tells you *what* a variable's value is at a specific moment. It does not explain *why* it has that value. After you observe a wrong value, you still need to read the code — or step back through earlier lines — to understand what caused it. Breakpoints are observation tools, not explanations.

## When to use this

Breakpoints are the right tool any time stepping from the beginning would take too long — which is most real programs. Set a breakpoint near the code you suspect, run to it, and then step from there. When you already have `std::cerr` output pointing at a specific function, place the breakpoint at that function's opening line. Multiple breakpoints work well for programs that call the same function many times: set the breakpoint inside the function and use Continue to skip to each successive call until you see the wrong value appear.

For programs this short, breakpoints feel like overkill — but developing the habit now means you will reach for the right tool instinctively on the longer programs you will write later.

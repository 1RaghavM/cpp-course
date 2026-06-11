## The idea

Stepping and breakpoints let you pause a running program at exactly the right moment. But once you are paused, how do you know *which* variable to look at? In small programs you can scan every local variable in the debugger's variable panel. In larger programs — or when a bug depends on a subtle pattern in how a value changes over several steps — scanning every variable is tedious and easy to get wrong. The *watch* feature solves this problem.

A watch is a named expression you register with the debugger. Instead of hunting through a list of all variables, the debugger keeps your watched expression visible and up to date as you step. Think of it like a stock ticker: instead of checking every stock each minute, you pin the two or three you care about and watch only those update in real time.

Watches are not limited to single variables — you can watch an expression like `a + b` or `x * factor` and see it computed live as you step through the code. This is especially useful when you are tracking down a calculation error and want to watch an intermediate result evolve without adding `std::cerr` lines to the source.

## How it works

### Adding a watch expression

In most IDEs (VS Code, Visual Studio, CLion) there is a **Watch** panel in the debugger UI. You click "Add Expression" (or a `+` button) and type the name of a variable or a simple expression. When the debugger pauses, it evaluates each watch expression in the current scope and displays the result. As you step, the values update automatically.

Consider this function:

```cpp
#include <iostream>

int scaled_sum(int a, int b, int factor) {
    int sum = a + b;
    int result = sum * factor;
    return result;
}

int main() {
    int answer = scaled_sum(3, 5, 4);
    std::cout << answer << "\n";
    return 0;
}
```

If you set a breakpoint at the first line of `scaled_sum` and add watches for `sum`, `result`, and `sum * factor`, you can step through the function and see each watch value update: first `sum` becomes `8`, then `result` becomes `32`. Without watches you would need to scroll through the variable panel or add three `std::cerr` lines.

### Using `std::cerr` to approximate watching

Since cpproad's exercises run on Judge0 rather than an interactive debugger, you can simulate watch behavior by printing variable values at each step with `std::cerr`. The pattern is the same: identify the expression you want to observe, print its value at each relevant point, and look at how it changes across steps.

```cpp
#include <iostream>

int running_total(int a, int b, int c) {
    int t1 = a;
    std::cerr << "[watch] t1=" << t1 << "\n";
    int t2 = t1 + b;
    std::cerr << "[watch] t2=" << t2 << "\n";
    int t3 = t2 + c;
    std::cerr << "[watch] t3=" << t3 << "\n";
    return t3;
}

int main() {
    std::cout << running_total(2, 5, 3) << "\n";
    return 0;
}
```

Here every intermediate accumulation is "watched" via cerr. If `t2` shows `9` instead of `7`, you know the problem is in the `t1 + b` step.

### Watching expressions vs. variables

Watches are more flexible than variables because you can watch *derived* values. If you suspect the issue is with `factor - 1` rather than `factor` itself, you watch `factor - 1` directly instead of watching `factor` and mentally subtracting one each time. This precision cuts down on mental arithmetic errors while debugging.

```cpp
#include <iostream>

int offset_product(int base, int offset) {
    std::cerr << "[watch] base=" << base << "\n";
    std::cerr << "[watch] offset=" << offset << "\n";
    std::cerr << "[watch] base*(offset-1)=" << base * (offset - 1) << "\n";
    return base * (offset - 1);
}

int main() {
    std::cout << offset_product(6, 4) << "\n";
    return 0;
}
```

The watch expression `base * (offset - 1)` — which evaluates to `6 * 3 = 18` — gives you the final answer directly, not as two separate variables you must mentally combine.

## Common mistakes

**Mistake 1 — Watching variables that are out of scope**

A watch expression is only valid while the variable it references is in scope. If you add a watch on a local variable `sum` declared inside a function, the watch shows "not in scope" or an error when you are paused outside that function. This surprises many beginners who expect watches to persist globally. The fix is to only add watches that are relevant to the current stack frame, or to re-enter the function to see those values.

**Mistake 2 — Watching the wrong expression and drawing the wrong conclusion**

If you watch `a + b` but the bug is in `a * b`, you will see perfectly correct values in the watch window and conclude "that's fine" — then remain confused. Be precise about which subexpression you are tracking. Print or watch every intermediate value involved in the suspicious computation, not just the final result.

**Mistake 3 — Forgetting that watching does not change program behavior**

Watches are read-only observations. Looking at a variable in the watch window does not affect the program. Beginners sometimes wonder if "adding a watch" somehow fixed their bug — it did not. If the program started working after you added a watch, something else changed (perhaps a rebuild triggered a recompile, or a prior run had corrupt state).

## When to use this

Use the watch panel any time you are stepping through a multi-step computation and need to track more than one or two values simultaneously. It is especially valuable when the same variable changes multiple times in a loop (covered later) and you want to see how it evolves without drowning in cerr output. For simpler cases — a single function call with two or three variables — the debugger's normal variable panel is sufficient.

In the context of cpproad exercises, you will simulate watching by printing `std::cerr` messages at each relevant step. This is slightly more verbose than a real watch window but teaches the same skill: identifying the key intermediate value, observing how it changes, and pinpointing the step where it becomes wrong.

## The idea

Every program you have written so far runs from top to bottom in a straight line: one statement executes, then the next, until `main` returns. That model breaks down the moment you need a program to make a decision ("if the user typed a negative number, warn them") or repeat an action ("ask again until the input is valid"). Control flow is the mechanism that lets execution take different paths — jumping forward over some statements, jumping backward to repeat others, or jumping sideways into a function. Understanding the taxonomy of control flow statements is the prerequisite for every lesson that follows in this chapter.

Think of a program as a road. Without control flow, the road is a single straight highway. With control flow, the road has forks (branches), on-ramps that loop back (iteration), and tunnels that transport you to a completely different section of road (function calls). The destination is still determined by the code you write, but the route can vary based on data known only at runtime.

## How it works

Control flow statements can be grouped into four categories. Each category gets its own dedicated lesson later in this chapter; here we just name them so you have a mental map.

**Conditional statements** choose which path to take. The `if`/`else` family and the `switch` statement both fall here.

**Loops** repeat a block of code. C++ provides three: `while`, `do while`, and `for`. Each has a slightly different entry/exit behaviour.

**Jumps** transfer execution unconditionally to another location. `goto`, `break`, `continue`, and `return` are all jumps. Halt functions like `std::exit` and `std::abort` are a special subcategory that terminate the entire program.

**Function calls** are technically jumps as well — the CPU saves its current position, jumps to the function body, executes it, and jumps back. Function calls were covered in chapter 2; we mention them here only to complete the picture.

A simple illustration of what a conditional branch looks like at the source level:

```cpp
#include <iostream>

int main()
{
    int score { 72 };

    if (score >= 60)
        std::cout << "Pass\n";
    else
        std::cout << "Fail\n";

    return 0;
}
```

Execution reaches the `if`, evaluates `score >= 60` (true), prints `Pass`, and skips the `else` branch entirely. The `else` branch is the road not taken — it still exists in the binary but the CPU never visits it on this run.

Here is the same idea with a loop. This will not compile yet (loops arrive in lesson 8.8) but it shows the concept:

```cpp
// Conceptual illustration — do not compile yet
// while (condition)      <- tests condition before each iteration
//     statement;         <- body: runs only when condition is true
```

The key insight is that all of these constructs share the same structure: a **condition** (something that evaluates to true or false) and **one or more statements** that execute depending on that condition. Mastering that pattern once gives you the intuition for every variant.

A complete, runnable example showing both a branch and a function call you already know:

```cpp
#include <iostream>

int main()
{
    int x {};
    std::cin >> x;

    if (x > 0)
        std::cout << "Positive\n";

    std::cout << "Done\n";  // always runs

    return 0;
}
```

When `x` is `5`, you see both lines. When `x` is `-3`, you see only `Done`. The second `cout` is not inside the `if` — there is no block, so only the single next statement is conditional.

## Common mistakes

**Confusing the categories.** Beginners often call everything a "loop" or everything an "if statement". The distinction matters when debugging: if output appears too many times, you are probably in a loop problem; if output never appears, you are probably in a branch problem. Naming the category correctly focuses the fix.

**Thinking control flow only applies to `main`.** All functions have their own flow. A `return` statement inside a helper function terminates *that function*, not the whole program. Conflating a `return` in a helper with `std::exit` causes subtle bugs where callers expect a value but the program has already terminated — or vice versa.

**Assuming "skip" means "never evaluated".** Skipped statements are not executed, but expressions inside conditions *are* evaluated every time the condition is checked. This matters most with loops: if a condition has a side effect (like reading from `cin`), it fires on each iteration, not just once. This lesson introduces the concept without code examples that demonstrate it — just keep it in mind as you read the loop lessons.

## When to use this

This lesson is intentionally conceptual. You do not pick "control flow introduction" as a construct the way you pick `for` vs `while`. Instead, treat it as a reference: whenever you are unsure which tool belongs to which category, come back here to orient yourself.

As a rule of thumb: reach for a **conditional** when different inputs should produce different outputs; reach for a **loop** when the same operation needs to repeat a variable number of times; reach for a **jump** (`break`, `continue`, `return`) to exit a construct early once a condition is met. The following lessons cover each category in depth and show exactly when one variant is preferable over another.

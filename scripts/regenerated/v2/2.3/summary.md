## The idea

Not every function needs to hand something back. Sometimes a function's entire job is to do something — print a message, draw a divider, show the current state of a calculation — with no result to return to the caller. These are called void functions (or non-value-returning functions). The name comes from the `void` keyword that replaces the return type, signalling "this function produces nothing."

Think of the difference this way: a value-returning function is like a vending machine — you put something in and you get something back. A void function is like a light switch — you flip it and something happens in the world, but nothing is handed back to you.

The term "void" is not a special value; it is the absence of a value. When the return type is `void`, the compiler guarantees that the function call site cannot produce a value and therefore cannot be used in an expression that expects one. This prevents whole classes of mistakes where a programmer might accidentally use a "result" that doesn't exist.

## How it works

Declare a void function by writing `void` as the return type. The function body does its work and falls off the end without a `return` statement — or you can write `return;` (with no value) to exit early.

```cpp
#include <iostream>

void printDivider()
{
    std::cout << "---\n";
}

int main()
{
    printDivider();
    std::cout << "Section 1\n";
    printDivider();
    std::cout << "Section 2\n";
    printDivider();
    return 0;
}
```

Output:
```
---
Section 1
---
Section 2
---
```

`printDivider` has no return statement at all — after the last `std::cout` line, execution simply returns to the caller automatically.

You can also exit a void function early with a bare `return;` — with no expression after the keyword. This becomes useful once you know about conditionals (covered in chapter 4). For now, the key point is that `return;` with no value is the correct syntax. Writing `return 0;` or `return x;` inside a `void` function is a compile error.

Here is a realistic example that stays within what you know — two void helpers composing a report:

```cpp
#include <iostream>

void printHeader()
{
    std::cout << "=====\n";
    std::cout << "Report\n";
    std::cout << "=====\n";
}

void printFooter()
{
    std::cout << "=====\n";
    std::cout << "End\n";
    std::cout << "=====\n";
}

int main()
{
    printHeader();
    std::cout << "Data: 42\n";
    printFooter();
    return 0;
}
```

The two helper functions each do a small job. `main` reads like a script: header, data, footer. Notice that neither helper needs to know anything about the other — they are independent building blocks that `main` assembles in order. This is a pattern you will use constantly as your programs grow: break the work into named void actions, then compose them in `main`.

## Common mistakes

**Trying to return a value from a void function.**

```cpp
void printSum(int a, int b)
{
    std::cout << a + b << "\n";
    return a + b;   // ERROR: return-statement with a value in function returning 'void'
}
```

The compiler rejects this immediately. A void function has nowhere to put a return value. If you need to send the result back to the caller, change the return type to `int` (or whichever type fits).

**Trying to use a void function call as a value.**

```cpp
#include <iostream>

void printSum(int a, int b)
{
    std::cout << a + b << "\n";
}

int main()
{
    int result = printSum(3, 4);   // ERROR: void value not ignored
    std::cout << result << "\n";
    return 0;
}
```

`printSum` returns nothing, so there is no value to assign to `result`. The compiler reports something like "void value not ignored as it ought to be." If you need the computed value in addition to printing it, either return it and let the caller print it, or compute it separately.

**Confusing "does nothing" with "has no effect".**

A void function can absolutely change the observable state of the program — it just does not compute a value for the caller. Printing to the screen, reading from input, modifying a variable (with techniques covered later) are all side effects. `void` only means "no return value," not "no effect."

## When to use this

Reach for a void function when the function's purpose is an action: printing output, recording a log entry, displaying a menu, or drawing a section of a report. Anything whose purpose is a side effect rather than producing a value fits here.

When the function does compute something the caller needs, use a value-returning function instead (covered in lesson 2.2). Many programs use a mix: value-returning functions for computation, void functions for I/O and display. Keeping those two responsibilities separate makes code easier to test and reuse.

A practical rule of thumb: if you find yourself writing `int result = someFunction();` and then never actually using `result` for a computation but only printing it, consider whether the function should just print directly and be void. Conversely, if the caller needs to use the computed value — passing it to another function, storing it, adding it to something else — use a return value instead of a print side effect. Choosing correctly between void and value-returning is one of the first design decisions you make when writing a new function.

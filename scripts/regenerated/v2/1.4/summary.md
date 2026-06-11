## The idea

The previous lesson showed how to declare a variable — how to carve out a named piece of memory. This lesson is about what goes *into* that memory: giving a variable its value. There are two distinct operations to understand.

**Assignment** means changing the value of an already-existing variable. You can do it as many times as you like. Think of it as erasing what is written on a whiteboard and writing something new.

**Initialization** means supplying the first value when the variable is created — in the same statement as the declaration. Think of it as writing on the whiteboard the moment you first pick it up. Initialization is generally preferred over a separate assignment because an uninitialized variable holds garbage, and the less time a variable spends uninitialized, the safer your code is.

A crucial mental model: `=` in C++ is *not* a mathematical equation. It is a one-way instruction: "take the value on the right, compute it, and store it in the box named on the left." When you write `score = score + 10`, the compiler first evaluates `score + 10` using the current value of `score`, then overwrites `score` with the result. There is no circular logic — the right-hand side is always evaluated before the assignment happens.

## How it works

**Assignment** uses the `=` operator. The variable being assigned must already have been declared.

```cpp
#include <iostream>

int main()
{
    int level;
    level = 1;              // first assignment
    std::cout << level << "\n"; // prints 1
    level = 5;              // reassignment — old value is replaced
    std::cout << level << "\n"; // prints 5
    return 0;
}
```

Output:
```
1
5
```

Notice that `level = 5` completely replaces the previous value of `1`. The old value is gone.

**Initialization** comes in three forms. All three are equally valid for `int`:

- **Copy initialization:** `int x = 5;`
- **Direct initialization:** `int x(5);`
- **List (brace) initialization:** `int x{5};`

List initialization is the modern preferred form because it prevents a class of mistakes called *narrowing conversions* (trying to store a value that does not fit). For `int`, all three behave identically.

```cpp
#include <iostream>

int main()
{
    int apples = 3;    // copy initialization
    int oranges(7);    // direct initialization
    int bananas{12};   // list initialization
    std::cout << apples << "\n";
    std::cout << oranges << "\n";
    std::cout << bananas << "\n";
    return 0;
}
```

Output:
```
3
7
12
```

All three variables are initialized at the moment they are created — there is never a window where they hold garbage.

Using the updated value in a subsequent assignment is common and intentional:

```cpp
#include <iostream>

int main()
{
    int score{0};
    score = score + 10;  // read old value, add 10, store result
    score = score + 5;
    std::cout << score << "\n"; // prints 15
    return 0;
}
```

The compiler evaluates the right side first, then stores the result. `score` starts at `0`, becomes `10` after the first assignment, and becomes `15` after the second.

## Common mistakes

**Confusing initialization with equality.** Learners coming from mathematics often read `x = x + 1` as a contradiction: "x cannot equal itself plus one." In C++, it is not an assertion of equality — it is a command: add 1 to the current value and store the result back into `x`.

```cpp
int x{3};
x = x + 1;
// x is now 4, not "undefined"
```

**Using an uninitialized variable.** Declaring without initializing and then doing arithmetic before assigning is a common source of bugs. The result depends on whatever garbage happened to be at that memory address.

```cpp
#include <iostream>

int main()
{
    int total;
    total = total + 5; // BUG: total was never initialized
    std::cout << total << "\n"; // prints garbage + 5
    return 0;
}
```

Always initialize: `int total{0};`. If there is no meaningful starting value, zero is the safe default.

**Trying to initialize with a mismatched type (narrowing).** List initialization specifically guards against this:

```cpp
int x{3.7}; // error: narrowing conversion from double to int
int y = 3.7; // compiles but silently truncates to 3 (dangerous)
```

This is one reason list initialization is the recommended style — it makes this class of mistake a compile error instead of a silent bug.

## When to use this

Prefer initialization over a two-step declare-then-assign pattern whenever the initial value is known at declaration time. Use list initialization (`{}`) as the default style because it catches accidental narrowing conversions at compile time. Reserve plain assignment (`=` on its own line) for moments where the value changes after the variable has already been created — for example, updating a running total inside a loop. When you are unsure of the starting value, initialize to `0` explicitly rather than leaving the variable uninitialized.

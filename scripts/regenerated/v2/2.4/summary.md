## The idea

A function that always does exactly the same thing with the same fixed values is useful, but limited. What you really want is a function that can work on different values each time it is called — a function that takes input. Parameters are the mechanism for that. They are the named placeholders declared in the function's signature, and the arguments are the actual values you pass in when you call the function.

Think of a parameter like a blank in a form: the form has a blank labelled "Name" and a blank labelled "Age." Those blanks are the parameters — they describe what information the form needs. When you fill out the form with "Alice" and "30," those filled-in values are the arguments. The form (function) then uses those specific values to do its job.

Parameters let you write one function that works for any input rather than one function for each possible input. Instead of `printDouble4()`, `printDouble7()`, `printDouble10()`, you write `printDouble(int x)` once and call it with `4`, `7`, or `10`.

## How it works

Declare parameters inside the parentheses of the function signature, each with a type and a name. When you call the function, the argument values are copied into the parameters.

```cpp
#include <iostream>

void printDouble(int x)
{
    std::cout << x * 2 << "\n";
}

int main()
{
    printDouble(5);    // prints 10
    printDouble(12);   // prints 24
    return 0;
}
```

Each call creates a fresh copy of `x` with the value you provided. The two calls are completely independent — the `x` in the first call does not affect the `x` in the second.

A function can have multiple parameters. Separate them with commas in both the declaration and the call:

```cpp
#include <iostream>

int add(int a, int b)
{
    return a + b;
}

int main()
{
    std::cout << add(3, 7) << "\n";   // 10
    std::cout << add(100, 1) << "\n"; // 101
    return 0;
}
```

Arguments are matched to parameters by position: the first argument maps to the first parameter, the second to the second, and so on. Here `3` is copied into `a` and `7` into `b`.

Parameters can be used in combination with return values and with `std::cin`:

```cpp
#include <iostream>

int multiply(int x, int y)
{
    return x * y;
}

int main()
{
    int a, b;
    std::cin >> a >> b;
    std::cout << multiply(a, b) << "\n";
    return 0;
}
```

The user enters two numbers. `main` reads them into local variables, then passes them to `multiply`. The function computes the product and returns it to `main`, which prints it. Notice that the names `a` and `b` in `main` and `x` and `y` in `multiply` are completely separate — same value, different names.

## Common mistakes

**Passing arguments in the wrong order.**

```cpp
#include <iostream>

void printRatio(int numerator, int denominator)
{
    std::cout << numerator / denominator << "\n";
}

int main()
{
    printRatio(1, 10);   // prints 0 (integer division: 1/10)
    printRatio(10, 1);   // prints 10
    return 0;
}
```

With integer division, `1 / 10` gives `0`, not `0.1`. If you accidentally write `printRatio(denominator, numerator)`, you get a completely different result with no compiler error because both are `int`. With parameters of the same type, positional mistakes compile silently and produce wrong output. Double-check the order every time you have two or more parameters of the same type.

**Assuming parameters persist between calls.**

```cpp
#include <iostream>

void addAndPrint(int x)
{
    x = x + 1;          // modifies the local copy — does NOT affect the caller
    std::cout << x << "\n";
}

int main()
{
    addAndPrint(5);   // prints 6
    addAndPrint(5);   // also prints 6 — x is fresh each call
    return 0;
}
```

Each call gets its own fresh copy of `x`. Modifying `x` inside `addAndPrint` has no effect on the original variable in `main`, and no effect on the next call. Parameters are not persistent storage; they are re-initialised from the argument on every call.

**Wrong number of arguments.**

```cpp
int add(int a, int b)
{
    return a + b;
}

int main()
{
    add(5);          // ERROR: too few arguments
    add(1, 2, 3);    // ERROR: too many arguments
    return 0;
}
```

C++ requires the call site to provide exactly as many arguments as there are parameters (unless default arguments are used — a feature covered later). Providing too few or too many is a compile error.

## When to use this

Add a parameter whenever the caller needs to control a piece of data the function uses to do its work. If the same function body needs to produce different results for different inputs, those differences belong in parameters.

Avoid the temptation to add parameters for values that never change across all calls — those should be fixed inside the function body instead. Parameters communicate variation; constants communicate fixed facts.

Once you combine parameters with return values, functions become genuinely composable: `multiply(add(2, 3), add(4, 1))` expresses "add 2 and 3, add 4 and 1, then multiply the results" in a single readable expression. This is the fundamental building block of larger C++ programs.

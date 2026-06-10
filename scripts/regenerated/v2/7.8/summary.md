## The idea

You have now seen how to declare global variables with both internal and external linkage. Both work, and the language does not prevent you from using them. But experienced C++ programmers treat non-`const` global variables as a design smell that should be avoided in almost all cases.

The core problem is not technical — it is cognitive. A global variable can be read and written by any code in the entire program. As the program grows, this means the variable's value at any given moment depends on the entire execution history: every function that has ever touched it, in every order those functions might have been called. Tracking that history in your head is hard, debugging it is hard, and testing it independently is nearly impossible.

Think of a non-`const` global as a whiteboard in the middle of a busy open-plan office. Anyone can walk up and change what is written on it at any time. If a calculation is wrong, you have to ask: who was the last person at the whiteboard? That could be anyone. A function parameter, by contrast, is a private notepad — you hand the data to the function explicitly, and the function can only change what you gave it.

## How it works

The issues with non-`const` globals show up in three related ways.

**Initialization order uncertainty.** Globals in a single translation unit are initialized in declaration order. But across multiple translation units, the initialization order is unspecified by the standard. If global `A` in `file1.cpp` reads global `B` from `file2.cpp` during initialization, `B` may or may not be initialized yet:

```cpp
// file1.cpp
int a { b + 1 };   // undefined behavior if file2.cpp's b is not yet initialized
```

This is the "static initialization order fiasco" — a notoriously hard-to-diagnose bug class.

**Hidden dependencies.** A function that reads a global takes it as a hidden input. The function's behavior depends on state that is not visible in its signature:

```cpp
#include <iostream>

int taxRate { 8 };   // global

int computeTax(int price)
{
    return price * taxRate / 100;  // depends on global — invisible to callers
}

int main()
{
    taxRate = 0;                   // somewhere far away in the code
    std::cout << computeTax(100) << '\n';  // prints 0, not 8
    return 0;
}
```

A reader looking only at the `computeTax` call site has no indication that `taxRate` matters. A caller who sets `taxRate = 0` for one purpose may silently break an unrelated computation.

**Non-const globals cannot be `constexpr`.** Constants shared across the program should be `const` or `constexpr` — they can be placed in headers safely because they have internal linkage by default and are evaluated at compile time. Mutable globals cannot be `constexpr` and therefore cannot participate in compile-time evaluation.

The good alternative is to pass data explicitly as function parameters and return results as return values. If a value genuinely needs to be shared across a program and never changes after startup, make it `const`. If it must change, confine it inside a namespace or behind a function interface so that modifications are visible and controlled.

```cpp
#include <iostream>

int computeTax(int price, int rate)  // explicit dependency — visible to caller
{
    return price * rate / 100;
}

int main()
{
    int taxRate { 8 };
    std::cout << computeTax(100, taxRate) << '\n';  // 8
    return 0;
}
```

Now the dependency is explicit. The signature tells you everything `computeTax` needs. Changing `taxRate` in `main` has no effect on any other call site that passes a different rate.

## Common mistakes

**Mistake 1 — Using a global to avoid passing an argument.** This is the most common motivation. Adding a parameter feels like extra work, so the variable becomes global. The short-term convenience hides the long-term cost: the function can no longer be tested in isolation, and every future maintainer must hunt for all places that might modify the global.

**Mistake 2 — Assuming globals are zero-initialized and therefore "safe" to read before they are set.** Non-`const` globals with no initializer are zero-initialized before any other initialization, which is a guarantee. But global class objects can run constructors, and those constructors may read other globals that are not yet initialized. Zero-initialized fundamental globals are predictable on their own, but the moment you mix them with initializer expressions that reference other globals, the initialization order problem reappears.

**Mistake 3 — Treating `const` globals the same as non-`const` globals.** `const` global variables do not have the mutation problem — once initialized, their value is fixed for the program's lifetime. They are a legitimate tool for program-wide constants (and the next lesson shows how to share them across files cleanly). The warning applies specifically to non-`const` (mutable) globals, not to `const` or `constexpr` ones.

## When to use this

Avoid non-`const` global variables by default. In nearly every situation, passing values as function parameters or returning them as function results is cleaner, safer, and easier to test. If you find yourself reaching for a global because "every function needs it," that is a sign the function signature is underdeveloped. Legitimate exceptions are narrow: OS signal handlers (which cannot accept parameters), program-wide counters used by testing infrastructure, and a small handful of platform-specific patterns. In those cases, document the global clearly, keep it in an unnamed namespace to limit its linkage, and never modify it from more than one place. `const` and `constexpr` globals for program-wide constants are fine and encouraged.

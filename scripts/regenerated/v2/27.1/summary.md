## The idea

Imagine you write a function that divides two numbers. What should happen when the caller passes zero as the divisor? You could return a special sentinel value like `-1` or `INT_MIN`, but what if those are valid results? You could print an error and exit, but that kills the entire program — the caller never gets a chance to recover. You could return a `bool` indicating success, but then the actual result needs another output parameter, and the caller can silently ignore that bool.

None of these approaches scale. Real programs need a clean, standard way to signal that something went wrong and hand control to whoever is equipped to handle it. That is exactly what exceptions provide. An exception is a mechanism for reporting an error condition that the current function cannot (or should not) fix itself, allowing an outer layer of the program to respond.

The core insight: exceptions **separate error detection from error handling**. The function that discovers the problem does not need to know anything about how to fix it — it just throws an exception. Some outer scope that does know how to respond catches it. Code in between neither knows nor cares about the error.

## How it works

The exception mechanism has three parts: `throw`, `try`, and `catch`.

```cpp
#include <iostream>
#include <stdexcept>

double divide(double a, double b) {
    if (b == 0.0)
        throw std::runtime_error("Division by zero");
    return a / b;
}

int main() {
    double result = divide(10.0, 0.0); // throws
    std::cout << result << "\n";       // never reached
    return 0;
}
```

When `throw` executes, the function stops immediately — no return value, no further statements. The exception object (here a `std::runtime_error`) is propagated up the call stack looking for a matching `catch`. If nothing catches it, the program terminates via `std::terminate`.

To actually handle the exception, the call goes inside a `try` block:

```cpp
int main() {
    try {
        double result = divide(10.0, 0.0);
        std::cout << result << "\n";
    } catch (const std::runtime_error& e) {
        std::cerr << "Error: " << e.what() << "\n";
    }
    return 0;
}
```

The `try` block encloses the code that might throw. The `catch` clause that immediately follows handles the exception if its type matches. `e.what()` returns the error message string. After the `catch` block runs, execution continues after the last `catch` — not back inside the `try`.

A third scenario shows the contrast with old-style error codes:

```cpp
// Old style — error code that callers routinely ignore
int old_divide(double a, double b, double& result) {
    if (b == 0.0) return -1;  // caller might forget to check
    result = a / b;
    return 0;
}

// Exception style — impossible to silently ignore
double new_divide(double a, double b) {
    if (b == 0.0)
        throw std::runtime_error("Division by zero");
    return a / b;
}
```

With the old approach, forgetting to check the return value compiles and runs silently. With exceptions, an uncaught exception always terminates the program loudly — the error cannot be quietly ignored.

## Common mistakes

**Mistake 1 — throwing without a try/catch and expecting recovery.**

```cpp
void process() {
    throw std::runtime_error("something failed");
}

int main() {
    process();  // no try/catch
    return 0;
}
```

The program calls `std::terminate`, which typically prints an uncaught-exception message and aborts. There is no recovery. Every `throw` that is meant to be recoverable must eventually be caught by a matching `catch`. If you want the program to survive, the call must be inside a `try` block somewhere up the call stack.

**Mistake 2 — catching by value instead of const reference.**

```cpp
try {
    throw std::runtime_error("oops");
} catch (std::runtime_error e) {  // copies the exception object
    std::cout << e.what() << "\n";
}
```

This works but unnecessarily copies the exception object. Worse, if the thrown type is a derived class, catching by value slices it — you lose the derived part. Always catch by `const` reference: `catch (const std::runtime_error& e)`.

**Mistake 3 — using exceptions for normal control flow.**

```cpp
// BAD: using throw/catch as a non-local goto
for (int i = 0; i < 100; ++i) {
    try {
        if (i == 42) throw i;  // "exit" the loop
    } catch (int val) {
        std::cout << "Found: " << val << "\n";
        break;
    }
}
```

Exceptions carry significant overhead when thrown. They are meant for *exceptional* situations — conditions that should not occur during normal operation. Using them as a fancy `break` or as routine branching is an anti-pattern that makes code hard to read and slow.

## When to use this

Reach for exceptions when a function encounters a condition it cannot handle itself and that the caller needs to know about. Classic examples: a constructor that cannot acquire a resource, a file-open that fails, a network request that times out, a division by zero detected at runtime.

Do not use exceptions when you expect the condition frequently (use a return value or `std::optional` instead) or when you are writing code where exceptions are disabled by platform policy (some embedded or game-engine codebases use `-fno-exceptions`).

Exceptions pair naturally with the RAII pattern taught in earlier chapters on destructors and move semantics — when an exception unwinds the stack, destructors still run, so resources are released cleanly. The next lessons in this chapter build on this foundation.

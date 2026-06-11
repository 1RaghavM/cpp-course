## The idea

Chapter 27 covered C++ exceptions from first principles to advanced usage. The core insight is that exceptions separate normal logic from error handling by letting any function throw a value that travels up the call stack until a catch handler claims it — or the program terminates. Along the way, the stack is unwound, destructors run, and RAII objects clean themselves up.

This summary lesson recaps the key ideas across all seven lessons and identifies the patterns and invariants you should carry forward into every program you write.

## How it works

**The exception mechanism in brief.**

A `throw` expression packs a value (any type) and initiates stack unwinding. Each stack frame's local objects are destroyed in reverse construction order. The first `catch` clause whose parameter type matches the thrown type receives the exception. If no handler matches, `std::terminate` is called.

```cpp
#include <iostream>
#include <stdexcept>

void level2() {
    throw std::runtime_error("deep failure");
}

void level1() {
    level2(); // exception passes through; no local handler
}

int main() {
    try {
        level1();
    } catch (const std::runtime_error& e) {
        std::cout << "caught: " << e.what() << "\n";
    }
    return 0;
}
```

This shows the three essential parts: `throw` (level2), unwinding through level1, and `catch` (main).

**Class exceptions and inheritance.**

Throwing a derived class and catching by base class reference works because the derived object is the thrown object — no slicing occurs when you catch by reference. The standard library exception hierarchy (`std::exception` → `std::runtime_error`, `std::logic_error`, etc.) lets you write a single `catch (const std::exception& e)` that handles almost everything.

```cpp
#include <iostream>
#include <stdexcept>

struct AppError : public std::runtime_error {
    explicit AppError(const std::string& msg) : std::runtime_error(msg) {}
};

int main() {
    try {
        throw AppError("something went wrong");
    } catch (const std::runtime_error& e) {
        std::cout << e.what() << "\n"; // "something went wrong"
    }
    return 0;
}
```

**Rethrowing and function try blocks.**

`throw;` (no operand) rethrows the currently active exception without slicing. This is critical inside a `catch` that translates or logs an exception and must pass the original (or a new) exception up. Function try blocks handle constructor initializer-list exceptions — the only place regular try cannot reach — but constructors must rethrow.

**noexcept and move_if_noexcept.**

`noexcept` annotations are a compile-time contract: the function promises not to throw. Breaking the contract calls `std::terminate`. The `noexcept` operator tests the promise at compile time. `std::move_if_noexcept` exploits this: it moves when safe, copies when a move might throw, enabling generic code to maintain strong exception guarantees without sacrificing performance.

**The three dangers.**

Every program using exceptions must avoid: (1) throwing from destructors (always `noexcept`), (2) exception-unsafe resource management (always RAII — never naked `new`/`delete` across a potential throw), and (3) using exceptions for routine control flow in hot paths.

## Common mistakes

**Mistake 1 — catching by value instead of reference.**

```cpp
try {
    throw std::runtime_error("error");
} catch (std::exception e) { // copies; derived info sliced away
    std::cout << e.what() << "\n";
}
```

Catch by `const reference` (`const std::exception&`) to preserve the derived type and avoid an extra copy. Catching by value also slices the exception if the thrown type is derived.

**Mistake 2 — ordering catch clauses most-specific last.**

```cpp
try { ... }
catch (const std::exception& e) { ... }    // catches EVERYTHING first
catch (const std::runtime_error& e) { ... } // DEAD CODE — never reached
```

Always order catch clauses from most-derived to least-derived (or most-specific to most-general). Once a catch handler matches, the subsequent ones are skipped entirely.

**Mistake 3 — ignoring the `noexcept` contract on destructors.**

Destructors are implicitly `noexcept` in C++11 and later. If you write cleanup code in a destructor that calls throwing functions, wrap those calls in try/catch and swallow or log the error internally. A destructor that allows an exception to escape during stack unwinding triggers `std::terminate`.

## When to use this

Use exceptions for genuinely exceptional conditions: I/O failures, invalid user-supplied data, resource exhaustion, and any error that a function cannot reasonably handle itself. Prefer return values or `std::optional` for expected failures in tight loops or real-time code.

Every function that acquires a resource should use RAII to ensure that resource is released on every exit path, including throws. Mark move constructors, move assignment operators, swap, and destructors `noexcept` so the standard library can choose faster algorithms for your types.

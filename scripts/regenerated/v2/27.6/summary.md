## The idea

Sometimes a catch block cannot fully handle an exception — it can log it, do partial cleanup, or translate it, but then it needs to pass it on for someone else to deal with. The mechanism for this is **rethrowing**: a `throw;` statement with no operand inside a catch block re-propagates the current exception as if it were never caught.

Rethrowing is essential for middleware: a logging layer in the call stack wants to record every exception, but should not suppress them. A resource-release wrapper needs to guarantee cleanup even during error propagation, then let the exception continue up.

## How it works

**Plain rethrow with `throw;`**

```cpp
#include <iostream>
#include <stdexcept>

void log_and_rethrow() {
    try {
        throw std::runtime_error("network timeout");
    } catch (const std::exception& e) {
        std::cerr << "[LOG] exception: " << e.what() << "\n";
        throw;  // re-propagate the original exception unchanged
    }
}

int main() {
    try {
        log_and_rethrow();
    } catch (const std::exception& e) {
        std::cout << "handled: " << e.what() << "\n";
    }
    return 0;
}
```

Output:
```
[LOG] exception: network timeout
handled: network timeout
```

The `throw;` inside the catch passes the exact same exception object up the stack. The type is preserved — if the original exception was a `DatabaseError`, it is still a `DatabaseError` when it arrives at the outer catch, not a sliced `std::exception`.

**The difference between `throw;` and `throw e;`**

This is the most important subtlety of rethrowing:

```cpp
#include <iostream>
#include <stdexcept>

class Derived : public std::runtime_error {
public:
    Derived() : std::runtime_error("derived") {}
};

int main() {
    try {
        try {
            throw Derived();
        } catch (const std::runtime_error& e) {
            throw e;  // throws a COPY of the base — Derived is SLICED!
        }
    } catch (const Derived& d) {
        std::cout << "caught Derived\n";
    } catch (const std::runtime_error& r) {
        std::cout << "caught runtime_error: " << r.what() << "\n";
    }
    return 0;
}
```

Output:
```
caught runtime_error: derived
```

`throw e;` throws a new exception of type `std::runtime_error` (the static type of `e`), discarding the `Derived` part. The outer `catch (const Derived&)` never fires. By contrast, `throw;` (no operand) re-throws the original `Derived` object intact.

**Rethrowing after partial cleanup.**

```cpp
#include <iostream>
#include <stdexcept>

void with_cleanup(bool fail) {
    std::cout << "acquiring resource\n";
    try {
        if (fail)
            throw std::runtime_error("failure");
        std::cout << "success\n";
    } catch (...) {
        std::cout << "releasing resource\n";
        throw; // re-throw whatever was caught
    }
    std::cout << "releasing resource normally\n";
}

int main() {
    try {
        with_cleanup(true);
    } catch (const std::exception& e) {
        std::cout << "outer caught: " << e.what() << "\n";
    }
    return 0;
}
```

Output:
```
acquiring resource
releasing resource
outer caught: failure
```

The `catch (...)` with rethrow is a common pattern for cleanup in non-RAII code. In modern C++ you would use RAII objects with destructors instead, but this pattern still appears when interfacing with C-style APIs.

## Common mistakes

**Mistake 1 — rethrowing outside a catch block.**

```cpp
void f() {
    throw; // ERROR: no active exception — undefined behavior
}
```

Calling `throw;` when there is no currently active exception is undefined behavior, typically an immediate program termination. `throw;` is only valid inside an active catch block (or functions called from one, if you track that carefully).

**Mistake 2 — accidentally slicing on rethrow.**

```cpp
catch (const std::exception& e) {
    // want to rethrow, but:
    throw e; // slices to std::exception — wrong!
    // correct:
    // throw;
}
```

A beginner typing `throw e;` intends "rethrow the exception" but actually creates a new exception object of the static type `std::exception`, losing any derived-class data. The bare `throw;` is always correct for rethrowing the current exception.

**Mistake 3 — forgetting that catch-then-rethrow is still a catch.**

```cpp
try {
    do_work();
} catch (const std::exception&) {
    throw;
}
// The compiler sees a catch here, even though it rethrows.
// An outer catch is needed, or the program terminates.
```

The `throw;` inside a catch is caught by the next outer catch, not by any catch in the same try block. If there is no outer try/catch, the exception is uncaught.

## When to use this

Use `throw;` (bare rethrow) whenever a catch needs to do something — log, clean up, translate error info — and then let the exception continue to an outer handler. Use it in catch-all blocks that perform logging or mandatory cleanup. Never use `throw e;` to rethrow — always use the bare form to preserve the exception's actual type.

When you control the exception and want to change it (e.g., convert a low-level exception into a higher-level one), throw a new exception instead of rethrowing.

## The idea

Exceptions are a powerful error-handling tool, but using them carelessly introduces subtle problems that can make your program crash in unexpected ways, leak resources, or behave non-deterministically. This lesson examines three concrete dangers: destructors that throw, exception-unsafe code that leaks resources, and the performance costs that come with using exceptions in hot paths.

Understanding these dangers does not mean avoiding exceptions. It means knowing when they are safe and how to write code that stays correct even when something unexpected happens.

## How it works

**Danger 1 — throwing from a destructor.**

When an exception is thrown and the stack unwinds, C++ calls destructors for all objects going out of scope. If one of those destructors throws its own exception, C++ now has two simultaneously active exceptions and no way to handle both. The result is a call to `std::terminate`, which ends the program immediately.

```cpp
#include <iostream>
#include <stdexcept>

struct Leaky {
    ~Leaky() {
        throw std::runtime_error("destructor threw!"); // NEVER do this
    }
};

int main() {
    try {
        Leaky l;
        throw std::runtime_error("original error");
    } catch (const std::exception& e) {
        std::cout << e.what() << "\n"; // never reached
    }
    return 0;
}
```

The program calls `std::terminate` before the catch block runs. Destructors must be `noexcept` (which they are by default in C++11 and later — an explicit annotation just makes the guarantee visible). If cleanup inside a destructor can fail, catch the exception internally and log or ignore it; never let it escape.

**Danger 2 — exception-unsafe code and resource leaks.**

Code is exception-safe when any exception that escapes leaves the program in a valid, consistent state. Code that allocates resources and then might throw before releasing them is not safe.

```cpp
#include <iostream>
#include <stdexcept>

void process(int x) {
    int* data = new int[100]; // acquired
    if (x < 0)
        throw std::runtime_error("negative"); // data leaks here
    // ... use data ...
    delete[] data; // only reached when no exception
}

int main() {
    try { process(-1); }
    catch (const std::exception& e) { std::cout << e.what() << "\n"; }
    return 0;
}
```

The fix is RAII: wrap the resource in an object whose destructor frees it. Stack unwinding then guarantees cleanup regardless of which path the code takes. Use `std::unique_ptr`, `std::vector`, or your own RAII wrapper instead of raw `new`/`delete`.

**Danger 3 — exception overhead in performance-sensitive code.**

On most platforms the "zero-cost exception" model means a function that does not throw incurs no measurable overhead at the call site. However, when an exception is actually thrown, the runtime must walk the stack, look up exception tables, call destructors, and find the matching catch handler. This work takes time — often hundreds of microseconds to milliseconds.

```cpp
// Fine in error paths (rare), expensive if called thousands of times per second:
try {
    result = dictionary.at(key);  // throws std::out_of_range on miss
} catch (const std::out_of_range&) {
    result = default_value;
}

// Prefer the non-throwing version when misses are common:
auto it = dictionary.find(key);
result = (it != dictionary.end()) ? it->second : default_value;
```

Exceptions are designed for exceptional conditions — events that should not happen in normal operation. Using them as control flow for routine decisions defeats the zero-cost model.

## Common mistakes

**Mistake 1 — letting a destructor propagate an exception.**

```cpp
struct File {
    ~File() {
        if (!flush()) // flush() can fail
            throw std::runtime_error("flush failed"); // WRONG
    }
};
```

If this destructor runs during stack unwinding, `std::terminate` is called. The correct pattern is to try the cleanup and silently swallow or log any failure:

```cpp
struct File {
    ~File() noexcept {
        try { flush(); }
        catch (...) { /* log if possible, never rethrow */ }
    }
};
```

**Mistake 2 — assuming RAII is automatic when you use raw pointers.**

A common misconception is that wrapping the block in a try/catch ensures cleanup. It does not — if the catch does not run (or if there are multiple exception paths), raw pointers still leak. RAII types release in their destructors, which always run, no matter how the scope is exited.

```cpp
void bad() {
    int* p = new int(42);
    might_throw(); // if this throws, p leaks
    delete p;
}

void good() {
    auto p = std::make_unique<int>(42);
    might_throw(); // if this throws, ~unique_ptr runs and frees p
}
```

**Mistake 3 — using exceptions for flow control in tight loops.**

```cpp
int total = 0;
for (const auto& key : keys) {
    try {
        total += table.at(key); // throws on miss — expensive for common misses
    } catch (const std::out_of_range&) {
        // miss is not exceptional here; it happens all the time
    }
}
```

If table misses are frequent, the throw/catch path dominates runtime. Use `find` or `count` instead. Reserve exceptions for genuinely unexpected events.

## When to use this

Exception safety is not optional — it is a correctness property. Any function that acquires resources must guarantee that those resources are released on every exit path, including exceptional ones. The safest way to meet that guarantee is RAII: never hold a raw resource between a constructor and its corresponding destructor.

Reserve exceptions themselves for operations that should succeed in ordinary use but can fail due to external conditions (I/O failures, invalid user input, network errors). For decisions that happen in normal control flow — especially in loops or real-time code — prefer return values, `std::optional`, or pre-condition checks that avoid the throw entirely.

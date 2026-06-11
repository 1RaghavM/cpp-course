## The idea

Every exception that gets thrown must eventually find a matching catch. If it does not, the program calls `std::terminate` and aborts — no recovery, no graceful shutdown. But sometimes you want a safety net that catches absolutely anything, even an `int` or a type you did not anticipate. C++ provides a special catch clause for exactly this purpose: `catch (...)`. The three dots are not a typo; they are the **catch-all handler** and they match any thrown object regardless of type.

The catch-all is like the last employee on the night shift who sweeps up whatever was left behind. You generally do not want to rely on it for your main error handling, but it is indispensable as a backstop.

## How it works

**Catching every possible exception.**

```cpp
#include <iostream>
#include <stdexcept>

void risky(int x) {
    if (x == 1) throw std::runtime_error("std exception");
    if (x == 2) throw 42;               // plain int
    if (x == 3) throw "a raw string";   // const char*
}

int main() {
    for (int i = 1; i <= 3; ++i) {
        try {
            risky(i);
        } catch (...) {
            std::cout << "Caught something\n";
        }
    }
    return 0;
}
```

Output:
```
Caught something
Caught something
Caught something
```

`catch (...)` matches all three throws. Inside the catch-all you do not have access to the exception object — you only know something was thrown.

**Catch-all combined with typed catches.**

The catch-all is most useful as the last resort after more specific clauses:

```cpp
#include <iostream>
#include <stdexcept>

void process(int x) {
    if (x == 0) throw std::out_of_range("zero");
    if (x < 0)  throw std::invalid_argument("negative");
    if (x > 100) throw x;
}

int main() {
    for (int val : {0, -1, 200, 50}) {
        try {
            process(val);
            std::cout << "ok: " << val << "\n";
        } catch (const std::out_of_range& e) {
            std::cout << "range: " << e.what() << "\n";
        } catch (const std::invalid_argument& e) {
            std::cout << "arg: " << e.what() << "\n";
        } catch (...) {
            std::cout << "unknown exception\n";
        }
    }
    return 0;
}
```

Output:
```
range: zero
arg: negative
unknown exception
ok: 50
```

The typed catches handle what they know about; `catch (...)` handles the rest. The `catch (...)` must always be last — any clause after it is unreachable.

**What happens with no catch at all.**

```cpp
int main() {
    throw std::runtime_error("nobody home");
    return 0;
}
```

The exception propagates out of `main` with no catcher. `std::terminate` is called. The default terminate handler calls `std::abort`, which dumps a message to stderr and exits with a non-zero code. The exact message is implementation-defined.

You can inspect what exception caused the termination via `std::current_exception` and `std::exception_ptr`, but those are advanced tools outside this lesson's scope.

## Common mistakes

**Mistake 1 — placing catch-all before typed catches.**

```cpp
try {
    throw std::runtime_error("err");
} catch (...) {           // catches everything — typed catches below are dead
    std::cout << "fallback\n";
} catch (const std::runtime_error& e) {  // never reached!
    std::cout << e.what() << "\n";
}
```

Just like with inheritance, catch clauses are checked in order. `catch (...)` matches everything, so any clause after it is dead code. Most compilers warn about this. Always put `catch (...)` last.

**Mistake 2 — swallowing exceptions silently.**

```cpp
try {
    do_something_important();
} catch (...) {
    // silently ignore all errors
}
```

A catch-all that does nothing is a bug magnet. If an unexpected exception occurs, it disappears without a trace, leaving the program in an unknown state. At minimum, log the fact that an unknown exception occurred. Better: use `std::current_exception` to rethrow and log, or print a message.

**Mistake 3 — confusing catch-all with a noexcept guarantee.**

Having `catch (...)` in a function does not make the function noexcept. The exception is caught and handled inside the function, which is fine, but it is a runtime mechanism, not a compile-time specification. The `noexcept` specifier (covered later) tells callers at compile time that the function will not throw.

## When to use this

Use `catch (...)` in two situations. First, as a last-resort handler at the top level of a thread or of `main` to log unexpected failures and terminate gracefully rather than crashing with an implementation-specific message. Second, in middleware code that must always complete a cleanup step regardless of what kind of exception occurred (log the error, release a lock, close a socket), then optionally rethrow.

Avoid `catch (...)` deep inside application logic — specific exception types tell you what went wrong and how to recover. The more specific your catch, the better your error handling.

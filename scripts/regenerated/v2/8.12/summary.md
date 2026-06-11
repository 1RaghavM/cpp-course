## The idea

Every program you have written so far exits by reaching the closing brace of `main`, which returns 0 to the operating system. But sometimes a program needs to stop before it reaches that point: an invalid argument, a condition that makes continuing meaningless, or an explicit user request to quit. C++ provides a family of "halt" functions that terminate the program immediately from any point, bypassing the normal flow of execution.

The main tools are `std::exit`, `std::quick_exit`, and `std::abort`. Think of them as three different emergency exits: `std::exit` is an orderly evacuation that tidies up as it leaves, `std::abort` is pulling the fire alarm with no cleanup at all, and `std::quick_exit` is somewhere in between. Each is appropriate in different circumstances.

## How it works

**std::exit** is the most common halt. It takes an integer status code (0 means success; non-zero means failure), performs cleanup, and terminates. It is declared in `<cstdlib>`.

```cpp
#include <iostream>
#include <cstdlib>

int main() {
    int x{};
    std::cout << "Enter a positive number: ";
    std::cin >> x;

    if (x <= 0) {
        std::cerr << "Error: must be positive.\n";
        std::exit(1);
    }

    std::cout << "You entered: " << x << "\n";
    return 0;
}
```

When `x` is 0 or negative, `std::exit(1)` is called. The message is printed to `std::cerr` (standard error, distinct from `std::cout`), and the program terminates with status code 1 before the second `std::cout` line runs.

The integer passed to `std::exit` is the program's exit status. The two portable values are `EXIT_SUCCESS` (0) and `EXIT_FAILURE` (1), also defined in `<cstdlib>`. Passing these named constants instead of raw integers makes intent clear:

```cpp
#include <cstdlib>
#include <iostream>

int checkDivisor(int d) {
    if (d == 0) {
        std::cerr << "Divisor cannot be zero.\n";
        std::exit(EXIT_FAILURE);
    }
    return d;
}

int main() {
    int a{10}, b{0};
    int divisor{checkDivisor(b)};
    std::cout << a / divisor << "\n";
    return 0;
}
```

Here `std::exit` is called from a function other than `main`. This works because `std::exit` is a global termination, not a function return.

**std::abort** terminates immediately with no cleanup. It signals an abnormal termination and is typically used when an internal invariant is violated — something that should never happen in a correct program. It is also in `<cstdlib>`:

```cpp
#include <cstdlib>
#include <iostream>

int main() {
    int value{-1};
    if (value < 0) {
        std::cerr << "Invariant violated: value must be non-negative.\n";
        std::abort();
    }
    return 0;
}
```

`std::abort` does not flush output buffers or run cleanup code. Reserve it for impossible program states, not ordinary error handling.

## Common mistakes

**Not flushing output before calling std::exit.** Output written to `std::cout` is buffered. Under most circumstances, `std::exit` does flush `std::cout` as part of cleanup. However, `std::abort` does not. If you need to guarantee that output is visible before an abnormal exit, flush explicitly:

```cpp
std::cout << "About to abort.\n";
std::cout.flush();   // or: std::cout << std::flush;
std::abort();
```

Failing to flush before `std::abort` can leave the last few lines of output invisible, which is confusing when debugging crash scenarios.

**Using std::exit instead of return in main.** Returning from `main` is almost always cleaner than calling `std::exit(0)` at the end. Both produce the same exit status, but `return 0` is idiomatic, shorter, and will run local destructors if they become relevant later. Reserve `std::exit` for early exits when continuing to `main`'s closing brace is not feasible.

**Confusing exit status conventions.** A status of 0 always means success. Any non-zero value means failure. The exact meaning of different non-zero codes is system-dependent unless you use `EXIT_SUCCESS` and `EXIT_FAILURE`. Do not return -1 from `main` or pass -1 to `std::exit`; some platforms treat negative exit codes in unexpected ways.

## When to use this

`std::exit` is appropriate when a program detects a condition in a helper function (not `main`) that makes continuing meaningless — a missing required file, an invalid command-line argument, or a fatal configuration error. Rather than threading error flags back through every call frame, a single `std::exit(EXIT_FAILURE)` with a clear error message on `std::cerr` exits immediately.

`std::abort` belongs only in situations that indicate a bug in the program itself: violated invariants, unreachable code that was somehow reached, or logic that should be impossible. For any kind of expected error condition that a user might encounter, `std::exit` with a helpful message is almost always the right choice. As programs grow, both halts tend to be replaced by structured error-handling patterns introduced in later chapters.

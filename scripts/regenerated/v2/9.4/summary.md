## The idea

When you write a function, you implicitly assume that callers will pass sensible arguments. But real users make mistakes, programs receive bad data from files, and edge cases you didn't consider will occur. Detecting and handling errors is the practice of building functions that check their inputs and respond in a controlled way when something is wrong, rather than silently producing garbage or crashing unpredictably.

Think of it like a vending machine. The machine is designed to dispense a snack when you insert the right amount of money and press a button. But what if someone inserts a coin that's too thick? A well-built machine rejects it immediately and returns it. A badly built machine jams and stops working entirely. Your functions should behave like the well-built machine: detect the bad input, communicate the problem, and not corrupt their own state.

There is a spectrum of options for responding to an error. This lesson covers four practical strategies: returning a special error value, returning a status code, printing an error message and stopping, and using `std::exit` or `std::abort` for fatal errors.

## How it works

**Strategy 1 — return a sentinel value:**
A sentinel value is a special return value that means "this call failed." The caller checks the return value and handles the failure.

```cpp
#include <iostream>

// Returns -1 if input is invalid; otherwise returns the square root (integer).
int safeSqrt(int n) {
    if (n < 0)
        return -1;   // sentinel: caller checks for this
    int root = 0;
    while (root * root < n)
        ++root;
    if (root * root == n)
        return root;
    return -1;       // n is not a perfect square
}

int main() {
    int r = safeSqrt(-4);
    if (r == -1)
        std::cout << "Error: invalid input\n";
    else
        std::cout << "Result: " << r << '\n';
    return 0;
}
```

The downside of sentinel values is that the caller must remember to check them. If the caller ignores the return value, the error is silently swallowed.

**Strategy 2 — print an error and exit:**
For programs (as opposed to library functions), printing a description of what went wrong and then calling `std::exit` or `std::abort` is a legitimate and simple strategy. Use this when the error is so severe that the program cannot continue.

```cpp
#include <iostream>
#include <cstdlib>   // for std::exit, std::abort

int divide(int a, int b) {
    if (b == 0) {
        std::cerr << "Error: division by zero\n";
        std::exit(1);  // non-zero exit code signals failure to the OS
    }
    return a / b;
}

int main() {
    std::cout << divide(10, 2) << '\n';  // prints 5
    std::cout << divide(10, 0) << '\n';  // prints error and exits
    return 0;
}
```

`std::cerr` is the error output stream — it writes to the terminal like `std::cout` but is conventionally used for error messages.

**Strategy 3 — return a bool status and output via parameter:**

```cpp
#include <iostream>

// Returns true on success; writes result via out parameter.
bool safeDivide(int a, int b, int& result) {
    if (b == 0)
        return false;
    result = a / b;
    return true;
}
```

This pattern is useful when you want the caller to decide what to do on failure. It avoids sentinel values by separating the status (`bool`) from the actual result (the `result` reference). However, references haven't been covered yet — this is shown for completeness and will make more sense after references are introduced.

## Common mistakes

**Mistake 1 — not checking return values:**

```cpp
int result = safeSqrt(-4);
std::cout << "Square root: " << result << '\n';  // prints -1, but caller ignores sentinel
```

If `safeSqrt` returned `-1` to signal an error, printing it as if it were a valid answer silently produces wrong output. Always check the return value of functions that can fail.

**Mistake 2 — using `std::exit` for non-fatal errors:**
`std::exit` terminates the entire program. Use it only when the error is genuinely unrecoverable. For an error that a caller can reasonably handle (like "the number was not a perfect square"), returning a sentinel or a bool status is better — it gives the caller a chance to recover.

**Mistake 3 — picking sentinel values that overlap with valid returns:**
If a function that computes a score can legitimately return `-1` (for example, a score deficit), using `-1` as the error sentinel creates ambiguity. Choose a sentinel value that lies outside the valid output range, or prefer `bool` status codes instead.

## When to use this

Return a sentinel value when the function has a clear invalid output (like `-1` for a non-negative quantity) and the valid range does not include that value. Use `std::exit` or `std::abort` when the error is catastrophic and continuing would produce undefined behavior or corrupt data — for example, opening a required config file that does not exist. Use `std::cerr` for error output rather than `std::cout` so error messages and normal output can be redirected independently in the shell. The right strategy depends on how severe the error is and whether the caller can reasonably recover.

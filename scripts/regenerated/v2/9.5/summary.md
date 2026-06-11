## The idea

Every program that reads from `std::cin` is at risk of receiving input it wasn't designed for. A user might type a letter when your program expects a number, enter a number outside the valid range, or include extra characters after valid input. When `std::cin` encounters input it cannot convert to the target type, it enters a failure state and stops reading anything — silently corrupting every subsequent input operation. Handling invalid input from `std::cin` means detecting this failure state and recovering from it before the rest of the program runs.

Think of `std::cin` like a ticket scanner. Feed it the right ticket (a well-formed integer) and it lets you through. Feed it a crumpled piece of paper (letters when it expects digits) and it jams. A robust scanner detects the jam, ejects the bad ticket, and waits for the next one. Your program needs the same reset mechanism.

## How it works

When `std::cin >> x` fails to extract a value (because the input is not the right type), three things happen:

1. `std::cin` sets its internal fail flag.
2. The variable `x` is left unchanged (its value is indeterminate from the failed extraction).
3. The bad input is left in the stream buffer — it is not consumed.

Every subsequent `>>` operation fails instantly until you explicitly clear the flag and discard the bad input.

**Example 1 — detecting a failed extraction:**

```cpp
#include <iostream>

int main() {
    int x;
    if (std::cin >> x) {
        std::cout << "Got: " << x << '\n';
    } else {
        std::cout << "Invalid input\n";
    }
    return 0;
}
```

`std::cin >> x` returns a reference to `std::cin`. When used as a `bool` (inside `if`), it evaluates to `false` when the stream is in a failed state. This is the basic check — if the extraction succeeded, proceed; if not, handle the error.

**Example 2 — clearing the fail state and discarding bad input:**

```cpp
#include <iostream>
#include <limits>

int main() {
    int x;
    std::cout << "Enter a number: ";
    if (!(std::cin >> x)) {
        // clear the error flag
        std::cin.clear();
        // discard everything up to and including the next newline
        std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');
        std::cout << "That was not a number. Try again.\n";
        return 1;
    }
    std::cout << "You entered: " << x << '\n';
    return 0;
}
```

`std::cin.clear()` resets the fail flag. Without it, `std::cin` remains broken and every subsequent `>>` immediately fails again. `std::cin.ignore(...)` then removes the bad characters from the buffer so the next read starts fresh.

**Example 3 — range validation after a successful extraction:**

```cpp
#include <iostream>
#include <limits>

int readPositive() {
    int n;
    if (!(std::cin >> n)) {
        std::cin.clear();
        std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');
        return -1;   // sentinel: extraction failed
    }
    if (n <= 0)
        return -1;   // sentinel: out of valid range
    return n;
}

int main() {
    int val = readPositive();
    if (val == -1)
        std::cout << "Invalid\n";
    else
        std::cout << "Valid: " << val << '\n';
    return 0;
}
```

Two things can go wrong: the extraction itself can fail (non-numeric input) or the value can be in range but semantically invalid (a negative number). Both cases return the same sentinel so the caller handles them the same way.

## Common mistakes

**Mistake 1 — not clearing after a failed extraction:**

```cpp
int x, y;
std::cin >> x;          // user types "abc"
std::cin >> y;          // fails immediately — stream still broken
std::cout << y << '\n'; // prints garbage or zero
```

If you don't call `std::cin.clear()` after detecting failure, all subsequent extractions fail silently. The variables keep whatever values they had before, which are often uninitialized — undefined behavior.

**Mistake 2 — clearing without ignoring:**

```cpp
std::cin.clear();
// BAD: the "abc" is still in the buffer
std::cin >> x;  // immediately fails again on "abc"
```

`std::cin.clear()` only resets the error flag. It does not remove the bad characters. You must also call `std::cin.ignore(...)` to discard the unconsumed input before the next read.

**Mistake 3 — confusing type failure with range failure:**
`std::cin >> n` succeeds when the user types `"0"` — the extraction works, `n` is now `0`. But if your program requires a positive number, `n == 0` is a semantic error, not an extraction failure. Always check both: did the extraction succeed, and is the value in the valid range?

## When to use this

Any time your program reads user input with `>>`, wrap the extraction in a conditional check. For simple programs that should just report an error and exit, checking `if (!(std::cin >> x))` and printing a message then returning is sufficient. For interactive programs that need to keep prompting until valid input arrives, combine `std::cin.clear()`, `std::cin.ignore(...)`, and a loop. Always validate the value's range separately from the extraction success — a successfully extracted integer might still be outside the acceptable range.

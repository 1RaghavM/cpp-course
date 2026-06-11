## The idea

Every stream carries four status flags that record what has happened to it. Think of them as four light bulbs on a panel. When everything is fine, all four are off. When something goes wrong — the user types letters instead of a number, or the program reaches the end of a file — one or more bulbs switch on. Once a flag is set, the stream refuses to do more work until you acknowledge the problem and turn the flag off. This mechanism prevents corrupted data from silently propagating through your program.

Understanding these flags is what separates programs that crash or produce garbage on bad input from programs that recover gracefully and give the user a second chance.

## How it works

**The four flags**

- `goodbit` — stream is fully functional; all other bits are clear.
- `eofbit` — the end of the input was reached.
- `failbit` — a logical error: the data did not match the expected type, or a non-fatal format problem occurred.
- `badbit` — an unrecoverable I/O error (disk failure, etc.).

Member functions for querying them: `good()`, `eof()`, `fail()`, `bad()`. A stream also converts to `bool` (true when no error flags are set), which is why `while (std::cin >> x)` works.

```cpp
#include <iostream>

int main() {
    int n;
    if (std::cin >> n) {
        std::cout << "Got: " << n << "\n";
    } else {
        std::cout << "Read failed\n";
    }
}
```

If the user types `abc`, the extraction fails, `failbit` is set, and the `if` condition is false.

**Clearing flags and recovering**

Once `failbit` is set, all subsequent read operations do nothing until you call `clear()`. But `clear()` alone is not enough: the offending characters are still in the buffer. Use `ignore` to discard them.

```cpp
#include <iostream>
#include <limits>

int main() {
    int n = 0;
    while (true) {
        std::cout << "Enter an integer: ";
        if (std::cin >> n) break;           // success
        std::cout << "Invalid. Try again.\n";
        std::cin.clear();                   // clear failbit
        std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n'); // discard bad input
    }
    std::cout << "You entered: " << n << "\n";
}
```

**Using the stream as a condition**

Because `operator bool` returns `!fail()`, you can use stream extraction directly in a loop condition:

```cpp
#include <iostream>

int main() {
    int x;
    int sum = 0;
    while (std::cin >> x) {   // stops at EOF or bad input
        sum += x;
    }
    std::cout << "Sum: " << sum << "\n";
}
```

This is idiomatic for reading until end-of-file: redirect a file into the program, and the loop terminates cleanly when the file ends.

**Checking specific flags**

```cpp
if (std::cin.eof())  { /* end of file  */ }
if (std::cin.fail()) { /* bad format   */ }
if (std::cin.bad())  { /* I/O error    */ }
```

`fail()` returns true if either `failbit` OR `badbit` is set. `bad()` returns true only for `badbit`. In practice, check `fail()` for format errors and `bad()` for hardware-level problems.

## Common mistakes

**Mistake 1 — Calling `clear()` without discarding the bad input**

```cpp
std::cin >> n;
if (!std::cin) {
    std::cin.clear();           // clears failbit
    std::cin >> n;              // fails again — "abc" is still in the buffer
}
```

After `clear()`, the bad characters remain. The next read attempt hits `abc` again and immediately sets `failbit` again. Always pair `clear()` with `ignore()` to discard the offending input.

**Mistake 2 — Confusing `eof()` and `fail()` after a failed read**

```cpp
while (!std::cin.eof()) {
    std::cin >> n;
    // ... use n
}
```

When `std::cin` hits an unexpected non-integer, `failbit` is set but `eofbit` is not. The loop spins forever re-reading the same bad data. The idiomatic check is `while (std::cin >> n)` — it stops on either EOF or bad format.

**Mistake 3 — Not checking the stream after extraction**

```cpp
int n;
std::cin >> n;
std::cout << n * 2 << "\n";  // n is garbage if extraction failed
```

If extraction fails, `n` retains its previous value (or garbage if uninitialized). Always check the stream state or the return value of `>>` before using the variable.

## When to use this

Input validation matters whenever a human or an external system can supply your program with unexpected data. Any interactive program that reads typed numbers should use the `clear()`+`ignore()` recovery loop. Programs that read data files should check `cin.fail()` after each read to catch truncated or malformed records. The `while (stream >> value)` idiom is the right choice for reading an unknown number of values until end-of-file. These patterns transfer unchanged to file streams and string streams.

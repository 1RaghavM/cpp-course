## The idea

Everything you know about `std::cin` and `std::cout` transfers directly to *file streams*. `std::ifstream` is an input stream connected to a file; `std::ofstream` is an output stream connected to a file. Because both inherit from the same `std::istream`/`std::ostream` base classes you already know, every technique — `>>`, `getline`, `setw`, `clear`/`ignore`, `while (stream >> value)` — works identically.

The key difference from the console streams is lifecycle: you open a file, use it, and close it (or let the destructor close it when it goes out of scope). Getting the open/check/use/close sequence right is the main skill this lesson adds.

## How it works

**Opening and checking a file for reading**

```cpp
#include <fstream>
#include <iostream>
#include <string>

int main() {
    std::ifstream file("data.txt");
    if (!file) {                         // check if open succeeded
        std::cerr << "Cannot open file\n";
        return 1;
    }
    std::string line;
    while (std::getline(file, line)) {   // read until EOF
        std::cout << line << "\n";
    }
}   // file closes automatically here
```

The `if (!file)` check is essential. If the file does not exist, `failbit` is set and every subsequent read silently does nothing without a check.

**Writing to a file**

```cpp
#include <fstream>
#include <iomanip>

int main() {
    std::ofstream out("results.txt");
    if (!out) { return 1; }
    out << std::fixed << std::setprecision(2);
    for (int i = 1; i <= 3; ++i) {
        out << "Item " << i << ": " << i * 1.1 << "\n";
    }
}   // destructor flushes and closes
```

All `<iomanip>` manipulators work on `std::ofstream` because it *is* an `std::ostream`.

**`std::fstream` — read and write**

`std::fstream` can read and write the same file. You must pass open-mode flags to specify the access pattern. The most common modes are:

- `std::ios::in` — open for reading.
- `std::ios::out` — open for writing (truncates by default).
- `std::ios::app` — append; writes go to the end.
- `std::ios::binary` — binary mode (no newline translation).

```cpp
#include <fstream>

int main() {
    std::ofstream out("log.txt", std::ios::app);  // append mode
    out << "new entry\n";
}
```

**Functions that accept any stream**

Because file streams inherit from `std::istream`/`std::ostream`, a function that takes `std::istream&` works with both `std::cin` and `std::ifstream`. This is the payoff of the hierarchy:

```cpp
#include <fstream>
#include <iostream>
#include <string>

int countLines(std::istream& in) {
    int n = 0;
    std::string line;
    while (std::getline(in, line)) ++n;
    return n;
}

int main() {
    std::ifstream f("data.txt");
    std::cout << countLines(f) << "\n";   // works with file
    // countLines(std::cin) would also work
}
```

## Common mistakes

**Mistake 1 — Not checking whether the file opened**

```cpp
std::ifstream file("missing.txt");
std::string line;
std::getline(file, line);  // silently does nothing; line stays ""
std::cout << line << "\n"; // prints blank line — no error message
```

Always check `if (!file)` immediately after opening. A missing or permission-denied file sets `failbit`; the program continues without any indication that the reads silently failed.

**Mistake 2 — Forgetting that `std::ofstream` truncates by default**

```cpp
std::ofstream out("log.txt");   // truncates any existing log.txt to zero bytes
out << "entry\n";
```

If the intent is to add to an existing file, use `std::ios::app` mode. Otherwise the previous content is silently discarded.

**Mistake 3 — Using the stream after it has been moved or closed**

```cpp
std::ifstream f("data.txt");
f.close();
std::string s;
std::getline(f, s);  // reads nothing — stream is closed; failbit is set
```

After `close()`, the stream is in a failed state. If you need to reopen it, call `f.open("other.txt")` which implicitly clears the state (or call `f.clear()` first).

## When to use this

Use `std::ifstream` to read configuration files, data files, or logs. Use `std::ofstream` to write output files, logs, or results. Prefer `std::ios::app` when you are adding records to an existing file rather than replacing it. Because the file stream API is identical to the console stream API, you can write and test functions against `std::cin`/`std::cout` and then seamlessly point them at files without changing the function bodies — just swap the stream argument.

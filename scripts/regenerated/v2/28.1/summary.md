## The idea

Every C++ program that interacts with the outside world — reading a number the user types, printing results to the screen, writing data to a file — does so through *streams*. A stream is a one-directional sequence of bytes that flows between your program and some external endpoint. Think of it like a water pipe: you push bytes in one end, and they come out the other. The stream handles all the buffering and transport details; you just read or write.

The C++ standard library organises streams into a class hierarchy. At the root sits `std::ios_base`, which holds flags and formatting state. One level down is `std::basic_ios`, which adds a stream buffer and error-state bits. From there the hierarchy splits into two branches: `std::istream` for reading and `std::ostream` for writing. `std::iostream` inherits from both and supports reading and writing on the same object.

The objects you already know — `std::cin`, `std::cout`, `std::cerr`, and `std::clog` — are instances of these classes, pre-connected to the terminal when your program starts. They are not special keywords; they are ordinary global objects defined in `<iostream>`.

## How it works

**The four standard stream objects**

```cpp
#include <iostream>

int main() {
    int x;
    std::cin >> x;            // read from standard input
    std::cout << x * 2 << "\n"; // write to standard output (buffered)
    std::cerr << "done\n";    // write to standard error (unbuffered)
    // std::clog writes to standard error but IS buffered
}
```

`std::cout` and `std::clog` are *buffered*: bytes accumulate in an internal buffer and are sent to the OS in chunks, which is faster. `std::cerr` is *unbuffered*: each write goes straight to the OS, so diagnostic messages appear immediately even if the program crashes.

**The stream hierarchy in practice**

Because `std::cin` is an `std::istream`, any function that takes an `std::istream&` parameter works with `std::cin`. The same object can later be swapped for a file stream or a string stream — the function never needs to change.

```cpp
#include <iostream>

void greet(std::istream& in) {
    std::string name;
    in >> name;
    std::cout << "Hello, " << name << "\n";
}

int main() {
    greet(std::cin);   // works with terminal input
}
```

**Insertion and extraction operators**

`<<` is the *insertion* operator: it inserts data into an output stream. `>>` is the *extraction* operator: it extracts data from an input stream. Both return a reference to the stream itself, which is why you can chain them:

```cpp
std::cout << "x=" << 42 << " y=" << 3.14 << "\n";
```

Each `<<` returns `std::cout`, and the next `<<` operates on that returned reference. The chain evaluates left to right.

## Common mistakes

**Mistake 1 — Including the wrong header**

Beginners sometimes include `<stdio.h>` (the C header for `printf`/`scanf`) and then try to use `std::cout`. The `std::cout` and `std::cin` objects live in `<iostream>`; `<stdio.h>` provides nothing for them.

```cpp
#include <cstdio>   // wrong for std::cout
std::cout << "hello"; // compiler error: 'cout' is not a member of 'std'
```

Fix: use `#include <iostream>`.

**Mistake 2 — Treating cerr as cout**

Some learners use `std::cerr` for normal output because "it always appears on screen." This breaks the moment someone pipes the program's stdout to a file: cerr goes to the terminal, but cout goes to the file, which is the desired behaviour. Normal program output belongs on `std::cout`; diagnostic and error messages belong on `std::cerr`.

**Mistake 3 — Forgetting that cout is buffered**

If a program terminates abnormally (a crash or `std::abort()`), the cout buffer may not be flushed and output may be lost. For debugging you need `std::cerr` (unbuffered) or an explicit `std::cout.flush()` / `"\n"` followed by flushing (or `std::endl`, which flushes but is slower than `"\n"`). A program that uses `std::cout << "about to crash\n"` right before a segfault may never show that line.

## When to use this

You will use `std::cin` and `std::cout` in almost every interactive program. Prefer `std::cerr` for error and diagnostic output so that normal output and error output can be separated by the shell. Reach for `std::clog` when you want buffered diagnostic output (log lines that tolerate some latency). The stream hierarchy matters when you write functions that should work on any stream — declare parameters as `std::istream&` or `std::ostream&` rather than specifically `std::cin`/`std::cout`, and the same function will work with file streams and string streams introduced in the upcoming lessons of this chapter.

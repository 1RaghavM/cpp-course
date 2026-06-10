## The idea

When you run a program from the terminal, you can pass extra pieces of text to it before it starts. These are command-line arguments. Running `./myprog hello world` passes the strings `hello` and `world` to the program. The program receives them as an array of C-style strings before `main` begins executing.

This is how virtually every command-line tool you have ever used is configured: `g++ -std=c++20 -o out main.cpp`, `ls -la /tmp`, `git commit -m "fix bug"` — each of those words and flags after the program name is an argument. Learning to read them turns a program that always does the same thing into a reusable tool.

## How it works

**The `argc` / `argv` signature**

`main` has an overload that accepts two parameters: `argc` (argument count) and `argv` (argument vector):

```cpp
#include <iostream>

int main(int argc, char* argv[]) {
    std::cout << "Argument count: " << argc << "\n";
    for (int i = 0; i < argc; ++i)
        std::cout << "argv[" << i << "] = " << argv[i] << "\n";
    return 0;
}
```

`argc` is always at least 1. `argv[0]` is the program name (or path). The user-supplied arguments start at `argv[1]`. Running `./show hello 42` prints:

```
Argument count: 3
argv[0] = ./show
argv[1] = hello
argv[2] = 42
```

`argv` is a `char*[]` — an array of pointers to C-style strings. To use an argument as an integer, convert it with `std::stoi`; as a double, use `std::stod`.

**Converting arguments and using them**

A practical program that adds two numbers passed as arguments:

```cpp
#include <iostream>
#include <string>

int main(int argc, char* argv[]) {
    if (argc != 3) {
        std::cout << "Usage: add <a> <b>\n";
        return 1;
    }
    int a = std::stoi(argv[1]);
    int b = std::stoi(argv[2]);
    std::cout << a + b << "\n";
    return 0;
}
```

`std::stoi` converts the C-string `argv[1]` to `int`. Always check `argc` before accessing `argv[i]` — indexing past `argc - 1` is undefined behavior.

**A flag-based tool**

Programs often accept flag arguments that change behavior. A simple example that greets either formally or informally based on a `--formal` flag:

```cpp
#include <iostream>
#include <string>

int main(int argc, char* argv[]) {
    bool formal = false;
    std::string name;

    for (int i = 1; i < argc; ++i) {
        std::string arg = argv[i];
        if (arg == "--formal") formal = true;
        else name = arg;
    }

    if (name.empty()) { std::cout << "No name given\n"; return 1; }
    if (formal) std::cout << "Good day, " << name << ".\n";
    else        std::cout << "Hey, " << name << "!\n";
    return 0;
}
```

Running `./greet --formal Alice` prints `Good day, Alice.` Running `./greet Alice` prints `Hey, Alice!`

## Common mistakes

**Mistake 1 — accessing `argv` out of bounds**

`argv` has exactly `argc` valid pointers (indices 0 through `argc - 1`). Accessing `argv[argc]` or beyond is undefined behavior, often a crash. Always check `argc` first:

```cpp
// WRONG: argv[1] may not exist
int val = std::stoi(argv[1]);

// RIGHT: check before accessing
if (argc < 2) { std::cout << "Missing argument\n"; return 1; }
int val = std::stoi(argv[1]);
```

**Mistake 2 — forgetting that `argv[0]` is the program name**

A program expecting one user argument needs `argc == 2` (program name plus one argument). Checking `argc == 1` instead accepts zero user arguments, causing an out-of-bounds access on `argv[1]`:

```cpp
if (argc == 1) {           // WRONG: this means no user args supplied
    std::stoi(argv[1]);    // undefined behavior — argv[1] doesn't exist
}
// argc == 2 means exactly one user argument was provided
```

**Mistake 3 — `stoi` throws on invalid input**

`std::stoi` throws `std::invalid_argument` if the string is not a valid integer and `std::out_of_range` if the number is too large. In exercises and competitive contexts you can assume valid input; in real programs, wrap the call in a try-catch or validate the string before converting.

```cpp
std::stoi("hello");   // throws std::invalid_argument — not a number
std::stoi("99999999999999");  // throws std::out_of_range
```

## When to use this

Command-line arguments are the standard way to make a compiled C++ program configurable without recompiling or modifying the source. Use them for file paths, mode flags, numeric parameters, and any setting a user might want to change between runs.

For interactive input that changes during a run, `std::cin` is still appropriate. Command-line arguments are for startup configuration — things the program needs to know before it begins its main logic.

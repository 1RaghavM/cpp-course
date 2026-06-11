## The idea

Any program of real size splits across multiple `.cpp` files. When those files all need the same named constant — say, the maximum number of players in a game, or the mathematical constant pi — you have to decide where the constant lives and how every file can see it.

The naive solution is to copy-paste `const int kMaxPlayers = 4;` into every `.cpp` file. That works for small programs, but the moment you change the value you have to find and update every copy. The more principled solution is to put the constant in a single location and let every file that needs it read from there. This lesson covers the three approaches and explains why the modern `inline const` in a header is the cleanest one.

## How it works

**Approach 1 — define in one `.cpp`, declare in the header (the traditional way)**

Before C++17 this was standard practice for non-trivially-initialised constants.

```cpp
// constants.h
#pragma once
extern const int kMax;   // declaration only — no value

// constants.cpp
#include "constants.h"
const int kMax = 100;    // single definition
```

Every `.cpp` that includes `constants.h` sees the declaration and can use `kMax`. The linker finds the one definition in `constants.cpp`. This is correct but verbose: you maintain two separate files, and the constant's value is invisible at compile time in files other than `constants.cpp`, which prevents the compiler from using it in `constexpr` expressions.

**Approach 2 — inline const in the header (modern, recommended)**

C++17 introduced `inline` variables. An `inline const` in a header can appear in as many translation units as you like; the linker merges all the identical definitions into one.

```cpp
// constants.h
#pragma once
inline const int    kMax      = 100;
inline const double kPi       = 3.14159265358979;
inline const int    kMinScore = 0;
```

Any `.cpp` that does `#include "constants.h"` has access to all three constants. There is one object in memory (the linker merges them), and the compiler can see the value immediately, enabling constant-folding and use in `constexpr` contexts.

**A single-file illustration of the pattern**

In a single-file program you cannot demonstrate multiple translation units, but the syntax is the same:

```cpp
#include <iostream>

inline const int kWidth  = 80;
inline const int kHeight = 24;

int area(int w, int h) {
    return w * h;
}

int main() {
    std::cout << "Terminal: " << kWidth << "x" << kHeight << "\n";
    std::cout << "Area: "     << area(kWidth, kHeight)    << "\n";
    return 0;
}
```

Output:
```
Terminal: 80x24
Area: 1920
```

The constants are defined once, used multiple times, and the value is baked in at compile time.

**Why not just use `#define`?**

Some older codebases use the preprocessor:

```cpp
#define K_MAX 100
```

This works but has serious drawbacks: the preprocessor does textual substitution with no type, no scope, and no namespace. The name `K_MAX` is invisible to the debugger and bypasses type checking. Typed `inline const` constants are strictly better.

## Common mistakes

**Forgetting `inline` and getting a linker error**

```cpp
// constants.h  — WRONG
const int kLimit = 50;
```

A plain `const int` at namespace scope has internal linkage by default in C++. Each translation unit that includes this header gets its own copy. For simple integers this usually links fine (internal linkage avoids the ODR conflict), but it wastes memory — there may be dozens of distinct `kLimit` objects in the final binary, one per translation unit. For types that are expensive to construct (large `const std::string`, for example), this overhead is real. Use `inline const` to guarantee a single shared object.

**Confusing declaration and definition when using the extern pattern**

```cpp
// constants.h — WRONG (this is a definition, not just a declaration)
extern const int kMax = 100;   // the initialiser makes this a definition
```

The `extern` keyword with an initialiser is still a definition. If this header is included by two `.cpp` files, the linker sees two definitions and rejects the program. A pure declaration has no initialiser: `extern const int kMax;`. The definition with the value lives in exactly one `.cpp`. Many learners mix these up and get confusing linker errors.

**Using the constant before the header is included**

```cpp
// main.cpp — WRONG
std::cout << kPi << "\n";   // kPi used before any #include
#include "constants.h"
```

Constants (and all names) must be declared before use. The `#include` directive must appear before the first reference to any name from that header. This seems obvious but typos or copy-paste errors cause it more often than you would expect.

## When to use this

Reach for `inline const` in a header whenever you have a named constant that multiple `.cpp` files need and that does not change at runtime. Common examples: mathematical constants, game configuration (grid size, maximum lives), physical constants in a simulation. If you are working with a codebase that predates C++17, you may encounter the `extern const` pattern and it is worth knowing. For truly compile-time constants that must be usable in array sizes or template parameters, `constexpr` (covered in chapter 5) is even better — but `inline const` handles the majority of real cases cleanly.

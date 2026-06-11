## The idea

A C-style string is just an array of `char` ending in a null terminator (`'\0'`). When you write `const char* greeting = "Hello";`, you are creating a *string literal* — a sequence of characters stored somewhere in read-only program memory — and binding a pointer to it. That pointer is a symbolic constant: a name for a fixed address. The key mental model is that **the pointer does not own the characters**. It just points at them. The string literal itself lives forever (static duration), but you must never try to modify it.

This is different from a `char` array that you initialize yourself. An array owns its characters; a pointer to a literal does not. Understanding this distinction keeps you away from one of C++'s most persistent footguns.

## How it works

**Declaring a pointer to a string literal**

```cpp
#include <iostream>

int main()
{
    const char* msg = "Good morning";
    std::cout << msg << '\n';      // prints: Good morning
    std::cout << *msg << '\n';     // prints: G  (first character)
    return 0;
}
```

`msg` is a `const char*` — a pointer to constant characters. The `const` is mandatory in good C++ because the string literal lives in read-only memory. The `<<` operator knows to keep printing characters until it hits `'\0'`.

**Symbolic constants in arrays of pointers**

One of the most practical uses of `const char*` is building a table of string names without wasting space on fixed-width character arrays:

```cpp
#include <iostream>

int main()
{
    const char* days[7] = {
        "Monday", "Tuesday", "Wednesday",
        "Thursday", "Friday", "Saturday", "Sunday"
    };

    for (int i = 0; i < 7; ++i)
        std::cout << days[i] << '\n';

    return 0;
}
```

Each element of `days` is a pointer that points at a different string literal. The array itself holds seven pointers, not the characters. This is efficient — you do not copy anything.

**Comparing `const char*` vs `char[]`**

A `char[]` owns its characters; modifying them is safe. A `const char*` pointing to a literal must never be written through:

```cpp
#include <iostream>

int main()
{
    char mutable_str[] = "Hello";     // array owns the chars
    mutable_str[0] = 'J';            // OK: Jello
    std::cout << mutable_str << '\n';

    const char* literal = "Hello";   // pointer to read-only data
    // literal[0] = 'J';             // undefined behavior — DO NOT do this
    std::cout << literal << '\n';

    return 0;
}
```

The difference matters at runtime. The array version allocates characters on the stack; the pointer version refers to read-only program storage.

## Common mistakes

**1. Dropping `const` from the pointer type**

```cpp
char* msg = "Hello";   // warning or error in C++
msg[0] = 'h';          // undefined behavior — likely crash
```

The string literal is `const`. Assigning it to a non-`const` pointer is deprecated in C++ and produces a compiler warning or error depending on the version. The `const` tells both you and the compiler "these characters are not yours to change." Always write `const char*` when pointing at a literal.

**2. Comparing two `const char*` pointers with `==`**

```cpp
const char* a = "hello";
const char* b = "hello";
if (a == b)              // compares ADDRESSES, not characters
    std::cout << "same\n";
```

`==` on two pointers checks whether they store the same address — not whether the strings have the same content. Some compilers merge identical literals so this accidentally returns true sometimes, but that is not guaranteed. The correct comparison uses `std::strcmp` from `<cstring>`, or — far better — use `std::string` (covered in chapter 5) where `==` does compare content.

**3. Printing the address instead of the string**

When you have a `const char*` pointing somewhere useful and accidentally `static_cast` it or store it in a `void*`, `cout` will print a hex address instead of the text. This is because `<<` has a special overload for `char*` that walks the characters, but not for other pointer types. If you see something like `0x4005c8` instead of your expected string, a pointer cast is usually the culprit.

## When to use this

Use `const char*` symbolic constants when you need a compile-time name for a fixed string — such as a version tag, a file-extension constant, or a lookup table of labels — and you have no need to modify the contents. They are also the natural type for string literal arguments to C library functions like `fopen` or `printf`.

For any string you intend to build, compare with `==`, resize, or pass around safely, prefer `std::string` (chapter 5) or `std::string_view`. `std::string` owns its memory and makes copying and comparison straightforward. `const char*` is essentially the low-level building block that `std::string` manages for you. In modern C++ you only reach for raw `const char*` when interfacing with C APIs or when writing a small lookup table of immutable labels where the overhead of `std::string` is not desired.

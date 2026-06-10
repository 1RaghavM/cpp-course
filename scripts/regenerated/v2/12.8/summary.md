## The idea

A pointer stores an address. But what should a pointer contain when it is not pointing at anything — when there is no valid object for it to refer to? The answer is `nullptr`, the null pointer value. A null pointer is a pointer that is guaranteed not to point to any object. It is the conventional way to represent "this pointer has no target right now."

Think of a pointer as a piece of paper with an address written on it. A null pointer is a blank piece of paper. When someone hands you a piece of paper, you can check whether it is blank before trying to follow the address. That check — testing whether a pointer is null before dereferencing it — is the null check, and it is one of the most important defensive habits in C++ programming.

`nullptr` replaces the old C idiom of using the integer `0` or the macro `NULL` for the same purpose. Use `nullptr` in all modern C++ code.

## How it works

**Declaring and testing a null pointer.**

```cpp
#include <iostream>

int main() {
    int* p = nullptr;   // p holds no valid address

    if (p != nullptr) {
        std::cout << *p << '\n';   // safe: only reached when p points somewhere
    } else {
        std::cout << "no value\n";
    }
    return 0;
}
```

`nullptr` is a keyword whose value converts to any pointer type. Comparing a pointer to `nullptr` with `!=` or `==` tells you whether it currently holds a valid address. The condition `if (p)` is equivalent to `if (p != nullptr)` — a non-null pointer is truthy, a null pointer is falsy — but the explicit form is clearer for learners.

**Setting a pointer to null and then to a valid address.**

```cpp
#include <iostream>

int main() {
    int* p = nullptr;
    int x = 42;

    p = &x;                // p now points to x
    if (p != nullptr) {
        std::cout << *p << '\n';   // prints 42
    }

    p = nullptr;           // "unset" the pointer
    if (p != nullptr) {
        std::cout << *p << '\n';   // never reached
    } else {
        std::cout << "empty\n";
    }
    return 0;
}
```

You can reset a pointer to `nullptr` at any time. This is useful after you are done using a pointer — it leaves the pointer in a clean, testable state rather than holding a stale (dangling) address.

**Null pointer as a function result signal.**

A common pattern is for a function to return a pointer, using `nullptr` to signal "no result found":

```cpp
#include <iostream>

// Returns a pointer to x if x is positive, nullptr otherwise.
int* positiveOrNull(int& x) {
    if (x > 0) {
        return &x;
    }
    return nullptr;
}

int main() {
    int a = 5;
    int* result = positiveOrNull(a);
    if (result != nullptr) {
        std::cout << *result << '\n';   // prints 5
    } else {
        std::cout << "not positive\n";
    }
    return 0;
}
```

The caller always checks before dereferencing. This pattern is the pointer equivalent of returning an optional value.

## Common mistakes

**Dereferencing a null pointer.**

```cpp
int* p = nullptr;
*p = 10;   // undefined behavior: crash or worse
```

This is the single most common and dangerous pointer mistake. A null pointer has no target object — dereferencing it is undefined behavior, which on most systems means an immediate crash. Always null-check before dereferencing a pointer that might be null.

**Confusing `nullptr` with the integer zero.**

`nullptr` is not `0` in any arithmetic sense. You cannot write `p = 0;` in modern C++ and expect it to be idiomatic (it may compile but is deprecated). You cannot do arithmetic on `nullptr` or compare it to an `int`. It is a pointer-specific constant.

**Checking the wrong variable.**

```cpp
int x = 0;
int* p = &x;
if (p != nullptr) {
    std::cout << *p << '\n';   // prints 0, not "nothing"
}
```

A non-null pointer can point to a variable that holds 0. Testing `p != nullptr` checks only whether the pointer itself has a valid address, not what value is stored there. If you also need to know whether the pointed-to value is meaningful, that is a separate check on `*p`, not on `p` itself.

## When to use this

Use `nullptr` any time you declare a pointer you are not immediately pointing at something — it is safer than leaving the pointer uninitialized. Null-check every pointer before dereferencing it whenever the pointer could legitimately be null. In the "positiveOrNull" pattern, a function returns `nullptr` instead of a special sentinel value like `-1` to communicate "no result" in a type-safe way. For cases where "no value" is common and references are not appropriate, `nullptr` is the idiomatic C++ signal. Later, `std::optional` (covered in chapter 12) offers a higher-level alternative to the pointer-as-optional pattern, but understanding null pointers is prerequisite knowledge for working with raw memory, dynamic allocation, and many C and C++ APIs.

## The idea

The previous lesson established the basics of pass-by-address: hand a pointer to a function, dereference to read or write the original variable. This lesson covers two important extensions that arise in real programs.

The first is *pass by address to pass ownership of a pointer*. When you pass a pointer by value, the function gets a copy of that pointer. Changing the copy's value (making it point somewhere else) does not affect the caller's pointer. If you want the function to be able to change *which address* the caller's pointer holds, you must pass the pointer by address — a pointer to a pointer.

The second is *preferring pass by reference over pass by address* in modern C++. Since references cannot be null and cannot be accidentally reseated, they are safer and more readable for the common case. Understanding pass-by-address fully means knowing when to reach for it and — just as importantly — when to choose a reference instead.

## How it works

**Modifying a pointer inside a function (pointer to pointer)**

When a function receives `int* ptr`, it holds a *copy* of the original pointer. Assigning to `ptr` inside the function only changes the copy:

```cpp
#include <iostream>

void tryReseat(int* ptr, int* other) {
    ptr = other;   // only changes the local copy
}

int main() {
    int a { 1 }, b { 2 };
    int* p { &a };
    tryReseat(p, &b);
    std::cout << *p << '\n';  // still prints 1 — p was not changed
    return 0;
}
```

To let the function actually change the caller's pointer, pass the pointer by address (i.e., pass a `int**`):

```cpp
#include <iostream>

void reseat(int** pptr, int* other) {
    *pptr = other;   // writes through the outer pointer
}

int main() {
    int a { 1 }, b { 2 };
    int* p { &a };
    reseat(&p, &b);            // pass address of the pointer p
    std::cout << *p << '\n';   // prints 2 — p now points at b
    return 0;
}
```

`&p` is of type `int**`. Inside `reseat`, `*pptr` is the original pointer `p`, and assigning to it changes which address `p` holds.

**Preferring references over pointers for non-optional parameters**

Pass-by-address forces callers to write `&x`, which adds noise. It also allows callers to pass `nullptr`, which the function must then guard against. When the parameter is mandatory and cannot be null, a reference is cleaner:

```cpp
#include <iostream>

// Using a reference — cleaner, cannot be null
void doubleRef(int& val) { val *= 2; }

// Using a pointer — extra & at call site, must handle null
void doublePtr(int* ptr) {
    if (ptr == nullptr) return;
    *ptr *= 2;
}

int main() {
    int x { 5 };
    doubleRef(x);          // x is now 10
    doublePtr(&x);         // x is now 20
    std::cout << x << '\n'; // prints 20
    return 0;
}
```

Both achieve the same result, but `doubleRef` is the idiomatic choice when null is not a valid input.

## Common mistakes

**Mistake 1: expecting a pointer-to-pointer when only a pointer was passed**

The most frequent confusion here: a student writes a function that tries to change the caller's pointer, passes a plain `T*`, and is puzzled that the change does not persist:

```cpp
void makeNull(int* ptr) {
    ptr = nullptr;   // only the local copy changes
}

int main() {
    int x { 5 };
    int* p { &x };
    makeNull(p);
    // p is still &x here — not nullptr
}
```

To have `p` become null after the call, you would need `void makeNull(int** pptr) { *pptr = nullptr; }` and call `makeNull(&p)`. Alternatively, pass `p` by reference: `void makeNull(int*& ptr) { ptr = nullptr; }`.

**Mistake 2: null-checking after dereferencing**

```cpp
void process(int* ptr) {
    int val { *ptr };    // crashes if ptr is null
    if (ptr == nullptr) return;  // too late
    // ...
}
```

Null checks must come *before* any dereference. Dereferencing null, even in a branch that would have caught it a line later, is undefined behavior.

**Mistake 3: choosing a pointer when a reference would do**

Passing `int*` when the value will never be null makes callers write unnecessary `&`s and creates the mistaken impression that null is a valid input. The rule: use a pointer parameter only when null is a meaningful state or when the parameter represents an optional argument; use a reference for everything else.

## When to use this

Pointer-to-pointer parameters (`T**`) appear in C-style APIs that allocate or redirect memory (think `malloc`-style allocators, or functions that create objects and give you back a handle). In modern C++, prefer passing the pointer by reference (`T*&`) instead of `T**` — same power, clearer syntax. The overarching lesson: pass-by-address is the right tool when null is a valid sentinel or when you are interoperating with C interfaces. For all other function parameters, start with a reference and switch to a pointer only when you have a concrete reason.

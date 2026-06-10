## The idea

You have been passing values into functions. Now the question is: what can a function *give back*? Return by value gives back a copy. Return by reference gives back an alias — a reference to a variable that outlives the function call. Return by address gives back a pointer to that variable.

The key insight is lifetimes. A function can only safely return a reference or a pointer to something that *still exists* after the function returns. Returning a reference to a local variable is one of the most dangerous mistakes in C++ because the local variable is destroyed the moment the function exits, leaving a dangling reference — a reference to memory that no longer belongs to that variable. The same hazard applies to pointers: returning a pointer to a local variable gives the caller a pointer to freed stack memory.

Safe uses of return-by-reference share a common pattern: the referenced variable was handed *in* to the function (via a reference or pointer parameter), so it lives in the caller's scope and will remain valid after the function returns.

## How it works

**Return by reference**

A function can return a reference if the referenced object outlives the function. The simplest case: a function accepts a reference and returns that same reference (the object is in the caller's scope, so it lives long enough):

```cpp
#include <iostream>

int& larger(int& a, int& b) {
    return (a >= b) ? a : b;
}

int main() {
    int x { 3 }, y { 7 };
    larger(x, y) = 100;           // assigns to y directly
    std::cout << y << '\n';       // prints 100
    return 0;
}
```

`larger` returns a reference to whichever of `a` or `b` is bigger. Because both are references to caller-scope variables, the returned reference is valid. The return value is an lvalue, so you can assign to it.

**Return by const reference**

When the caller only needs to read the returned value, return a `const` reference to avoid accidental modification:

```cpp
#include <iostream>

const int& smaller(const int& a, const int& b) {
    return (a <= b) ? a : b;
}

int main() {
    int p { 5 }, q { 2 };
    std::cout << smaller(p, q) << '\n';  // prints 2
    return 0;
}
```

**Return by address**

Works the same way as return by reference — only safe when the returned address belongs to an object that outlives the function:

```cpp
#include <iostream>

int* findPositive(int* a, int* b) {
    if (*a > 0) return a;
    if (*b > 0) return b;
    return nullptr;   // signal "not found" — impossible with references
}

int main() {
    int x { -1 }, y { 4 };
    int* result { findPositive(&x, &y) };
    if (result != nullptr)
        std::cout << *result << '\n';  // prints 4
    return 0;
}
```

Return by address has one advantage over return by reference: the function can return `nullptr` to signal "nothing found". A reference cannot be null, so returning a reference from a "search" function requires a different signaling mechanism.

## Common mistakes

**Mistake 1: returning a reference to a local variable**

```cpp
int& badRef() {
    int local { 42 };
    return local;   // DANGER: local dies here
}

int main() {
    int& r { badRef() };
    std::cout << r << '\n';   // undefined behavior
    return 0;
}
```

`local` is destroyed when `badRef` returns. Using `r` afterward reads garbage (or crashes). Most compilers warn about this. The fix: do not return a reference to anything allocated inside the function.

**Mistake 2: same mistake with pointers**

```cpp
int* badPtr() {
    int local { 99 };
    return &local;   // DANGER: address of a destroyed variable
}
```

Same hazard, same rule: never return the address of a local. The address is valid only within the function body.

**Mistake 3: not checking for null when using return-by-address**

```cpp
int* findPositive(int* a, int* b) {
    if (*a > 0) return a;
    if (*b > 0) return b;
    return nullptr;
}

int main() {
    int x { -1 }, y { -2 };
    int* r { findPositive(&x, &y) };
    std::cout << *r << '\n';   // crash: r is nullptr
    return 0;
}
```

Any function that might return `nullptr` must have its return value null-checked before dereference. Return-by-address is only justified over return-by-reference when this nullable sentinel adds real value.

## When to use this

Return by reference makes the most sense when the function selects one of several caller-scope objects (like `larger` above) or provides indexed access to a container element. Return by const reference avoids a copy when the returned object is large; for small built-in types like `int`, return by value is simpler. Return by address is the right choice when "not found" (`nullptr`) is a valid outcome — the pointer-returning analogue of `std::optional`. In all cases, the hard rule is the same: never return a reference or pointer to a local variable.

## The idea

When you first learn about `const`, it applies to values: a `const int` cannot be changed. When you first learn about pointers, they hold an address: a `int*` lets you read and write the integer at that address. Put the two together and you have a choice — maybe you want the *pointer itself* to be constant, maybe you want the *value it points at* to be constant, or maybe you want both. These three combinations are genuinely different things with different meanings, and mixing them up is one of the most reliable ways to get a confusing compiler error in C++.

The mental model: think of a pointer as a sign on a post. The sign has an arrow pointing to a house. You can ask two separate questions: (1) Can I repaint the house? and (2) Can I swivel the sign to point at a different house? A "pointer to const" means you cannot repaint the house through this sign. A "const pointer" means you cannot swivel the sign. A "const pointer to const" means neither is allowed.

## How it works

**Pointer to const** — the value at the address cannot be modified through this pointer:

```cpp
#include <iostream>

int main() {
    int x { 5 };
    const int* ptr { &x };   // pointer to const int

    // *ptr = 10;            // ERROR: cannot modify through ptr
    x = 10;                  // Fine: x itself is not const
    std::cout << *ptr << '\n'; // prints 10
    return 0;
}
```

The declaration reads right-to-left: `ptr` is a pointer (`*`) to a `const int`. Even though `x` itself is not `const`, the pointer's view of `x` is read-only. You can still change `ptr` to point somewhere else:

```cpp
int y { 20 };
ptr = &y;        // fine — the pointer variable itself is not const
```

**Const pointer** — the pointer cannot be changed to point somewhere else, but the value it points at can still be modified:

```cpp
#include <iostream>

int main() {
    int x { 5 };
    int* const ptr { &x };   // const pointer to int

    *ptr = 10;               // Fine: value can be changed
    // ptr = &x;             // ERROR: cannot reassign a const pointer

    std::cout << x << '\n';  // prints 10
    return 0;
}
```

The `const` after the `*` binds to `ptr` (the pointer variable), not to `int`. Because the pointer is const, it must be initialized when declared and can never be retargeted.

**Const pointer to const** — neither the pointer nor the value can be changed:

```cpp
#include <iostream>

int main() {
    int x { 5 };
    const int* const ptr { &x };  // const pointer to const int

    // *ptr = 10;  // ERROR: value is read-only
    // ptr = &x;   // ERROR: pointer is read-only

    std::cout << *ptr << '\n';    // prints 5
    return 0;
}
```

This is the most restrictive form. It is useful in function parameters when you want to guarantee both that you won't retarget the pointer and that you won't modify the pointed-at value.

## Common mistakes

**Mistake 1: confusing which `const` belongs where**

A common trip-up is writing `int const*` vs `int* const`. Because of right-to-left reading, `int const*` and `const int*` mean the same thing (pointer to const int), while `int* const` means const pointer to int.

```cpp
int x { 5 };
int const* p1 { &x };   // pointer to const int — same as const int*
int* const p2 { &x };   // const pointer to int
```

The trick: look at what is immediately to the left of the `*`. If `const` is there (`const int*` or `int const*`), the *pointee* is const. If `const` is to the right of `*` (`int* const`), the *pointer* is const.

**Mistake 2: assigning a pointer-to-const from a non-const pointer (going the other direction)**

You can always convert a regular pointer to a pointer-to-const — that is a safe "add restriction" operation:

```cpp
int x { 5 };
int* ptr { &x };
const int* cptr { ptr };   // fine: cptr promises not to modify x
```

But you cannot go the other way without a cast, because that would silently allow modification of something that was protected:

```cpp
const int y { 10 };
// int* p = &y;   // ERROR: this would let you do *p = 99 and break const-ness
```

The compiler refuses this assignment. If you see an error about "cannot convert `const int*` to `int*`", this is what happened.

**Mistake 3: thinking a pointer-to-const makes the underlying variable const**

This is the subtlest mistake. A pointer-to-const only restricts what *you* can do through *that pointer*. The underlying variable can still be modified directly or through another non-const pointer:

```cpp
int x { 5 };
const int* cptr { &x };    // cptr cannot modify x
int* mptr { &x };          // mptr can modify x

*mptr = 99;                // x is now 99
std::cout << *cptr << '\n'; // prints 99 — x changed, cptr just watched
```

This is not a bug or a language inconsistency; it is the intended design. `const int*` says "I promise not to change it through this pointer", not "nobody can change it".

## When to use this

Use `const int*` (pointer to const) in function parameters whenever the function only reads the pointed-at value. This documents intent and prevents accidental writes — it is the pointer equivalent of passing `const int&`. Use `int* const` (const pointer) rarely; it mostly appears in cases like member pointers or embedded programming where a pointer must always refer to the same hardware register. Use `const int* const` when you want the maximum guarantee for both the pointer and its target, typically in a function parameter that must not be reseated and must not modify through the pointer.

The most practical rule: any time you write a function that takes a pointer and does not need to modify the pointed-at value, make the parameter `const T*`. This is the direct equivalent of the `const T&` rule taught in "Pass by const lvalue reference" — same philosophy, pointer syntax.

## The idea

You have learned that move operations are faster than copies, and that `noexcept` on a move constructor lets `std::vector` use moves during reallocation. But what if you are writing generic code and you do not know at compile time whether the type you are moving has a `noexcept` move constructor?

`std::move_if_noexcept` solves this. It is a standard library utility that returns an rvalue reference (enabling a move) when the type's move constructor is `noexcept`, and falls back to an lvalue reference (forcing a copy) when it might throw. This gives generic code the safe-move optimization automatically, without having to write conditional logic manually.

This is the mechanism behind how `std::vector` and other containers guarantee strong exception safety while still getting move performance when available.

## How it works

`std::move_if_noexcept(x)` is defined in `<utility>`. Its return type changes based on whether `T`'s move constructor is `noexcept`:

- If `T(T&&) noexcept` → returns `T&&` (same as `std::move`)
- If `T(T&&)` can throw → returns `const T&` (forces a copy)

```cpp
#include <iostream>
#include <utility>

struct Safe {
    Safe() = default;
    Safe(Safe&&) noexcept { std::cout << "Safe moved\n"; }
    Safe(const Safe&) { std::cout << "Safe copied\n"; }
};

struct Risky {
    Risky() = default;
    Risky(Risky&&) { std::cout << "Risky moved\n"; } // not noexcept
    Risky(const Risky&) { std::cout << "Risky copied\n"; }
};

int main() {
    Safe s;
    Safe s2 = std::move_if_noexcept(s); // move: Safe's move ctor is noexcept

    Risky r;
    Risky r2 = std::move_if_noexcept(r); // copy: Risky's move ctor is not noexcept
    return 0;
}
```

Output:
```
Safe moved
Risky copied
```

`s` was moved because its move constructor is `noexcept`. `r` was copied because its move constructor might throw — `move_if_noexcept` protected the caller from a potentially-throwing move.

**Why this matters for strong exception guarantees.**

Suppose you are relocating elements in a buffer. If a move throws halfway through, the original elements have been partially destroyed — you cannot roll back. With `move_if_noexcept`, elements that might throw are copied instead. If any copy throws, all originals are still intact, so the operation can roll back cleanly.

```cpp
#include <iostream>
#include <utility>

template <typename T>
void relocate(T* src, T* dest, int n) {
    for (int i = 0; i < n; ++i) {
        new (dest + i) T(std::move_if_noexcept(src[i]));
    }
}
```

This template moves each element when safe and copies when not, achieving the best performance the type allows while preserving safety.

**Comparing `std::move` and `std::move_if_noexcept`.**

```cpp
#include <utility>
#include <string>

int main() {
    std::string a = "hello";

    // std::move always produces an rvalue:
    std::string b = std::move(a);       // move, even if move ctor could throw

    std::string c = "world";
    // std::move_if_noexcept also produces an rvalue here, because
    // std::string's move ctor is noexcept:
    std::string d = std::move_if_noexcept(c); // move (std::string move is noexcept)
    return 0;
}
```

For types whose move constructors are `noexcept` (like `std::string`, `std::vector`, `std::unique_ptr`), both utilities behave identically. The difference only appears when working with types whose move constructors may throw.

## Common mistakes

**Mistake 1 — using `std::move_if_noexcept` expecting it to suppress moves entirely.**

```cpp
Risky r;
Risky r2 = std::move_if_noexcept(r);
// Programmer thinks: "r is untouched if noexcept is false"
// Reality: r is COPIED, so r is still intact, but the intent to avoid a copy was not met
```

`move_if_noexcept` does not prevent the operation — it chooses between a move and a copy. If the type is not `noexcept`-movable, you get a copy, not a skip.

**Mistake 2 — calling `std::move_if_noexcept` on types that have no move constructor.**

```cpp
struct NoCopy {
    NoCopy(const NoCopy&) = delete;
    NoCopy(NoCopy&&) = default; // defaulted, but is it noexcept?
};
```

Defaulted move constructors are `noexcept` if every member's move constructor is `noexcept`. If you add a member type whose move constructor is not `noexcept`, the class silently loses its own `noexcept` guarantee and `move_if_noexcept` will copy — but if the copy constructor is also deleted, the call will fail to compile. Check that your types annotate move operations correctly.

**Mistake 3 — forgetting to include `<utility>`.**

`std::move_if_noexcept` is in `<utility>`, as is `std::move`. Forgetting the include produces a confusing "not a member of std" error. Always include `<utility>` when using either.

## When to use this

Use `std::move_if_noexcept` when writing generic code — templates or library utilities — that must maintain strong exception guarantees while still benefiting from move semantics when available. Container implementations and relocation routines are the canonical examples.

In ordinary application code, you typically know the concrete type you are working with and can decide directly whether to use `std::move` (when you know the move is `noexcept` or when you accept the risk) or to copy (when you need to preserve the original). Reserve `move_if_noexcept` for code that must work correctly for any type a user might supply, regardless of that type's exception-safety properties.

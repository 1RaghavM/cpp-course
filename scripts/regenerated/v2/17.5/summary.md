## The idea

C++ references are powerful — they let you alias an existing object without copying it. But references have a limitation: you cannot put them in a standard container. An `std::array<int&, 5>` is illegal because references are not objects; they have no identity, no size, and cannot be reseated. Yet sometimes you genuinely want a collection of aliases: a list of "the five highest-scoring students" that points into the main student list rather than copying five students. The standard library provides exactly one tool for this: `std::reference_wrapper<T>`, defined in `<functional>`. It wraps a reference into a regular copyable, assignable object that can live in a `std::array` or any other container.

## How it works

**`std::reference_wrapper<T>` basics**

`std::reference_wrapper<T>` stores a pointer to a `T` internally, but presents itself as a reference-like object. You construct it by passing a variable by reference, and you extract the underlying reference using `.get()` or by implicit conversion.

```cpp
#include <array>
#include <functional>
#include <iostream>

int main() {
    int a = 10, b = 20, c = 30;
    std::array<std::reference_wrapper<int>, 3> refs { a, b, c };
    refs[0].get() = 99;          // modifies a through the wrapper
    std::cout << a << '\n';      // 99
    return 0;
}
```

Notice that `refs[0].get() = 99` changes `a` in the caller — the wrapper genuinely refers to the original variable.

**`std::ref` and `std::cref` convenience helpers**

Writing `std::reference_wrapper<int>` is verbose. The helper function `std::ref(x)` returns `std::reference_wrapper<int>` wrapping `x`, and `std::cref(x)` returns `std::reference_wrapper<const int>`. Use these in initializer lists and function calls.

```cpp
#include <array>
#include <functional>
#include <iostream>

int main() {
    int x = 5, y = 10, z = 15;
    std::array<std::reference_wrapper<int>, 3> vals {
        std::ref(x), std::ref(y), std::ref(z)
    };
    for (int& v : vals) {    // implicit conversion to int& in the range loop
        v *= 2;
    }
    std::cout << x << ' ' << y << ' ' << z << '\n'; // 10 20 30
    return 0;
}
```

The range-based for loop with `int&` works because `std::reference_wrapper<int>` implicitly converts to `int&`.

**Read-only references with `std::cref`**

When you want a view of several existing objects without allowing modification, use `std::reference_wrapper<const T>` or equivalently `std::cref`:

```cpp
#include <array>
#include <functional>
#include <iostream>

int main() {
    const int p = 100, q = 200;
    std::array<std::reference_wrapper<const int>, 2> view {
        std::cref(p), std::cref(q)
    };
    for (const int& v : view) {
        std::cout << v << ' ';
    }
    std::cout << '\n'; // 100 200
    return 0;
}
```

## Common mistakes

**Mistake 1 — confusing `arr[i]` with `arr[i].get()` when you need the value**

```cpp
std::array<std::reference_wrapper<int>, 3> refs { a, b, c };
std::cout << refs[0];     // does NOT print int — prints the wrapper
std::cout << refs[0].get(); // OK: prints the int value
```

`refs[0]` is a `std::reference_wrapper<int>`, not an `int`. You must call `.get()` or explicitly write `static_cast<int&>(refs[0])` to obtain the underlying `int`. In a range-based for with `int& v`, the conversion is implicit, but in a direct `std::cout` call you need `.get()` unless you force the conversion by assigning to a reference first.

**Mistake 2 — storing a reference_wrapper to a temporary**

```cpp
std::reference_wrapper<int> rw = std::ref(42); // 42 is a temporary rvalue — ill-formed
```

`std::reference_wrapper` stores a pointer to the object. A temporary `42` is destroyed immediately, leaving a dangling reference. The compiler may reject this outright or allow it as undefined behavior depending on context. Only wrap lvalues (named variables with a stable lifetime).

**Mistake 3 — trying to put raw references in an array**

```cpp
int a = 1, b = 2;
std::array<int&, 2> refs { a, b }; // compile error: reference is not an object
```

This is the exact problem `std::reference_wrapper` solves. Raw references are not objects and have no size, so they cannot be stored in `std::array`. Replace `int&` with `std::reference_wrapper<int>`.

## When to use this

Use `std::array<std::reference_wrapper<T>, N>` when you need a fixed-size view of several existing objects without copying them and without owning them. Typical situations: selecting N "top" items from a larger collection for display, aliasing several global or long-lived objects under a common interface, or passing a small set of named variables to a function that iterates over them. Prefer `std::cref` when the references should be read-only. If the number of references is not fixed at compile time, consider `std::vector<std::reference_wrapper<T>>` instead.

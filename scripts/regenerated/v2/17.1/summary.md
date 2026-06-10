## The idea

Imagine you need to keep a fixed number of related values together — say, the scores from exactly five quiz rounds, or the coordinates of three vertices of a triangle. You could declare five separate variables, but that scales terribly and makes loops impossible. `std::array<T, N>` solves this: it bundles exactly N values of type T into a single named object, gives them consecutive memory addresses, and lets you access them by index. Unlike a loose collection of variables, the whole group behaves as one object you can copy, return from a function, and store inside another struct.

The key word is *fixed*: the size N must be known at compile time and never changes. If you need a collection that grows and shrinks at runtime, `std::vector` (chapter 16) is the right tool. `std::array` shines when the count is truly constant — a chess board always has 64 squares, a week always has 7 days, a 3-D point always has 3 coordinates.

`std::array` lives in the `<array>` header and belongs to the `std` namespace. It is part of the standard library since C++11 and works seamlessly with range-based for loops and standard algorithms.

## How it works

**Declaring and initializing a `std::array`**

The declaration syntax is `std::array<ElementType, Size>`. The size is a non-type template argument — it must be a compile-time constant.

```cpp
#include <array>
#include <iostream>

int main() {
    std::array<int, 5> scores { 10, 20, 30, 40, 50 };
    std::cout << scores[0] << '\n'; // 10
    std::cout << scores[4] << '\n'; // 50
    return 0;
}
```

The braces initialize all five elements in order. Elements not listed are zero-initialized, so `std::array<int, 5> scores {};` gives five zeros.

**Accessing elements with `operator[]` and `.at()`**

You access elements the same way as a C-style array: `arr[i]`. Indices start at 0 and end at N−1. `arr.at(i)` does the same but checks the bounds at runtime and throws `std::out_of_range` if i is out of range. For index-safe access in early development, `.at()` is helpful.

```cpp
#include <array>
#include <iostream>

int main() {
    std::array<double, 3> temps { 36.6, 37.1, 36.9 };
    for (int i = 0; i < 3; ++i) {
        std::cout << temps[i] << '\n';
    }
    return 0;
}
```

**Range-based for loop**

Because `std::array` provides `.begin()` and `.end()` iterators, a range-based for loop works directly:

```cpp
#include <array>
#include <iostream>

int main() {
    std::array<int, 4> vals { 2, 4, 6, 8 };
    for (int v : vals) {
        std::cout << v << ' ';
    }
    std::cout << '\n'; // 2 4 6 8
    return 0;
}
```

This is the cleanest way to visit every element when you do not need the index.

## Common mistakes

**Mistake 1 — using a runtime variable as the size**

```cpp
int n = 5;
std::array<int, n> arr {}; // ERROR: n is not a compile-time constant
```

The compiler rejects this because template non-type arguments must be compile-time constants. Use `constexpr` when you want a named size:

```cpp
constexpr int N = 5;
std::array<int, N> arr {};  // OK
```

If the size truly must be determined at runtime, use `std::vector` instead.

**Mistake 2 — off-by-one index with `operator[]`**

```cpp
std::array<int, 3> a { 1, 2, 3 };
std::cout << a[3]; // undefined behavior — valid indices are 0, 1, 2
```

`operator[]` does not check bounds, so reading index 3 on a 3-element array silently reads memory past the end of the array. The program may print a garbage value, crash, or appear to work. Use `.at(3)` during development to catch this as a runtime error instead.

**Mistake 3 — assuming default initialization fills with zeros**

```cpp
std::array<int, 4> arr; // elements are UNINITIALIZED (indeterminate values)
std::cout << arr[0];    // reads garbage
```

In C++, `std::array<int, 4> arr;` without an initializer leaves the elements uninitialized when the array has automatic storage duration (stack). Always value-initialize with `{}` if you want zeros: `std::array<int, 4> arr {};`.

## When to use this

Reach for `std::array<T, N>` whenever you have a fixed, compile-time-known count of homogeneous values and you want them on the stack with no heap allocation. Typical examples: the sides of a polygon that is always a specific shape, lookup tables for small fixed datasets, game board rows, or RGB channels of a single pixel. Prefer it over raw C-style arrays because it carries its own length, supports copy/assignment out of the box, and fits naturally into range-based for loops. When the count can vary at runtime or you need push/pop semantics, use `std::vector` from chapter 16 instead.

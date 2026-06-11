## The idea

C++11, published in 2011, was the most significant update to the C++ language since its inception. It transformed the language from a refined version of "C with classes" into modern C++: a language with move semantics, type inference, lambda expressions, concurrency primitives, and dramatically safer resource management. Almost every feature introduced in later standards (C++14, C++17, C++20) builds on the foundation C++11 established. If you have been working through this curriculum you have already used C++11 features without necessarily knowing they were introduced in that standard — `auto`, range-based for loops, `nullptr`, smart pointers, `std::vector` with initializer lists, and more all date to C++11.

## How it works

**`auto` and type inference**

Before C++11, every variable declaration required an explicit type. `auto` lets the compiler deduce the type from the initializer:

```cpp
auto x = 42;          // int
auto y = 3.14;        // double
auto z = "hello";     // const char*
```

This is especially useful for iterator types that would otherwise require verbose declarations like `std::vector<int>::iterator`.

**Move semantics and rvalue references**

C++11 introduced the concept of *move semantics*: instead of copying a resource-owning object, its contents can be "stolen" from a temporary. The `&&` syntax marks an rvalue reference:

```cpp
#include <vector>
#include <utility>

std::vector<int> make_vec() {
    std::vector<int> v = {1, 2, 3, 4, 5};
    return v;  // move, not copy (Named Return Value Optimization / move semantics)
}

int main() {
    std::vector<int> v = make_vec();  // no deep copy of the elements
    std::vector<int> w = std::move(v); // explicitly move: v becomes empty
}
```

Before C++11, returning a large vector from a function always caused a deep copy of every element. Move semantics reduce this to a pointer swap.

**Lambda expressions**

Lambdas allow anonymous function objects to be defined inline:

```cpp
#include <algorithm>
#include <vector>
#include <iostream>

int main() {
    std::vector<int> v = {5, 1, 3, 2, 4};
    std::sort(v.begin(), v.end(), [](int a, int b) { return a < b; });
    for (int x : v) std::cout << x << ' ';  // 1 2 3 4 5
}
```

The `[capture]` clause controls what variables from the enclosing scope are accessible inside the lambda body.

**Smart pointers**

`std::unique_ptr` and `std::shared_ptr` were introduced in C++11 (in `<memory>`). They automate `delete` via RAII and replace nearly all raw `new`/`delete` in application code.

**`nullptr` and `= delete` / `= default`**

`nullptr` is a type-safe null pointer constant, replacing the old `NULL` or `0`. Functions can be explicitly deleted (`= delete`) or defaulted (`= default`):

```cpp
struct NoCopy {
    NoCopy() = default;
    NoCopy(const NoCopy&) = delete;  // copying is forbidden
};
```

**Other notable C++11 additions**

- Range-based for loops: `for (auto x : container)`
- `constexpr` for compile-time evaluation
- `static_assert` for compile-time assertions
- Variadic templates
- `std::thread` for multithreading
- Uniform initialization: `int x{5};`
- `override` and `final` for virtual functions
- Scoped enumerations: `enum class Color { Red, Green, Blue };`
- `std::array` — a fixed-size array wrapper
- Initializer lists for standard containers

## Common mistakes

**Mistake 1: Using `auto` when the type should be explicit**

`auto` is a readability tool, not a universally superior replacement for explicit types. `auto x = vec.size();` deduces `std::size_t` (unsigned). If you later write `x - 1` when `x` is 0, you get unsigned wrap-around rather than -1. Prefer explicit types when the deduced type is non-obvious or when signedness matters.

**Mistake 2: Forgetting that `std::move` doesn't actually move**

`std::move` is a cast — it casts an lvalue to an rvalue reference, enabling a move operation. The actual transfer of resources happens in the move constructor or move assignment operator. After `std::move(v)`, `v` is in a "valid but unspecified" state — do not use it without reassigning it first.

**Mistake 3: Capturing by reference in a lambda that outlives the scope**

```cpp
auto make_adder = [](int n) {
    int local = n;
    return [&local](int x) { return x + local; };  // BUG: local is destroyed
};
```

`local` is a stack variable. The inner lambda captures it by reference. After `make_adder` returns, `local` is destroyed; using the returned lambda is undefined behavior. Capture by value (`[local]`) when the lambda may outlive the local variable.

## When to use this

C++11 is the minimum standard for any new C++ code written today. Most modern compilers default to at least C++14 or C++17. You activate C++11 explicitly with `-std=c++11` (GCC/Clang) or `/std:c++11` (MSVC), though `-std=c++20` is a better default for new projects. The features covered here — `auto`, lambdas, move semantics, smart pointers, range-for — should be part of your default vocabulary whenever you write C++.

## The idea

C++14, published in 2014, is best understood as a polish pass on C++11. It did not introduce a sweeping new paradigm — it took the best ideas from C++11 and made them more expressive, more consistent, and less prone to papercut annoyances. Many C++14 changes are things you would have wanted in C++11 but that arrived just slightly late: return type deduction for regular functions, generic lambdas, relaxed `constexpr`, binary literals, and a cleaner syntax for creating unique pointers. If C++11 was the revolution, C++14 is the moment the revolution became comfortable to live in day-to-day.

## How it works

**Return type deduction for functions**

C++11 introduced `auto` for variables. C++14 extended it to function return types. The compiler deduces the return type from the `return` statement:

```cpp
auto square(int x) {
    return x * x;  // compiler deduces int
}

auto divide(double a, double b) {
    return a / b;  // deduces double
}
```

The function body must have consistent return types (all `return` statements must yield the same deduced type). For recursive functions, at least one `return` must appear before the recursive call for deduction to work.

**Generic lambdas**

C++11 lambdas required you to specify the parameter types. C++14 allows `auto` parameters, making a lambda behave like a function template:

```cpp
#include <iostream>
int main() {
    auto twice = [](auto x) { return x + x; };
    std::cout << twice(5)   << '\n';   // 10 (int)
    std::cout << twice(3.5) << '\n';   // 7 (double)
    std::cout << twice(std::string("ab")) << '\n'; // "abab"
}
```

Each call with a different type instantiates a new overload of the underlying function-call operator, just like a template function.

**`std::make_unique`**

C++11 introduced `std::unique_ptr` but, inexplicably, did not include `std::make_unique`. C++14 added it:

```cpp
#include <memory>
// C++11: had to write this manually
std::unique_ptr<int> p1(new int(42));

// C++14: cleaner and exception-safe
auto p2 = std::make_unique<int>(42);
```

Using `make_unique` is safer because it ensures no memory is leaked if the constructor of the managed object throws.

**Relaxed `constexpr` functions**

C++11 `constexpr` functions were severely restricted: they could contain only a single `return` statement. C++14 relaxed this to allow local variables, loops, and conditionals:

```cpp
constexpr int factorial(int n) {
    int result = 1;
    for (int i = 2; i <= n; ++i)
        result *= i;
    return result;
}
static_assert(factorial(5) == 120);
```

**Binary literals and digit separators**

Two small but appreciated additions for numeric literals:

```cpp
int flags = 0b10110011;   // binary literal (C++14)
long big  = 1'000'000;    // digit separator (C++14) — reads as one million
double pi = 3.14'159'265;
```

The digit separator `'` is purely visual; it has no effect on the value.

## Common mistakes

**Mistake 1: Return type deduction with multiple `return` statements of different types**

```cpp
auto bad(bool flag) {
    if (flag) return 1;     // int
    return 2.0;             // double — error: deduced int vs double
}
```

All `return` statements must deduce to the same type. Mixed returns are a compile error. If you need different types, use an explicit return type or a common type like `double`.

**Mistake 2: Assuming generic lambda captures a copy of `auto` arguments**

A generic lambda with `auto x` captures nothing by default. The `[=]` and `[&]` captures still work exactly as in C++11 — `auto` in the parameter list is about the parameter type, not about capture mode. Confusing these leads to unexpected behavior when the lambda is stored and the captured variables change.

**Mistake 3: Using digit separators in older standards**

The `'` separator syntax is C++14. If a project targets C++11 with `-std=c++11`, digit separators will cause a compile error. Check the project's standard version before using this feature.

## When to use this

Enable C++14 with `-std=c++14`. All the features in this lesson are safe to use in any modern codebase. `std::make_unique` in particular should replace all direct `new` for unique ownership. Generic lambdas are the right default for lambdas passed to algorithms when the element type is templated or unknown. Return type deduction is a readability aid for short, obviously-typed functions — avoid it for public API functions in headers where the return type is part of the contract and should be explicit.

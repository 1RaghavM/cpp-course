## The idea

A `constexpr` function is one that the compiler is allowed to evaluate at compile time, turning a call into a constant the same way you might evaluate `2 + 3` with a pencil before the program ever runs. The word "allowed" is key: you write the function once, and the compiler decides whether to run it now (at compile time) or later (at runtime) depending on context.

Think of it like a contractor who can pre-build components in the workshop or assemble them on-site. If you order parts ahead of time and the blueprints are fully specified, they build in the workshop—fast, no on-site labor. If a measurement is unknown until the building is up, they wait and build on-site. Either way, your order form (the function call) looks identical.

Before `constexpr` functions existed, programmers had to use macros or template metaprogramming tricks to compute values at compile time. Both approaches were fragile and hard to read. `constexpr` functions look exactly like regular functions—they just carry a promise that they *can* be evaluated early when the inputs are known at compile time.

The practical benefit is that `constexpr` functions feed into constant expressions. A constant expression is something the compiler needs to know at compile time: array sizes, `static_assert` conditions, template non-type arguments. When a `constexpr` function is called with constant arguments, its result qualifies as a constant expression.

## How it works

Marking a function `constexpr` is syntactically minimal—just add the keyword before the return type:

```cpp
#include <iostream>

constexpr int square(int x) {
    return x * x;
}

int main() {
    constexpr int result = square(5);  // evaluated at compile time
    int side = 7;
    int area = square(side);           // evaluated at runtime (side is not constexpr)
    std::cout << result << "\n";       // prints 25
    std::cout << area << "\n";         // prints 49
}
```

`result` is declared `constexpr`, so the compiler must evaluate `square(5)` at compile time. `area` is a plain `int`, and `side` is a plain `int`, so the compiler evaluates `square(side)` at runtime—but the same function handles both cases.

A key use case is feeding a `constexpr` result into a place that demands a compile-time constant:

```cpp
constexpr int factorial(int n) {
    int result = 1;
    for (int i = 2; i <= n; ++i)
        result *= i;
    return result;
}

int main() {
    constexpr int f5 = factorial(5);   // 120 at compile time
    int arr[f5];                        // array size must be a constant — this works
    static_assert(f5 == 120, "factorial(5) should be 120");
}
```

`f5` is a compile-time constant, so it is legal as an array size and inside `static_assert`. If `factorial` were not `constexpr`, the declaration of `arr` would be a variable-length array (a GCC extension, not standard C++) and `static_assert` would not compile.

A third facet: a `constexpr` function called with non-constant arguments behaves exactly like a regular function, no special handling needed:

```cpp
#include <iostream>

constexpr int clamp(int value, int lo, int hi) {
    if (value < lo) return lo;
    if (value > hi) return hi;
    return value;
}

int main() {
    int n;
    std::cin >> n;
    std::cout << clamp(n, 0, 100) << "\n";  // runtime call, works fine
}
```

The same `clamp` can also be called with all-`constexpr` arguments to produce a compile-time constant.

## Common mistakes

**Mistake 1: Expecting `constexpr` to force compile-time evaluation everywhere.**

Declaring a function `constexpr` does not guarantee the compiler always evaluates it at compile time. The guarantee only kicks in when the result is used in a context that *requires* a compile-time constant (assigned to a `constexpr` variable, used as a template argument, etc.). If you just call it and store the result in a plain `int`, the compiler may evaluate it at runtime:

```cpp
constexpr int square(int x) { return x * x; }

int main() {
    int a = square(4);  // might be runtime — no constexpr obligation here
}
```

This is not an error, but it surprises people who expect the `constexpr` keyword to mean "always compile time". If you need guaranteed compile-time evaluation, store the result in a `constexpr` variable.

**Mistake 2: Calling `constexpr` functions with non-constant arguments and expecting a constant result.**

The result is only a constant expression when every argument is also a constant expression:

```cpp
constexpr int double_it(int x) { return x * 2; }

int main() {
    int n = 3;  // n is not constexpr
    constexpr int d = double_it(n);  // ERROR: n is not a constant expression
}
```

The compiler will reject this. `double_it` is `constexpr`, but `n` is a runtime variable, so the call cannot be evaluated at compile time. Fix: make `n` `constexpr`, or drop the `constexpr` on `d`.

**Mistake 3: Putting side effects that only work at runtime inside a `constexpr` function.**

`constexpr` functions (in C++20) can use `std::cout`, but only if the call happens at runtime. If the function is evaluated at compile time, I/O operations are not allowed. A common trap is adding a debug print inside a `constexpr` function and then using it in a `constexpr` context:

```cpp
#include <iostream>
constexpr int add(int a, int b) {
    std::cout << "adding\n";  // legal at runtime, illegal at compile time
    return a + b;
}

int main() {
    constexpr int r = add(2, 3);  // compile error: cout not allowed at compile time
}
```

The fix is to remove I/O from the function body, or to test the function only at runtime when you need debug prints.

## When to use this

Reach for `constexpr` functions whenever a computation has fully-known inputs and you want its result available as a compile-time constant: lookup tables, mathematical constants (factorial, powers, bit widths), or validation checks in `static_assert`. They are particularly useful with function templates (covered in chapter 11): a templated `constexpr` function can compute both compile-time and runtime values from the same source.

When the inputs are only known at runtime—user input, file data, network responses—the function runs at runtime regardless of the `constexpr` label. That is fine; the label still lets the function serve double duty. If you need a function that is *only* allowed to run at compile time (and should error if called at runtime), that is the job of `consteval`, covered in a later lesson in this chapter.

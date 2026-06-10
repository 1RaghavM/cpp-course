## The idea

The previous lessons covered `constexpr` functions—functions that *may* be evaluated at compile time when called with constant arguments. This lesson introduces two remaining behaviors: what happens when a `constexpr` function contains a branch that is only valid at runtime, and the newer `consteval` keyword, which turns the "may" into a "must."

Think of `constexpr` as a flexible contractor: they can work in the workshop (compile time) or on-site (runtime). `consteval` is a specialist who only works in the workshop. If you try to send them on-site, they refuse and the job fails immediately. This strictness is a feature: you can guarantee that a value is computed at compile time, and if someone accidentally passes a runtime argument, the compiler tells them right away rather than silently falling back to a slower runtime call.

Understanding when compile-time execution is *possible* versus *guaranteed* is the conceptual bridge this lesson builds.

## How it works

**The `consteval` keyword**

`consteval` marks an *immediate function*: every call to it must be a constant expression. If a call cannot be evaluated at compile time, it is a compile error—no silent runtime fallback.

```cpp
#include <iostream>

consteval int square_ct(int x) {
    return x * x;
}

int main() {
    constexpr int a = square_ct(5);  // OK: 5 is a constant expression
    // int b = square_ct(some_runtime_int);  // ERROR if uncommented
    std::cout << a << "\n";
}
```

The advantage is clarity and safety: if you write `consteval`, you are asserting that this function must *always* produce a compile-time constant. Any call that cannot satisfy that requirement is caught at the call site.

**Comparing `constexpr` and `consteval` side by side**

Both look the same in the body. The difference is the call site:

```cpp
constexpr int double_cx(int x) { return x * 2; }
consteval int double_ce(int x) { return x * 2; }

int main() {
    int n;
    std::cin >> n;

    int a = double_cx(n);   // fine — constexpr can run at runtime
    // int b = double_ce(n); // ERROR — consteval forbids runtime calls

    constexpr int c = double_cx(7);  // fine — compile-time call
    constexpr int d = double_ce(7);  // fine — consteval compile-time call
    std::cout << a << " " << c << " " << d << "\n";
}
```

`double_cx` handles both worlds. `double_ce` is restricted to compile-time; trying to pass a runtime variable fails.

**`constexpr` branches: `if consteval`**

C++23 introduced `if consteval`, but in C++20 you can use a helper technique: check whether execution is in a constant-expression context using `std::is_constant_evaluated()` from `<type_traits>`. This lets a `constexpr` function behave differently depending on whether it is being evaluated at compile time or runtime:

```cpp
#include <iostream>
#include <type_traits>

constexpr double safe_sqrt(double x) {
    if (std::is_constant_evaluated()) {
        // compile-time path: manual Newton's method (simplified)
        double r = x;
        for (int i = 0; i < 20; ++i)
            r = (r + x / r) / 2.0;
        return r;
    } else {
        // runtime path: can call non-constexpr library functions
        // (shown conceptually; std::sqrt is constexpr in C++26)
        return x;  // placeholder for illustration
    }
}

int main() {
    constexpr double s = safe_sqrt(9.0);  // uses compile-time branch
    std::cout << (s > 2.9 && s < 3.1 ? "ok" : "bad") << "\n";
}
```

`std::is_constant_evaluated()` returns `true` when the function is being run at compile time, `false` at runtime. This lets you use a pure compile-time algorithm at compile time and a potentially faster or more precise library call at runtime.

## Common mistakes

**Mistake 1: Expecting `consteval` to allow runtime calls to non-`constexpr` functions.**

`consteval` makes the call site stricter, not the body. The body has the same constraints as a `constexpr` function evaluated at compile time—no calls to non-`constexpr` functions, no I/O:

```cpp
int lookup(int x) { return x + 1; }  // not constexpr

consteval int wrapped(int x) {
    return lookup(x);  // ERROR: lookup is not constexpr
}
```

Fix: mark `lookup` as `constexpr`, or restructure so the non-`constexpr` work is not needed.

**Mistake 2: Calling `std::is_constant_evaluated()` inside a plain `if` and expecting it to filter compile-time calls.**

`std::is_constant_evaluated()` is only meaningful when the compiler is evaluating the call as part of a constant expression. Wrapping it in a runtime `if` inside a `consteval` function is a no-op—a `consteval` function is always evaluated at compile time, so `std::is_constant_evaluated()` inside it always returns `true`. Using it inside a regular function that is only ever called at runtime always returns `false`:

```cpp
void runtime_only() {
    if (std::is_constant_evaluated()) {
        // unreachable at runtime — always false outside constexpr/consteval context
    }
}
```

Use `std::is_constant_evaluated()` only inside `constexpr` functions where you want a dual-path implementation.

**Mistake 3: Confusing `consteval` with `inline` or `static`.**

`consteval` is not about linkage or inlining. It is purely about when evaluation is required. An `inline` function can be defined in headers and is evaluated at runtime; a `consteval` function must always be evaluated at compile time. They are orthogonal properties.

## When to use this

Use `consteval` when you want to guarantee at the language level that a value is computed at compile time—for example, a compile-time hash, a bit-manipulation lookup table, or a format string validator. Using `consteval` documents the intent clearly and turns a silent performance bug (falling back to runtime) into a hard compile error.

Reach for `std::is_constant_evaluated()` inside a `constexpr` function when you need two distinct implementations—a pure arithmetic path at compile time and a library-based path at runtime. This is uncommon but useful for math functions and cryptographic primitives.

For most application code, plain `constexpr` is sufficient: mark helpers `constexpr` so they can participate in constant expressions when needed, and let the compiler decide the evaluation site.

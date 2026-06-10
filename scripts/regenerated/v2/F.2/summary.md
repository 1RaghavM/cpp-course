## The idea

The first lesson established what `constexpr` functions do: they compute values at compile time when their inputs are constant. This lesson fills in the practical rules about *what you can put inside* a `constexpr` function, and how the compiler's two-mode evaluation works in more detail.

Picture a function as a recipe. A `constexpr` function is a recipe the kitchen can prepare in advance (compile time) or the day guests arrive (runtime). The kitchen has rules about what can be prepped in advance: you can chop vegetables, make sauces, and combine ingredients—but you cannot take a phone order from a customer (I/O) or peek into a box that hasn't arrived yet (a non-constant argument). These rules limit what can appear in the recipe, not because the chef is lazy but because advance prep must be deterministic.

C++14 significantly relaxed the rules from C++11, and C++20 relaxed them further. As of C++20, a `constexpr` function body can contain almost everything a normal function body can, with a handful of notable exceptions. Understanding the rules helps you write functions that genuinely can serve both roles.

## How it works

**What is allowed inside a `constexpr` function (C++20):**

Assignments, local variable declarations, `if`/`else`, `switch`, all loop forms (`for`, `while`, `do-while`), function calls to other `constexpr` functions, and `constexpr` constructors are all legal. This makes `constexpr` functions look and read exactly like normal code:

```cpp
#include <iostream>

constexpr int sum_to(int n) {
    int total = 0;
    for (int i = 1; i <= n; ++i)
        total += i;
    return total;
}

int main() {
    constexpr int s = sum_to(10);     // 55, compile time
    std::cout << s << "\n";
    std::cout << sum_to(100) << "\n"; // 5050, runtime or compile time depending on optimizer
}
```

**What is NOT allowed when evaluated at compile time:**

- Calls to non-`constexpr` functions (because they cannot be evaluated at compile time)
- I/O operations (`std::cin`, `std::cout`) — only illegal at compile time; OK at runtime
- Modifying objects with static storage duration
- `reinterpret_cast` and most C-style casts that do unsafe type punning
- `goto`

In practice, if you mark a function `constexpr` and then call a non-`constexpr` helper inside it, the compiler only complains if the call actually happens at compile time:

```cpp
int runtime_helper(int x) { return x * 2; }  // NOT constexpr

constexpr int double_it(int x) {
    return runtime_helper(x);  // only illegal if called at compile time
}

int main() {
    int a = double_it(5);             // fine — runtime call
    constexpr int b = double_it(3);   // ERROR: runtime_helper is not constexpr
}
```

**`constexpr` variables inside a `constexpr` function:**

A local variable inside a `constexpr` function can be `constexpr`—but it doesn't need to be, and often is not. The outer context drives whether the whole call is compile-time:

```cpp
constexpr int digit_sum(int n) {
    int sum = 0;
    while (n > 0) {
        sum += n % 10;
        n /= 10;
    }
    return sum;
}

int main() {
    constexpr int ds = digit_sum(1234);  // sum and n are not constexpr inside
                                          // the body, yet the whole call is fine
    static_assert(ds == 10, "1+2+3+4 = 10");
}
```

The local variables `sum` and `n` are mutable during the imaginary compile-time execution; they do not need to be declared `constexpr` themselves. The requirement is that the *function return value* ends up as a compile-time constant.

## Common mistakes

**Mistake 1: Calling a non-`constexpr` function and expecting compile-time evaluation.**

The most common version: a helper function is not marked `constexpr`, but the outer function is. Everything works fine at runtime, but the program fails to compile when the outer function is used as a constant expression:

```cpp
int abs_val(int x) { return x < 0 ? -x : x; }  // forgot constexpr

constexpr int magnitude(int x) {
    return abs_val(x);  // fine at runtime; breaks at compile time
}

int main() {
    constexpr int m = magnitude(-5);  // ERROR: abs_val is not constexpr
}
```

Fix: add `constexpr` to `abs_val`. The standard library's `<cstdlib>` `std::abs` is `constexpr` in C++23 but not universally in C++20, so writing your own is safer for constant-expression contexts.

**Mistake 2: Declaring a local variable `constexpr` inside the function when it depends on a parameter.**

A parameter is not a constant expression outside a compile-time call, so you cannot make a local variable `constexpr` if it depends on a parameter:

```cpp
constexpr int doubled(int x) {
    constexpr int result = x * 2;  // ERROR: x is not a constant expression here
    return result;
}
```

The fix is to drop `constexpr` from the local variable—it just needs to be a regular local:

```cpp
constexpr int doubled(int x) {
    int result = x * 2;  // fine
    return result;
}
```

**Mistake 3: Assuming `constexpr` on the function guarantees it is evaluated at compile time for every call.**

The `constexpr` label is a *permission*, not a *command*. A plain assignment to a non-`constexpr` variable does not force compile-time evaluation, and a slow implementation is not automatically optimized just because it is `constexpr`:

```cpp
constexpr long long fib(int n) {
    if (n <= 1) return n;
    return fib(n - 1) + fib(n - 2);
}

int main() {
    long long result = fib(40);  // likely evaluated at runtime (expensive), no warning
}
```

If you need a guaranteed compile-time constant, assign to `constexpr`. If you need a fast result at runtime, prefer an iterative implementation.

## When to use this

Use `constexpr` functions liberally: the cost of marking a function `constexpr` is nearly zero, and it enables the function to serve compile-time contexts later even if you did not anticipate that need. The practical ceiling is the restriction on non-`constexpr` helper calls—if your function must call library functions that are not `constexpr`, the function itself cannot be `constexpr` either. In those cases, keep two versions (one plain for runtime) or restructure so the `constexpr` work is isolated. Alternatively, `consteval` (covered next) forces all calls to be compile-time, useful when you want to guarantee no expensive runtime fallback.

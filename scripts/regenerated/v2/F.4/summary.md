## The idea

By this point you know three levels of compile-time evaluation: `constexpr` (may run at compile time), `consteval` (must run at compile time), and runtime (always runs at runtime). This lesson ties those threads together by examining how `constexpr` interacts with function templates, how to structure code so compile-time guarantees propagate cleanly through a call chain, and a handful of practical patterns you will encounter in real C++ code.

Think of compile-time evaluation as a supply chain. A product (the final value) is only as "pre-built" as its slowest component. If one part requires runtime information, the whole assembly waits until runtime. `constexpr` function templates extend the factory to handle families of types, but the supply-chain rule still applies: every component called at compile time must itself be `constexpr`-capable.

## How it works

**`constexpr` with function templates**

A function template can be `constexpr`. The same template can then produce compile-time or runtime values depending on whether the template arguments and call arguments are constant expressions. Templates were introduced in chapter 11; this lesson shows their interaction with `constexpr`:

```cpp
#include <iostream>

template <typename T>
constexpr T cabs(T x) {
    return x < T{0} ? -x : x;
}

int main() {
    constexpr int ci = cabs(-7);        // compile-time: T = int
    constexpr double cd = cabs(-3.14);  // compile-time: T = double
    int n;
    std::cin >> n;
    std::cout << cabs(n) << "\n";       // runtime: T = int, n is not constexpr
    std::cout << ci << " " << cd << "\n";
}
```

The same `cabs` template handles `int`, `double`, or any arithmetic type, and works at both compile time and runtime.

**Chaining `constexpr` calls**

A `constexpr` function can call other `constexpr` functions. The result is still a compile-time constant as long as every called function is `constexpr` and the arguments are constant expressions. This lets you build libraries of composable compile-time utilities:

```cpp
constexpr int square(int x) { return x * x; }
constexpr int sum_of_squares(int a, int b) { return square(a) + square(b); }

int main() {
    constexpr int s = sum_of_squares(3, 4);  // 9 + 16 = 25, compile time
    static_assert(s == 25, "Pythagorean triple check");
}
```

Each function in the chain must be `constexpr`; removing it from any one breaks the chain for compile-time evaluation.

**`constexpr` variables and `const` — how they differ**

This is a source of confusion. `const` means "this variable will not be modified after initialisation"—but the initialiser can be a runtime value. `constexpr` on a variable means "the initialiser must be a constant expression, evaluated at compile time":

```cpp
int runtime_val() { return 42; }   // not constexpr

int main() {
    const int a = runtime_val();     // OK: const, but runtime
    // constexpr int b = runtime_val();  // ERROR: not a constant expression

    constexpr int c = 10 * 10;       // OK: constant expression
    const int d = 10 * 10;           // also OK: const, and the compiler may
                                      // optimize to compile time, but no guarantee
}
```

The practical rule: use `constexpr` on variables when you need the value guaranteed at compile time (e.g., as an array size or template argument). Use `const` for variables that should not change but whose value is determined at runtime.

## Common mistakes

**Mistake 1: Marking a variable `const` and assuming it behaves like `constexpr` as an array size.**

`const int n = some_function();` does not make `n` a constant expression if `some_function` is not `constexpr`. Using `n` as an array size is only legal in standard C++ if `n` is a constant expression:

```cpp
int get_size() { return 10; }  // not constexpr

int main() {
    const int n = get_size();
    int arr[n];  // non-standard VLA — some compilers accept it as an extension
}
```

Fix: use `constexpr int n = get_size();` (and make `get_size` `constexpr`), which guarantees `n` is a compile-time constant.

**Mistake 2: Forgetting that a templated `constexpr` function's compile-time eligibility depends on the template arguments.**

Even though the template is `constexpr`, if the deduced `T` involves a type whose constructor is not `constexpr`, the call cannot be compile-time. For basic arithmetic types this is not an issue, but keep it in mind when writing generic `constexpr` code:

```cpp
template <typename T>
constexpr T identity(T x) { return x; }

// Works fine for int, double, etc.
// Would fail at compile time for a type with non-constexpr constructor.
```

**Mistake 3: Applying `constexpr` to a function that modifies a global variable.**

Modifying objects with static storage duration (globals, `static` locals) is forbidden in the compile-time path of a `constexpr` function. The compiler will reject the call if it is used in a constant-expression context:

```cpp
int g = 0;

constexpr int increment() {
    ++g;    // modifying a global — forbidden at compile time
    return g;
}

int main() {
    constexpr int x = increment();  // ERROR
}
```

The fix is to restructure the function to take its state as a parameter and return a new value, keeping it pure.

## When to use this

Combine `constexpr` with function templates (chapter 11) to write generic compile-time utilities that work for any arithmetic type—absolute value, min/max, rounding helpers, bit manipulation. Keep compile-time call chains fully `constexpr`-labeled so the compiler can propagate constant evaluation from top to bottom. Use `constexpr` on variables (not just `const`) when you need the value at compile time for array sizes, `static_assert`, or template non-type arguments. The pattern of `constexpr` variables + `constexpr` functions + `consteval` for strict guarantees gives you fine-grained control over where computation happens in your program.

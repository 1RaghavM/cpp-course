## The idea

When your program runs, the CPU executes instructions in memory. When the C++ compiler transforms your source code into those instructions, it is free to rearrange, combine, or eliminate steps — as long as the observable behavior of the program stays the same. This freedom is called the as-if rule: the compiler may do whatever it likes *as if* the original code were running unchanged.

The as-if rule is what makes `constexpr` possible. A `constexpr` variable tells the compiler: "this value can be computed at compile time, not at runtime." The compiler evaluates the expression during compilation, embeds the result directly into the generated machine code, and the running program never spends any time computing it. For arithmetic constants, this means zero runtime cost.

Think of it like baking vs ordering: a `constexpr` constant is baked into the executable at compile time, so the running program just reads a hardcoded value. A regular `const` variable might still be evaluated at startup. Both promise the value will not change, but `constexpr` promises the value is known before the program even starts.

## How it works

**The as-if rule in practice.** The compiler is allowed to rewrite your code any way it chooses, provided the final output to the user is identical. Consider this:

```cpp
#include <iostream>

int main()
{
    int x{ 2 + 3 };   // compiler replaces this with x{ 5 } — never adds at runtime
    std::cout << x << "\n";
    return 0;
}
```

The addition `2 + 3` involves only literal constants. The compiler sees both operands at compile time and folds them into `5` before generating any code. The executable contains no ADD instruction — just the value 5. You wrote an addition; the compiler optimized it away because the result was knowable at compile time.

**`constexpr` variables.** Declare a variable `constexpr` to explicitly require that it be evaluated at compile time. If the initializer cannot be evaluated at compile time, the compiler issues an error. This is stronger than `const`: a `const` variable initialized from a runtime value is still `const` (it cannot change), but it is not `constexpr` (its value was not known at compile time).

```cpp
#include <iostream>

int main()
{
    constexpr int seconds_per_minute{ 60 };
    constexpr int seconds_per_hour{ seconds_per_minute * 60 };   // 3600, at compile time

    int raw_seconds{ 0 };
    std::cin >> raw_seconds;

    // const int runtime_const{ raw_seconds };   // fine — const from runtime input
    // constexpr int bad{ raw_seconds };         // compile error — not compile-time

    int hours{ raw_seconds / seconds_per_hour };
    int remaining{ raw_seconds % seconds_per_hour };
    std::cout << hours << "h " << remaining << "s\n";
    return 0;
}
```

`seconds_per_hour` depends only on `seconds_per_minute`, which is itself `constexpr`, so the entire chain is evaluated at compile time. The variable `raw_seconds` is read from `std::cin` at runtime, so it cannot be `constexpr` — trying to make it one is a hard error.

**Constant expressions.** An expression is a *constant expression* if the compiler can fully evaluate it at compile time, using only values known at compile time. Literals and `constexpr` variables are constant expressions. Arithmetic on constant expressions is a constant expression. An expression involving a runtime variable is not.

```cpp
constexpr double pi{ 3.14159 };
constexpr double tau{ 2.0 * pi };       // constant expression: both operands are compile-time
// double radius = 5.0;                 // runtime variable
// constexpr double area{ pi * radius * radius };  // error: radius not compile-time
```

## Common mistakes

**Using `constexpr` where `const` suffices, or vice versa.** `constexpr` is the right choice for mathematical constants, sizes, and configuration values whose values are written directly in source. `const` is right for values that are fixed during a run but come from input or computation. Using `constexpr` for a runtime-derived value is a compile error; using only `const` for a pure literal constant is valid but misses the optimization guarantee.

**Assuming `const` implies compile-time evaluation.** A `const` variable initialized from `std::cin` is read-only but definitely not a compile-time constant.

```cpp
int x{ 0 };
std::cin >> x;
const int limit{ x };         // const — value fixed after assignment
// constexpr int bound{ x };  // compile error — x is not a constant expression
```

**Expecting `constexpr` to change runtime behavior.** `constexpr` is about when the computation happens, not about correctness. A `constexpr` expression produces the same numeric value as the equivalent non-`constexpr` expression — the difference is only timing and, potentially, performance.

## When to use this

Prefer `constexpr` over bare `const` for any variable whose value is a literal, a mathematical expression of literals, or an expression of other `constexpr` values. `constexpr double pi{ 3.14159 }` is strictly better than `const double pi{ 3.14159 }` — both are read-only, but `constexpr` also guarantees compile-time evaluation and enables use in contexts that require constant expressions (such as array sizes in later chapters).

Use `const` (not `constexpr`) when the value comes from runtime input, a function return value, or any computation that depends on data read during execution.

The as-if rule means you do not need to obsessively use `constexpr` for micro-optimization — the compiler will fold constants regardless. Use it instead as a clear signal to both the compiler and the reader: this value is a fixed truth about the program, knowable before it starts.

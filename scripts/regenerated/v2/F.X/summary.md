## The idea

Chapter F covered `constexpr` and `consteval` functions — the mechanism C++ gives you for moving computation from runtime to compile time. This summary consolidates the core rules, common pitfalls, and the decision framework for choosing between `constexpr`, `consteval`, and plain functions.

The overarching principle: put computation at compile time when you know all the inputs at compile time and the result is needed as a constant (array sizes, template arguments, `static_assert` conditions). Leave computation at runtime when any input depends on user data, file contents, network responses, or other dynamic information.

The two keywords share the same goal — eliminating runtime cost for work that can be done earlier — but they offer different levels of certainty. `constexpr` is a declaration of *capability*: this function can produce a compile-time constant when given constant inputs. `consteval` is a declaration of *obligation*: every call must be a constant expression, or the program will not compile. Choosing between them is a question of how strict you want the contract to be.

## How it works

**Core vocabulary recap**

- `constexpr` on a function: the function may be evaluated at compile time if called with all constant-expression arguments and the result is used in a constant-expression context; otherwise it runs at runtime like any other function.
- `consteval` on a function: every call must be a constant expression. Any call that is not produces a compile error — there is no runtime fallback.
- `constexpr` on a variable: the initializer must be a compile-time constant expression; the variable is itself usable as a constant expression (for array sizes, template arguments, etc.).
- `const` on a variable: the variable is not modifiable after initialization, but the initializer may be a runtime value. A `const` variable initialized at runtime is not a constant expression.

**What is allowed inside a `constexpr` / `consteval` function body (C++20)**

Allowed in both: local variable declarations and assignments, `if`/`else`, `switch`, all loop forms (`for`, `while`, `do-while`), calls to other `constexpr` or `consteval` functions, use of `constexpr`-capable types.

Not allowed at compile time: calls to non-`constexpr` functions, I/O operations (`std::cin`, `std::cout`), modification of objects with static storage duration (globals, `static` locals), and `reinterpret_cast`.

**The evaluation rule**

A call to a `constexpr` function is evaluated at compile time if and only if: (1) every argument is a constant expression, and (2) the result is used in a context that demands a constant expression (assigned to a `constexpr` variable, used as an array size, or used as a template argument). If either condition is absent, the call runs at runtime.

A call to a `consteval` function must always satisfy condition (1). If it does not, the compiler reports an error at the call site.

**`constexpr` + function templates**

Combining `constexpr` with a function template gives a generic compile-time utility that works for any type whose operations are themselves `constexpr`-capable. You write the function once; it handles `int`, `double`, and any arithmetic type at both compile time and runtime:

```cpp
template <typename T>
constexpr T cmax(T a, T b) { return a > b ? a : b; }

constexpr int big = cmax(10, 20);  // 20 at compile time
```

**`std::is_constant_evaluated()` (brief recap)**

Inside a `constexpr` function, `std::is_constant_evaluated()` returns `true` during compile-time evaluation and `false` during runtime evaluation. Use it when you need two distinct implementations — a pure-arithmetic path at compile time and a library-based path at runtime. This is uncommon but useful for numerical and cryptographic functions.

## Common mistakes

**Mistake 1: Using `const` where `constexpr` is needed.**

`const int n = some_function();` is legal even if `some_function` is not `constexpr`, but `n` is not a constant expression and cannot be used as an array size or template argument. Use `constexpr` on the variable when you need a compile-time guarantee. The symptom is often a cryptic error saying the array size is not a constant expression, even though the variable looks like it should be.

**Mistake 2: Breaking the chain.**

One non-`constexpr` helper function anywhere in a compile-time call chain prevents the entire chain from producing a constant expression. Check every function in the call graph is labeled `constexpr` when you need constant evaluation to propagate. The error message typically names the innermost non-`constexpr` call, which can be several levels removed from where you wrote the `constexpr` variable.

**Mistake 3: Expecting `consteval` to allow runtime helpers.**

`consteval` makes the call site stricter, but the body's restrictions are identical to those of a `constexpr` function evaluated at compile time: no non-`constexpr` helpers, no I/O, no global mutation. Marking a function `consteval` does not grant it any additional permissions inside its body.

## When to use this

Reach for `constexpr` functions by default for any pure computation that could be useful at compile time — especially utility functions called from both constant-expression contexts (array sizes, `static_assert`) and runtime loops (where the optimizer may inline and evaluate them anyway). The cost of adding `constexpr` is nearly zero; the benefit is that the function is available to constant-expression contexts without any changes later.

Reach for `consteval` when you want the compiler to guarantee compile-time evaluation and catch any accidental runtime call immediately. Good candidates: format string validators, compile-time hash functions, bit-manipulation lookup tables, and any computation whose result must be embedded in read-only memory.

Use `constexpr` variables instead of `const` variables whenever the initializer is a constant expression and you need the value as an array size, template non-type argument, or `static_assert` operand. When the initializer depends on runtime data, `const` is the right choice — and that variable will not be usable as a compile-time constant, which is expected.

Combine `constexpr` with function templates (chapter 11) to write a single generic utility that handles both compile-time and runtime workloads without code duplication. This pattern — a `constexpr` template function — appears throughout the C++ standard library and is the primary way to write zero-overhead generic code.

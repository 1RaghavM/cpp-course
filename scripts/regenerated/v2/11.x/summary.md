## The idea

Chapter 11 is about two related tools the C++ compiler gives you to write code once and reuse it across types and values: **function overloading** and **function templates**. Overloading lets you give multiple functions the same name, each handling a different set of argument types. Templates go further — they let the compiler generate those multiple functions automatically from a single generic recipe. Together they form the foundation of generic programming in C++.

If you have ever wished you could write `max(a, b)` without caring whether `a` and `b` are `int`, `double`, or anything else, this chapter is the answer.

## How it works

**Function overloading** (lessons 11.1–11.5) relies on the compiler examining the argument types at each call site and picking the best matching function. Two overloads are distinct if their parameter *types or counts* differ — return type alone does not differentiate them.

```cpp
#include <iostream>
int    describe(int x)    { std::cout << "int: "    << x; return x; }
double describe(double x) { std::cout << "double: " << x; return x; }
int main() {
    describe(3);    // calls the int overload
    describe(3.0);  // calls the double overload
}
```

The compiler resolves the call by running through a priority chain: exact match, then promotion, then standard conversion, then user-defined conversion. If two overloads tie at the same priority level the call is ambiguous and the compiler rejects it. You can use `= delete` to explicitly remove a specific overload and force a compile error for that argument type.

Default arguments (lesson 11.5) let callers omit trailing parameters, but they interact with overloading: a function with a default argument can look identical to a zero-extra-argument call of an overloaded sibling, producing ambiguity.

**Function templates** (lessons 11.6–11.9) replace type-specific overloads with a single parameterised recipe:

```cpp
#include <iostream>
template <typename T>
T maximum(T a, T b) { return (a > b) ? a : b; }
int main() {
    std::cout << maximum(4, 9)      << '\n';  // int
    std::cout << maximum(1.2, 0.8)  << '\n';  // double
}
```

The compiler *instantiates* the template — generates a real function — at each call site where it deduces or is given a concrete type. Each distinct combination of template arguments produces a separate compiled function.

When a single type parameter is not enough, multi-type templates (lesson 11.8) accept several type parameters:

```cpp
template <typename T, typename U>
auto mixedMax(T a, U b) { return (a > b) ? a : b; }
```

Non-type template parameters (lesson 11.9) let a compile-time *value* be part of the template:

```cpp
template <int N>
void printLine(char c) {
    for (int i = 0; i < N; ++i) std::cout << c;
    std::cout << '\n';
}
```

`N` is baked in at compile time; only literals and `constexpr` values may be passed.

Finally, because templates are instantiated at the call site, their definitions must be visible at every translation unit that uses them — which means template definitions belong in header files, not in `.cpp` files (lesson 11.10).

## Common mistakes

**Ambiguous overload resolution from implicit conversions.** If you have `void f(int)` and `void f(double)` and you call `f(2.5f)`, the compiler cannot decide whether to promote the `float` to `double` or convert it to `int` — both are standard conversions. The call is ambiguous. Prefer to keep overloads clearly separated by argument type, or delete the ambiguous overload explicitly.

**Leaving a template definition in a `.cpp` file.** This is the most damaging mistake in this chapter because the linker error — `undefined reference to 'maximum<int>'` — looks unrelated to templates:

```cpp
// bad layout: definition in max.cpp, only declaration in max.h
// max.cpp compiles fine; the linker step fails
```

The fix is always to move the full definition to the header. There is no shortcut.

**Passing a runtime variable as a non-type template argument:**

```cpp
int n = 5;
printLine<n>('*');  // error: n is not a constant expression
```

Non-type template arguments must be compile-time constants. Use a `constexpr` variable or a literal.

## When to use this

Reach for overloading when you have a small, fixed set of types that need the same logical operation but genuinely different implementations. Reach for function templates when the implementation is the same regardless of type — the same comparisons, arithmetic, or logic just need to work for any type that supports the operators involved. Use non-type template parameters when a value is fixed at the point of use and baking it in enables compile-time checking or optimisation. Keep all template definitions in headers from day one to avoid mysterious linker failures.

The next chapters introduce `struct` and `class`, where overloading and templates combine with member functions to become even more powerful. Everything covered in chapter 11 applies equally to member function templates and operator overloads.

When deciding between overloading and templates in practice, ask one question: do the different argument types need *different* code, or is the *same* logic applied to different types? Different code means overloads (or `= delete` to block unwanted types). Same logic means a template. When both a template and an overload exist for a given argument type, the overload wins — the compiler prefers an exact non-template match over a template instantiation. This priority ordering lets you write a general template and then fine-tune behaviour for specific types by adding targeted overloads on top.

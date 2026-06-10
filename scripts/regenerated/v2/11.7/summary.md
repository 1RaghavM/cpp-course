## The idea

Writing a function template is like writing a recipe on a card. The recipe does not produce any food on its own — it only becomes food when someone follows it with actual ingredients. Template instantiation is the moment the compiler "follows the recipe": it reads your template, substitutes a concrete type for every placeholder, and generates a real function that gets compiled into your program.

Understanding instantiation helps you reason about three things: why certain errors only appear when you use a template (not when you write it), why the same template can appear in multiple `.cpp` files without causing linker "multiple definition" errors, and how to control instantiation explicitly when you need to.

## How it works

**Implicit instantiation** happens automatically when you call a template function and the compiler deduces the type:

```cpp
#include <iostream>

template <typename T>
T square(T x)
{
    return x * x;
}

int main()
{
    int   a = square(5);      // compiler generates: int square(int x)
    double b = square(2.5);   // compiler generates: double square(double x)
    std::cout << a << ' ' << b << '\n';   // 25 3.14 (actually 6.25)
    return 0;
}
```

Each unique combination of template arguments triggers one instantiation. `square<int>` and `square<double>` are two completely separate functions in the compiled binary.

**Explicit instantiation** lets you force the compiler to generate a version of a template without calling it. You use the `template` keyword followed by the full function signature:

```cpp
template int    square(int);     // explicit instantiation: generate int version
template double square(double);  // explicit instantiation: generate double version
```

This is most useful in larger codebases where you want to pre-compile template code in one `.cpp` file and avoid recompiling it in every translation unit. For now, the key idea is that you can write this if you need to.

**Explicit specialisation** is a different but related concept: you provide a hand-written version of a template for one specific type, overriding the generic blueprint:

```cpp
#include <iostream>
#include <string>

template <typename T>
T maximum(T a, T b)
{
    return (a > b) ? a : b;
}

// Specialisation for const char* — compares strings, not pointers
template <>
const char* maximum<const char*>(const char* a, const char* b)
{
    return (std::string(a) > std::string(b)) ? a : b;
}

int main()
{
    std::cout << maximum(3, 7) << '\n';              // uses generic template
    std::cout << maximum("banana", "apple") << '\n'; // uses specialisation
    return 0;
}
```

Without the specialisation, `maximum("banana", "apple")` would compare pointer addresses (undefined, platform-dependent), not the actual string content. The specialisation intercepts that specific type and does the right thing.

**Type deduction and explicit template arguments.** The compiler deduces `T` from the call arguments whenever possible. When deduction would be ambiguous or impossible, you write the type in angle brackets:

```cpp
std::cout << square<int>(3) << '\n';     // explicit: T=int
std::cout << square(3) << '\n';          // deduced: T=int (same result)
std::cout << square<double>(3) << '\n';  // explicit: T=double → 9.0
```

Explicit type arguments also let you force a narrowing or widening conversion: `square<double>(3)` converts `3` to `3.0` before the template body runs.

## Common mistakes

**1. Expecting type deduction to resolve mismatched argument types.**

If a template parameter `T` appears in two arguments and the caller passes different types, deduction fails:

```cpp
template <typename T>
T add(T a, T b) { return a + b; }

auto result = add(1, 2.5);   // error: T=int from 1, T=double from 2.5 — conflict
```

Fix it with an explicit type: `add<double>(1, 2.5)` converts `1` to `1.0` before calling.

**2. Putting the template definition in a `.cpp` file and the declaration in a header.**

Unlike regular functions, templates must be fully visible (declaration + definition) in every translation unit that uses them. If you put the definition in `utils.cpp` but only declare the template in `utils.h`, other files will compile but the linker will fail with "undefined reference":

```
// utils.h
template <typename T>
T square(T x);   // declaration only — PROBLEM

// utils.cpp
template <typename T>
T square(T x) { return x * x; }   // definition hidden here
```

The fix: keep the full template definition in the header. Templates are an exception to the usual "definitions only in .cpp" rule.

**3. Confusing a template specialisation with a regular overload.**

A full specialisation (`template <>`) does not participate in overload resolution the same way a non-template overload does. In practice, prefer writing a plain overload over a full specialisation when you need type-specific behaviour — it is simpler and avoids subtle ordering surprises.

## When to use this

You rarely need to think about instantiation explicitly in day-to-day code — the compiler handles it automatically. Understanding it matters when debugging cryptic error messages (the error is in an instantiation, not the template itself), when optimising compile times in large projects (explicit instantiation can help), or when you need type-specific behaviour for one type (explicit specialisation or a plain overload). For most consumer C++ code, implicit instantiation is all you need.

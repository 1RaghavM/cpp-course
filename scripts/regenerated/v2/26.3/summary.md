## The idea

A function template gives you one implementation that works for any type. But sometimes a particular type needs different behaviour — not because the algorithm is wrong in general, but because that one type is special. Function template specialization lets you say: "Use the generic template for everything, but when the type is exactly `const char*`, do this instead."

Think of it like a restaurant menu with a default preparation and a note that says "except for peanut allergies, prepare separately." The default recipe handles 99% of orders; the specialization handles the one case that needs special treatment.

The compiler's rule is simple: when it needs to instantiate a template for a specific type, it first checks whether you have written an explicit specialization for that type. If you have, it uses yours. Otherwise it falls back to the primary template.

## How it works

**The primary template**

Start with the generic version — this is the primary template:

```cpp
#include <iostream>

template <typename T>
void print(const T& value) {
    std::cout << "Value: " << value << "\n";
}
```

This works for `int`, `double`, `std::string`, and any other printable type.

**Writing a full specialization**

A full (explicit) specialization replaces the template for one exact type. The syntax is `template <>` with empty angle brackets, followed by the full function signature with the concrete type filled in:

```cpp
template <>
void print<const char*>(const char* const& value) {
    std::cout << "C-string: " << value << "\n";
}
```

Now `print(42)` uses the primary template (prints `Value: 42`), while `print("hello")` uses the specialization (prints `C-string: hello`).

**A more realistic example: comparing strings vs numbers**

Suppose you have a generic `areEqual` that uses `==`, but floating-point equality is unreliable for doubles computed via arithmetic. A specialization can handle `double` specially:

```cpp
#include <cmath>

template <typename T>
bool areEqual(T a, T b) {
    return a == b;
}

template <>
bool areEqual<double>(double a, double b) {
    return std::abs(a - b) < 1e-9;
}
```

`areEqual(1, 1)` uses the primary (exact integer comparison). `areEqual(0.1 + 0.2, 0.3)` uses the specialization (epsilon comparison).

## Common mistakes

**Mistake 1 — Specializing when overloading would suffice**

Function template specialization interacts with overload resolution in a surprising way. A non-template function overload is always preferred over a template instantiation (including a specialization). Many cases that look like they need a specialization actually just need an overload:

```cpp
// Overload — preferred over ANY template for this exact signature:
void print(const char* value) {
    std::cout << "C-string: " << value << "\n";
}
```

Specializations are best reserved for cases where you need to intercept one specific type within a template system (such as when the primary template is in a library you don't control). For your own code, prefer overloads.

**Mistake 2 — Using `template <typename T>` instead of `template <>`**

A common error is writing the specialization with the same header as the primary template, accidentally creating a new primary template or a partial specialization (which is not allowed for functions):

```cpp
// WRONG — this declares a NEW primary template, not a specialization
template <typename T>
void print<const char*>(const char* const& value) { ... }  // compile error
```

The header for a full function specialization must be exactly `template <>` — empty angle brackets, no parameters.

**Mistake 3 — The specialization must have the exact same return type and parameter types**

If the primary template takes `const T&` but your specialization takes `T` by value, they have different signatures and the compiler may not recognize the specialization or may prefer the primary template anyway:

```cpp
template <typename T>
void print(const T& value);       // primary: const T&

template <>
void print<int>(int value);       // mismatch — not treated as a specialization
```

Match the parameter list precisely, substituting `T` → the concrete type everywhere it appears.

## When to use this

Function template specialization is the right tool when a single type in a set needs radically different behaviour — especially when you are extending or adapting a template you did not write. The canonical use cases are comparisons (epsilon for floats, case-insensitive for strings) and custom printers (c-string vs std::string). For types you control and code you own, prefer a function overload because overloads are simpler and participate in overload resolution more predictably. Class template specialization (the next lesson) follows the same principle but applies to whole classes.

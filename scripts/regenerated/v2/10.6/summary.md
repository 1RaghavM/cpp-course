## The idea

Sometimes the compiler's automatic type conversions are not what you want. You need a way to say, explicitly, "I know the types involved, and I want this specific conversion to happen here." That is what a cast does. A cast is a programmer-directed type conversion — you take responsibility for the result instead of leaving it to the compiler's implicit rules.

C++ inherited C's old-style casts from the language, but also introduced four named cast operators that are far safer. The one you will use most in everyday programming is `static_cast`. It performs a compile-time conversion between related types: numeric conversions, conversions between compatible pointer types (later chapters), and a handful of other transformations the compiler can verify at compile time. When the conversion is not meaningful, `static_cast` simply refuses to compile — catching your mistake before the program ever runs.

Think of `static_cast` as a polite but firm instruction to the compiler: "I know this is a narrowing conversion, or this is integer arithmetic that I want to yield a float result. Please do it, but check that it makes sense."

## How it works

The syntax is:

```cpp
static_cast<TargetType>(expression)
```

The most common use is converting between numeric types where you want to control rounding or precision.

**Example 1 — integer division to floating-point division**

```cpp
#include <iostream>

int main()
{
    int a { 7 };
    int b { 2 };

    double result { static_cast<double>(a) / b };
    std::cout << result << '\n';  // prints 3.5
    return 0;
}
```

Without the cast, `a / b` performs integer division and produces `3`. The cast converts `a` to `double` before the division, which causes `b` to be promoted as well (arithmetic conversions), yielding `3.5`.

**Example 2 — safely converting char to int to inspect its ASCII value**

```cpp
#include <iostream>

int main()
{
    char ch { 'A' };
    std::cout << static_cast<int>(ch) << '\n';  // prints 65
    return 0;
}
```

Without the cast, `std::cout` would print the character `A`. The cast tells the compiler (and the reader) that you want the numeric value, not the character representation.

**Example 3 — acknowledging a narrowing conversion**

```cpp
#include <iostream>

int main()
{
    double temperature { 98.6 };
    int rounded { static_cast<int>(temperature) };  // truncates, does not round
    std::cout << rounded << '\n';  // prints 98
    return 0;
}
```

List initialization would reject `int rounded { temperature }` with a narrowing error. Using `static_cast` tells the compiler you are aware of the truncation and accept it. The cast makes a silent truncation visible to any reader.

Old C-style casts use the form `(TargetType)expression`. They work, but they are intentionally hard to search for, they do not communicate which of several possible cast semantics you intended, and they can silently perform casts that the safer named casts would reject. Prefer `static_cast` for numeric conversions.

## Common mistakes

**Mistake 1 — expecting `static_cast` to round, not truncate**

```cpp
double d { 2.9 };
int i { static_cast<int>(d) };
std::cout << i << '\n';  // prints 2, not 3
```

`static_cast<int>` from a floating-point value always truncates toward zero — it throws away everything after the decimal point. If you need rounding, you must add `0.5` before casting (or use library functions from `<cmath>`, covered later). New learners expect a result of `3` and are confused when they see `2` from a value like `2.9`.

**Mistake 2 — casting after the operation instead of before**

```cpp
int x { 5 };
int y { 2 };
double result { static_cast<double>(x / y) };  // result is 2.0, not 2.5
```

The division `x / y` happens first, in integer arithmetic, producing `2`. The cast then converts that integer `2` to `2.0`. The cast needed to wrap one of the operands, not the whole expression:

```cpp
double result { static_cast<double>(x) / y };  // 2.5
```

**Mistake 3 — using a C-style cast instead of `static_cast`**

```cpp
double pi { 3.14159 };
int truncated { (int)pi };   // compiles, but harder to spot in code review
```

C-style casts blend into the surrounding code and are easy to miss during review. They also silently perform `const_cast` and `reinterpret_cast` semantics in some situations, which `static_cast` would refuse. Reserve C-style casts for legacy codebases and use `static_cast` everywhere in new code.

## When to use this

Reach for `static_cast` any time you want to perform a numeric conversion that the compiler would otherwise warn about (narrowing) or that you need to control explicitly (integer-to-float division). It is the right tool whenever you know more about the intended semantics than the compiler's implicit-conversion rules convey. If you find yourself writing a C-style cast for a numeric conversion, replace it with `static_cast` — it is safer, easier to search for, and self-documenting. The other named casts (`const_cast`, `reinterpret_cast`, `dynamic_cast`) handle different scenarios covered in later chapters; for arithmetic and everyday numeric type changes, `static_cast` is almost always the right choice.

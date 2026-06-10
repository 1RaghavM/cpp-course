## The idea

Integers are exact. The number 42 stored in an `int` is always precisely 42. Floating-point numbers are different — they represent an approximation of a real number, not an exact value. Think of a floating-point number like a stopwatch that can show hundredths of a second: it is much more precise than one that only shows whole seconds, but it still cannot show every possible moment. The representable values are densely packed, but there are always gaps between them.

This approximation exists because real numbers are infinite in scope and precision, while a computer has a finite number of bits. C++ gives you three floating-point types that trade off range and precision: `float` (32 bits, ~7 significant decimal digits), `double` (64 bits, ~15–16 significant decimal digits), and `long double` (80 or 128 bits, platform-dependent). For most work, `double` is the right choice.

## How it works

**The three floating-point types**

```cpp
#include <iostream>

int main()
{
    float       f { 3.14f };       // 32-bit; suffix 'f' marks it as float
    double      d { 3.14 };        // 64-bit; default for floating-point literals
    long double ld { 3.14L };      // 80 or 128-bit; suffix 'L'

    std::cout << sizeof(float)       << "\n";   // 4
    std::cout << sizeof(double)      << "\n";   // 8
    std::cout << sizeof(long double) << "\n";   // 16 (on most modern x86)
    return 0;
}
```

Without the `f` suffix, a literal like `3.14` is a `double`, not a `float`. Assigning it to a `float` triggers a narrowing warning. The `f` suffix silences that by making the literal itself a `float` value.

**Precision and rounding**

Floating-point numbers cannot represent every decimal fraction exactly. The value 0.1 has no exact binary representation — the stored value is the closest representable number. Normally this rounding error is tiny (less than 10⁻¹⁵ for `double`), but it accumulates over many operations.

```cpp
#include <iostream>

int main()
{
    double a { 0.1 };
    double b { 0.2 };
    double c { 0.3 };

    // 0.1 + 0.2 is not exactly 0.3 in floating-point
    std::cout << (a + b == c) << "\n";           // 0 (false!)
    std::cout << (a + b - c) << "\n";            // a tiny non-zero value
    return 0;
}
```

**Comparing floating-point values with an epsilon**

Because exact equality is unreliable, the standard idiom is to check whether two values are "close enough" — within some small threshold called epsilon. Rather than `a == b`, you compute `a - b` and check whether the raw difference is small. The `<cmath>` header provides `std::abs` for the absolute value:

```cpp
#include <cmath>
#include <iostream>

int main()
{
    double x { 0.1 + 0.2 };
    double y { 0.3 };

    double epsilon { 1.0e-9 };   // a small tolerance value
    double close_enough { std::abs(x - y) < epsilon };

    std::cout << close_enough << "\n";   // 1 (true — they are within epsilon)
    std::cout << (x == y)     << "\n";   // 0 (false — exact equality fails)
    return 0;
}
```

`std::abs` from `<cmath>` returns the absolute (non-negative) value of its argument. The comparison `std::abs(x - y) < epsilon` is true whenever `x` and `y` are within `epsilon` of each other, which is the correct way to compare floating-point results.

**Infinity and NaN**

Some operations produce special floating-point results. Dividing a positive number by zero produces positive infinity (`+inf`). An operation with no mathematical answer produces NaN (not a number):

```cpp
#include <iostream>

int main()
{
    double pos_inf { 1.0 / 0.0 };     // positive infinity
    double neg_inf { -1.0 / 0.0 };    // negative infinity
    double nan     { 0.0 / 0.0 };     // NaN

    std::cout << pos_inf << "\n";   // inf
    std::cout << neg_inf << "\n";   // -inf
    std::cout << nan     << "\n";   // -nan or nan (platform-dependent)
    return 0;
}
```

## Common mistakes

**Mistake 1 — Comparing floats with `==`**

Checking `a == b` for two `double` variables computed independently almost always fails, even when the values should be mathematically identical. The code compiles without error, but the comparison rarely behaves as expected. Use a difference-within-epsilon check instead.

**Mistake 2 — Mixing float and double silently**

Without the `f` suffix, a literal like `3.14` is `double`. Assigning it to a `float` narrows the precision:

```cpp
float x { 3.14 };   // compiler warning: narrowing from double to float
float y { 3.14f };  // correct: literal is already float
```

The warning-free form uses the explicit `f` suffix. Mixing types without thinking leads to unintended precision loss.

**Mistake 3 — Expecting 0.1 + 0.2 to equal 0.3**

The most famous floating-point surprise: `0.1 + 0.2` does not equal `0.3` in any standard IEEE 754 implementation. The discrepancy is tiny (around 5.5 × 10⁻¹⁷) but it makes `==` return false. Understanding this is more important than memorizing the exact error — it comes from the fact that 0.1, 0.2, and 0.3 are all non-terminating fractions in binary.

## When to use this

Use `double` as your default floating-point type. It has enough precision for almost all practical engineering, scientific, and game calculations. Use `float` only when memory is at a premium (large arrays of values, GPU code) and you have confirmed that single-precision is sufficient. Reserve `long double` for calculations requiring extended precision — financial calculations with many digits, or numerical algorithms with tight accuracy requirements — because it is slower and its size varies by platform.

Prefer integer arithmetic whenever possible: currency in cents instead of dollars, pixel coordinates as `int`. Floating-point is necessary when the domain is inherently real-valued — physics simulations, graphics, scientific measurements — but should be avoided in contexts where exact arithmetic matters, such as counting items or comparing keys.

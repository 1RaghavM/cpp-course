## The idea

Unsigned integers can only represent non-negative values — zero and above. If a signed integer is like a thermometer that shows both negative and positive temperatures, an unsigned integer is like an odometer: it only counts up from zero, and it never goes negative. At first glance this sounds useful — why ever need a negative count? But the "only non-negative" property comes with a dangerous side effect that trips up even experienced programmers: the value wraps around rather than going below zero.

Understanding unsigned integers is less about knowing when to use them and more about knowing why you should usually avoid them in everyday arithmetic code.

## How it works

**Declaring unsigned integers**

You declare an unsigned integer by adding the keyword `unsigned` before the type name:

```cpp
#include <iostream>

int main()
{
    unsigned int age { 25 };
    unsigned short small { 10 };
    unsigned long big { 1000000UL };

    std::cout << age << "\n";   // 25
    std::cout << small << "\n"; // 10
    std::cout << big << "\n";   // 1000000
    return 0;
}
```

The range of an unsigned type is twice as wide on the positive side compared to its signed counterpart. An `unsigned int` on most systems holds 0 to 4,294,967,295 (2³² − 1), while a plain `int` holds −2,147,483,648 to 2,147,483,647.

**Wrapping around — modular arithmetic**

Unsigned types follow modular arithmetic. When a value goes above the maximum, it wraps back to zero. When it goes below zero, it wraps back to the maximum. This is defined behavior in C++ for unsigned types (unlike signed overflow, which is undefined behavior).

```cpp
#include <iostream>

int main()
{
    unsigned int big { 0 };
    big = big - 1;   // 0 - 1 wraps to 4294967295

    std::cout << big << "\n";   // 4294967295

    unsigned int max_val { 4294967295U };
    max_val = max_val + 1;   // wraps to 0

    std::cout << max_val << "\n";   // 0
    return 0;
}
```

The subtraction `0 - 1` on an `unsigned int` does not produce -1 or a compiler error — it silently produces 4,294,967,295. This is the core danger.

**Mixed signed/unsigned arithmetic**

When a signed and unsigned value appear in the same arithmetic expression, C++ converts the signed value to unsigned — not the other way around. This conversion can produce surprising results when the signed value is negative.

```cpp
#include <iostream>

int main()
{
    int signed_val { -1 };
    unsigned int unsigned_val { 1 };

    // signed_val is converted to unsigned before comparison
    // -1 as unsigned becomes a very large number
    std::cout << (signed_val < unsigned_val) << "\n";   // prints 0 (false!)
    return 0;
}
```

Most programmers expect `-1 < 1` to be true. But because `unsigned_val` is unsigned, `signed_val` gets converted to unsigned first. `-1` as an unsigned 32-bit value becomes 4,294,967,295 — which is not less than 1. The result is `0` (false).

## Common mistakes

**Mistake 1 — Underflow when computing differences**

A common pattern is to subtract two values to measure a difference. If the result could ever go negative — even momentarily — and the type is unsigned, you get a huge positive number instead.

```cpp
unsigned int a { 3 };
unsigned int b { 5 };
unsigned int diff { a - b };   // wraps to 4294967294, not -2
```

With signed integers this is fine. With unsigned integers, `3 - 5` wraps around. There is no compiler warning and no runtime error — the program silently carries a wrong value forward.

**Mistake 2 — Comparing signed and unsigned**

Mixing signed and unsigned values in comparisons leads to counter-intuitive results, as shown above. Even `-1 < any_unsigned_positive` can evaluate to false. Compilers with `-Wall` usually warn about this, but the warning is easy to miss.

**Mistake 3 — Using `unsigned` to communicate "non-negative intent"**

Some programmers choose `unsigned` to express that a value should never be negative — "I'll use unsigned so the type enforces it." But the type does not prevent a negative calculation; it silently wraps. Using signed integers and validating input separately is safer: a value out of range is caught by a clear assertion or checked boundary, not a silent wraparound.

## When to use this

Unsigned integers are appropriate in two specific situations: when doing low-level bit manipulation (shifting, masking), and when interacting with interfaces that already use unsigned types — particularly `std::size_t` (covered in "Fixed-width integers and size_t"), which is used for sizes and indices in the standard library.

For everyday counters, ages, temperatures, prices, or any quantity where arithmetic involving negatives is even remotely possible, prefer signed `int` or `long long`. The signed/unsigned conversion rules are a common source of real bugs. Choosing signed types by default eliminates the entire category of unsigned wraparound errors, while the slightly smaller positive range almost never matters in practice.

## The idea

Chapter 4 is the chapter where C++ stops feeling like abstract theory and starts feeling like a type system with opinions. Every variable you declare carries a type, and that type determines its size, its range, what operations make sense on it, and what happens when you mix it with another type. This recap tours the full landscape of fundamental types, flags the traps that catch beginners most often, and gives you a map for deciding which type to reach for in a given situation.

Think of the fundamental types as a menu of storage containers. Some are tiny (one byte), some are large (eight bytes). Some hold whole numbers only; others hold fractions with limited precision. One holds a single character. One holds a yes/no value. Understanding which container fits your data — and what happens when you pour the wrong thing into a container — is the skill this chapter built.

## How it works

**The integer family.** The signed integer types — `short`, `int`, `long`, `long long` — store whole numbers in two's complement form. `int` is at least 16 bits but almost always 32 bits on modern platforms; `long long` is at least 64 bits. Unsigned variants (`unsigned int`, etc.) store only non-negative values and wrap around on overflow. The `sizeof` operator returns the size of a type or object in bytes as a `std::size_t` value.

```cpp
#include <iostream>

int main()
{
    int apples{ 42 };
    long long population{ 8'100'000'000LL };
    std::cout << sizeof(int) << "\n";          // typically 4
    std::cout << sizeof(long long) << "\n";    // always 8
    return 0;
}
```

When portability matters, prefer `<cstdint>` fixed-width types: `int8_t`, `int16_t`, `int32_t`, `int64_t`, and their unsigned counterparts. These guarantee exact widths across platforms. For sizes and indices, `std::size_t` (from `<cstddef>`) is the right unsigned type because `sizeof` returns it.

**Floating-point types.** `float` (4 bytes, ~7 significant digits), `double` (8 bytes, ~15 significant digits), and `long double` (8–16 bytes, platform-dependent) store real numbers in IEEE 754 format. Prefer `double` over `float` — its extra precision prevents many silent rounding bugs. Use scientific notation when working with very large or very small values.

```cpp
#include <iostream>
#include <iomanip>

int main()
{
    double speed_of_light{ 2.998e8 };   // 2.998 × 10^8 m/s
    double tiny{ 1.5e-10 };
    std::cout << std::setprecision(4) << speed_of_light << "\n";  // 2.998e+08
    std::cout << tiny << "\n";
    return 0;
}
```

**Bool and char.** `bool` stores `true` or `false`; it prints as `1` or `0` by default, or as `true`/`false` with `std::boolalpha`. `char` stores a single character encoded as an integer (ASCII values 0–127 cover the printable set). Because `char` is an integer type, arithmetic on it works — `'A' + 1` gives `66`, which prints as `B` when passed to `std::cout` as a `char`.

**Type conversion and static_cast.** Implicit conversion happens automatically when you assign a wider value to a narrower type or mix types in an expression. Narrowing conversions (e.g., assigning a `double` to an `int`) silently truncate, not round. The safe explicit alternative is `static_cast<T>(value)`, which states your intent clearly and avoids compiler warnings.

```cpp
#include <iostream>

int main()
{
    double ratio{ 7.9 };
    int truncated{ static_cast<int>(ratio) };   // 7, not 8
    std::cout << truncated << "\n";
    
    char letter{ 'C' };
    int code{ static_cast<int>(letter) };        // 67
    std::cout << code << "\n";
    return 0;
}
```

## Common mistakes

**Signed/unsigned mismatch causing wraparound.** Unsigned integers silently wrap around on underflow. Subtracting 1 from an `unsigned int` holding 0 gives 4,294,967,295, not -1. This happens invisibly when you compare a signed value with an unsigned one — the signed value gets converted to unsigned first.

```cpp
unsigned int count{ 0 };
count = count - 1;   // wraps to 4294967295, no compiler error
```

Avoid using unsigned types for values that might go negative. Use `int` (or `int32_t`) as your default integer type unless you have a specific reason for unsigned.

**Integer division truncates instead of rounding.** When both operands are integers, `/` performs integer division: the fractional part is dropped, not rounded.

```cpp
int result = 7 / 2;   // 3, not 3.5 and not 4
```

If you need a fractional result, at least one operand must be a floating-point type: `7.0 / 2` or `static_cast<double>(7) / 2`.

**Floating-point precision is finite.** `0.1 + 0.2` does not equal `0.3` in floating-point arithmetic. Never compare two `double` values with `==` when they are computed; instead, check whether their difference is smaller than a small epsilon. The `std::setprecision` manipulator controls how many digits `std::cout` displays, but the underlying stored value retains its limited precision regardless.

## When to use this

Use `int` for general-purpose whole-number arithmetic. Use `int32_t`/`int64_t` when the exact width matters for binary protocols, file formats, or cross-platform guarantees. Use `double` for any computation involving fractions or real-world measurements. Use `float` only when memory is genuinely constrained (e.g., large arrays in graphics code). Use `char` when you need a single ASCII character; remember it is an integer type and participates in arithmetic via its ASCII value. Use `bool` to name the result of a condition so that code reads like plain English.

`static_cast` is your tool whenever an implicit conversion would lose precision or change sign. Reach for it explicitly rather than letting the compiler silently narrow your data. As you move into Chapter 5, these fundamentals stay constant — you will learn how to lock their values (`const`, `constexpr`) and how to express their literals more precisely using suffixes and numeral-system prefixes.

## The idea

An integer is a whole number — no fractional part, no decimal point. C++ provides four signed integer types that differ only in how many bytes they occupy and therefore how wide a range of values they can represent. The word "signed" means the type can hold both positive and negative values, using one bit internally to record the sign.

Think of each signed integer type as a measuring tape of a different length. A short tape can reach only a few metres; a long tape reaches much further. You pick the tape appropriate for the distance you need to measure. Similarly, you pick the integer type appropriate for the range of values your program needs to handle.

The four types, from narrowest to widest:
- `short` — at least 2 bytes (typically 2), range approximately −32 768 to 32 767
- `int` — at least 2 bytes (almost always 4), range approximately −2.1 billion to 2.1 billion
- `long` — at least 4 bytes (4 or 8 depending on platform), range at least −2.1 billion to 2.1 billion
- `long long` — at least 8 bytes, range approximately −9.2 × 10¹⁸ to 9.2 × 10¹⁸

For most everyday integer arithmetic, `int` is the natural first choice.

## How it works

**Declaring and initialising signed integers** follows the same pattern as any other variable:

```cpp
#include <iostream>

int main() {
    short  s{-100};
    int    i{2000000};
    long   l{-3000000000L};   // L suffix: long literal
    long long ll{9000000000LL};  // LL suffix: long long literal

    std::cout << s  << "\n";
    std::cout << i  << "\n";
    std::cout << l  << "\n";
    std::cout << ll << "\n";
    return 0;
}
```

Output:
```
-100
2000000
-3000000000
9000000000
```

The `L` suffix on a literal tells the compiler the value is at minimum a `long`; `LL` requires `long long`. Without the suffix a large literal is still interpreted at its natural size, but supplying the suffix makes the intent clear and avoids silent truncation warnings.

**Overflow is the central hazard.** When you compute a value larger than the type can hold, the bit pattern wraps and you get a wrong answer. The compiler does not stop you at runtime:

```cpp
#include <iostream>

int main() {
    short big{32767};   // maximum for a 2-byte short
    short wrapped{32767 + 1};  // undefined behavior — overflow
    std::cout << big     << "\n";
    std::cout << wrapped << "\n";
    return 0;
}
```

In practice `wrapped` usually prints `-32768` because the two's-complement arithmetic wraps around. But overflow of signed integers is technically undefined behaviour in C++, meaning the compiler is free to produce any result — including one that appears correct sometimes and wrong other times.

**Integer division truncates toward zero.** When both operands are integers, the `/` operator discards the fractional part:

```cpp
#include <iostream>

int main() {
    int a{7};
    int b{2};
    std::cout << a / b << "\n";   // 3, not 3.5
    std::cout << a % b << "\n";   // 1 (remainder)
    return 0;
}
```

`7 / 2` is `3` because the `.5` is truncated. The `%` operator gives the remainder. This behaviour surprises programmers coming from Python, where `/` always produces a float.

## Common mistakes

**Mistake 1: Assuming int has a known maximum and then overflowing it**

```cpp
#include <iostream>

int main() {
    int x{2147483647};   // INT_MAX on a 32-bit int
    int y{x + 1};        // undefined behavior — signed overflow
    std::cout << y << "\n";   // may print -2147483648
    return 0;
}
```

Adding 1 to the maximum `int` wraps to the most negative `int` value in two's-complement arithmetic. The result is implementation-defined and technically undefined behaviour. If you need values beyond `int`'s range, use `long long`.

**Mistake 2: Expecting integer division to produce a decimal result**

```cpp
#include <iostream>

int main() {
    int numerator{1};
    int denominator{3};
    std::cout << numerator / denominator << "\n";   // prints 0, not 0.333
    return 0;
}
```

Both operands are `int`, so the division is integer division and the fractional part is dropped. The result is `0`, not `0.333`. To get the decimal result, at least one operand must be a floating-point type.

**Mistake 3: Using the wrong type for a large value**

```cpp
#include <iostream>

int main() {
    int population{8000000000};   // will not compile or overflow silently
    std::cout << population << "\n";
    return 0;
}
```

The literal `8000000000` (8 billion) exceeds `INT_MAX` on a 32-bit `int`. The compiler may warn or error. Use `long long` for values in the billions.

## When to use this

Use `int` for almost all whole-number arithmetic unless you have a specific reason to choose otherwise. It is the type the CPU handles most naturally and the one the standard guarantees is at least 16 bits (in practice always 32). Choose `long long` when your values can exceed about 2 billion — population counts, file sizes, tick counts. Reserve `short` for memory-constrained situations (such as large arrays where each element can be at most 32 767) because the narrower type saves memory at scale.

Prefer signed integer types over unsigned for general computation because signed arithmetic has predictable semantics under subtraction and comparison. The lesson "Unsigned integers, and why to avoid them" explains the pitfalls of unsigned types in detail.

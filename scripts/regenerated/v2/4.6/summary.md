## The idea

When you declare `int x { 0 };`, you know `int` is at least 16 bits — but the C++ standard does not pin down its exact size. On most desktop platforms today `int` is 32 bits, but on older embedded systems it might be 16 bits. A calculation that fits in a 32-bit `int` could silently overflow on a 16-bit `int`, and your program would produce wrong answers on a different machine with no warning at all.

Fixed-width integers solve this problem by giving you types whose sizes are guaranteed, regardless of platform: `int32_t` is always exactly 32 bits, `uint64_t` is always exactly 64 bits unsigned, and so on. Use them whenever the exact bit width matters for correctness — binary file formats, network packets, hardware registers, or any place where overflow at a specific boundary is meaningful.

`std::size_t` is the companion type for measuring sizes and counts. It is unsigned and wide enough to hold the size of any object on the current platform — on 64-bit systems it is usually 64 bits wide. The standard library uses it for all sizes, lengths, and indices, so you will encounter it constantly.

## How it works

**The fixed-width integer types**

Fixed-width types live in `<cstdint>`. The naming pattern is straightforward:

- `int8_t` — 8-bit signed integer (−128 to 127)
- `int16_t` — 16-bit signed integer (−32,768 to 32,767)
- `int32_t` — 32-bit signed integer (−2,147,483,648 to 2,147,483,647)
- `int64_t` — 64-bit signed integer (−9,223,372,036,854,775,808 to 9,223,372,036,854,775,807)
- `uint8_t`, `uint16_t`, `uint32_t`, `uint64_t` — the unsigned counterparts

```cpp
#include <cstdint>
#include <iostream>

int main()
{
    int32_t population { 2147483647 };   // exactly 32 bits, guaranteed
    uint64_t national_debt { 33000000000000ULL };   // 64-bit unsigned

    std::cout << population << "\n";      // 2147483647
    std::cout << national_debt << "\n";   // 33000000000000
    return 0;
}
```

There is no guessing about sizes — `int32_t` is 32 bits on every conforming platform, period.

**`sizeof` with fixed-width types**

Because sizes are guaranteed, `sizeof` reports exactly what you expect:

```cpp
#include <cstdint>
#include <iostream>

int main()
{
    std::cout << sizeof(int8_t) << "\n";    // 1
    std::cout << sizeof(int16_t) << "\n";   // 2
    std::cout << sizeof(int32_t) << "\n";   // 4
    std::cout << sizeof(int64_t) << "\n";   // 8
    std::cout << sizeof(uint64_t) << "\n";  // 8
    return 0;
}
```

**`std::size_t` for sizes and counts**

`std::size_t` is the type returned by `sizeof` and used everywhere the standard library measures a size. Include `<cstddef>` to bring it in (though many headers provide it as a side effect):

```cpp
#include <cstddef>
#include <iostream>

int main()
{
    std::size_t byte_count { sizeof(double) };   // 8 on most systems
    std::cout << byte_count << "\n";             // 8

    std::size_t pixels { 1920UL * 1080UL };
    std::cout << pixels << "\n";                 // 2073600
    return 0;
}
```

Because `std::size_t` is unsigned, the same wraparound pitfalls from "Unsigned integers, and why to avoid them" apply — be cautious when doing subtraction with it.

## Common mistakes

**Mistake 1 — Using `int8_t` where you mean a small integer but printing it as a character**

`int8_t` is typically a `typedef` for `signed char`. When you pass it to `std::cout`, the stream treats it as a character, not a number. You see a blank or a control character instead of the digit you expected.

```cpp
#include <cstdint>
#include <iostream>

int main()
{
    int8_t small { 65 };
    std::cout << small << "\n";   // prints 'A', not 65!
    return 0;
}
```

To print it as a number, cast to `int`: `std::cout << static_cast<int>(small)`. (You will learn `static_cast` in lesson 4.12.)

**Mistake 2 — Assuming `int` and `int32_t` are always interchangeable**

On most modern desktop compilers they are the same underlying type. But they are not guaranteed to be. Code that passes `int32_t` where an `int` is expected might trigger a narrowing-conversion warning on a platform where `int` is only 16 bits. If you care about the width, use the fixed-width type consistently; do not mix them.

**Mistake 3 — Subtracting from `std::size_t` near zero**

Because `std::size_t` is unsigned, subtracting when the result would be negative wraps around to a huge value — exactly the problem described in "Unsigned integers, and why to avoid them." Expressions like `byte_count - 1` when `byte_count` is zero produce 2⁶⁴ − 1, not −1. Store the result in a signed type or check before subtracting.

## When to use this

Reach for fixed-width integers when the exact width matters: writing or reading binary data in a specific format, implementing a checksum or hash with defined overflow semantics, or writing code that must behave identically on 32-bit and 64-bit targets. For ordinary counting and arithmetic where you just need "a reasonably big signed integer," plain `int` or `long long` is fine and often faster because the compiler can choose the platform's natural size.

Use `std::size_t` when working with sizes, byte offsets, or any quantity that the standard library measures in `size_t` — this prevents signed/unsigned comparison warnings. Avoid it for general arithmetic where results might go negative; prefer signed types there.

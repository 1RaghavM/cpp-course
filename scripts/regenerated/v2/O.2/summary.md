## The idea

C++ inherits a set of operators that work directly on the binary representation of integers. Instead of adding, subtracting, or comparing values as whole numbers, these operators act on each bit independently. They are called bitwise operators, and they are the fundamental tool for bit manipulation when you need to work with raw integer types rather than `std::bitset`.

The mental model is simple: picture a row of light switches. The bitwise AND operator produces a 1 only where both inputs have a 1 — like requiring two switches to be on simultaneously. The bitwise OR produces a 1 wherever at least one input has a 1. The XOR (exclusive OR) produces a 1 exactly where the inputs differ. The NOT operator flips every switch. The shift operators slide the entire row left or right, filling in zeros on the vacated side.

These operations are fast — a single CPU instruction each — and they show up in nearly every domain where you deal with hardware, protocols, or compact data storage.

## How it works

The bitwise operators are `&` (AND), `|` (OR), `^` (XOR), `~` (NOT), `<<` (left shift), and `>>` (right shift). They operate on integer types: `int`, `unsigned int`, and the fixed-width types like `uint8_t`.

AND and OR are the most frequently used:

```cpp
#include <bitset>
#include <iostream>

int main()
{
    unsigned int a{ 0b1100'1010 };  // 202
    unsigned int b{ 0b1010'1100 };  // 172

    std::cout << std::bitset<8>(a & b) << '\n';  // 10001000  (AND)
    std::cout << std::bitset<8>(a | b) << '\n';  // 11101110  (OR)
    std::cout << std::bitset<8>(a ^ b) << '\n';  // 01100110  (XOR)
}
```

Each bit in the result is computed independently. For `a & b`, bit 7 is `1 & 1 = 1`, bit 6 is `1 & 0 = 0`, bit 5 is `0 & 1 = 0`, and so on.

The NOT operator flips every bit. On a 32-bit `unsigned int`, `~0` produces a value with all 32 bits set to 1:

```cpp
#include <bitset>
#include <iostream>

int main()
{
    unsigned int x{ 0b0000'1111 };
    std::cout << std::bitset<32>(~x) << '\n';
    // prints 11111111111111111111111100000000
}
```

Shift operators move bits left or right. Left shift by `n` multiplies by 2^n (as long as no bits overflow); right shift by `n` divides by 2^n:

```cpp
#include <bitset>
#include <iostream>

int main()
{
    unsigned int x{ 0b0000'0001 };  // 1

    std::cout << std::bitset<8>(x << 3) << '\n';  // 00001000 = 8
    std::cout << std::bitset<8>(x << 7) << '\n';  // 10000000 = 128
    std::cout << std::bitset<8>(0b1000'0000u >> 4) << '\n'; // 00001000 = 8
}
```

All six operators also have compound-assignment forms: `&=`, `|=`, `^=`, `<<=`, `>>=`.

## Common mistakes

**Using bitwise operators on `int` instead of `unsigned int`.** Right-shifting a negative signed integer is implementation-defined behavior in C++ — some platforms fill in 1s from the left, others fill in 0s. Always prefer `unsigned` types when doing bit manipulation to get predictable results.

```cpp
int x{ -1 };
int y{ x >> 1 };  // implementation-defined — avoid this
```

**Confusing bitwise AND (`&`) with logical AND (`&&`).** These are completely different operators. `a & b` works bit by bit and returns an integer. `a && b` treats both operands as booleans (zero or non-zero) and returns `true` or `false`. Using `&` where you meant `&&` in a condition can produce a non-zero result even when you expected false, or zero when you expected true.

```cpp
#include <iostream>

int main()
{
    int a{ 2 };  // binary 10
    int b{ 1 };  // binary 01
    // a & b is 0 (no bit in common) — but a && b is 1 (both non-zero)
    std::cout << (a & b)  << '\n';  // 0  (bitwise AND — no shared bits)
    std::cout << (a && b) << '\n';  // 1  (logical AND — both non-zero)
}
```

**Shifting by a negative amount or by the bit width of the type.** Both invoke undefined behavior. Shifting a 32-bit integer by 32 is not the same as zeroing it — the result is undefined, and optimizers may produce surprising output.

## When to use this

Bitwise operators are the right tool when you work with hardware registers, binary file formats, network packets, or any data structure that packs multiple values into a single integer. You will use them in the next lessons to build bit masks — a pattern for extracting or modifying individual bits inside an integer. If your data is a simple collection of named flags and performance is not a concern, `std::bitset` (covered in O.1) is more readable. When you need to squeeze every cycle out of inner loops or interoperate with C APIs that use unsigned integer fields, bitwise operators on `unsigned int` or fixed-width types are the right choice.

## The idea

Every integer in a C++ program is stored in memory as a sequence of bits. The value you write as `42` is stored as `00101010` in an 8-bit type. When you write `0b00101010` you are writing that same value in binary notation, which reveals the direct relationship between the written digits and the memory layout. Understanding this relationship is what allows bit manipulation to make sense: once you can read and write a number in binary, the effects of AND, OR, shift, and mask become concrete and predictable rather than mysterious.

This lesson is about the mechanics of that conversion — how to translate between the decimal numbers you normally use and the binary numbers the machine actually stores. This is not something you do constantly in everyday C++ code, but it is the foundation underneath every bit-manipulation technique in this chapter.

## How it works

**Decimal to binary.** The standard algorithm is repeated division by 2. Divide the number by 2 and record the remainder (0 or 1). Divide the quotient again. Keep going until the quotient is 0. The binary representation is the remainders read from bottom to top.

For 42:

```
42 / 2 = 21 remainder 0
21 / 2 = 10 remainder 1
10 / 2 =  5 remainder 0
 5 / 2 =  2 remainder 1
 2 / 2 =  1 remainder 0
 1 / 2 =  0 remainder 1
```

Reading the remainders upward: `101010`. Pad to 8 bits: `00101010`. You can verify: 32 + 8 + 2 = 42.

**Binary to decimal.** Each bit position represents a power of 2. Bit 0 (rightmost) represents 2^0 = 1, bit 1 represents 2^1 = 2, bit 2 represents 2^2 = 4, and so on. Sum the powers of 2 that correspond to 1 bits:

```
0b00101010
Bit 5: 2^5 = 32
Bit 3: 2^3 =  8
Bit 1: 2^1 =  2
Sum:        42
```

**Verifying in code.** C++ binary literals and `std::bitset` let you confirm your work directly:

```cpp
#include <bitset>
#include <iostream>

int main()
{
    int value{ 42 };

    // print as binary
    std::cout << std::bitset<8>(value) << '\n';  // 00101010

    // construct from binary literal and print decimal
    int from_binary{ 0b00101010 };
    std::cout << from_binary << '\n';             // 42
}
```

**Hexadecimal as a shorthand.** Binary literals get unwieldy for large values. Hexadecimal (base 16) is a convenient middle ground because each hex digit maps exactly to 4 binary bits. The digit `A` (10) maps to `1010`; `2` maps to `0010`; so `0x2A` = `0b0010'1010` = 42. Hexadecimal is common in documentation for hardware registers and memory addresses:

```cpp
#include <iostream>

int main()
{
    unsigned int mask{ 0xFF };          // 11111111 — low 8 bits all set
    unsigned int high_byte{ 0xFF00 };   // 1111111100000000

    std::cout << mask       << '\n';  // 255
    std::cout << high_byte  << '\n';  // 65280
}
```

## Common mistakes

**Off-by-one on bit positions.** A value with only bit 3 set is `8` (2^3), not `4` (2^2). A frequent mistake is to confuse the bit index (3) with the value (8). Writing `1 << 3` is the reliable way to get the value for bit 3; counting from the right in a binary literal is less error-prone than trying to compute the power of 2 mentally.

**Assuming sign extension does not affect conversion.** For signed types, the most significant bit is the sign bit. The value `0b11111111` in a signed 8-bit type is `-1`, not `255`. When you print a signed integer as binary using `std::bitset`, the bitset constructor treats the value as a sequence of bits — the two's complement encoding is what you see, which may surprise you if you expected a small negative number to look like a small binary number.

```cpp
signed char c{ -1 };
std::cout << std::bitset<8>(static_cast<unsigned char>(c)) << '\n';
// prints 11111111, not 00000001
```

**Trying to count bits wrong when converting by hand.** The error shows up like this: working left-to-right instead of right-to-left. Bit 0 is always the rightmost digit. If you write `10100` and assign values left-to-right you get 1×1 + 0×2 + 1×4 + ... — the wrong answer. Always number from the right, starting at zero.

## When to use this

Knowing the binary representation is a prerequisite for all the bit manipulation work in this chapter. You will not convert between decimal and binary by hand in production code — the compiler handles that. But you need to be able to read a hex value in a hardware datasheet and know which bits it sets, write a mask like `0x0F` and understand that it covers exactly the low 4 bits, and trace through a bitwise expression and predict its result. These skills make the operations in O.2 and O.3 — shifting, masking, testing, clearing — transparent rather than opaque. They are also directly useful when reading low-level C and C++ code, embedded firmware, or any documentation that describes memory layouts in hex or binary.

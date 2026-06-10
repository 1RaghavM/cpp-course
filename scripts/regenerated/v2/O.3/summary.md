## The idea

A bit mask is a pattern of bits used as a stencil. You lay the mask over an integer and use a bitwise operator to isolate, set, clear, or toggle exactly the bits the mask covers — leaving all other bits unchanged. This is how programs pack multiple independent pieces of information into a single integer and later read each piece back out.

Think of a house with eight light switches in a row. Each switch is independent: bedroom light, kitchen light, hallway light, and so on. A mask is a way of pointing at one or more of those switches and flipping only them, while every other switch stays exactly where it is. The mask itself is just another integer, but you construct it to have 1s exactly where you want to operate and 0s everywhere else.

Bit masks are the practical application of the bitwise operators you learned in O.2. Together they form the core vocabulary of low-level programming.

## How it works

The standard pattern defines named constants for each bit position, then combines the operators `&`, `|`, `^`, and `~` to perform the four fundamental flag operations: test, set, clear, and toggle.

Define one constant per flag by shifting 1 left to the desired bit position:

```cpp
#include <cstdint>
#include <iostream>

int main()
{
    unsigned int READABLE   { 1u << 0 };  // 0000 0001
    unsigned int WRITABLE   { 1u << 1 };  // 0000 0010
    unsigned int EXECUTABLE { 1u << 2 };  // 0000 0100

    unsigned int perms{ 0 };

    // Set READABLE and WRITABLE
    perms |= READABLE;
    perms |= WRITABLE;
    std::cout << perms << '\n';  // 3
}
```

With those constants in place, the four operations follow a fixed pattern:

- **Test** whether a flag is set: `(value & mask) != 0`
- **Set** a flag: `value |= mask`
- **Clear** a flag: `value &= ~mask`
- **Toggle** a flag: `value ^= mask`

Here they all are in one example:

```cpp
#include <cstdint>
#include <iostream>

int main()
{
    unsigned int FLAG_A { 1u << 0 };
    unsigned int FLAG_B { 1u << 1 };
    unsigned int FLAG_C { 1u << 2 };

    unsigned int status{ 0 };

    status |= FLAG_A;                              // set A
    status |= FLAG_C;                              // set C
    // status is now 0000 0101

    bool a_on = (status & FLAG_A) != 0;            // true
    bool b_on = (status & FLAG_B) != 0;            // false

    status &= ~FLAG_A;                             // clear A → 0000 0100
    status ^= FLAG_C;                              // toggle C → 0000 0000

    std::cout << a_on << ' ' << b_on << '\n';      // 1 0
    std::cout << status << '\n';                   // 0
}
```

You can also combine multiple masks into one using OR to operate on several flags at the same time: `status |= (FLAG_A | FLAG_B)` sets both A and B in a single expression.

## Common mistakes

**Forgetting the parentheses when testing a flag.** The `!=` operator has higher precedence than `&`, so writing `value & mask != 0` is parsed as `value & (mask != 0)` — which compares the mask to zero first (always giving 1), then ANDs that 1 with value. The correct form always wraps the AND in its own parentheses: `(value & mask) != 0`.

```cpp
#include <iostream>

int main()
{
    unsigned int v{ 4u };
    unsigned int M{ 1u << 2 };

    // Wrong: parsed as v & (M != 0) which is v & 1 = 0
    std::cout << (v & M != 0) << '\n';    // 0 — wrong!
    // Right
    std::cout << ((v & M) != 0) << '\n'; // 1 — correct
}
```

**Clearing with AND instead of AND-NOT.** A common mistake is to write `value &= mask` thinking it clears the flag. It does the opposite — it keeps only the bits in the mask and zeros everything else. Clearing requires the complement: `value &= ~mask`.

```cpp
#include <iostream>

int main()
{
    unsigned int flags{ 0b0000'0111u };
    unsigned int TARGET{ 1u << 1 };

    unsigned int wrong{ flags };
    wrong &= TARGET;               // keeps ONLY TARGET, wipes the rest
    std::cout << wrong << '\n';    // 2 (wrong — was 7, expected 5)

    unsigned int right{ flags };
    right &= ~TARGET;              // clears only TARGET bit
    std::cout << right << '\n';    // 5 (correct)
}
```

**Using a signed type for the mask or the value.** On an 8-bit signed `char`, `~0` is `-1` and casting it to a larger type sign-extends, producing unexpected bit patterns. Always use `unsigned` types — `unsigned int`, `uint8_t`, `uint16_t`, `uint32_t` — for any variable that holds bit flags.

## When to use this

Use bit masks and flags whenever you need to store multiple independent yes/no states compactly in a single integer, or whenever you interface with a hardware register, file header, or network packet that encodes fields as individual bits. This pattern is everywhere in systems programming: Unix file permissions, TCP flags, OpenGL render state, game entity components. If your flags are few and named, `std::bitset` (O.1) gives you the same operations with bounds checking and a cleaner API at no runtime cost. Bit masks on plain integers are preferred when the bit pattern must match a specific numeric value defined by an external standard, when you need to pass the flags as a function argument to a C API, or when you are working inside a performance-critical loop where you cannot afford the overhead of member-function calls.

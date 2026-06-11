## The idea

Every variable your program uses lives in memory, and memory is made of bits — individual switches that can be either 0 or 1. Most of the time you work with those bits indirectly: you store an `int` and let the compiler handle the binary representation. But sometimes the binary representation itself is what matters. Network protocols encode fields in individual bits of a byte. Game engines pack a character's status flags — poisoned, stunned, invisible — into a single integer to save memory. Permission systems use one byte to represent read, write, and execute rights all at once.

This chapter is about working at that level directly. You will learn to inspect, set, clear, and flip individual bits. Two tools make this possible: the `std::bitset` type from the standard library, which gives you a named container for a fixed number of bits, and the bitwise operators (`&`, `|`, `^`, `~`, `<<`, `>>`), which let you manipulate bits inside ordinary integers.

This lesson introduces `std::bitset` — a safe, readable starting point before you touch raw bitwise operators.

## How it works

`std::bitset` lives in the `<bitset>` header. You declare one by specifying the number of bits at compile time, in angle brackets. The bits are numbered from right to left starting at 0, so bit 0 is the rightmost (least significant) bit.

```cpp
#include <bitset>
#include <iostream>

int main()
{
    std::bitset<8> flags;      // 8 bits, all zero by default
    std::cout << flags << '\n'; // prints 00000000
}
```

You can initialize a `bitset` from an unsigned integer literal or from a string of '0' and '1' characters:

```cpp
#include <bitset>
#include <iostream>

int main()
{
    std::bitset<8> a{ 0b0000'1111 };  // binary literal: bits 0-3 are set
    std::bitset<8> b{ "11001010" };   // string: bit 7 is leftmost

    std::cout << a << '\n';  // 00001111
    std::cout << b << '\n';  // 11001010
}
```

Once you have a `bitset`, four member functions cover most operations you will need:

- `test(pos)` — returns `true` if bit `pos` is 1, `false` if it is 0
- `set(pos)` — sets bit `pos` to 1
- `reset(pos)` — sets bit `pos` to 0
- `flip(pos)` — toggles bit `pos` (0 becomes 1, 1 becomes 0)

Calling any of these with a position outside the valid range throws `std::out_of_range`, which makes `bitset` safer than operating directly on integer bits.

```cpp
#include <bitset>
#include <iostream>

int main()
{
    std::bitset<8> flags{ 0b0000'0000 };

    flags.set(2);    // bit 2 on  → 00000100
    flags.set(5);    // bit 5 on  → 00100100
    flags.reset(2);  // bit 2 off → 00100000
    flags.flip(7);   // bit 7 on  → 10100000

    std::cout << "bit 5 is " << flags.test(5) << '\n'; // 1
    std::cout << flags << '\n';                          // 10100000
}
```

`bitset` also has `count()` (number of bits set to 1), `size()` (total bits), `any()` (true if any bit is 1), `none()` (true if all are 0), and `all()` (true if all are 1). These are useful for checking state without having to loop over individual positions.

## Common mistakes

**Confusing bit numbering direction.** The printed output shows bit 7 on the left and bit 0 on the right. A common mistake is to call `set(0)` expecting the leftmost printed bit to change, then being surprised when the rightmost one changes instead. Bit 0 is always the least significant bit — the rightmost in the standard output.

```cpp
std::bitset<8> b;
b.set(0);
std::cout << b << '\n';  // prints 00000001, NOT 10000000
```

**Using `[]` instead of `test()` and forgetting it doesn't bounds-check.** `bitset` supports `operator[]` for both reading and writing, but unlike `test()` it does not throw on an out-of-range index in release builds — behavior is undefined. If you are unsure whether a position is valid, use `test()`.

**Initializing from a string with invalid characters.** If you initialize a `bitset` from a string that contains anything other than '0' or '1', the constructor throws `std::invalid_argument`. Passing a normal decimal string like `"42"` will fail at runtime, not at compile time.

```cpp
std::bitset<8> bad{ "42" };  // throws std::invalid_argument
```

## When to use this

Reach for `std::bitset` when you have a fixed, known number of binary flags and you want readable, safe access to them. It is ideal for a small collection of boolean options — file permissions, entity status flags in a game, feature toggles — where packing them into a single integer saves memory compared to a `bool` array.

`std::bitset` is less useful when the number of bits varies at runtime (use `std::vector<bool>` for that), when you need to interoperate with a hardware register or network protocol that requires a specific integer type (use bitwise operators on `unsigned int` or `uint8_t` instead), or when performance is critical and you need to process many integers with bitwise operations in a tight loop. Those cases are covered in the next lessons of this chapter.

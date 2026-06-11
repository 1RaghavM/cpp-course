## The idea

Every time you write a number directly in your source code — `42`, `3.14`, `'A'`, `true` — you are writing a literal. C++ assigns each literal a default type based on how it looks: `42` is `int`, `3.14` is `double`, `'A'` is `char`. Most of the time that default is fine, but sometimes it causes silent narrowing or precision loss. Literal suffixes let you override the default type so the literal matches exactly what you intend.

A parallel topic is numeral systems. Humans usually write numbers in base-10 (decimal), but hardware and low-level code often work with base-16 (hexadecimal), base-2 (binary), or base-8 (octal). C++ lets you write integer literals in any of these forms, which makes bit patterns, color values, and flag constants much easier to read and verify.

## How it works

**Type suffixes.** Append a suffix directly to the literal — no space — to control its type.

- `u` or `U` → `unsigned int` (e.g., `100u`)
- `l` or `L` → `long` (e.g., `100L`)
- `ul` or `UL` → `unsigned long` (e.g., `100UL`)
- `ll` or `LL` → `long long` (e.g., `9'000'000'000LL`)
- `f` or `F` → `float` (e.g., `3.14f`)
- No suffix on a floating-point literal → `double` (e.g., `3.14`)

```cpp
#include <iostream>

int main()
{
    long long big{ 9'000'000'000LL };   // needs LL; 9 billion overflows int
    float approx{ 3.14f };             // f suffix: float, not double
    unsigned int flags{ 255u };        // u suffix: unsigned int

    std::cout << big << "\n";          // 9000000000
    std::cout << approx << "\n";       // 3.14 (approx)
    std::cout << flags << "\n";        // 255
    return 0;
}
```

Note that `9'000'000'000` without the `LL` suffix would be an `int` literal, and 9 billion overflows `int`. The compiler does not automatically widen the literal to `long long` just because it does not fit; you must state the intent with `LL`.

**Numeral systems.** Integer literals can be written in four bases:

- Decimal: plain digits, e.g., `255`
- Hexadecimal: prefix `0x` or `0X`, digits `0-9` and `a-f`/`A-F`, e.g., `0xFF`
- Octal: leading zero `0`, digits `0-7`, e.g., `0377`
- Binary: prefix `0b` or `0B` (C++14 and later), digits `0` and `1`, e.g., `0b11111111`

All four of the examples above represent the same value, 255.

```cpp
#include <iostream>

int main()
{
    int dec{ 255 };
    int hex{ 0xFF };
    int oct{ 0377 };
    int bin{ 0b11111111 };

    std::cout << dec << "\n";  // 255
    std::cout << hex << "\n";  // 255
    std::cout << oct << "\n";  // 255
    std::cout << bin << "\n";  // 255
    return 0;
}
```

You can combine a numeral-system prefix with a type suffix: `0xFFu` is an `unsigned int` with value 255.

**Digit separators.** The single-quote character `'` can be inserted anywhere in a numeric literal (C++14) to improve readability: `1'000'000`, `0xFF'AA'BB`, `0b1000'0000`. The compiler ignores the separators; they are purely for human readers.

## Common mistakes

**Accidentally writing octal.** A leading zero means octal, not decimal. `int x{ 010 }` initializes `x` to 8, not 10. This trap hits hard when you align a column of numbers and zero-pad the smaller ones: `int a{ 010 }` and `int b{ 10 }` are different values. If you need a leading zero for display formatting, use `std::setw` and `std::setfill` — do not zero-pad in the literal itself.

```cpp
int octal_trap{ 010 };  // 8, not 10!
int decimal{ 10 };      // 10
```

**Omitting the `LL` suffix on large integer literals.** Writing `long long big{ 9000000000 }` looks like it should work because the variable is `long long`, but the literal `9000000000` is still parsed as `int` first, causing an overflow before the value is stored in `big`. Add `LL` to the literal: `9000000000LL`.

**Confusing `f` suffix with precision.** `3.14f` is a `float` literal with about 7 significant digits of precision. Assigning it to a `double` variable works, but the float-precision limit was already applied during parsing — you get a `double` holding a value that was already rounded to float precision. If you need full `double` precision, write `3.14` with no suffix.

## When to use this

Use `LL` whenever an integer literal might not fit in `int` (any value beyond about 2.1 billion). Use `u` when you deliberately want an unsigned value, such as a bit mask or a count that should never go negative. Use `f` when you intentionally work in `float` precision, typically in graphics or audio code where arrays of floats are common.

Use hexadecimal for bit flags, memory addresses, color values (e.g., `0xFF8800`), and any value whose structure is clearer in groups of four bits. Use binary (`0b...`) for individual bit patterns when you want to see exactly which bits are set. Avoid octal outside of legacy file-permission code (Unix `chmod` values like `0644`) — its accidental use from zero-padding is a classic C and C++ bug.

These choices pair naturally with `const` from the previous lesson: `const unsigned int mask{ 0b0000'1111u }` is both immutable and self-documenting.

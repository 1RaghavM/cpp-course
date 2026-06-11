## The idea

Every value in a program has a type. A type is a label that tells the compiler two things: how much memory to reserve for the value, and how to interpret the bits stored there. The number `65` stored as an integer is the number sixty-five; the same bit pattern interpreted as a character is the letter `'A'`. Types make that distinction precise.

C++ is a statically typed language. Every variable has a type that is fixed at compile time and never changes while the program runs. This is different from languages like Python, where a variable can hold a string today and an integer tomorrow. In C++, the compiler uses the type to catch mismatches before the program ever runs.

The fundamental types are the building blocks the language provides directly, without any header or library. They fall into five families:

- Integer types — whole numbers, both positive and negative (`int`, `short`, `long`, `long long`)
- Unsigned integer types — whole numbers that are never negative (`unsigned int`, etc.)
- Floating-point types — numbers with a fractional part (`float`, `double`, `long double`)
- Boolean type — a value that is either true or false (`bool`)
- Character type — a single character, such as `'A'` or `'7'` (`char`)
- Void — the absence of a value; used to say a function returns nothing

You do not need to memorise every size and range right now. The key idea is that different types exist because different kinds of data need different amounts of memory and different rules for arithmetic.

## How it works

**Declaring a variable** tells the compiler to reserve storage and name it. The type comes first, then the name, then an optional initialiser.

```cpp
#include <iostream>

int main() {
    int score = 0;          // integer, initialised to zero
    double temperature = 98.6;  // floating-point
    bool passed = true;     // boolean
    char grade = 'A';       // single character

    std::cout << score << "\n";
    std::cout << temperature << "\n";
    return 0;
}
```

The output is `0` on the first line and `98.6` on the second. Each variable holds exactly the kind of value its type describes.

**Each type has a size** — the number of bytes of memory it occupies. More bytes means a wider range of values. A 4-byte `int` can hold values from roughly −2 billion to +2 billion. A 1-byte `char` can hold only 256 distinct values.

```cpp
#include <iostream>

int main() {
    int    a = 2147483647;   // largest positive value for a 4-byte int
    short  b = 32767;        // largest positive value for a 2-byte short
    double c = 3.14159265358979;

    std::cout << a << "\n";
    std::cout << b << "\n";
    std::cout << c << "\n";
    return 0;
}
```

Output:
```
2147483647
32767
3.14159265359
```

(The `double` output is rounded by the default stream precision.)

**Initialisation** is the act of giving a variable its first value at the point of creation. C++ offers several syntaxes; brace initialisation (`{}`) is the safest because it refuses to silently narrow the value.

```cpp
#include <iostream>

int main() {
    int x{42};       // brace initialisation — preferred
    int y = 42;      // copy initialisation — also fine
    int z(42);       // direct initialisation — less common

    std::cout << x << " " << y << " " << z << "\n";
    return 0;
}
```

Output: `42 42 42`

All three ways produce the same result here. Brace initialisation becomes important later when narrowing conversions would otherwise slip through silently.

## Common mistakes

**Mistake 1: Leaving a variable uninitialised**

```cpp
#include <iostream>

int main() {
    int score;
    std::cout << score << "\n";  // undefined behavior
    return 0;
}
```

`score` was never given a value, so reading it is undefined behaviour — the program may print garbage, crash, or do something else entirely. Always initialise variables when you declare them.

**Mistake 2: Assigning a value that does not fit the type**

```cpp
#include <iostream>

int main() {
    short s = 40000;   // 40000 is outside [-32768, 32767]
    std::cout << s << "\n";
}
```

A `short` on most platforms holds at most 32767. Assigning 40000 causes an overflow: the bit pattern wraps around and the printed value is something unexpected, often a negative number. The compiler may warn, but it will not stop you. Brace initialisation (`short s{40000};`) would be an error.

**Mistake 3: Treating a character as if it were a number — or vice versa**

```cpp
#include <iostream>

int main() {
    char c = 65;
    std::cout << c << "\n";   // prints: A  (not 65)
    return 0;
}
```

A `char` variable printed with `cout` shows the character whose ASCII code matches the stored value, not the raw number. If you want to see `65`, you need to cast it to an integer type first. This surprises many beginners who expect `cout << c` to print the number.

## When to use this

You reach for specific fundamental types when you know the nature of the data. Use `int` for most whole-number arithmetic; it is the natural integer size for the platform. Use `double` when fractional precision matters (measurements, money, physics calculations). Use `bool` for yes/no flags. Use `char` for individual characters.

Choose the narrowest type that can hold your data range without wasting memory — but in practice `int` is the default choice for integers until a reason to narrow arises, such as representing a protocol byte. When you need exact sizes (for binary file formats or network packets), the fixed-width types from `<cstdint>` are the right tool; those are covered in lesson "Fixed-width integers and size_t".

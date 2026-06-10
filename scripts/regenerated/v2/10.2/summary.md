## The idea

C++ was designed so that arithmetic can always be performed using the CPU's native arithmetic units, which typically operate on `int` (32-bit) or `double` (64-bit) values. Small types like `bool`, `char`, and `short` exist for storage efficiency, but the hardware does not have dedicated add/multiply instructions for them. So whenever a small type appears in an arithmetic expression, the compiler automatically converts it to a larger, more capable type before doing any math. This automatic upward conversion is called **promotion**.

Think of it like a sports league that only runs official matches between teams in the Premier League. If a lower-division team wants to play, it must first be promoted to the Premier League. The player (value) is the same person; they just now play in the higher league (type). Promotion never loses information — you are only moving to a wider, more expressive type — and it happens silently, before the arithmetic.

There are two separate promotion rules worth knowing: **integral promotion** (for integer-family types) and **floating-point promotion** (for `float`).

## How it works

**Integral promotion**

The rule is: any type narrower than `int` — specifically `bool`, `char`, `signed char`, `unsigned char`, `short`, and `unsigned short` — is promoted to `int` (or `unsigned int` if `int` cannot hold all the values of the source type) before being used in most expressions.

```cpp
#include <iostream>

int main() {
    char c = 'A';          // 'A' is 65 as a number
    short s = 100;
    // In the expression below, both c and s are promoted to int first
    int sum = c + s;       // int(65) + int(100) = int(165)
    std::cout << sum << "\n"; // prints 165
    return 0;
}
```

Neither `c` nor `s` is changed in memory. The compiler creates temporary `int` copies for the arithmetic, performs the addition as an `int + int` operation, and stores the `int` result. After the expression, `c` is still a `char` and `s` is still a `short`.

`bool` is also subject to integral promotion. `true` becomes `1` and `false` becomes `0`, both as `int`:

```cpp
#include <iostream>

int main() {
    bool flag = true;
    // flag is promoted to int(1) before the addition
    int result = flag + 10;
    std::cout << result << "\n"; // prints 11
    return 0;
}
```

**Floating-point promotion**

`float` is promoted to `double` when used in most expressions. This is because the standard arithmetic type for floating-point in C++ is `double`:

```cpp
#include <iostream>

int main() {
    float f = 3.14f;
    // f is promoted to double before the addition
    double d = f + 1.0;
    std::cout << d << "\n"; // prints approximately 4.14
    return 0;
}
```

When `f` (a `float`) is added to `1.0` (a `double` literal), the `float` is promoted to `double`, and the addition is done in `double` precision.

## Common mistakes

**Mistake 1: Believing arithmetic on `char` stays as `char`**

```cpp
#include <iostream>

int main() {
    char a = 200;
    char b = 100;
    // Programmer expects char arithmetic; might expect wrap-around
    int result = a + b;    // both promoted to int; result is 300, not wrapped
    std::cout << result << "\n"; // prints 300
    return 0;
}
```

A common misconception is that `char + char` produces a `char` (which would overflow on an 8-bit signed or unsigned char). But because both operands are promoted to `int` first, the addition is `300` — no overflow, no wrap-around. Only when you store the result back into a `char` does truncation happen. The arithmetic itself is always done as `int`.

**Mistake 2: Printing a `char` after arithmetic and expecting a number**

```cpp
#include <iostream>

int main() {
    char c = 'B';
    char incremented = c + 1;  // c promoted to int(66), + 1 = int(67), narrowed back to char
    std::cout << incremented << "\n"; // prints 'C', not 67
    return 0;
}
```

The arithmetic `c + 1` promotes `c` to `int(66)` and adds `1` to get `int(67)`. That result is then narrowed back to `char` for storage in `incremented`. When you pass a `char` to `std::cout`, it prints the character, not the number. If you wanted to print the numeric value `67`, you would store the result in an `int` variable. The trap: the promotion helps during arithmetic but the stored type is still `char`, and `char` prints as a character.

**Mistake 3: Thinking `float + float` gives a `double`**

```cpp
#include <iostream>

int main() {
    float x = 1.1f;
    float y = 2.2f;
    float z = x + y;
    std::cout << z << "\n";   // not a double result; floats stay float here
    return 0;
}
```

`float` is promoted to `double` only when it interacts with a `double`. When both operands are `float`, the promotion to `double` still applies internally (the standard allows either), but the result is converted back to `float` when you store it in a `float`. Practically, `float + float` behaves as `float` arithmetic from the programmer's perspective. The confusion arises when a programmer assumes two floats produce higher-precision output.

## When to use this

You rarely need to think about promotion explicitly — it happens automatically and always safely (no information loss). The main time promotion matters is when you are debugging unexpected results in arithmetic. If you add two `char` values and get a `short` or `int` instead of a `char`, remember that promotion is the reason. Similarly, if you wonder why a `bool` behaves like `0` or `1` in arithmetic, integral promotion explains it. Understanding promotion also prepares you for the next topic: numeric conversions, where the rules stop being loss-free.

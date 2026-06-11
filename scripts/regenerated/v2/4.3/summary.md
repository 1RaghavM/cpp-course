## The idea

When you declare a variable, the compiler must reserve some memory for it. How much? That depends on the type. An `int` needs enough bytes to hold a 32-bit number; a `double` needs enough for a 64-bit floating-point value; a `char` needs only a single byte. Knowing how many bytes a type occupies lets you reason about the limits of what it can store and understand why overflow happens.

The `sizeof` operator answers the question at compile time: given a type or an expression, `sizeof` returns the number of bytes that type or value occupies in memory. The result is a value of type `std::size_t`, which is an unsigned integer type defined in `<cstddef>`. You do not need to include any header to use `sizeof` itself — it is a built-in language feature, not a function.

A key point: `sizeof` is evaluated entirely at compile time. There is no runtime cost. It simply reports a number the compiler already knows.

## How it works

**Basic usage** — pass either a type name in parentheses or a variable directly:

```cpp
#include <iostream>

int main() {
    std::cout << sizeof(int)    << "\n";   // typically 4
    std::cout << sizeof(double) << "\n";   // typically 8
    std::cout << sizeof(char)   << "\n";   // always 1
    std::cout << sizeof(bool)   << "\n";   // typically 1

    int x{0};
    std::cout << sizeof(x) << "\n";        // same as sizeof(int)
    return 0;
}
```

Output on a typical 64-bit platform:
```
4
8
1
1
4
```

`sizeof(char)` is guaranteed to be `1` by the C++ standard — a byte is defined as the size of a `char`. All other sizes are platform-dependent, but the values above are almost universal on modern 64-bit systems.

**The sizes of the fundamental types** follow a partial ordering guaranteed by the standard:

- `sizeof(char)` is always 1
- `sizeof(short)` is at least 2
- `sizeof(int)` is at least 2 (in practice always 4)
- `sizeof(long)` is at least 4 (8 on most 64-bit Linux/macOS; 4 on most Windows)
- `sizeof(long long)` is at least 8
- `sizeof(float)` is typically 4; `sizeof(double)` is typically 8

```cpp
#include <iostream>

int main() {
    std::cout << "short:     " << sizeof(short)     << " bytes\n";
    std::cout << "int:       " << sizeof(int)       << " bytes\n";
    std::cout << "long:      " << sizeof(long)      << " bytes\n";
    std::cout << "long long: " << sizeof(long long) << " bytes\n";
    std::cout << "float:     " << sizeof(float)     << " bytes\n";
    std::cout << "double:    " << sizeof(double)    << " bytes\n";
    return 0;
}
```

Running this on your machine shows the actual sizes your compiler uses. The results may differ between platforms.

**sizeof on an expression** evaluates the type of the expression without actually evaluating the expression itself — so it is always safe:

```cpp
#include <iostream>

int main() {
    int a{5};
    int b{3};
    std::cout << sizeof(a + b) << "\n";   // prints sizeof(int), not 8
    return 0;
}
```

`a + b` produces an `int`, so `sizeof(a + b)` is `sizeof(int)`, typically 4. The addition itself never executes.

## Common mistakes

**Mistake 1: Thinking sizeof returns bits instead of bytes**

```cpp
#include <iostream>

int main() {
    std::cout << sizeof(int) << "\n";   // prints 4, not 32
    return 0;
}
```

`sizeof` measures bytes, not bits. A 4-byte `int` holds 32 bits, but `sizeof(int)` is 4. Multiply by 8 to get the bit count if you need it.

**Mistake 2: Assuming all integer types have the same size**

A common assumption is that `int`, `long`, and `long long` are all 4 bytes. They are not. On 64-bit Linux and macOS, `sizeof(long)` is 8; on 64-bit Windows it is 4. `sizeof(long long)` is 8 on both. Code that mixes up the sizes can silently overflow on one platform while working fine on another.

**Mistake 3: Forgetting that sizeof is a compile-time operator, not a function**

```cpp
std::cout << sizeof int << "\n";   // ERROR on some compilers: needs parentheses for a type
std::cout << sizeof(int) << "\n";  // always correct
```

When the operand is a type name, parentheses are required. When the operand is a variable name, they are optional (`sizeof x` compiles but `sizeof(x)` is safer and clearer).

## When to use this

Use `sizeof` when you need to know the exact byte count of a type or variable — for example, when computing how many values fit in a buffer, when writing binary data to a file in a portable way, or when verifying that a platform provides the integer size your code requires. You will also see `sizeof` used extensively with fixed-width types (lesson "Fixed-width integers and size_t") and with arrays (covered in a later chapter). For everyday arithmetic, you rarely need `sizeof` directly; it becomes important the moment your code must be portable across platforms or must deal with raw memory.

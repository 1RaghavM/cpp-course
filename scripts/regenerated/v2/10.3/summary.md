## The idea

Promotion (lesson 10.2) only moves types *upward* — from a small type to a larger, more capable one — and it always preserves all information. Numeric conversion is the broader category: any implicit conversion between numeric types, including conversions that can lose information. The compiler performs numeric conversions when it needs to fit a value into a type that is different from the value's natural type, regardless of whether that type is larger or smaller.

Think of it like moving files between storage devices. Copying from a 1 GB drive to a 2 TB drive is always safe — all data fits. But copying from a 2 TB drive to a 1 GB drive might silently truncate your data if more than 1 GB is used. Numeric conversion covers both directions. The "safe direction" (smaller to larger, or integer to floating-point) is called a widening conversion. The "risky direction" (larger to smaller, or floating-point to integer) is called a narrowing conversion. This lesson focuses on the rules for both; the lesson on narrowing covers when the compiler specifically diagnoses the dangerous case.

## How it works

**Integer to larger integer**

```cpp
#include <iostream>

int main() {
    short s = 1000;
    int i = s;         // short → int: always safe, value preserved
    long l = i;        // int → long: always safe
    std::cout << i << " " << l << "\n"; // prints 1000 1000
    return 0;
}
```

Any signed integer type converts to a larger signed integer type without changing the value. The same holds for `unsigned` to a larger `unsigned`. These are safe numeric conversions.

**Integer to floating-point**

```cpp
#include <iostream>

int main() {
    int n = 16777217;  // 2^24 + 1
    float f = n;       // int → float: possible precision loss for large ints
    std::cout << f << "\n"; // may print 16777216, not 16777217
    return 0;
}
```

Small integers convert to floating-point exactly. But `float` only has 24 bits of mantissa. An `int` like `16777217` (which requires 25 significant bits) cannot be represented exactly in `float`, so the value is rounded. Converting `int` to `double` is safer because `double` has 53 bits of mantissa, covering all `int` values exactly.

**Floating-point to integer**

```cpp
#include <iostream>

int main() {
    double d = 3.9;
    int i = d;         // double → int: fractional part is TRUNCATED (not rounded)
    std::cout << i << "\n"; // prints 3, not 4
    return 0;
}
```

When a floating-point value is converted to an integer, the fractional part is discarded — this is truncation toward zero, not rounding. `3.9` becomes `3`. `-3.9` becomes `-3`. If the floating-point value is outside the range of the integer type, the result is undefined behavior.

**Larger integer to smaller integer**

```cpp
#include <iostream>

int main() {
    int big = 300;
    char small = big;   // int → char: 300 does not fit in a signed char (-128..127)
    std::cout << (int)small << "\n"; // implementation-defined, often -44 on most platforms
    return 0;
}
```

When a value that does not fit in the smaller type is assigned, the high-order bits are discarded. For unsigned types, this is modular arithmetic (wrap-around). For signed types, the result is implementation-defined (in practice, usually a two's-complement wrap-around, but you should not rely on it).

## Common mistakes

**Mistake 1: Expecting rounding when converting float to int**

```cpp
#include <iostream>

int main() {
    double price = 4.99;
    int cents = price * 100;    // result is 498, not 499
    std::cout << cents << "\n"; // prints 498
    return 0;
}
```

The computation `4.99 * 100` produces `498.99999...` due to floating-point representation error, and truncation then gives `498`. Programmers expect `499`. This trap combines two issues: floating-point imprecision and truncation-on-conversion. The fix (adding `0.5` before truncating, or using `std::round`) is beyond the current lesson, but recognizing the source of the error is the point.

**Mistake 2: Assigning a large `unsigned` to a `signed` type**

```cpp
#include <iostream>

int main() {
    unsigned int u = 4294967295u;  // max 32-bit unsigned
    int s = u;                     // too big for signed int
    std::cout << s << "\n";        // prints -1 on most systems (implementation-defined)
    return 0;
}
```

Unsigned-to-signed conversion for out-of-range values is implementation-defined. On two's-complement hardware (virtually all modern machines), `4294967295u` silently becomes `-1`. This is a common source of subtle bugs in code that mixes `unsigned` loop counters with signed comparisons.

**Mistake 3: Assuming `int` → `float` is always exact**

```cpp
#include <iostream>

int main() {
    int x = 16777216;   // 2^24, exactly representable as float
    int y = 16777217;   // 2^24 + 1, NOT exactly representable as float
    float fx = x;
    float fy = y;
    std::cout << (fx == fy ? "same" : "different") << "\n"; // prints "same"
    return 0;
}
```

Both `x` and `y` convert to the same `float` value because `float` lacks the precision to distinguish them. Any comparison done in `float` space loses this distinction. Use `double` if you need more precision.

## When to use this

Numeric conversions happen implicitly all the time — any time you store a value in a variable of a different type, or pass it to a function with a different parameter type. The safe conversions (widening integer, int-to-double) are fine to rely on. Be cautious with float-to-int (truncation, not rounding) and large-integer-to-small-integer (value loss, wrap-around). When you need more control over how conversions happen, the next lessons on narrowing conversions and explicit casts give you tools to express intent clearly.

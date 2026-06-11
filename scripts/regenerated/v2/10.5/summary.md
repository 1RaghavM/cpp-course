## The idea

When you write an arithmetic expression with two operands of different types — say `3 + 2.5` or `5u - 3` — C++ cannot simply perform the operation in two different types simultaneously. The CPU has separate integer and floating-point units; they cannot cooperate in a single instruction. So the compiler applies a specific set of rules to decide which type both operands should be converted to before the arithmetic happens. These rules are called the **usual arithmetic conversions** (sometimes called arithmetic conversion rules or the common type rules).

Think of it like a recipe that calls for the same measuring unit for all ingredients. If you have 2 cups and 300 milliliters, you must convert one to match the other before you can add them. The recipe specifies a priority order: if any ingredient is measured in metric, convert everything to metric. C++'s arithmetic conversion rules work the same way: there is a type hierarchy, and the rule always converts the lower-ranked type to the higher-ranked one.

Understanding these rules is important because they explain many subtle numeric bugs — particularly the signed/unsigned mismatch trap and the integer division trap with mixed operands.

## How it works

**The type hierarchy**

The compiler applies conversions in this priority order (highest wins):

- `long double` — if either operand is `long double`, convert the other to `long double`
- `double` — if either is `double`, convert the other to `double`
- `float` — if either is `float`, convert the other to `float`
- Otherwise (both are integral types): apply integral promotion, then:
  - `unsigned long long` beats `long long` beats `unsigned long` beats `long` beats `unsigned int` beats `int`

**Floating-point wins over integer**

```cpp
#include <iostream>

int main() {
    int i = 5;
    double d = 2.0;
    // i is converted to double(5.0), then the division is 5.0 / 2.0 = 2.5
    double result = i / d;
    std::cout << result << "\n"; // prints 2.5
    return 0;
}
```

Because one operand is `double`, the other (`int i`) is converted to `double` before the division. The arithmetic happens entirely in double space.

**Unsigned beats signed — the dangerous case**

```cpp
#include <iostream>

int main() {
    unsigned int u = 5;
    int s = -3;
    // s is converted to unsigned int: -3 becomes 4294967293 on 32-bit
    unsigned int result = u + s;
    std::cout << result << "\n"; // prints 4294967298... no, modular: 2
    return 0;
}
```

When `unsigned int` and `int` meet in an expression, the `int` is converted to `unsigned int`. The value `-3` in `unsigned int` is `4294967293` (modular arithmetic). So `5 + 4294967293 = 4294967298`, which wraps to `2` modulo 2^32. This is not 2 by arithmetic — it is 2 by coincidence of modular arithmetic. The compiler may or may not warn about this.

**Both integers: result type depends on the larger type**

```cpp
#include <iostream>

int main() {
    short a = 100;
    int b = 200;
    // short is promoted to int first (integral promotion), then int + int = int
    int sum = a + b;
    std::cout << sum << "\n"; // prints 300
    return 0;
}
```

Both `a` and `b` are integral types. `short` is integrally promoted to `int`, then `int + int` gives `int`. The result is always at least `int`-sized.

## Common mistakes

**Mistake 1: Expecting integer division when one operand is unsigned**

```cpp
#include <iostream>

int main() {
    unsigned int total = 10;
    int count = 4;
    // count is converted to unsigned int; result is unsigned int 2
    // the division is still integer division — no floating-point involved
    double avg = total / count;   // integer division first, then int->double
    std::cout << avg << "\n"; // prints 2, not 2.5
    return 0;
}
```

Mixing `unsigned int` and `int` produces `unsigned int` arithmetic, not floating-point. The division `10u / 4` is integer division giving `2` as an `unsigned int`, and only then is `2` converted to `double 2.0`. The floating-point conversion happens too late.

**Mistake 2: Comparing a signed and unsigned value**

```cpp
#include <iostream>

int main() {
    unsigned int size = 5;
    int offset = -1;
    // offset (-1) is converted to unsigned: very large number
    if (offset < size) {          // comparing as unsigned: large_number < 5 is FALSE
        std::cout << "offset is smaller\n";
    } else {
        std::cout << "wrong branch\n"; // this prints
    }
    return 0;
}
```

The comparison `offset < size` converts `offset` to `unsigned int` because `size` is `unsigned int`. The value `-1` becomes `4294967295`, which is not less than `5`. The comparison produces the wrong result. Compilers usually warn about signed/unsigned comparison; treat those warnings as errors.

**Mistake 3: `float` arithmetic on an `int` expression**

```cpp
#include <iostream>

int main() {
    int x = 7;
    int y = 2;
    float ratio = x / y;       // x / y is int division (3), then 3 -> float 3.0
    std::cout << ratio << "\n"; // prints 3
    return 0;
}
```

Both `x` and `y` are `int`. There is no `float` in the expression, so the division is integer division. Assigning the result to `float` does not change when the conversion happens.

## When to use this

Arithmetic conversions happen inside every binary expression with mixed types. The rule of thumb: if you have a `double` in the expression, everything else converts to `double`. If you only have integers, the widest type wins, with unsigned beating signed at the same width. When mixing signed and unsigned integers in comparisons or arithmetic, prefer to make both types match explicitly — either by changing the variable declarations or by using an explicit cast. The signed/unsigned mismatch is the most dangerous case and the one that most often produces silent wrong results in real programs.

## The idea

Two arithmetic operations that often trip up beginners are the **remainder** (or modulo) operator `%` and the absence of a built-in **exponentiation** operator in C++. The remainder operator gives you what is left over after integer division. Exponentiation — raising a number to a power — is not an operator in C++; instead you call the `std::pow` function from `<cmath>`.

Think of `%` as the "leftover" from long division. When you divide a pie into equal slices, the remainder is the number of slices that could not form a complete serving. If you have 17 cookies and want to share them equally among 5 people, each person gets 3 cookies (`17 / 5 = 3`) and you have 2 cookies left (`17 % 5 = 2`). This leftover property makes `%` extremely useful for checking divisibility, wrapping values around a range, and extracting individual digits.

Exponentiation is rarer in day-to-day code, but when you need it, `std::pow(base, exp)` from `<cmath>` returns a `double`. For small integer exponents, manual multiplication is often clearer and avoids floating-point rounding.

## How it works

**Example 1: Basic remainder and divisibility**

```cpp
#include <iostream>

int main()
{
    std::cout << 17 % 5 << '\n';  // 2
    std::cout << 20 % 5 << '\n';  // 0  (exactly divisible)
    std::cout << 3  % 7 << '\n';  // 3  (quotient is 0, remainder is 3)
    return 0;
}
```

A remainder of `0` means the left operand is evenly divisible by the right. This is how you test whether a number is even (`n % 2 == 0`) or a multiple of something.

**Example 2: Remainder with negative numbers**

In C++, the result of `%` carries the sign of the **left operand** (the dividend). This can surprise programmers who expect a non-negative result.

```cpp
#include <iostream>

int main()
{
    std::cout << -7 % 3  << '\n'; // -1  (not 2!)
    std::cout <<  7 % -3 << '\n'; // 1   (sign follows left operand)
    return 0;
}
```

The identity `(a / b) * b + (a % b) == a` always holds (for non-zero `b`). You can verify: `(-7 / 3) * 3 + (-7 % 3)` = `(-2) * 3 + (-1)` = `-6 + (-1)` = `-7`. If you need a true mathematical modulo (always non-negative), add the divisor when the result is negative: `((n % m) + m) % m`.

**Example 3: Using std::pow for exponentiation**

```cpp
#include <iostream>
#include <cmath>

int main()
{
    double result = std::pow(2.0, 10.0);  // 2^10 = 1024
    std::cout << result << '\n';           // 1024

    // For small integer powers, manual multiplication avoids floating-point issues
    int base = 3;
    int cube = base * base * base;
    std::cout << cube << '\n';  // 27
    return 0;
}
```

`std::pow` always returns `double`. For integer results, cast with `static_cast<int>(std::pow(base, exp))`, but beware: floating-point rounding can make `std::pow(2, 10)` return `1023.9999...` on some platforms. For small integer powers used in calculations, manual multiplication is safer.

## Common mistakes

**Mistake 1: Using `%` with floating-point operands**

The `%` operator only works with integer types. Applying it to `double` is a compile error:

```cpp
double x = 5.5;
double y = 2.0;
// double r = x % y;  // compile error: invalid operands to binary %
```

For floating-point remainder, use `std::fmod(x, y)` from `<cmath>`.

**Mistake 2: Assuming % always gives a positive result**

A very common mistake when working with negative numbers:

```cpp
int n = -9;
bool isEven = (n % 2 == 0);   // correct: -9 % 2 is -1, so isEven is false
int wrapped = n % 10;          // -9 % 10 is -9, not 1
```

If you need to wrap a value into a non-negative range `[0, m)`, use `((n % m) + m) % m` rather than `n % m` directly.

**Mistake 3: Treating std::pow as exact for integer arguments**

`std::pow` uses floating-point arithmetic internally, so results for integer arguments may be slightly off:

```cpp
#include <cmath>
int x = static_cast<int>(std::pow(10, 3));  // might be 999 on some platforms
```

For integer powers that must be exact, write your own loop or use repeated multiplication for small exponents. The `<cmath>` function is fine for approximate calculations or when the result will stay as `double`.

## When to use this

Use `%` whenever you need to check divisibility, cycle through a fixed range (like clock hours wrapping around 12), extract the last digit of a number, or alternate between two behaviors every N steps. It is one of the most frequently used operators in competitive programming and daily algorithms.

Reach for `std::pow` when you need a general floating-point power — scientific computing, graphics math, financial calculations. For small, fixed integer exponents (squaring, cubing) prefer direct multiplication to stay in integer arithmetic and avoid rounding surprises. Earlier in this chapter you learned that integer division truncates; `%` is its complement, and together they fully describe integer division in C++.

## The idea

Arithmetic operators perform mathematical calculations on numbers. C++ has five binary arithmetic operators — addition (`+`), subtraction (`-`), multiplication (`*`), division (`/`), and remainder (`%`) — plus two unary operators, unary plus (`+x`) and unary minus (`-x`). They look exactly like pencil-and-paper math, but there are a few C++-specific rules that catch beginners off guard, especially **integer division** and the behavior of the unary operators.

The central thing to understand is that the type of the operands determines the type and rounding behavior of the result. Two `int` operands always produce an `int` result — even if you are dividing. Two `double` operands always produce a `double` result, which keeps fractional parts. Mixing an `int` and a `double` triggers an implicit conversion before the operation.

## How it works

**Example 1: Basic binary arithmetic**

```cpp
#include <iostream>

int main()
{
    int a = 17;
    int b = 5;

    std::cout << a + b << '\n';  // 22
    std::cout << a - b << '\n';  // 12
    std::cout << a * b << '\n';  // 85
    std::cout << a / b << '\n';  // 3  (integer division — truncates toward zero)
    std::cout << a % b << '\n';  // 2  (remainder)
    return 0;
}
```

Integer division truncates toward zero: `17 / 5` is `3`, not `3.4`. The leftover `2` is exactly what `%` gives you. Together, `/` and `%` satisfy the identity `(a / b) * b + (a % b) == a` whenever `b != 0`.

**Example 2: Floating-point division keeps the fraction**

```cpp
#include <iostream>

int main()
{
    double x = 17.0;
    double y = 5.0;
    std::cout << x / y << '\n';  // 3.4

    // Mixing int and double: int is converted to double first
    int n = 17;
    std::cout << n / y << '\n';  // 3.4  (n promoted to double)
    std::cout << n / 5  << '\n'; // 3    (both int → integer division)
    return 0;
}
```

When one operand is `double` and the other is `int`, the `int` is implicitly widened to `double` before the operation, so the result is `double`.

**Example 3: Unary minus and compound assignment**

The unary minus operator negates a value without modifying the original variable. C++ also provides compound assignment operators (`+=`, `-=`, `*=`, `/=`) that combine an arithmetic operation with assignment.

```cpp
#include <iostream>

int main()
{
    int x = 10;
    int y = -x;     // y is -10; x is still 10
    x += 3;         // x = x + 3; x is now 13
    x *= 2;         // x = x * 2; x is now 26
    std::cout << x << ' ' << y << '\n';  // 26 -10
    return 0;
}
```

Compound assignment is shorthand — `x += 3` means exactly `x = x + 3`. It never changes the type of `x`.

## Common mistakes

**Mistake 1: Integer division silently truncates**

This is the most common arithmetic mistake in C++. Beginners expect `7 / 2` to be `3.5` because that is what a calculator gives. In C++, when both operands are `int`, the result is `int` and the fraction is thrown away:

```cpp
int a = 7;
int b = 2;
int c = a / b;  // c is 3, not 3.5
```

If you need a fractional result, cast at least one operand to `double`: `static_cast<double>(a) / b` gives `3.5`. You learned `static_cast` in chapter 4, so this is the right tool here.

**Mistake 2: Dividing by zero**

Division by zero is undefined behavior for integers and produces a special `inf` or `nan` value for floating-point. The program may crash, produce garbage, or behave unpredictably:

```cpp
int x = 5;
int y = 0;
int z = x / y;  // undefined behavior — do not do this
```

Always check that a divisor is non-zero before dividing. In this chapter you already know `if`, so guarding with `if (y != 0)` is the right approach.

**Mistake 3: Overflow in intermediate results**

`int` is typically 32 bits. Multiplying two large `int` values can overflow before the result is stored, even if the final answer would fit. For example, `100000 * 100000` overflows a 32-bit `int` (max ~2.1 billion):

```cpp
int big = 100000 * 100000;  // overflow: undefined behavior
```

For large calculations, use `long long` (introduced in chapter 4) or perform the arithmetic in `double` first.

## When to use this

Binary arithmetic operators appear in almost every non-trivial program. Integer division and `%` are especially useful for extracting digits, checking divisibility, and doing modular arithmetic. Floating-point arithmetic is for physics, geometry, statistics, and any domain where fractional values matter.

Compound assignment (`+=`, `-=`, `*=`, `/=`) is the idiomatic way to update a variable in place; prefer it over the longer form `x = x + n`. When you are uncertain whether a division result needs to be exact, ask yourself whether both operands are integer types — if they are, you are doing integer division.

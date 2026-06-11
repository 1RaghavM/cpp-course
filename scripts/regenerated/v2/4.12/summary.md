## The idea

Every value in C++ has a type. When your code mixes values of different types — say, dividing an `int` by another `int`, or passing a `double` to a function that expects `float` — C++ has to decide what to do with the mismatch. Sometimes it converts one type to another automatically; other times it refuses. Understanding these conversions is critical to writing correct programs, because silent automatic conversions can quietly destroy precision or wrap values in ways you never intended.

There are two kinds of conversion:

- **Implicit conversion** — the compiler performs it automatically, without any syntax from you. Sometimes this is fine; sometimes it loses data.
- **Explicit conversion** — you write `static_cast<target_type>(expression)` to tell the compiler "I know the types differ; convert it this way on purpose."

`static_cast` is the C++ way to say "I am aware of this conversion and I take responsibility for it." It turns a potential bug into a deliberate choice.

## How it works

**Implicit numeric promotions (safe widening)**

When you use a smaller type in an expression expecting a larger type, C++ widens it automatically. This is always safe — no data is lost:

```cpp
#include <iostream>

int main()
{
    int   count { 3 };
    double ratio { count };   // int -> double: no data loss

    std::cout << ratio << '\n';  // prints 3
    return 0;
}
```

`int` promotes to `double` because `double` can represent every integer in the `int` range exactly. The general rule: smaller types promote to larger ones, integers promote to floating-point.

**Implicit narrowing conversions (dangerous)**

Going the other direction — from a larger or more precise type to a smaller one — can silently lose data:

```cpp
#include <iostream>

int main()
{
    double pi    { 3.14159 };
    int    approx { pi };     // narrowing: fractional part is truncated, no error

    std::cout << approx << '\n';  // prints 3, NOT 3.14159
    return 0;
}
```

The fractional part is silently discarded. With brace initialization (`{}`), the compiler usually rejects narrowing conversions. With direct initialization (`= pi` or `int approx(pi)`), it often accepts them silently. This is why brace initialization is preferred — it catches narrowing at compile time.

**Integer arithmetic and integer division**

One of the most common implicit-conversion surprises: dividing two integers gives an integer result, not a decimal:

```cpp
int numerator   { 7 };
int denominator { 2 };
double result   { numerator / denominator };  // integer division first!
// result is 3.0, NOT 3.5
```

The division happens between two `int` values before the result is stored in `double`. To get floating-point division, at least one operand must be a `double` at the time of division.

**static_cast: explicit conversions**

`static_cast<target_type>(expression)` converts `expression` to `target_type` explicitly. It is safer than C-style casts `(int)x` because it is checked at compile time and it documents intent clearly:

```cpp
#include <iostream>

int main()
{
    int   numerator   { 7 };
    int   denominator { 2 };
    double result { static_cast<double>(numerator) / denominator };  // 3.5

    char  letter { 'a' };
    int   code   { static_cast<int>(letter) };     // 97
    char  back   { static_cast<char>(code + 1) };  // 'b'

    std::cout << result << '\n';  // 3.5
    std::cout << code   << '\n';  // 97
    std::cout << back   << '\n';  // b
    return 0;
}
```

Casting only one operand to `double` is enough to promote the whole division to floating-point. The other operand is implicitly promoted too.

**static_cast with bool**

You can cast between `bool` and integers explicitly. Any non-zero integer is `true`; zero is `false`. Going back, `true` → 1 and `false` → 0:

```cpp
bool flag    { true };
int  asInt   { static_cast<int>(flag) };      // 1
bool fromInt { static_cast<bool>(42) };       // true
std::cout << asInt << '\n';                   // 1
```

## Common mistakes

**Mistake 1: Integer division when floating-point is expected**

```cpp
double average { (4 + 5) / 2 };   // prints 4, not 4.5
```

Both operands are `int` literals. The division happens in integer arithmetic before the result is widened to `double`. Fix: `static_cast<double>(4 + 5) / 2` or use at least one floating-point literal: `(4 + 5) / 2.0`.

**Mistake 2: Relying on implicit narrowing and losing data**

```cpp
int truncated { 3.9 };   // compiles (direct init), truncates to 3
```

If you used brace initialization `int truncated { 3.9 }`, the compiler would reject it. Direct initialization silently discards the fractional part. Use `static_cast<int>(3.9)` when truncation is intentional, so readers know you mean it.

**Mistake 3: Thinking static_cast rounds instead of truncates**

```cpp
double d { 3.9 };
int i { static_cast<int>(d) };  // i is 3, not 4
```

`static_cast<int>` truncates toward zero — it does not round. `3.9` becomes `3`, `-3.9` becomes `-3`. If you want rounding, you need to add 0.5 before casting (using `d + 0.5`) but that is a manual workaround, not automatic rounding.

## When to use this

Use `static_cast` whenever you intentionally cross a type boundary and need the conversion to be visible to reviewers. The most common cases: forcing floating-point division from integer operands, converting `char` to `int` to get the ASCII value, and converting `bool` to `int` to count true values. Also use it when storing a `double` calculation result into an `int` — the cast signals that you know truncation is happening.

Prefer brace initialization throughout your programs because it catches dangerous narrowing before you even run your code. When the compiler rejects a narrowing conversion, that is not an inconvenience — it is the compiler saving you from a silent data-loss bug. These principles connect directly to the signed/unsigned types covered earlier ("Signed integers", "Unsigned integers, and why to avoid them") and the floating-point precision issues from "Floating point numbers."

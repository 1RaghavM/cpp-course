## The idea

In the previous lesson, `auto` let the compiler deduce the type of a local variable from its initializer. The same idea extends to functions: instead of writing the return type explicitly, you can write `auto` as the return type and let the compiler deduce it from whatever expression the function actually returns. When all return statements in a function return the same type, the compiler knows what that type is, and you do not need to spell it out.

This is called return-type deduction. It keeps function signatures cleaner when the return type is obvious from the function body, and it means you do not have to update the return type in the signature every time you change the expression you are returning. The trade-off is that callers can no longer see the return type in the function declaration without looking at the body.

## How it works

To use return-type deduction, write `auto` where the return type would normally go:

```cpp
auto add(int a, int b)
{
    return a + b;  // compiler deduces int
}
```

The compiler looks at the `return` expression `a + b`. Both `a` and `b` are `int`, so `a + b` is `int`, so the function's return type is deduced as `int`.

**Example 1 — deduction from arithmetic**

```cpp
#include <iostream>

auto square(double x)
{
    return x * x;  // deduced: double
}

int main()
{
    auto result { square(4.0) };
    std::cout << result << '\n';  // prints 16
    return 0;
}
```

`x * x` where `x` is `double` gives `double`. `result` is then deduced as `double` too.

**Example 2 — multiple return statements must agree**

```cpp
#include <iostream>

auto sign(int n)
{
    if (n > 0) return  1;
    if (n < 0) return -1;
    return 0;
}

int main()
{
    std::cout << sign(5) << ' ' << sign(-3) << ' ' << sign(0) << '\n';
    return 0;
}
```

All three `return` statements return an `int` literal, so the deduced return type is `int`. If the return expressions had different types, the program would not compile — the compiler cannot deduce a single type from conflicting returns.

**Example 3 — returning a function of another function**

```cpp
#include <iostream>

auto double_it(int x)
{
    return x * 2;
}

auto quad(int x)
{
    return double_it(x) * 2;  // deduced: int
}

int main()
{
    std::cout << quad(3) << '\n';  // prints 12
    return 0;
}
```

`double_it` returns `int`, so `double_it(x) * 2` is `int`, and `quad` is also deduced as `int`.

One important rule: when you use return-type deduction, the function definition must be visible before the function is called. Forward declarations without a body (just the signature) cannot use `auto` return type because the compiler has no body to deduce from at that point.

## Common mistakes

**Mistake 1 — conflicting return types prevent deduction**

```cpp
auto value(bool flag)
{
    if (flag) return 1;     // int
    return 1.5;             // double — different type, compile error
}
```

The compiler cannot deduce a single return type when different `return` statements evaluate to different types. The fix is either to make all returns the same type (`return 1.0;`) or to specify the return type explicitly.

**Mistake 2 — using a forward declaration with `auto` return type**

```cpp
auto add(int a, int b);  // forward declaration — error in some contexts

int main()
{
    std::cout << add(2, 3) << '\n';  // compiler doesn't know return type
    return 0;
}

auto add(int a, int b) { return a + b; }
```

When the definition comes after the call site, and you rely on return-type deduction, the compiler has not seen the body yet and cannot deduce the type. The function definition must precede its callers, or you must use an explicit return type in the declaration.

**Mistake 3 — expecting `auto` to deduce a different type than the literal implies**

```cpp
auto half(int x)
{
    return x / 2;   // deduced: int, not double
}
```

`x / 2` is integer division because `x` is `int` and `2` is an `int` literal. The deduced return type is `int`. To return a floating-point half, write `return x / 2.0;` or `return static_cast<double>(x) / 2;`.

## When to use this

Return-type deduction is a good fit for short helper functions where the return type is obvious from reading the one-line body. It removes a maintenance burden when refactoring — changing the expression in the `return` statement automatically updates the function's type. Prefer explicit return types for public functions (especially in header files), for functions with multiple return paths where the type is not obvious at a glance, and wherever the caller needs to know the return type from the signature alone without reading the body. Used with good judgment, `auto` return types reduce repetition without sacrificing readability.

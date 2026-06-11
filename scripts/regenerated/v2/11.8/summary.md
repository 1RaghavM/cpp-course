## The idea

The function templates you have written so far use a single type parameter `T`. That means every argument that uses `T` must be the same type — you cannot, for example, write `add(3, 4.5)` when `add` expects two `T`s, because `3` is `int` and `4.5` is `double`. This single-type restriction is intentional and useful, but it does not fit every problem.

Sometimes you genuinely need two arguments of potentially different types: a function that adds an `int` and a `double`, or one that prints a key-value pair where the key is a string and the value is a number. Multiple template type parameters let you declare a separate placeholder for each distinct type. The compiler deduces each one independently from the corresponding argument.

## How it works

Adding a second type parameter is as simple as listing it in the template parameter list, separated by a comma:

```cpp
#include <iostream>

template <typename T, typename U>
void printPair(T first, U second)
{
    std::cout << first << " : " << second << '\n';
}

int main()
{
    printPair(42, 3.14);         // T=int, U=double
    printPair("hello", true);    // T=const char*, U=bool
    printPair('A', 65);          // T=char, U=int
    return 0;
}
```

Output:
```
42 : 3.14
hello : 1
A : 65
```

`T` and `U` are deduced independently: `printPair(42, 3.14)` sets `T=int` and `U=double` in one instantiation. There is no requirement that `T` and `U` be different types — `printPair(1, 2)` sets both to `int`, which is perfectly valid.

The real power shows up when you need arithmetic between two differently-typed values. But there is a catch: what should the return type be? If `T` is `int` and `U` is `double`, the return is `double` (the common type). The cleanest modern solution is to let the compiler figure out the return type using `auto`:

```cpp
#include <iostream>

template <typename T, typename U>
auto add(T a, U b)
{
    return a + b;
}

int main()
{
    std::cout << add(3, 4.5) << '\n';    // int + double → double: 7.5
    std::cout << add(2, 3) << '\n';      // int + int   → int:    5
    std::cout << add(1.5, 2.5) << '\n';  // double + double → double: 4
    return 0;
}
```

The `auto` return type tells the compiler to deduce the return type from the `return` expression, which here is `a + b`. Since C++ already knows the rules for what `int + double` produces (a `double`), `auto` gives you exactly the right type without you having to name it.

A slightly more complete example shows how `T` and `U` can be used together in a more interesting way:

```cpp
#include <iostream>

template <typename T, typename U>
auto scale(T value, U factor)
{
    return value * factor;
}

int main()
{
    int    pixels = 100;
    double zoom   = 1.5;
    std::cout << scale(pixels, zoom) << '\n';   // 150
    std::cout << scale(7, 3) << '\n';           // 21
    return 0;
}
```

`scale(pixels, zoom)` instantiates with `T=int, U=double`. The product `int * double` is `double`, and `auto` picks that up, so the function returns `150.0` which prints as `150`.

## Common mistakes

**1. Forgetting that `T` and `U` are independent but still must support the operation.**

Multiple type parameters do not magically make any combination valid. If you write `return a + b` and pass types that have no `+` operator together, the compiler will fail at instantiation:

```cpp
template <typename T, typename U>
auto combine(T a, U b) { return a + b; }

combine("hello", 5);  // error: can't add const char* and int
```

The error message will point at the instantiation, not the template definition — a common source of confusion. Always verify that the operations in your template body are valid for the types you intend to use.

**2. Shadowing a type parameter with the same name.**

If you name your parameters `T` and `T` (a typo) or accidentally reuse a name, the compiler will error or produce surprising behaviour. Pick distinct names — `T` and `U`, or descriptive names like `Key` and `Val`.

**3. Expecting `auto` return type to always give you what you want.**

`auto` deduces based on the `return` expression. If your function has branching with returns of different types, it can fail to compile:

```cpp
template <typename T, typename U>
auto ambiguous(T a, U b)
{
    if (a > 0) return a;   // deduces T
    return b;              // deduces U — conflict if T != U
}
```

This compiles only when `T` and `U` are the same type. For a function with multiple return paths of different types, use `decltype` or a common type — topics covered in later lessons.

## When to use this

Reach for multiple type parameters when a function genuinely operates on two independent types and forcing them to be the same would be an unnatural restriction — `add(int, double)`, `printPair(string, int)`, and `scale(value, factor)` are all good candidates. The `auto` return type pairs naturally with this pattern when the return type depends on an arithmetic expression involving both parameters.

When you only need one logical type — for instance, swapping two values must swap two things of the same type — stick to a single `T`. Using two type parameters where one suffices makes the template harder to reason about and can hide type-mismatch bugs.

## The idea

Writing `Pair<int> p{ 1, 2 };` feels redundant. The `1` and the `2` are obviously `int`s — the compiler can see that as well as you can. Spelling out `<int>` is the kind of bookkeeping a tool ought to handle.

Class template argument deduction, usually called CTAD, is exactly that tool. From C++17 onwards, when you construct an object from a class template without supplying the angle-bracket arguments, the compiler tries to figure them out from the initializer. If the deduction succeeds, you get to write `Pair p{ 1, 2 };` and the compiler treats it as if you had written `Pair<int> p{ 1, 2 };`. If the deduction fails, you get an error and have to spell the arguments out yourself.

CTAD is purely a convenience. The underlying mechanism is identical to writing the type explicitly: the compiler picks a type for `T`, instantiates the template, and constructs the object. The difference is only in what you have to type.

There is one subtlety. The default deduction rules look at constructors to figure out what `T` should be. Aggregates — plain structs with public members and no constructors — do not have explicit constructors, so the compiler needs an extra hint, called a deduction guide, to know how to map initializer arguments onto template parameters. For most C++17 aggregates the standard provides automatic guides, and from C++20 onwards the compiler synthesises them for you in many cases. When the automatic version is not enough, you write a deduction guide yourself.

## How it works

The simplest CTAD case is an aggregate with one template parameter. From C++20 onwards this just works:

```cpp
#include <iostream>

template <typename T>
struct Pair
{
    T first;
    T second;
};

int main()
{
    Pair p{ 3, 4 };
    std::cout << p.first + p.second << '\n';
    return 0;
}
```

No angle brackets after `Pair`. The compiler sees that both initializers are `int`, deduces `T = int`, and constructs a `Pair<int>`. The output is `7`. If you had written `Pair p{ 3, 4.5 };` the deduction would fail with a "couldn't deduce template argument for 'T'" error, because the two members would need different types.

For templates with two parameters, the same rule applies — one parameter per member, deduced from the matching initializer:

```cpp
#include <iostream>

template <typename T, typename U>
struct Tagged
{
    T value;
    U tag;
};

int main()
{
    Tagged e{ 42, 'X' };
    std::cout << e.tag << ' ' << e.value << '\n';
    return 0;
}
```

`T` is deduced as `int` from `42`, `U` is deduced as `char` from `'X'`, and the output is `X 42`.

When the automatic deduction is not what you want — for example, you want a literal `0` to be treated as `long` instead of `int`, or you have a template where the relationship between parameters and members is non-obvious — you can supply a user-defined deduction guide. The syntax sits just after the class template definition:

```cpp
#include <iostream>

template <typename T>
struct Holder { T value; };

// Deduction guide: when constructed from any integer-typed argument, use long.
Holder(int) -> Holder<long>;

int main()
{
    Holder h{ 5 };
    std::cout << sizeof(h.value) << '\n';
    return 0;
}
```

The guide reads: "when you see `Holder` constructed from an `int`, deduce `T` as `long`". `h.value` is therefore a `long`, and `sizeof(h.value)` prints whatever a `long` is on this platform (often `8`). Guides are not constructors — they exist only to tell the compiler what type to substitute for `T`.

## Common mistakes

The first mistake is assuming CTAD works without any constructor or guide. In older C++17 code without automatic aggregate deduction, this fails:

```cpp
template <typename T>
struct Pair { T first; T second; };

Pair p{ 1, 2 };
```

Compiling with `-std=c++14` or some pre-C++20 modes produces `class template argument deduction failed`. The fix is either to compile with C++20 or to add a deduction guide like `template<typename T> Pair(T, T) -> Pair<T>;`. Most beginner code targets C++20 or later, so the issue mostly arises when projects are stuck on an older standard.

The second mistake is supplying initializers that drive deduction in two different directions:

```cpp
Pair p{ 1, 2.5 };
```

The compiler sees `T` should be `int` from the first argument and `double` from the second, has no rule to reconcile them, and reports a deduction failure. The fix is either to convert the arguments to the same type before constructing, or to spell out `Pair<double> p{ 1, 2.5 };` so the second member triggers a conversion from `int` to `double`.

The third mistake is expecting CTAD on a constructor that throws away the template parameter. If a struct wraps `T` but the constructor takes `int` regardless of `T`, the compiler has nothing in the call to base its deduction on. A user-written deduction guide is the only way out.

## When to use this

Use CTAD whenever it shortens code without making it less clear. `Pair p{ 1, 2 }` is a clean improvement over `Pair<int> p{ 1, 2 }`. Spell the arguments out whenever the deduction is genuinely ambiguous, when the deduced type would surprise a reader, or when you specifically want a different type than the literals would suggest (for example, `Pair<double> p{ 1, 2 }` to force floating-point arithmetic later). The next lesson, 13.15, introduces alias templates — another tool for trimming template syntax — and the two work well together.

## The idea

Suppose you want to write a function that returns the larger of two integers. Easy enough. Then you want the same function for `double`. And then for `char`. You end up copy-pasting the same logic three times and maintaining three nearly identical functions that differ only in type names. Function templates solve this by letting you write the logic once and tell the compiler to stamp out a version for whatever type is needed.

A function template is a blueprint, not a real function. It says: "for some type `T`, here is how this function works." The compiler reads the blueprint and generates actual functions from it on demand — one per concrete type the template is used with. This process is called instantiation, and it happens at compile time, so there is no runtime overhead.

## How it works

The simplest template declares a type parameter using the `template` keyword followed by the parameter list in angle brackets:

```cpp
#include <iostream>

template <typename T>
T maximum(T a, T b)
{
    return (a > b) ? a : b;
}

int main()
{
    std::cout << maximum(3, 7) << '\n';      // T=int
    std::cout << maximum(3.14, 2.72) << '\n'; // T=double
    std::cout << maximum('x', 'a') << '\n';   // T=char
    return 0;
}
```

Output:
```
7
3.14
x
```

`typename T` introduces `T` as a placeholder for any type. When the compiler sees `maximum(3, 7)`, it deduces `T=int` and generates `int maximum(int a, int b)`. When it sees `maximum(3.14, 2.72)`, it generates `double maximum(double a, double b)`. You write one template; the compiler generates as many overloads as are needed.

You can also use the keyword `class` instead of `typename` — they are completely interchangeable for template type parameters. `typename` is preferred in modern C++ because it does not imply the type must be a class.

Sometimes the compiler cannot deduce `T` automatically — for example when the return type is the template parameter but no argument carries that type. In those cases you provide the type explicitly with angle brackets:

```cpp
template <typename T>
T zero()
{
    return T{};
}

int main()
{
    int  i = zero<int>();     // must specify T explicitly
    double d = zero<double>();
    return 0;
}
```

Here `zero()` takes no arguments, so the compiler has nothing to deduce `T` from. Writing `zero<int>()` tells it to instantiate with `T=int`.

A slightly more realistic example: a generic `clamp` function that restricts a value to a range:

```cpp
#include <iostream>

template <typename T>
T clamp(T value, T lo, T hi)
{
    if (value < lo) return lo;
    if (value > hi) return hi;
    return value;
}

int main()
{
    std::cout << clamp(15, 0, 10) << '\n';     // 10  (clamped down)
    std::cout << clamp(-3, 0, 10) << '\n';     //  0  (clamped up)
    std::cout << clamp(5, 0, 10) << '\n';      //  5  (in range)
    std::cout << clamp(3.5, 1.0, 3.0) << '\n'; //  3  (clamped down)
    return 0;
}
```

The same `clamp` template works for `int` and `double` because both support `<` and `>`.

## Common mistakes

**1. Mixing types across arguments when the compiler expects them to all match.**

Because all three arguments to `clamp` above are `T`, every argument must be the same type. Mixing `int` and `double` silently causes an "ambiguous deduction" error:

```cpp
clamp(5, 0, 10.0);   // error: T could be int or double — ambiguous
```

The compiler cannot settle on one `T` because `5` and `0` suggest `int` but `10.0` suggests `double`. Fix it by making all arguments the same type: `clamp(5.0, 0.0, 10.0)` or `clamp(5, 0, 10)`.

**2. Forgetting that the template is just a blueprint until it is used.**

A template with a type error compiles fine as long as it is never instantiated. This can mislead you into thinking your code is correct:

```cpp
template <typename T>
T broken(T x)
{
    return x.nonexistentMethod();   // only errors when T lacks this method
}

int main()
{
    // No call here → no instantiation → no compile error!
    return 0;
}
```

Once you add `broken(42)`, the compiler generates `int broken(int)` and discovers that `int` has no `nonexistentMethod()` — now it fails. Always test templates with the types you intend to use.

**3. Trying to use `T` in a way the template does not guarantee.**

A function template imposes an implicit contract: the type `T` must support every operation the template body uses. If you write `a + b` inside a template and someone passes a type that has no `+` operator, the resulting error message can be long and confusing. The fix is to be clear in your own documentation (and eventually concepts) about what `T` must support.

## When to use this

Use function templates when you have a function whose logic is identical for multiple types and the only difference between the overloads would be the type names. `maximum`, `minimum`, `swap`, `clamp`, and absolute-value functions are textbook examples. Templates replace manual overloads and keep your code DRY.

Avoid templates when the logic genuinely differs per type — for example, printing a `double` might need different formatting than printing an `int`. In those cases write separate overloads rather than forcing one template to handle both. Templates also make compiler errors harder to read, so prefer plain overloads in code that beginners maintain.

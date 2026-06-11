## The idea

Most template parameters stand in for a *type* — you write `template <typename T>` and T can be `int`, `double`, or anything else. But sometimes what you want to vary at compile time is not a type but a *value*: the size of a fixed buffer, the base of a number system, a compile-time flag. Non-type template parameters let you express exactly this. Instead of computing a value at runtime and passing it to a function, you bake it directly into the template so the compiler can use it to reason about, and specialise, your code before the program ever runs.

Think of it like a cookie cutter that has its dimensions stamped into the metal. Every cookie it stamps out has the same dimensions, but if you want a different size you reach for a different cutter — a different *instantiation*.

## How it works

A non-type template parameter is declared just like a type parameter, but instead of `typename T` you write a concrete type followed by a name:

```cpp
#include <iostream>

template <int N>
void printNTimes(const char* msg) {
    for (int i = 0; i < N; ++i)
        std::cout << msg << '\n';
}

int main() {
    printNTimes<3>("hello");   // prints "hello" three times
    printNTimes<1>("world");   // prints "world" once
}
```

Each call with a distinct value of `N` causes the compiler to generate a separate function. `printNTimes<3>` and `printNTimes<1>` are two different functions; `N` is a compile-time constant inside each one.

The value passed to a non-type parameter must itself be a compile-time constant — a literal, a `constexpr` variable, or another template parameter. It cannot be a runtime variable:

```cpp
#include <iostream>

template <int Base>
int toBase(int value) {
    // convert `value` from base 10 to `Base`; simplified demo
    int result = 0, place = 1;
    while (value > 0) {
        result += (value % Base) * place;
        value  /= Base;
        place  *= 10;
    }
    return result;
}

int main() {
    std::cout << toBase<2>(10) << '\n';   // 1010 (binary representation as decimal digits)
    std::cout << toBase<8>(255) << '\n';  // 377 (octal)
}
```

Here `Base` is locked in at each call site. Changing the base is free at compile time; no conditional logic is needed at runtime.

Non-type parameters can also mix with type parameters in the same template:

```cpp
#include <iostream>

template <typename T, int N>
T clamp(T value) {
    if (value < -N) return static_cast<T>(-N);
    if (value >  N) return static_cast<T>(N);
    return value;
}

int main() {
    std::cout << clamp<int, 10>(25)    << '\n';  // 10
    std::cout << clamp<double, 5>(3.7) << '\n';  // 3.7
    std::cout << clamp<int, 100>(-200) << '\n';  // -100
}
```

`T` is a type parameter; `N` is a non-type parameter. Both are resolved at compile time.

## Common mistakes

**Passing a runtime value where a compile-time constant is required.** Non-type template arguments must be compile-time constants. If you try to pass a regular variable, the compiler rejects it:

```cpp
// Wrong — runtime variable cannot be a template argument
void bad(int n) {
    printNTimes<n>("x");  // error: 'n' is not a constant expression
}
```

The fix is either to use a `constexpr` variable, a literal, or to restructure so the value is known at compile time.

**Mixing up the template parameter with a function parameter.** A common beginner confusion is writing:

```cpp
template <int N>
void repeat(const char* msg, int N) { ... }  // error: 'N' redeclared
```

The `N` in `int N` shadows — or more precisely, conflicts with — the template parameter `N`. If you need a runtime argument for something different, give it a different name: `int times`.

**Assuming the same template parameter value produces a shared specialisation across translation units.** Because templates are instantiated wherever they are used, multiple files calling `printNTimes<3>` will each instantiate it. The linker merges them, but only if the definition is visible — which is why function templates (including those with non-type parameters) must live in headers. Splitting declaration and definition across `.h`/`.cpp` files breaks this, as the next lesson covers in detail.

## When to use this

Reach for non-type template parameters when a value is logically fixed at the point of use and known at compile time: buffer capacities, compile-time loop counts, numeric bases, bit widths. They let the compiler inline constants, unroll loops, or catch out-of-range values as compile errors rather than runtime crashes.

If the value only becomes known at runtime — from user input, a file, or a network response — a non-type template parameter is not the right tool; pass an ordinary function argument instead. If the value varies across many runtime calls but you still want type-safe parameterisation, consider whether a regular function parameter suffices before adding a template dimension.

Non-type parameters become especially valuable in the later chapters when you write fixed-size data structures. A buffer whose capacity is a non-type parameter can be checked at compile time: trying to access index 10 in a buffer of size 5 can be a static assertion rather than a silent out-of-bounds read at runtime. For now, the practical takeaway is simple: if something is always the same at a given call site and you know it when writing the code, it is a candidate for a non-type template parameter rather than a runtime argument.

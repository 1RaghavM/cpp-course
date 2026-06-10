## The idea

Imagine you're writing a program that calculates the absolute value of a number. A user might pass an `int`, or they might pass a `double`. In a world without function overloading, you'd have to name each version differently: `absInt`, `absDouble`, and so on. Every caller has to remember which name to use for which type.

Function overloading lets you define multiple functions with the same name, each handling a different type or set of parameters. The compiler figures out which version to call at compile time, based on the types you pass. The caller writes `abs(x)` and the compiler selects the right version automatically.

This is the core benefit: one intuitive name for one logical operation, regardless of the types involved.

## How it works

To overload a function, you define multiple functions in the same scope with the same name but different parameter lists. The compiler distinguishes them by their **signature** — specifically, the number and types of the parameters.

**Basic example: same name, different parameter types**

```cpp
#include <iostream>

int add(int a, int b) {
    return a + b;
}

double add(double a, double b) {
    return a + b;
}

int main() {
    std::cout << add(3, 4) << "\n";       // calls add(int, int) → 7
    std::cout << add(1.5, 2.5) << "\n";   // calls add(double, double) → 4
    return 0;
}
```

Both functions are named `add`. When you write `add(3, 4)`, both arguments are `int`, so the compiler selects the `int` version. When you write `add(1.5, 2.5)`, both are `double`, so the `double` version is called. No ambiguity — the types tell the compiler which overload to use.

**Different number of parameters**

Overloads can also differ by the number of parameters:

```cpp
#include <iostream>

void print(int x) {
    std::cout << "int: " << x << "\n";
}

void print(int x, int y) {
    std::cout << "int pair: " << x << ", " << y << "\n";
}

int main() {
    print(42);        // calls print(int)
    print(10, 20);    // calls print(int, int)
    return 0;
}
```

One parameter selects the first overload; two parameters select the second. The rule is that overloads must differ in either the number of parameters or the types of parameters (or both).

**What the return type cannot do**

Return type alone is not enough to distinguish overloads:

```cpp
int getValue();     // error if defined alongside:
double getValue();  // same name, same parameter list → not distinguishable
```

The compiler selects which overload to call before it knows what you plan to do with the return value. So two functions with identical parameter lists but different return types are not valid overloads — they conflict and the compiler will reject them.

## Common mistakes

**Mistake 1: Expecting overloads to differ only by return type**

```cpp
int process(int x) { return x * 2; }
double process(int x) { return x * 2.0; }  // compile error
```

Both functions take one `int` parameter. The compiler sees two definitions with the same signature and errors: *"function 'process' cannot be overloaded"*. To fix this, either change a parameter type or give the functions different names.

**Mistake 2: Forgetting that `const` on a value parameter doesn't count**

```cpp
void show(int x) {}
void show(const int x) {}  // NOT a distinct overload — same signature
```

For overload resolution, `const` on a *value* (non-reference, non-pointer) parameter is ignored. Both declarations above have the same signature from the compiler's perspective. This will cause a redefinition error, not two valid overloads. (`const` on references and pointers does matter — that comes later when references are introduced.)

**Mistake 3: Accidentally calling the wrong overload through implicit conversion**

```cpp
#include <iostream>

void log(int x) { std::cout << "int: " << x << "\n"; }
void log(double x) { std::cout << "double: " << x << "\n"; }

int main() {
    log('A');    // char promotes to int → prints "int: 65"
    return 0;
}
```

A `char` is not `int` or `double`, so the compiler promotes it to `int` and calls the `int` overload. The programmer might have expected the `double` overload, or expected a compile error. Understanding type conversions matters when overloads exist — the compiler will silently pick the best match.

## When to use this

Reach for function overloading when you have a single logical operation (print, add, convert, validate) that needs to work across multiple types but does essentially the same thing in each case. It keeps your API clean — callers use one intuitive name instead of memorizing a family of type-specific variants.

Don't overload when the functions do substantially different things despite taking different parameter types. Two functions that happen to share a name but behave in unrelated ways are confusing, not helpful — give them distinct names that communicate intent.

Overloading pairs naturally with the type conversion system covered earlier: when an exact-match overload isn't available, the compiler looks for the best implicit conversion. That process — overload resolution — is covered in detail in the next two lessons.

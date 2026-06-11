## The idea

In the previous lessons you saw that numeric conversions can silently discard information — a `double` becomes a truncated `int`, a large `int` becomes a wrapped-around `char`. C++ has a specific name for the dangerous direction: a **narrowing conversion** is any implicit conversion that could lose the value (either its magnitude or its precision). The standard explicitly calls these out because they are a major source of bugs that the compiler cannot always detect under traditional assignment syntax.

To address this, C++ 11 introduced **list initialization** (also called brace initialization or uniform initialization): using curly braces `{}` to initialize a variable. The unique property of list initialization is that it **prohibits narrowing conversions at compile time**. The compiler must diagnose the error, not silently truncate. Think of brace initialization as a picky teller who refuses to do any exchange that would lose money — if the currency you hand over cannot be represented exactly in the target currency, the transaction is rejected outright.

The third topic in this lesson, **constexpr initializers**, closes a remaining gap: even in brace initialization, an integer constant whose value happens to fit in the target type is allowed. The compiler can check at compile time whether the constant value fits, and if it does, the initialization is permitted even though the types differ.

## How it works

**What counts as a narrowing conversion**

These are narrowing:
- Floating-point to integer (`double` → `int`)
- Larger floating-point to smaller floating-point (`double` → `float`, when the value may not be representable)
- Integer to a smaller integer when the source value may not fit (`int` → `short`, `int` → `char`)
- Integer to floating-point when the value may not be representable exactly (`int` → `float` for large integers)
- Signed integer to unsigned integer when the value may be negative (`int` → `unsigned int`)

```cpp
int main() {
    int a = 300;
    char c = a;           // narrowing: 300 may not fit in char (range -128..127)
    // c gets an implementation-defined value (often 44 on most systems)
    return 0;
}
```

Under traditional copy-initialization (using `=`), this compiles silently. A warning may appear with `-Wall`, but the code is accepted.

**List initialization rejects narrowing**

```cpp
int main() {
    int a = 300;
    char c{a};            // ERROR: narrowing conversion from int to char
    // compiler error, not just a warning
    return 0;
}
```

With brace initialization, the compiler must produce a diagnostic. The variable `c` cannot be initialized from `a` because `a`'s value (`300`) may not fit in `char`. This catches the bug at the point of the mistake, not at runtime.

**Constexpr initializers get an exception**

```cpp
int main() {
    constexpr int small = 42;   // value is known at compile time: 42 fits in char
    char c{small};              // OK: constexpr value 42 fits in char range (-128..127)
    
    constexpr int big = 300;    // 300 does NOT fit in char
    char d{big};                // ERROR: even though it's constexpr, value is out of range
    return 0;
}
```

When the initializer is `constexpr`, the compiler knows the exact value at compile time. If the value fits in the target type's range, the initialization is allowed — this is not narrowing because no information is lost. If the `constexpr` value does not fit, the error is still reported.

**List initialization for all types**

Brace initialization is not only for catching narrowing. It also works as a general initialization syntax:

```cpp
#include <iostream>

int main() {
    int x{5};           // same as int x = 5; but with narrowing protection
    double d{3.14};     // same as double d = 3.14;
    std::cout << x << " " << d << "\n"; // prints 5 3.14
    return 0;
}
```

## Common mistakes

**Mistake 1: Using `=` instead of `{}` and missing silent narrowing**

```cpp
#include <iostream>

int main() {
    double pi = 3.14159;
    int truncated = pi;     // compiles silently; pi is narrowed to 3
    std::cout << truncated << "\n"; // prints 3
    return 0;
}
```

Had the programmer written `int truncated{pi};`, the compiler would have immediately rejected the code. With `=`, the silent truncation slips through and the programmer sees `3` at runtime without any indication that information was lost. Adopting `{}` for initialization systematically catches these mistakes.

**Mistake 2: Assuming constexpr means "no conversion needed"**

```cpp
int main() {
    constexpr double exact = 3.0;   // exactly 3, fits in int
    int i{exact};                   // still ERROR: double->int is narrowing even if value is 3.0
    return 0;
}
```

The constexpr exception applies only for integer constants fitting into integer targets. Converting a `double` to `int` is always a narrowing conversion in list initialization, even if the double value is an integer — the types are fundamentally different (floating-point vs. integer).

**Mistake 3: Using `{}` and expecting a default value when mistakenly left empty**

```cpp
#include <iostream>

int main() {
    int x{};    // value-initializes to 0 — this is intentional and well-defined
    std::cout << x << "\n"; // prints 0
    return 0;
}
```

Empty braces `{}` value-initialize the variable, which for numeric types means zero. This is not a mistake — it is a useful pattern. The mistake is doing `int x;` (no initializer), which leaves `x` uninitialized with garbage. Using `{}` as a zero-initializer is a good habit.

## When to use this

Use brace initialization `{}` as your default syntax for initializing variables. It is strictly safer than `=` because it will not silently accept narrowing conversions. You can still use `=` for cases where you want the old behavior (e.g., when assigning a value in a context where the type is already guaranteed correct), but for declarations, `{}` is the modern recommendation. The constexpr exception is particularly useful when you have a compile-time constant that you know fits in a smaller type — the compiler verifies this for you. As a rule: if you are narrowing intentionally, use an explicit cast (covered in lesson 10.6) to signal the intent rather than relying on silent implicit conversion.

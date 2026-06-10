## The idea

As programs grow, repeating a type name like `unsigned long long int` or `const double` dozens of times becomes tedious and fragile. If you later decide to change that type, you must find and update every occurrence. Type aliases and typedefs solve this by letting you give a long or complex type a shorter, more meaningful name. You write the alias once, use the short name everywhere, and change it in only one place if the underlying type ever needs to change.

The older syntax inherited from C is `typedef`. Modern C++ added the `using` alias declaration, which does the same job with a cleaner, more readable syntax. Both produce an alternative name for an existing type — they never create a new type. Code that uses the alias is identical to code that uses the original type; the compiler simply substitutes.

## How it works

**`typedef` — the classic form**

```cpp
typedef unsigned long long int ULL;

int main()
{
    ULL bigNumber { 10000000000ULL };
    return 0;
}
```

`typedef` reads as "define `ULL` as a synonym for `unsigned long long int`." The syntax can become confusing for pointer or function-pointer types because the alias name is placed in the middle of the declaration.

**`using` alias — the modern form**

```cpp
using ULL = unsigned long long int;

int main()
{
    ULL bigNumber { 10000000000ULL };
    return 0;
}
```

The `using` form is preferred in modern C++ because the structure is always `using Name = ExistingType;` — the alias name is on the left, the type on the right. This is consistent and easy to read for complex types.

**Practical use: platform-portable numeric types**

```cpp
#include <iostream>

using Score   = int;
using Average = double;

Score computeTotal(Score a, Score b)
{
    return a + b;
}

int main()
{
    Score s1 { 85 };
    Score s2 { 92 };
    Average avg { static_cast<Average>(computeTotal(s1, s2)) / 2 };
    std::cout << avg << '\n';
    return 0;
}
```

Here `Score` and `Average` are just `int` and `double` respectively, but the code communicates its domain intent. If the grading system ever needs `long` or `float`, a single-line change to the alias updates every usage.

Type aliases are not typedef-style renaming in a way that restricts which types can be assigned. Because they are just synonyms, you can still mix them freely with the original type. There is no compile error from assigning an `int` to a `Score` variable — they are exactly the same type.

## Common mistakes

**Mistake 1 — confusing typedef pointer declarations**

```cpp
typedef int* IntPtr;
IntPtr a, b;   // both a and b are int*
```

Compare with:

```cpp
int* a, b;   // a is int*, but b is just int (surprise!)
```

A `typedef` for a pointer applies to every variable in the declaration, which avoids the ambiguity of the `int*` multi-variable form. With `using`:

```cpp
using IntPtr = int*;
IntPtr a, b;   // both are int* — same as the typedef case
```

This is one of the rare cases where using a typedef or alias for a pointer type changes the meaning of a multi-variable declaration. The most common fix is to declare one variable per line instead.

**Mistake 2 — treating an alias as a new, distinct type**

```cpp
using Meters = double;
using Seconds = double;

Meters distance { 100.0 };
Seconds time { 9.58 };

Meters wrong { time };   // compiles! No error.
```

Because `Meters` and `Seconds` are both `double`, assigning one to the other compiles without complaint. Type aliases provide readability, not type safety. If you actually need the compiler to reject mixing meters and seconds, you need a wrapper type — a topic for later chapters.

**Mistake 3 — defining an alias inside a function and trying to share it**

```cpp
void foo()
{
    using BigInt = long long;
    BigInt x { 42LL };
}

void bar()
{
    BigInt y { 0LL };  // error: BigInt not in scope
}
```

An alias defined inside a function has function scope. To share it across multiple functions, define it at namespace scope (outside any function) or in a header file that both translation units include.

## When to use this

Reach for a type alias when a type is long, platform-specific, or carries domain meaning that the raw type name does not convey. The `using` syntax is preferred over `typedef` in new C++ code for its clarity. Aliases in global or header scope let you change the underlying type in one place — a concrete maintenance win on larger projects. When a long type name appears more than two or three times in a file, an alias pays off immediately. Skip aliases when the original type name is already short and self-explanatory (`int`, `char`, `bool`); they add noise without benefit.

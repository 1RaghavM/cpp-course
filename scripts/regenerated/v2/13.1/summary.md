## The idea

C++ ships with a fixed set of fundamental types: `int`, `double`, `char`, `bool`, and a few others. They are universal, but they are also generic. When your program models something specific — a traffic light, a card in a deck, an HTTP status code — a raw `int` cannot tell you that `0` is supposed to mean "red" and not just any integer. The compiler has no way to stop you from passing a card's suit where a card's rank was expected, because they are both just `int`.

A program-defined type is a new type that you, the programmer, introduce into the program. The language gives you the building blocks — keywords like `enum` and `struct` — and you assemble them into a type that carries meaning specific to your problem. Once defined, this type takes its place beside the fundamental ones: you can declare variables of it, pass it to functions, return it, and the compiler will enforce that it is used where it is expected and rejected where it is not.

Think of it like the difference between buying lumber and buying a chair. Lumber is general-purpose; you can build anything from it, but it is not itself a chair. A program-defined type is the chair: a named, specific shape your program understands and can reason about.

## How it works

Defining a program-defined type happens at file scope (or inside a namespace), typically near the top of the file or in a header. The definition introduces the name; you can then declare objects of that name like any other type.

Here is the general pattern using enumerations as a concrete vehicle (the next lesson covers the details):

```cpp
#include <iostream>

enum Color
{
    red,
    green,
    blue,
};

int main()
{
    Color shirt { red };
    std::cout << shirt << '\n';
    return 0;
}
```

`enum Color { ... };` is the type definition. After that line, `Color` is a real type name in the program, and `shirt` is a variable whose type is `Color`. The definition itself does not allocate any memory or produce any runtime work; it is a contract the compiler uses to check later code.

A program can have many type definitions. Each one usually lives near where it is needed:

```cpp
#include <iostream>

enum LogLevel
{
    info,
    warning,
    error,
};

int main()
{
    LogLevel current { warning };
    int count { 3 };
    std::cout << "Level: " << current << ", count: " << count << '\n';
    return 0;
}
```

Notice that `LogLevel` and `int` coexist peacefully. The compiler tracks them separately. If you later add a function that expects a `LogLevel`, passing it a raw `int` becomes a compile-time question rather than a silent bug.

Definitions almost always go in a header file when more than one source file needs the type. Because every translation unit that uses the type needs to see the same definition, the one-definition rule applies — but with an important exception: identical type definitions are allowed in multiple translation units as long as they appear in a header included by each. That is the whole point of headers for types.

```cpp
// colors.h
#ifndef COLORS_H
#define COLORS_H

enum Color
{
    red,
    green,
    blue,
};

#endif
```

Any `.cpp` file that needs `Color` includes `colors.h`. The header guard prevents double-inclusion within one translation unit; the rule about identical definitions across units handles the rest.

## Common mistakes

The first mistake is forgetting the semicolon after the closing brace of a type definition. Unlike a function definition, a type definition is a statement and ends with `;`. Without it, the next thing in the file is parsed as part of the definition, and the compiler error you get is usually about whatever line comes next — confusing if you do not know to look up:

```cpp
enum Color
{
    red,
    green,
    blue,
}   // missing semicolon

int main() { return 0; }
```

`g++` will say something like `expected ';' after enum specifier`. The line number it points at is the line of `int main`, not the line of the missing semicolon.

The second mistake is placing the type definition inside `main` or another function when it really needs file scope. C++ allows nested definitions, but if `main` defines `Color` locally, no other function in the file can use it. Beginners doing this notice the error only when they try to write a helper function that takes a `Color`.

The third mistake is treating the definition like a declaration that allocates a variable. Writing `enum Color { red, green, blue };` does not create a variable named `Color`; it creates a *type* named `Color`. To get a variable, you write `Color shirt { red };` afterward. The two lines have different roles and both are needed.

## When to use this

Reach for a program-defined type whenever a fundamental type is too general — whenever you find yourself documenting an `int` as "0 means red, 1 means green" or writing a comment to explain what a `bool` parameter controls. A program-defined type encodes that comment in the type system, where the compiler can enforce it. For a small set of named states, an enumeration is usually the right choice; for a bundle of related data fields, a `struct` is the right choice. Stick with fundamental types only when the value really is just a number, a character, or a yes/no answer with no further structure behind it.

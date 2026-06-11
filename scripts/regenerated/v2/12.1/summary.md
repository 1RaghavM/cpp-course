## The idea

Every value in a C++ program has a type, and so far you have been working with *fundamental* types: `int`, `double`, `bool`, `char`, and a handful of others. These map almost directly to single words of memory and have no internal structure.

But programs rarely stay that simple. You need to express "a variable that refers to another variable," "a variable that holds the memory address of something else," "a pair of related values that belong together," or "a sequence of values of the same kind." None of those ideas can be captured by a single fundamental type.

C++ solves this with *compound types* — types that are built on top of other types. A compound type does not exist in isolation; it always describes a relationship with some underlying type. Think of fundamental types as atoms and compound types as molecules: molecules are made of atoms, and the arrangement of atoms determines what the molecule does.

This chapter introduces the two most foundational compound types: **references** and **pointers**. Later chapters add more (function types, arrays, user-defined types like enums and structs), but references and pointers are the ones that appear everywhere in idiomatic C++ code and that every beginner must internalize.

Understanding compound types is the single biggest conceptual step in learning C++. Almost every feature that distinguishes C++ from a scripting language — performance, control over memory, efficient function interfaces — flows from the concepts introduced here and in the chapters that follow.

## How it works

The C++ type system is organized into two broad families.

**Fundamental types** are the building blocks: integer types (`int`, `short`, `long`, `long long`, and their unsigned variants), floating-point types (`float`, `double`, `long double`), `bool`, `char`, and the special type `void`. You have been using these since chapter 1.

**Compound types** are constructed from other types. The type they are built from is called the *underlying type* or *referenced type*, depending on the specific compound. The standard lists eight categories of compound types; the ones relevant to this chapter are:

- **References** — an alias for an existing object (introduced in lesson 12.3)
- **Pointers** — a variable that stores a memory address (introduced in lesson 12.7)
- **Arrays** — a sequence of objects of the same type (later chapters)
- **Function types** — the type of a callable (covered when discussing function pointers)
- **Enumeration types** — a set of named integer constants (chapter 13)
- **Class types** — user-defined types with members (chapters 13–14 and beyond)

Here is how you can think about the distinction in code:

```cpp
#include <iostream>

int main()
{
    // Fundamental types: each variable holds its own value directly.
    int x { 5 };
    double pi { 3.14159 };

    // The type of x is "int" — a fundamental type.
    // The type of pi is "double" — a fundamental type.

    std::cout << x << '\n';
    std::cout << pi << '\n';
    return 0;
}
```

The code above is familiar territory. What changes with compound types is that the type itself carries information about a relationship — "this is a pointer to an int" or "this is a reference to a double" — not just a standalone value category.

The *declarator syntax* is how you express that relationship. For a pointer to `int`, you write `int*`. For a reference to `int`, you write `int&`. The type modifier (`*` or `&`) is part of the type, not the variable name:

```cpp
int value { 42 };

// int& is the type "lvalue reference to int"
// ref is the variable name
int& ref { value };   // ref is an alias for value

// int* is the type "pointer to int"
// ptr is the variable name
int* ptr { &value };  // ptr holds the address of value
```

This distinction — modifier belongs to the type, not the name — trips up nearly every beginner, so it is worth locking in now before the details of references and pointers arrive.

A third compound-type category worth recognizing early is the *function type*. Every function you write has a type: `int(int, int)` is the type of a function that takes two ints and returns an int. You have been using function types all along without necessarily thinking of them that way.

```cpp
// The type of add is "function taking two ints, returning int"
int add(int a, int b)
{
    return a + b;
}

int main()
{
    std::cout << add(3, 4) << '\n';  // prints 7
    return 0;
}
```

## Common mistakes

**Mistake 1: Thinking the `*` or `&` belongs to the variable name rather than the type.**

When declaring multiple variables on one line, beginners sometimes write:

```cpp
int* a, b;   // WRONG mental model: many think both a and b are pointers
```

In C++, `*` binds to the variable name in a declaration, not to the type keyword. So `int* a, b` declares `a` as `int*` (pointer to int) and `b` as plain `int`. This is a quirk of C++ declaration syntax. The fix is to declare one pointer per line or keep the `*` next to the name when declaring multiple variables:

```cpp
int* a;
int* b;   // both are pointers to int — clear and unambiguous
```

Most style guides avoid multi-variable pointer declarations entirely because of this ambiguity.

**Mistake 2: Confusing compound types with complex types.**

"Compound" is a technical term in the C++ standard meaning "built from another type." It does not mean "complicated." An `int*` is compound but trivial; a single `int` is fundamental but might represent something complicated in your program. Keep the vocabulary straight: compound refers to the type's construction, not its difficulty.

**Mistake 3: Assuming you need compound types only for advanced programs.**

Students sometimes defer learning references and pointers thinking they can write "real" programs without them. In practice, references appear in nearly every function that avoids unnecessary copies, and pointers appear in every program that uses dynamic memory or interoperates with C libraries. The chapter ahead builds these skills incrementally — resist the urge to skip.

## When to use this

This lesson is an orientation, not a how-to: there is nothing to "use" yet. Its purpose is to give you the mental map before the details land.

Compound types are the tool you reach for whenever a fundamental type cannot express the relationship you need. If you need a variable that refers to another without copying it, that is a reference. If you need to store and pass around a memory address, that is a pointer. If you need a collection of same-typed values, that will be an array or `std::vector` (covered in chapter 16). If you need a named set of options, that will be an enum (chapter 13).

The specific compound type to choose depends on the lifetime and ownership semantics of your data — topics that the lessons ahead address one concept at a time. For now, the key takeaway is that the C++ type system is larger than its fundamental types, and the extensions that matter most for everyday code are the ones introduced in this chapter.

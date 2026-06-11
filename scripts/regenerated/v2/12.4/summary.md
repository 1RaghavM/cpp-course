## The idea

In lesson 12.3, you learned that a non-const lvalue reference (`int&`) is a handle that lets you both read *and* modify the object it aliases. That is exactly what you want when a function needs to change the caller's variable. But often you want the opposite promise: "I can see this value, but I will not change it."

A **lvalue reference to const** — written `const T&` — gives you that read-only window. It aliases an existing object just like a plain reference does, but through it you can only read, never write. The compiler enforces the read-only constraint at every use of the reference.

There is a second, subtler benefit: a `const T&` can bind to things that a plain `T&` cannot. Because the reference promises not to modify the value, the compiler is willing to create a temporary object on your behalf and let the reference alias *that* temporary. This means `const T&` can accept rvalues — literals, arithmetic expressions, and function return values — in addition to the lvalues that a plain reference accepts. This flexibility makes `const T&` the workhorse type for function parameters that need to observe a value without copying it.

## How it works

**Declaring a const reference.** Place `const` before the type:

```cpp
int x { 42 };
const int& cref { x };   // cref is a read-only alias for x
```

Reading `cref` gives you `x`'s value. Trying to write through it is a compile error:

```cpp
cref = 100;   // ERROR: cannot assign to a variable that is const
```

The original object `x` is not affected by `cref`'s `const`; `x` itself remains modifiable. The `const` qualifier on the reference restricts what *the reference* can do, not what the underlying object is.

```cpp
#include <iostream>

int main()
{
    int x { 10 };
    const int& cref { x };

    std::cout << cref << '\n';   // 10 — reading is fine
    x = 99;                      // OK: x itself is not const
    std::cout << cref << '\n';   // 99 — cref sees the change because x changed
    return 0;
}
```

Because `cref` aliases `x`, when `x` changes to `99`, reading through `cref` also returns `99`. The `const` on the reference only prevents writing *through the reference*; it does not freeze the underlying object.

**Binding to rvalues and temporaries.** The most important difference from a plain `int&` is that `const int&` can bind to an rvalue:

```cpp
const int& r { 5 };       // OK: r binds to a compiler-created temporary
const int& s { 2 + 3 };   // OK: s binds to the temporary value 5
```

When you write `const int& r { 5 }`, the compiler creates an anonymous `int` object with value `5` and makes `r` an alias for it. Crucially, the lifetime of that temporary is *extended* to match the lifetime of the reference. As long as `r` is in scope, the temporary stays alive.

This property is what allows you to write function parameters like:

```cpp
#include <iostream>

void printValue(const int& n)
{
    std::cout << n << '\n';
}

int main()
{
    int x { 7 };
    printValue(x);      // lvalue — works just like int&
    printValue(42);     // rvalue literal — also works because const int& accepts it
    printValue(3 + 4);  // rvalue expression — also works
    return 0;
}
```

A function taking `const int&` is callable with any integer expression — named variables, literals, or computed values — without copying the argument into a new variable.

**Binding to a const object.** A `const T&` can also alias a `const` object, which a plain `T&` cannot:

```cpp
const int limit { 100 };
const int& r { limit };  // OK
// int& s { limit };     // ERROR: can't bind non-const ref to const object
```

This is why function parameters for large objects almost always use `const T&` rather than `T&`: you can call such a function with `const` variables, non-`const` variables, and temporary values alike.

## Common mistakes

**Mistake 1: Thinking `const int& r { x }` makes `x` const.**

The `const` qualifier applies to the *reference*, not to the underlying object. `x` remains mutable and the reference simply cannot be used to change it:

```cpp
int x { 5 };
const int& r { x };
x = 20;    // OK — x is not const
// r = 20; // ERROR — r is a const reference
std::cout << r;  // 20 — reflects the change made via x
```

**Mistake 2: Trying to bind a non-const reference to a const object.**

```cpp
const int c { 50 };
int& r { c };   // ERROR: binding non-const lvalue reference to const object
```

This is a compile error. A non-const reference promises it *can* write to the object; a `const` object promises it *cannot* be written to. These promises conflict, so the compiler rejects the binding.

**Mistake 3: Thinking temporary lifetime extension applies to plain `int&`.**

```cpp
int& r { 5 };          // ERROR — can't bind non-const lvalue ref to rvalue
const int& cr { 5 };   // OK — const ref extends temp lifetime
```

Only a `const` reference extends the lifetime of a temporary. A plain `int&` cannot bind to a temporary at all.

## When to use this

Use `const T&` as a function parameter whenever the function only needs to read the argument and you want to avoid an unnecessary copy. This is the default choice for function parameters of any non-trivial type. For small fundamental types like `int`, `double`, or `bool`, passing by value is usually just as efficient as passing by const reference — but `const T&` is never wrong.

Use a local `const T&` when you want a readable alias for an expression without modifying it, or when you need to bind to a temporary and keep it alive for a few lines.

Avoid non-const `T&` unless the function genuinely needs to modify the caller's variable. The visibility of intent matters: `T&` signals "this will be modified," `const T&` signals "this will be read," and `T` by value signals "I'm working with my own copy." Choosing the right type makes code self-documenting.

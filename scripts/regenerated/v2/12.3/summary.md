## The idea

Imagine you have a friend's contact card. The card is not your friend — it is a reference to them. Calling the number on the card calls your friend. Updating their address via the card updates your friend's actual address. There is only one friend; the card is just another way to reach them.

An *lvalue reference* in C++ works the same way. It is a second name — an alias — for an existing object. Through the reference you can read or modify the original object. There is still only one object; the reference is just another handle to it.

References solve a concrete problem: copying a value every time you use it in a function is wasteful and sometimes semantically wrong. If you want a function to work on the caller's actual variable — not its own local copy — you need a way to hand the function the original. Lvalue references are that mechanism. They are the foundation for passing arguments efficiently and for avoiding unnecessary copies throughout your program.

## How it works

**Declaring a reference.** The `&` in a type position (not to be confused with the address-of operator in an expression) declares an lvalue reference:

```cpp
int value { 42 };
int& ref { value };   // ref is an alias for value
```

After this declaration, `ref` and `value` refer to the same object. Reading `ref` reads `value`. Writing to `ref` writes `value`.

```cpp
#include <iostream>

int main()
{
    int value { 10 };
    int& ref { value };   // ref is an alias for value

    std::cout << value << '\n';  // 10
    ref = 99;
    std::cout << value << '\n';  // 99 — the original was changed
    std::cout << ref << '\n';    // 99 — same object
    return 0;
}
```

Both `value` and `ref` print `99` after the assignment through `ref`, confirming they are the same object.

**Reference rules.**

Three rules govern lvalue references:

1. **A reference must be initialized when declared.** Unlike a pointer, a reference cannot be left in an uninitialized state. The compiler enforces this.

2. **A reference must bind to an lvalue.** The object it aliases must have a stable memory location. Binding a (non-const) reference to a literal or to an arithmetic expression is a compile error.

3. **A reference cannot be reseated.** Once a reference is bound to an object it stays bound for its entire lifetime. Assigning through a reference changes the *object*, not which object the reference aliases.

```cpp
int a { 1 };
int b { 2 };
int& r { a };   // r aliases a
r = b;          // assigns b's value (2) to a — does NOT rebind r to b
// Now: a == 2, b == 2, r still aliases a
```

This surprises many beginners. After `r = b`, `r` still refers to `a`; the value of `a` has simply been set to `2`.

**References in functions.** The most common use is to let a function modify or observe the caller's variable without copying it:

```cpp
#include <iostream>

void doubleIt(int& n)   // n is an lvalue reference parameter
{
    n = n * 2;           // modifies the caller's variable directly
}

int main()
{
    int x { 5 };
    doubleIt(x);
    std::cout << x << '\n';  // 10 — x was modified through the reference
    return 0;
}
```

When `doubleIt(x)` is called, `n` becomes an alias for `x`. The multiplication writes directly to `x`'s storage. No copy of `x` is made.

## Common mistakes

**Mistake 1: Trying to bind a non-const reference to an rvalue.**

```cpp
int& r { 5 };  // ERROR: cannot bind lvalue reference to rvalue (a literal)
```

The compiler error reads something like "cannot bind non-const lvalue reference of type 'int&' to an rvalue of type 'int'." The fix is either to use a named variable as the referent, or to make the reference `const` (covered in lesson 12.4).

**Mistake 2: Thinking assignment through a reference reseats it.**

```cpp
int a { 10 };
int b { 20 };
int& r { a };
r = b;   // Assigns b's VALUE to a — does NOT make r refer to b
```

After this, `r` still aliases `a`, and `a` now equals `20`. If you expect `r` to now refer to `b`, that is the wrong mental model: references are not pointers; they cannot be redirected.

**Mistake 3: Forgetting that a reference must be initialized.**

```cpp
int& r;   // ERROR: declaration of reference without an initializer
```

This is a compile error. Every reference must name the object it aliases at the point of declaration. There is no "null reference" or "uninitialized reference" in standard C++.

## When to use this

Use an lvalue reference whenever you want a function to modify the caller's variable (as shown with `doubleIt`) or when you want another name for an object within a limited scope to make code more readable. References are also the foundation for pass-by-reference — the parameter-passing strategy explored in lessons 12.5 and 12.6.

Do not use a non-const lvalue reference when you only need to *read* the value without modifying it; that is what `const` references (lesson 12.4) are for. Do not use a reference when you need to store a nullable handle or when the target may change after binding — pointers (lesson 12.7) handle those cases.

References keep your code free of redundant copies and communicate intent clearly: a `T&` parameter tells readers "this function may modify the argument," while a `const T&` parameter says "I am reading this without copying it." Mastering the distinction is one of the most practical skills in idiomatic C++.

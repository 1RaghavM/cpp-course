## The idea

Every variable lives somewhere in memory. Normally you interact with a variable by name — `x`, `count`, `total` — and the compiler handles where in memory that variable actually sits. A pointer breaks this abstraction open: it is a variable that stores the memory address of another variable. Instead of holding a number or a character, a pointer holds a location.

Why would you ever want that? Two reasons stand out at this stage. First, you can pass an address to a function and let that function reach back and modify the original variable — similar to references, but more explicit. Second, once you have an address you can do arithmetic on it, jumping from one element to the next in a sequence of values laid out consecutively in memory (covered later). For now the key insight is: a pointer is a number that happens to be an address, and dereferencing it gives you the object at that address.

Pointers are one of the features that distinguish C++ from most high-level languages. They give you direct access to memory, which is powerful but also demands care.

## How it works

**Declaring a pointer.** Put a `*` between the type and the variable name. The type says what kind of object the pointer points to:

```cpp
int x = 42;
int* p = nullptr;  // p is a pointer-to-int, currently points to nothing
p = &x;            // & is the address-of operator; p now holds x's address
```

`int* p` declares `p` as a pointer to `int`. Assigning `&x` stores x's address in `p`. Reading `p` gives you the address; it does not give you 42.

**Dereferencing.** The `*` operator, when placed in front of a pointer in an expression, follows the address and gives you the object at that address:

```cpp
#include <iostream>

int main() {
    int x = 42;
    int* p = &x;

    std::cout << p << '\n';   // prints an address, e.g. 0x7ffee1a2b4bc
    std::cout << *p << '\n';  // dereferences: prints 42
    *p = 100;                  // writes through the pointer into x
    std::cout << x << '\n';   // prints 100
    return 0;
}
```

`*p` on the right-hand side of an expression reads the value. `*p` on the left-hand side writes through the pointer. This is why `*p = 100` changes `x` — `p` holds x's address, so writing through `p` is the same as writing to `x`.

**The two uses of `*` in context.** The same symbol `*` plays two completely different roles: in a declaration (`int* p`) it marks `p` as a pointer; in an expression (`*p`) it is the dereference operator. This dual use trips up beginners but quickly becomes natural with practice.

```cpp
#include <iostream>

int main() {
    int a = 10;
    int b = 20;
    int* ptr = &a;         // ptr points to a

    std::cout << *ptr << '\n';  // 10
    ptr = &b;              // now ptr points to b
    std::cout << *ptr << '\n';  // 20
    return 0;
}
```

Pointers are reassignable — `ptr` can point to different objects over its lifetime, unlike references which are permanently bound to the object they were initialized with.

## Common mistakes

**Confusing `&` in a declaration with `&` in an expression.**

In a declaration like `int& ref = x;`, the `&` means "make this a reference." In an expression like `p = &x;`, the `&` is the address-of operator that produces x's address. They look identical but mean entirely different things depending on context. One way to keep them straight: `&` in a type position (attached to a type name) = reference type; `&` in an expression position = "give me the address of."

**Dereferencing before setting the pointer to a valid address.**

```cpp
int* p;   // uninitialized — holds garbage
*p = 5;   // undefined behavior: writing to a random memory address
```

An uninitialized pointer holds whatever bits happen to be in that memory location — it is not guaranteed to be a valid address. Dereferencing it is undefined behavior: the program may crash immediately, corrupt other variables, or appear to work on some machines and fail on others. Always initialize a pointer to either `nullptr` or a valid address before using it.

**Printing the pointer when you meant to print the pointed-to value.**

```cpp
int x = 7;
int* p = &x;
std::cout << p << '\n';   // prints an address like 0x7ffe...
std::cout << *p << '\n';  // prints 7
```

Forgetting the `*` dereference prints the numeric address, not the value stored there. The compiler will not warn you — both are valid operations with different meanings.

## When to use this

Pointers are the foundation for several later topics: pass by address, dynamic memory, arrays, and ultimately data structures like linked lists. At this stage, treat the lesson as learning the vocabulary: `T*` is the type, `&x` gives you the address, `*p` gets you back to the object. When you need to let a function modify a variable, prefer lvalue references (covered in "Pass by lvalue reference") — they are safer and cleaner. Pointers become necessary when you need to represent "no value" with `nullptr`, when you need to reassign what is being pointed at, or when working with raw memory. For read-only access to an existing object, continue using const references.

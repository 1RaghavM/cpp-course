## The idea

In the previous lesson you saw that passing by lvalue reference lets a function modify the caller's variable. But sometimes you want the opposite guarantee: you want the function to be able to read a value without copying it, and you want to be absolutely certain the function cannot change it. That is what pass by const lvalue reference gives you.

Think of it as lending a book to someone with a sticky note on the cover: "Read it, but do not write in it." The borrower gets full access to the content without you having to photocopy the whole thing, but they cannot alter the original.

This matters because making copies of things like strings can be expensive. A `const` reference lets you share data efficiently while the `const` enforces the read-only contract in the type system — the compiler enforces it, not the programmer's discipline.

## How it works

The syntax is `const T&` in the parameter list. The function can read the value through the reference but cannot assign to it:

```cpp
#include <iostream>

void printDouble(const int& n) {
    std::cout << n * 2 << '\n';
    // n = 0;  // error: cannot assign to const reference
}

int main() {
    int x = 7;
    printDouble(x);   // prints 14
    return 0;
}
```

No copy of `x` is made. `n` binds directly to `x` in the caller. The `const` means any attempt to assign through `n` is a compile error.

The critical advantage over a plain non-const reference is that `const` references can bind to **rvalues** — literals, temporaries, and computed expressions — as well as named variables:

```cpp
#include <iostream>

void show(const int& n) {
    std::cout << n << '\n';
}

int main() {
    int a = 5;
    show(a);       // lvalue: fine
    show(10);      // rvalue: also fine with const&
    show(a + 3);   // temporary: also fine
    return 0;
}
```

A non-const `int&` parameter would reject `show(10)` and `show(a + 3)` outright. When the argument is an rvalue, the compiler creates a temporary, and the const reference extends that temporary's lifetime for the duration of the call.

Const references also help communicate intent: a `const T&` parameter tells every reader of the code that the function is a pure reader — it inspects but does not mutate. A plain `T&` signals that mutation is possible (or intended). This documentation effect makes function signatures self-describing.

```cpp
#include <iostream>

// Reads two values and prints whichever is larger.
void printLarger(const int& a, const int& b) {
    if (a > b) {
        std::cout << a << '\n';
    } else {
        std::cout << b << '\n';
    }
}

int main() {
    int x = 10, y = 20;
    printLarger(x, y);    // prints 20
    printLarger(15, 8);   // prints 15 — rvalue args work too
    return 0;
}
```

## Common mistakes

**Using a non-const reference when you only need to read.**

```cpp
void printValue(int& n) {   // should be const int&
    std::cout << n << '\n';
}

int main() {
    printValue(42);   // error: cannot bind non-const lvalue reference to rvalue
    return 0;
}
```

If the function never modifies `n`, declaring it `int&` is a mistake: it prevents passing literals and temporaries, and it falsely suggests the function might change the argument. Using `const int&` fixes both problems.

**Thinking `const` on the reference prevents the caller's variable from changing through other means.**

The `const` in `const int& n` constrains only what the *function* can do through `n`. If something else holds a non-const reference to the same variable and modifies it during the call, the value seen through `n` can change. The `const` is not a lock on the object — it is a restriction on this particular reference.

**Passing `const&` for every type blindly, even cheap-to-copy types.**

```cpp
void process(const int& n) { /* ... */ }  // not ideal for int
void process(int n)         { /* ... */ }  // preferred for small types
```

For small built-in types — `int`, `double`, `bool`, `char` — a copy is as cheap or cheaper than a reference, because modern CPUs can pass them in registers but a reference may require a memory indirection. The common guideline: pass built-in types by value; pass larger types (strings, objects) by const reference. Overusing const references for ints adds indirection without benefit.

## When to use this

Use `const T&` whenever a function needs to read a value without modifying it and the type is expensive to copy. In practice, this is the default choice for any non-trivial type: strings, large arrays, or any type you define yourself (covered in later chapters). For small built-in types like `int`, `double`, or `char`, pass by value — it is simpler and equally fast. When you need to modify the caller's variable, drop the `const` and use a plain lvalue reference as shown in "Pass by lvalue reference".

## The idea

C++ will implicitly convert arguments to match a function's parameter type when no exact-match overload exists. Usually that's convenient, but sometimes it's exactly what you don't want. Imagine a function `printBinary(int x)` that only makes sense for integers: passing a `double` would silently truncate it, and passing a `bool` would silently convert it to `0` or `1`. The caller gets no warning that their argument was mangled.

The `= delete` specifier solves this by explicitly declaring that a particular version of a function is deleted — it exists but calling it is a hard compile error. Instead of a silent wrong-answer, the programmer gets an immediate, clear message at the point of the bad call.

## How it works

**Syntax**

You write `= delete` after the function signature, in place of the function body:

```cpp
void printBinary(double x) = delete;  // calling this is a compile error
```

This tells the compiler: "This overload participates in overload resolution, but if it wins, reject the call."

**Why deleted overloads still participate in resolution**

This is the key insight. When you call `printBinary(3.14)`, the compiler finds the deleted `double` overload as the best match. Because that overload is deleted, it emits an error immediately: *"use of deleted function"*. The compiler does not fall through to a less-precise overload. This is the desired behavior: the deleted overload acts as a trap that prevents implicit conversions from sneaking through.

Without the deleted overload, `printBinary(3.14)` would silently convert `3.14` to `int` and call `printBinary(int)`. With the deleted overload, it's a clean compile error.

```cpp
#include <iostream>

void printBinary(int x) {
    std::cout << "value: " << x << "\n";
}

void printBinary(double x) = delete;   // prevent silent double→int conversion
void printBinary(bool x)   = delete;   // prevent silent bool→int conversion

int main() {
    printBinary(42);      // OK: exact match to int overload
    // printBinary(3.14); // error: use of deleted function
    // printBinary(true); // error: use of deleted function
    return 0;
}
```

**Deleting to prevent specific implicit conversions in a non-overload context**

Even a single non-overloaded function can have its implicit-conversion variants deleted:

```cpp
#include <iostream>

void half(int x) {
    std::cout << x / 2 << "\n";
}

void half(double) = delete;

int main() {
    half(10);    // OK: prints 5
    // half(3.5); // error: avoids silent truncation to 3
    return 0;
}
```

**Deleting a function entirely**

You can delete any function, including ones the compiler generates automatically (more relevant in later chapters). For now, deleting a free function with no non-deleted overloads means the function simply cannot be called:

```cpp
void forbidden() = delete;
// forbidden(); // error: use of deleted function
```

## Common mistakes

**Mistake 1: Thinking `= delete` makes the overload invisible**

```cpp
void f(int x) {}
void f(double x) = delete;

f(3.14);  // error: use of deleted function 'void f(double)'
```

Some learners expect `f(3.14)` to call `f(int)` after "skipping" the deleted double overload. That's not how it works. The deleted overload wins the resolution race (it's the best match), and the compiler errors. If you want `f(3.14)` to call `f(int)`, don't provide a `double` overload at all.

**Mistake 2: Confusing `= delete` with omitting the function**

Omitting a `double` overload means `f(3.14)` silently calls `f(int)` via standard conversion. Adding a deleted `double` overload means `f(3.14)` is a hard compile error. These are different behaviors. Choose `= delete` precisely when you want the compiler to reject the call outright.

**Mistake 3: Placing `= delete` on the definition instead of the declaration**

```cpp
void f(int x);
void f(int x) = delete;  // error: cannot delete after already declared without delete
```

The `= delete` must appear on the first declaration of the function. You cannot add it later as a re-declaration.

## When to use this

Reach for `= delete` when you have a function that must only accept specific types, and implicit conversion to those types would silently produce wrong results. Common examples: integer-only math functions where `double` would be truncated, functions expecting non-negative values where passing `bool` would be misleading, and factory functions that must receive exact types.

For the reverse situation — you want a function to accept many types — function templates (covered in upcoming lessons) are the better tool. `= delete` is the tool for narrowing, not widening.

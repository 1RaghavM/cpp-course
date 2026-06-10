## The idea

Chapter 12 is about two related but distinct mechanisms for indirecting through data: **references** and **pointers**. Both let you work with a variable without copying it, but they differ in syntax, safety guarantees, and the scenarios where each is the right tool. The chapter also covers `std::optional`, which packages the idea of "this result might not exist" directly into the type system.

If Chapter 11 was about writing code that works for different types, Chapter 12 is about writing code that works with data efficiently — avoiding unnecessary copies and communicating ownership and intent through the parameter types you choose.

## How it works

**Value categories and references (lessons 12.1–12.4).** Every expression in C++ is either an lvalue (has a persistent identity — you can take its address) or an rvalue (a temporary, no persistent address). Lvalue references (`int&`) can only bind to lvalues; `const` lvalue references (`const int&`) can bind to both. This distinction drives how arguments are matched to parameters.

```cpp
#include <iostream>

void inspect(const int& x) {
    std::cout << x << '\n';
}

int main() {
    int n = 5;
    inspect(n);    // lvalue — fine
    inspect(3);    // rvalue temporary — const ref extends its lifetime
}
```

**Passing by reference (lessons 12.5–12.6).** Pass `T&` to let the function modify the caller's variable. Pass `const T&` to give read-only access without a copy — the standard pattern for large types.

**Pointers (lessons 12.7–12.9).** A pointer holds the address of another variable. Dereference it with `*` to read or write the value it points to. `nullptr` represents the absence of an address. `const int*` prevents modification through the pointer; `int* const` prevents reseating the pointer itself.

```cpp
#include <iostream>

int main() {
    int x = 10;
    int* ptr = &x;
    *ptr = 20;
    std::cout << x << '\n';  // 20

    int* empty = nullptr;
    if (empty) std::cout << *empty;  // guard before dereferencing
}
```

**Passing by address (lessons 12.10–12.11).** Passing a pointer into a function achieves similar effects to passing by reference, but the caller must take the address explicitly (`f(&x)`), and the function must check for `nullptr` when the pointer might be absent.

**Return by reference and by address (lesson 12.12).** A function can return a reference or pointer to a variable — but only if that variable outlives the function call. Returning a reference or pointer to a local variable is undefined behaviour.

**In and out parameters (lesson 12.13).** `const T&` signals an in parameter (read only). Non-const `T&` signals an out or in-out parameter (will be written). Matching the parameter type to the intended data flow prevents accidental modification and communicates the calling contract clearly.

**`auto` deduction with references and const (lesson 12.14).** `auto x = expr` strips the reference and top-level `const` from the deduced type — you get a copy. `auto& x = expr` keeps the reference; `const auto& x = expr` gives a read-only alias. Knowing the stripping rules prevents the silent-copy bug where you expected an alias.

**`std::optional` (lesson 12.15).** Wraps a value that may or may not be present. Return `std::nullopt` to signal absence. Check with `if (opt)` or `.has_value()` before dereferencing. `.value_or(default)` is a concise one-liner for "give me the value or this fallback."

## Common mistakes

**Dangling reference or pointer.** Returning a reference or address to a local variable is the most dangerous mistake in this chapter. The local is destroyed when the function returns; the reference or pointer now points at freed stack memory.

```cpp
int& bad() {
    int local = 5;
    return local;  // local dies at the closing brace — caller gets garbage
}
```

The rule: only return by reference if the object lives outside the function (a parameter, a static, or heap-allocated memory).

**Forgetting to null-check before dereferencing a pointer.**

```cpp
int* p = maybeNull();
std::cout << *p;  // undefined behaviour if p is nullptr
```

Every pointer that might be null must be checked. This is the exact problem `std::optional` solves when the pointer is used purely as an "optional value" signal.

**`auto` silently making a copy instead of an alias.**

```cpp
int x = 5;
int& ref = x;
auto y = ref;  // y is int, not int& — ref's reference-ness is stripped
y = 10;        // x is still 5
```

Write `auto& y = ref;` to get a reference. The mismatch between expectation and behaviour is the root of many subtle bugs when `auto` meets references.

## When to use this

Reach for `const T&` parameters for anything you only read and want to avoid copying. Use non-const `T&` only when the function's job is to write back to the caller. Prefer return values over out parameters for single results; use out parameters when producing two or three independent results without a struct. Use pointers instead of references when you need to represent optional presence (`nullptr`) or when the pointer will be reseated. Wrap the optional-presence pattern in `std::optional` once you are writing a value-type result that might not exist — it is cleaner than a sentinel value and safer than a nullable pointer.

The next chapter introduces structs, which let you bundle related values together. Many of the reference-and-pointer patterns from this chapter apply directly to struct objects: pass them by `const` reference to avoid expensive copies, return them by reference when they are stored in persistent state, and wrap them in `std::optional` when a lookup might fail.

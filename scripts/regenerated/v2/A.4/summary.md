## The idea

A FAQ is a collection of recurring questions that don't fit neatly into a single lesson but keep coming up in practice. This lesson gathers the most common C++ questions that learners ask after working through the main curriculum: questions about language history, toolchain choices, "why did C++ do it this way?", and what to do next after finishing a course. Think of it as a map of the terrain you have already crossed, labeled with answers to the questions you probably wrote down but didn't know where to put.

## How it works

**"Is C++ dying? Is it worth learning?"**

C++ consistently ranks in the top 5 languages by usage in competitive programming, systems programming, game development, high-performance finance, embedded systems, and scientific computing. The language receives a major revision every three years (C++11, C++14, C++17, C++20, C++23). It is not dying; it is actively evolving. Worth learning depends on your goals: if you are writing latency-sensitive systems, game engines, or OS components, C++ is often the only realistic choice. For web backends or data analysis, other languages will serve you better.

**"What is the difference between C and C++?"**

C++ was designed to be a superset of C with classes, references, templates, and a richer standard library. In practice, modern C++ code looks very different from C. The key differences:

- C++ has constructors, destructors, RAII, and exceptions — C does not.
- C++ has templates for compile-time generics — C uses macros and `void*`.
- C++ has `std::string`, `std::vector`, smart pointers — C uses raw arrays and manual memory.
- C has `restrict`, designated initializers (until C++20), and VLAs — features often absent or different in C++.

You can call C functions from C++ using `extern "C"` to prevent name mangling:

```cpp
// Tell the C++ compiler that these functions have C linkage
extern "C" {
    void c_function(int x);
    int c_compute(double a, double b);
}
```

**"What is undefined behavior and why does C++ have so much of it?"**

Undefined behavior (UB) means the standard places no requirement on what the program does. Signed integer overflow, reading past the end of an array, using a null pointer — all UB. The reason C++ has UB is performance: the standard leaves these cases undefined so compilers can assume they never happen and generate faster code. A compiler that sees `x + 1 > x` where `x` is `int` may optimize the comparison away entirely because signed overflow is UB.

```cpp
int x = INT_MAX;
// Signed integer overflow is UB. The optimizer may replace (x+1 > x) with true.
if (x + 1 > x) { /* this branch may always execute or never */ }
```

Use sanitizers (`-fsanitize=address,undefined`) during development to catch UB at runtime.

**"Should I use `new` and `delete` or smart pointers?"**

In modern C++ (C++11 and later), prefer smart pointers — `std::unique_ptr` and `std::shared_ptr` — over raw `new`/`delete`. They automate resource cleanup and prevent leaks even when exceptions are thrown:

```cpp
#include <memory>
// Smart pointer: auto-deleted when goes out of scope
std::unique_ptr<int> p = std::make_unique<int>(42);
// No delete needed
```

Raw `new`/`delete` is still used in implementation code for custom allocators and certain data structures, but application-level code should default to smart pointers or stack allocation.

**"What is a header guard / `#pragma once`?"**

A header guard prevents a header from being included more than once in a single translation unit. Without it, if two `.cpp` files include the same header, the compiler processes its contents twice and may report duplicate definition errors.

```cpp
// Traditional include guard
#ifndef MY_HEADER_H
#define MY_HEADER_H
// ... header content ...
#endif

// Modern equivalent (non-standard but universally supported)
#pragma once
// ... header content ...
```

**"What does `std::endl` vs `'\n'` mean?"**

`std::endl` outputs `'\n'` and then flushes the output buffer. Flushing is expensive on some systems. Prefer `'\n'` in performance-sensitive loops and only use `std::endl` when you explicitly need to guarantee the buffer is flushed (e.g., before a crash-reporting write).

## Common mistakes

**Mistake 1: Confusing compile-time vs. run-time errors**

A common source of confusion is the mental model that "if it compiles, it works." C++ has three distinct failure points: compile errors (syntax, type mismatch), linker errors (undefined reference, missing library), and runtime errors (UB, logic bugs, exceptions). Each requires a different debugging approach. A program that compiles without warnings can still misbehave at runtime due to UB.

**Mistake 2: Using `using namespace std;` in headers**

`using namespace std;` in a `.cpp` file is a matter of style. In a header file it is a bug: it pollutes the namespace of every translation unit that includes the header, potentially creating ambiguity or name collisions that are difficult to trace. Always use the full `std::` prefix in headers.

**Mistake 3: Treating C++ as "C with classes" and ignoring RAII**

Learners coming from C often manage resources manually — allocating with `malloc`/`new`, freeing in every exit path. C++ destructors run automatically at scope exit, making it possible to tie resource lifetimes to object lifetimes. Ignoring this pattern leads to leaks and double-frees. Trust destructors; use RAII wrappers.

## When to use this

This FAQ is a reference, not a progression of concepts. Return to it when you hit a question that seems obvious once you read the answer. The most actionable items for someone finishing this course: switch to smart pointers in new code, add `-fsanitize=address,undefined` to debug builds, and use `'\n'` instead of `std::endl` in loops. For the next steps in learning, consider studying a domain-specific library (SFML for graphics, Asio for networking, Catch2 for testing) rather than trying to read the full C++ standard.

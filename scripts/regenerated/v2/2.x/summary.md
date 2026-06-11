## The idea

Chapter 2 was about one big idea: breaking programs into named, reusable pieces and arranging those pieces so they are easy to find, share, and understand. The building block is the function — a named block of code that accepts inputs, does something, and optionally returns a value. Everything else in this chapter was infrastructure that makes functions work at scale: forward declarations let you call a function before defining it; multiple files let you organize functions across a project; headers let you share declarations without duplicating code; namespaces prevent name collisions when many files share a vocabulary; the preprocessor runs before the compiler and transforms source text using `#include` and `#define`; and header guards ensure that a header's content is never seen twice in the same compilation unit. The chapter closed with a design lesson: before writing code, identify inputs, outputs, and sub-tasks.

All of these pieces connect. You write a function, give it a declaration in a header, protect the header with a guard, include it wherever needed, and call the function from `main`. That is the backbone of every substantial C++ program you will write.

## How it works

**Functions and return values**

A function groups related computation under a name and returns its result to the caller:

```cpp
#include <iostream>

int cube(int n) {
    return n * n * n;
}

int main() {
    std::cout << cube(4) << "\n";  // 64
    return 0;
}
```

`cube` encapsulates the multiply-three-times logic. `main` stays short and readable. The return value flows directly into the `<<` expression.

**Forward declarations and multi-file organization**

When a function is defined below its first call, a forward declaration bridges the gap. This is exactly what a header file provides for functions living in a different `.cpp` file:

```cpp
// forward declaration (what a header would hold)
int cube(int n);

int main() {
    std::cout << cube(4) << "\n";
    return 0;
}

int cube(int n) {
    return n * n * n;
}
```

The one-definition rule means the body of `cube` may appear only once across the whole program; the declaration may appear many times.

**Namespaces and the preprocessor**

Namespaces prevent collisions when different libraries or files use the same function name. The standard library wraps everything in `std::`. You can reference symbols in another namespace with `::` or bring a specific name in with `using`:

```cpp
#include <iostream>

namespace geometry {
    int area(int w, int h) { return w * h; }
}

int main() {
    std::cout << geometry::area(6, 4) << "\n";  // 24
    return 0;
}
```

The preprocessor runs before compilation and handles `#include` (paste the file's contents here), `#define` (create a macro), and conditional compilation (`#ifndef`, `#endif`). Header guards use `#ifndef` to make a header safe to include multiple times.

## Common mistakes

**Forgetting the return statement — or returning from the wrong function**

A function with a non-`void` return type that falls off the end without a `return` statement causes undefined behavior. A void function that accidentally has a return-value expression is a compile error in the other direction.

```cpp
int double_it(int x) {
    int result = x * 2;
    // forgot return result; — undefined behavior
}
```

Always check: does every path through a value-returning function end with `return`?

**Using a forward declaration with the wrong signature**

A forward declaration that does not exactly match the definition — wrong parameter type, wrong return type, extra parameter — compiles but may fail to link or produce wrong behavior silently.

```cpp
int add(int a, int b);   // declaration

int add(int a) {         // definition has different signature — linker error
    return a + a;
}
```

**Skipping the header guard**

Including a header without a guard from two places in the same translation unit triggers redeclaration errors. Every header you create should start with `#ifndef MY_HEADER_H / #define MY_HEADER_H` and end with `#endif`.

## When to use this

Use functions whenever a piece of logic is named, repeatable, or tested independently. Use forward declarations when your file order would otherwise force a function below the point of its first call. Create a header when more than one `.cpp` file needs the same declarations. Add a header guard to every header, always. Use namespaces when there is a real risk of name collision — for a small single-file program, a namespace adds noise rather than clarity, but for any library or multi-file project it becomes essential. The design habit — inputs, outputs, sub-tasks before code — scales from ten-line exercises to programs with dozens of functions and files.

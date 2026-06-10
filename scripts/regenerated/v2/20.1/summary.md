## The idea

A function pointer is a variable that stores the address of a function, just as an integer pointer stores the address of an integer. This lets you treat functions as data: pass them to other functions, store them in containers, or decide at runtime which function to call. The core insight is that functions, like all code, live at memory addresses — and C++ lets you capture that address and use it later.

The classic motivating example is a sorting routine. A general-purpose sort needs to know how to compare elements, but the "right" comparison differs by context: sometimes you want ascending order, sometimes descending, sometimes by a struct field. Instead of writing a new sort for every comparison, you write one sort that accepts a comparison function as a parameter. The caller supplies the comparison, the sort uses it.

## How it works

**Declaring and calling a function pointer**

The syntax mirrors the function signature it points to. For a function returning `int` and taking two `int` parameters, the pointer type is `int (*)(int, int)`. Give the pointer a name by placing it inside the parentheses:

```cpp
#include <iostream>

int add(int a, int b) { return a + b; }
int multiply(int a, int b) { return a * b; }

int main() {
    int (*op)(int, int) = &add;   // point to add
    std::cout << op(3, 4) << "\n"; // prints 7

    op = &multiply;                // reassign to multiply
    std::cout << op(3, 4) << "\n"; // prints 12
}
```

`&add` produces the address of `add`. You can also write just `add` without the `&` — function names decay to pointers in most contexts, exactly like array names decay to pointers. Calling through a pointer uses the same `()` syntax as a direct call; dereference is optional: `(*op)(3, 4)` and `op(3, 4)` both work.

**Passing a function as a parameter**

The real power comes from using function pointers as parameters. Here is a small `apply` utility that calls any `int(int, int)` operation on two values:

```cpp
#include <iostream>

int apply(int x, int y, int (*op)(int, int)) {
    return op(x, y);
}

int subtract(int a, int b) { return a - b; }
int multiply(int a, int b) { return a * b; }

int main() {
    std::cout << apply(10, 3, subtract)  << "\n"; // 7
    std::cout << apply(10, 3, multiply)  << "\n"; // 30
}
```

The parameter `int (*op)(int, int)` declares a function pointer. The caller passes `subtract` or `multiply` by name; they decay automatically.

**Using `auto` and type aliases to tame the syntax**

Raw function-pointer syntax is notoriously hard to read. Two cleaner alternatives:

```cpp
#include <iostream>

// Type alias: give the function-pointer type a readable name
using BinaryOp = int (*)(int, int);

int add(int a, int b) { return a + b; }

int main() {
    BinaryOp op = add;
    std::cout << op(5, 6) << "\n"; // 11

    // auto also works when initialising immediately
    auto op2 = add;
    std::cout << op2(5, 6) << "\n"; // 11
}
```

`using BinaryOp = int (*)(int, int);` creates an alias for the type. `auto` deduces the pointer type from the assigned function. Both avoid repeating the raw pointer syntax every time.

## Common mistakes

**Mistake 1 — calling a null function pointer**

A function pointer that has been declared but not assigned is null (zero). Calling it is undefined behavior — on most platforms it immediately crashes.

```cpp
int (*op)(int, int);   // not initialized — contains garbage or null
op(2, 3);              // undefined behavior / crash
```

Always initialize to a known function or to `nullptr`, and check before calling when the pointer might be unset:

```cpp
int (*op)(int, int) = nullptr;
if (op) op(2, 3);     // safe — only calls if non-null
```

**Mistake 2 — mismatching the signature**

A function pointer must exactly match the return type and every parameter type of the function it points to. No implicit conversions apply. Assigning a `double(double, double)` function to an `int(*)(int, int)` pointer is a compile error:

```cpp
double fdiv(double a, double b) { return a / b; }
int (*op)(int, int) = fdiv; // compile error — types don't match
```

If you need to call functions with different signatures, look at `std::function` (covered later) or redesign the interface.

**Mistake 3 — forgetting the parentheses in the declaration**

`int *fn(int, int)` and `int (*fn)(int, int)` look similar but mean completely different things. The first declares a regular function `fn` that returns `int*`. The second declares a pointer `fn` to a function returning `int`. The parentheses around `*fn` are required for the pointer version:

```cpp
int *fn(int, int);      // function returning int*
int (*fp)(int, int);    // pointer to function returning int
```

When in doubt, use a type alias — `using Op = int(*)(int, int);` makes the intent obvious.

## When to use this

Function pointers are the right tool when you need to pass behavior as an argument and the behavior is a free function (not a lambda with captures, not a member function). Sorting with a custom comparator, implementing a callback-based event system, or building a simple command dispatch table (an array of function pointers indexed by an integer code) are typical uses.

Prefer `std::function<ReturnType(Params...)>` when you need to store lambdas with captures, member function wrappers, or any callable that isn't a plain free function. `std::function` has some overhead from type erasure, so raw function pointers are still preferred in performance-sensitive paths where only free functions are needed.

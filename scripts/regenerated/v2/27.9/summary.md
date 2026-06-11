## The idea

When you call a function, you often need to know whether it can throw. This information matters for two reasons: it lets the compiler generate faster code in certain paths, and it allows other parts of the program to make decisions — like choosing between a move and a copy — based on whether an operation is safe to interrupt with an exception.

C++ provides the `noexcept` specifier to make this contract explicit. A function marked `noexcept` promises that it will never throw an exception out of its body. If a `noexcept` function does throw, the runtime calls `std::terminate` immediately — there is no unwinding, no catch handlers. The guarantee is enforced at runtime, but the benefit is reaped at compile time through smarter code generation and through the `noexcept` operator, which lets you query whether a given expression can throw.

## How it works

**The `noexcept` specifier.**

```cpp
#include <iostream>

void safe_print(int x) noexcept {
    std::cout << x << "\n"; // cout does not throw in practice
}

int compute(int a, int b) noexcept {
    return a + b;
}

int main() {
    safe_print(compute(3, 4));
    return 0;
}
```

Adding `noexcept` after the parameter list declares the guarantee. If the function body does throw (because of a bug or an underlying function that unexpectedly throws), `std::terminate` is called at the throw site — the stack may not even be unwound.

**The `noexcept` operator.**

`noexcept(expr)` is a compile-time operator that evaluates to `true` if the expression is known not to throw, and `false` otherwise. It does not evaluate the expression — it only inspects type information.

```cpp
#include <iostream>

void might_throw() { throw 1; }
void wont_throw() noexcept {}

int main() {
    std::cout << std::boolalpha;
    std::cout << noexcept(wont_throw()) << "\n"; // true
    std::cout << noexcept(might_throw()) << "\n"; // false
    std::cout << noexcept(1 + 1) << "\n";         // true
    return 0;
}
```

This allows templates and library code to adapt their behavior at compile time depending on whether an operation is safe to throw.

**Conditional `noexcept`.**

A function can be conditionally `noexcept` — it promises no-throw only when some compile-time condition is true. This is most useful in templates:

```cpp
#include <iostream>
#include <stdexcept>

template <typename T>
void swap_values(T& a, T& b) noexcept(noexcept(T(std::move(a)))) {
    T tmp = std::move(a);
    a = std::move(b);
    b = std::move(tmp);
}

struct Safe { Safe(Safe&&) noexcept = default; Safe& operator=(Safe&&) noexcept = default; };
struct Risky { Risky(Risky&&) {} }; // not noexcept

int main() {
    std::cout << std::boolalpha;
    Safe x, y;
    std::cout << noexcept(swap_values(x, y)) << "\n"; // true
    Risky p, q;
    std::cout << noexcept(swap_values(p, q)) << "\n"; // false
    return 0;
}
```

**When `noexcept` matters most — move operations.**

The standard library's containers (such as `std::vector`) need to move elements when reallocating. If the move constructor is `noexcept`, the container can use the move directly. If it might throw, the container falls back to copying to preserve the strong exception guarantee. This is why the standard library's `swap`, move constructors, and move assignment operators are typically `noexcept`.

## Common mistakes

**Mistake 1 — marking a function `noexcept` when its body calls throwing code.**

```cpp
#include <vector>

void process(std::vector<int>& v, int idx) noexcept {
    int val = v.at(idx); // at() throws std::out_of_range on bad index
    // ...
}
```

If `v.at(idx)` throws, `std::terminate` is called — not the nearest catch handler. The `noexcept` contract is enforced at runtime. Add `noexcept` only when you have verified (or can guarantee) that nothing inside can throw.

**Mistake 2 — confusing the specifier and the operator.**

`noexcept` appears in two completely different positions and means different things:

```cpp
void f() noexcept;              // specifier: declares f does not throw
bool b = noexcept(f());         // operator: queries whether calling f() can throw
```

The specifier is part of the function's type. The operator is a compile-time expression. Confusing them leads to code like `if (noexcept(f()))` where the programmer intended to catch an exception rather than query a property.

**Mistake 3 — forgetting `noexcept` on move constructors and swap.**

```cpp
class Buffer {
    int* data_;
    std::size_t size_;
public:
    Buffer(Buffer&& other) { // not noexcept — missed annotation
        data_ = other.data_;
        size_ = other.size_;
        other.data_ = nullptr;
        other.size_ = 0;
    }
};
```

A move constructor that manipulates raw pointers cannot actually throw, but without `noexcept`, `std::vector<Buffer>` will copy instead of move on reallocation. The fix is `Buffer(Buffer&& other) noexcept { ... }`.

## When to use this

Mark a function `noexcept` when you can guarantee — by inspection of every code path — that nothing inside it can throw. The most important cases are destructors (already implicitly `noexcept` in C++11+), move constructors, move assignment operators, and `swap` functions. These are the hot paths where the standard library makes different algorithm choices based on the no-throw guarantee.

Avoid `noexcept` on functions that call into code you do not control, or on functions that will grow over time and may acquire throwing dependencies. A broken `noexcept` promise calls `std::terminate`, which is harder to diagnose than an uncaught exception with a full stack trace.

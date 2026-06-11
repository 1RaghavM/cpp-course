## The idea

When you call a function and pass a variable, C++ by default makes a copy of that variable for the function to work with. The function gets its own private copy; changes inside the function do not affect the original. Most of the time that is exactly what you want. But sometimes you specifically need the function to see and modify the caller's variable — not its own copy. That is what pass by lvalue reference solves.

Think of an lvalue reference as an alias — a second name for the same object. When you pass a variable by lvalue reference, the function parameter becomes another name for the caller's variable. Anything the function does through that parameter directly happens to the original. No copy is made.

This matters in two situations: when you want a function to modify a variable owned by the caller, and when you want to avoid the cost of copying a large object. This lesson focuses on the modification use case — the const variant (which handles the no-copy-but-read-only case) comes next.

## How it works

To declare a pass-by-reference parameter, put an ampersand (`&`) between the type and the parameter name:

```cpp
#include <iostream>

void doubleIt(int& x) {
    x = x * 2;
}

int main() {
    int value = 5;
    doubleIt(value);
    std::cout << value << '\n';  // prints 10
    return 0;
}
```

Inside `doubleIt`, `x` is not a copy of `value` — it is another name for `value`. The assignment `x = x * 2` writes back through the reference directly into `value`. When `doubleIt` returns, `value` in `main` holds 10.

Compare with what happens without the reference:

```cpp
#include <iostream>

void doubleItCopy(int x) {
    x = x * 2;
}

int main() {
    int value = 5;
    doubleItCopy(value);
    std::cout << value << '\n';  // still prints 5
    return 0;
}
```

`doubleItCopy` modifies its own local copy of `x`. The caller's `value` is unchanged. The `&` is the entire difference between the two behaviors.

A function can take multiple reference parameters and use them as output channels — writing results back to variables the caller owns:

```cpp
#include <iostream>

void minMax(int a, int b, int& outMin, int& outMax) {
    if (a < b) {
        outMin = a;
        outMax = b;
    } else {
        outMin = b;
        outMax = a;
    }
}

int main() {
    int lo, hi;
    minMax(7, 3, lo, hi);
    std::cout << "min=" << lo << " max=" << hi << '\n';  // min=3 max=7
    return 0;
}
```

`lo` and `hi` start uninitialized in `main`. `minMax` receives references to them and fills them in. After the call, both variables hold the computed values. This is a common pattern when a function needs to return more than one result.

## Common mistakes

**Passing an rvalue or a literal where a reference is expected.**

```cpp
void increment(int& n) { ++n; }

int main() {
    increment(5);       // error: cannot bind non-const lvalue reference to rvalue
    increment(2 + 3);   // error: same reason
    return 0;
}
```

A non-const lvalue reference can only bind to an lvalue — a named, modifiable object. A literal like `5` has no address and cannot be modified, so the compiler rejects the binding. The fix is to always pass a variable: `int x = 5; increment(x);`.

**Expecting the reference to keep the caller's variable alive after the function returns.**

References do not extend object lifetimes. If a function stores a reference to a local variable and then that local goes out of scope, the reference becomes dangling. In the context of pass-by-reference this usually shows up as the opposite mistake: assuming that after `void reset(int& n)` returns, `n` still refers to `value` in the caller — it does, but only during the call. Once the function returns, the parameter `n` ceases to exist. The original variable is unchanged by that (it still exists), but any pointer or reference to `n` itself that you tried to capture would be invalid.

**Forgetting the `&` in the caller — then being confused when modifications don't show up.**

```cpp
void setToZero(int& n) { n = 0; }

int main() {
    int x = 42;
    setToZero(x);   // x is now 0 — correct
    // If you wrote setToZero(x) but defined the function as void setToZero(int n)
    // (forgot &), x stays 42 and there's no error — silent logic bug.
    return 0;
}
```

If you accidentally drop the `&` from the function definition, the call still compiles — `x` is a valid argument for a by-value `int` parameter too. The function will receive a copy, modify the copy, and return. Your variable is untouched. Always double-check that the `&` appears in the parameter declaration when modification is the intent.

## When to use this

Reach for pass by lvalue reference when a function must modify a variable that belongs to the caller — changing state, filling in output parameters, or swapping values. It is also the right tool when you want to return more than one result from a function (one return value plus one or more reference parameters).

For values you want to read but not modify, prefer pass by const lvalue reference (covered in "Lvalue references to const" and elaborated in the next lesson). For small built-in types like `int`, `double`, or `char` where copying is essentially free, passing by value is simpler and clearer than passing by reference. Reserve the non-const reference form for cases where modification is the actual goal — using it just to avoid a copy is misleading, because a reader of your code will assume the function intends to modify the argument.

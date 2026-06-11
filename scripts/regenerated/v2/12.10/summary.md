## The idea

You have two well-established ways to let a function work with a caller's variable: pass by value (the function gets a copy) and pass by reference (the function gets an alias). Pass by address is a third option: instead of handing over the variable or an alias, you hand over the *address* of the variable. The function receives a pointer, and through that pointer it can read or write the original.

This matters for two practical reasons. First, a pointer can be null — a reference cannot — so pass-by-address is the natural choice when "no argument" is a meaningful state (a parameter the caller may or may not provide). Second, pass-by-address makes the calling code explicitly show that an address is being passed (`&x`), which some teams prefer for out-parameters because it makes mutations visible at the call site.

Outside of those two cases, prefer pass-by-reference. The mechanics are nearly identical, but references are safer because they cannot be null and cannot be accidentally reseated.

## How it works

A function that accepts a pointer parameter uses `T*` (or `const T*` for read-only access):

```cpp
#include <iostream>

void doubleIt(int* ptr) {
    *ptr *= 2;    // dereference to reach the original variable
}

int main() {
    int x { 7 };
    doubleIt(&x);             // pass the address of x
    std::cout << x << '\n';   // prints 14
    return 0;
}
```

The caller writes `&x` to form a pointer. Inside the function, `*ptr` is the variable `x`. Assigning through `*ptr` changes the original.

When the function only reads the pointed-at value, mark the parameter `const T*`:

```cpp
#include <iostream>

void printValue(const int* ptr) {
    std::cout << *ptr << '\n';
    // *ptr = 99;  // ERROR: can't write through const int*
}

int main() {
    int y { 42 };
    printValue(&y);   // prints 42
    return 0;
}
```

This is the pointer equivalent of `const int&` from "Pass by const lvalue reference". Prefer `const T*` when the function does not need to modify the value.

A pointer parameter can also be null, which lets callers signal "no value":

```cpp
#include <iostream>

void greet(const int* scorePtr) {
    if (scorePtr == nullptr) {
        std::cout << "No score.\n";
        return;
    }
    std::cout << "Score: " << *scorePtr << '\n';
}

int main() {
    int s { 99 };
    greet(&s);        // prints Score: 99
    greet(nullptr);   // prints No score.
    return 0;
}
```

Always check a pointer parameter for null before dereferencing when null is a valid input. Dereferencing a null pointer is undefined behavior and will likely crash the program.

## Common mistakes

**Mistake 1: forgetting the `&` when calling the function**

If the function expects `int*` and you pass a plain `int`, the compiler rejects the call:

```cpp
void doubleIt(int* ptr) { *ptr *= 2; }

int main() {
    int x { 7 };
    doubleIt(x);   // ERROR: cannot convert int to int*
    return 0;
}
```

Fix: write `doubleIt(&x)`. The `&` is not optional — it is what produces the `int*` the function needs.

**Mistake 2: dereferencing a null pointer without a null check**

```cpp
void print(const int* ptr) {
    std::cout << *ptr << '\n';   // crash if ptr is null
}

int main() {
    print(nullptr);   // undefined behavior
    return 0;
}
```

Add `if (ptr == nullptr) return;` (or an early bail-out) before any dereference. The nullptr lesson covered this, but the habit must carry over to every pointer parameter.

**Mistake 3: confusing the pointer with the pointed-at value**

A common slip is returning or printing the pointer itself (an address) instead of dereferencing it:

```cpp
void show(int* ptr) {
    std::cout << ptr << '\n';    // prints something like 0x7ffeabc — not the value
    std::cout << *ptr << '\n';   // this is what was intended
}
```

If you see a hex address in your output when you expected a number, you forgot the `*`.

## When to use this

Reach for pass-by-address when the function needs to optionally accept "no argument" (null pointer as sentinel), or when your team prefers out-parameters to be visible at the call site. For all other read/write parameter needs, pass by reference is cleaner. For read-only parameters of built-in types (`int`, `double`, etc.), pass by value or `const T&` is simpler still. Pass-by-address shines most in C-style interfaces, callback APIs, and situations where the pointer itself needs to be checked for null before use.

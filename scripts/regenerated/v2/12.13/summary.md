## The idea

Every time you write a function parameter, you are implicitly making a contract with the caller: "here is what I promise to do with this value." That contract has two directions. An *in parameter* carries information *into* the function — the caller hands data over and the function reads it but leaves the caller's variable untouched. An *out parameter* carries information *out of* the function — the function writes a result back through a reference or pointer so the caller can see the change. Some parameters are *in-out*: the function reads the incoming value and modifies it in place.

Understanding this distinction matters because C++ gives you the tools to enforce it in code — `const` references make in-parameters impossible to accidentally modify, while non-const references advertise that modification is intentional. When you name the contract in the type system, readers can understand calling conventions at a glance and the compiler catches violations for free.

## How it works

**In parameters** pass read-only data. The most efficient way to do this for anything larger than a built-in is `const T&`: no copy, no modification.

```cpp
#include <iostream>
#include <string>

void printGreeting(const std::string& name) {
    // name is read-only; the compiler prevents name = "..." here
    std::cout << "Hello, " << name << '\n';
}

int main() {
    std::string user = "Ada";
    printGreeting(user);   // user is unchanged after the call
}
```

`user` is never modified — `const` in the signature is a compile-time guarantee, not just a comment.

**Out parameters** write results back through a non-const reference or pointer. The function ignores the incoming value and fills in a fresh result.

```cpp
#include <iostream>

// Reads two ints from stdin and writes them through out parameters
void readPair(int& a, int& b) {
    std::cin >> a >> b;
}

int main() {
    int x = 0, y = 0;
    readPair(x, y);
    std::cout << x + y << '\n';
}
```

The calling code — `readPair(x, y)` — signals clearly that `x` and `y` will be set by the function, not merely read.

**In-out parameters** combine both roles: the function reads the existing value and overwrites it.

```cpp
#include <iostream>

void doubleAndAdd(int& value, int addend) {
    value = value * 2 + addend;  // reads old value, overwrites with result
}

int main() {
    int n = 3;
    doubleAndAdd(n, 1);  // n becomes 7
    std::cout << n << '\n';
}
```

`value` is both read (`value * 2`) and written (`value = ...`), so a non-const reference is the correct choice. `addend` is only read, so it is passed by value.

**Pass-by-address versions.** Everything above applies equally when pointers replace references. A pointer out parameter is especially common when you need to communicate the *absence* of a result using `nullptr`, which a reference cannot represent.

```cpp
#include <iostream>

// Returns the position of the first negative number, or -1 through out param
void findFirstNegative(const int* arr, int size, int* outIndex) {
    *outIndex = -1;
    for (int i = 0; i < size; ++i) {
        if (arr[i] < 0) { *outIndex = i; return; }
    }
}

int main() {
    int data[] = {4, 7, -2, 3};
    int idx = 0;
    findFirstNegative(data, 4, &idx);
    std::cout << idx << '\n';  // prints 2
}
```

## Common mistakes

**Forgetting `const` on an in parameter and accidentally modifying the caller's data.** When a reference parameter lacks `const`, the function can write to it — and sometimes does so by mistake. The caller's variable changes silently.

```cpp
// Wrong: modifies caller's string when trimming whitespace by value would be correct
void printTrimmed(std::string& s) {
    while (!s.empty() && s.back() == ' ')
        s.pop_back();          // permanently mutates caller's string!
    std::cout << s << '\n';
}
```

The fix is `const std::string& s`. If the function genuinely needs a working copy, take by value instead.

**Passing a literal or temporary to a non-const reference out parameter.** A non-const reference can only bind to an lvalue — a named variable. Passing a literal or the result of an expression is a compile error.

```cpp
void setToFive(int& x) { x = 5; }

int main() {
    setToFive(3);      // error: cannot bind non-const ref to rvalue '3'
    setToFive(2 + 2);  // error: same reason
}
```

Out parameters must be called with real variables that the function can write back to.

**Using an out parameter when a return value is clearer.** Out parameters are sometimes the right tool, but for a single result they make call sites harder to read: `int result; compute(x, result); use(result);` is more verbose than `int result = compute(x); use(result);`. Prefer return values for single results; reach for out parameters when a function must produce multiple independent values that do not naturally form a struct.

## When to use this

Use `const T&` (or `const T*`) whenever a function only reads its argument — it communicates intent, prevents bugs, and enables the function to accept temporaries. Use non-const `T&` or `T*` when the function's job is to modify the caller's variable or fill in multiple results. Reserve in-out parameters for cases where the incoming value genuinely feeds the calculation, like an accumulator. For a single return value, a plain `return` statement is almost always cleaner than an out parameter. Out parameters become more attractive when you need two or three independent results without defining a struct to bundle them, which you will learn in the next chapter.

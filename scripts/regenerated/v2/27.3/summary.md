## The idea

When you call a chain of functions — `main` calls `process`, which calls `parse`, which calls `validate` — each call pushes a frame onto the call stack. When `validate` throws, what happens to all those frames? They do not just vanish. C++ guarantees an orderly teardown called **stack unwinding**: the runtime walks back up the call stack, destroying every local variable in each frame in reverse order of construction, until it finds a matching `catch`.

The beautiful consequence of stack unwinding is that destructors always run, even during exception propagation. This is what makes RAII — the pattern of tying resource lifetime to object lifetime — reliable in the presence of exceptions. A file handle wrapped in a class, a mutex lock wrapped in `std::lock_guard`, dynamic memory wrapped in `std::unique_ptr` — all their destructors run during unwinding, releasing resources cleanly.

## How it works

**Tracing the unwind path.**

```cpp
#include <iostream>
#include <stdexcept>

struct Guard {
    std::string name;
    Guard(const std::string& n) : name(n) {
        std::cout << name << " constructed\n";
    }
    ~Guard() { std::cout << name << " destroyed\n"; }
};

void validate(int x) {
    Guard g("validate::g");
    if (x < 0) throw std::runtime_error("negative");
}

void process(int x) {
    Guard g("process::g");
    validate(x);
}

int main() {
    try {
        process(-1);
    } catch (const std::runtime_error& e) {
        std::cout << "Caught: " << e.what() << "\n";
    }
    return 0;
}
```

Output:
```
validate::g constructed
process::g constructed
validate::g destroyed
process::g destroyed
Caught: negative
```

Notice the destruction order: `validate::g` is destroyed first (innermost frame), then `process::g`. The catch runs last. This is the stack unwind in action.

**The exception propagates until caught — or terminates the program.**

```cpp
#include <iostream>
#include <stdexcept>

void level3() { throw std::runtime_error("deep error"); }
void level2() { level3(); }   // no catch here — exception passes through
void level1() { level2(); }   // no catch here — exception passes through

int main() {
    try {
        level1();
    } catch (const std::runtime_error& e) {
        std::cout << "Caught at main: " << e.what() << "\n";
    }
    return 0;
}
```

`level2` and `level3` do not need to know the exception exists. They have no error-handling responsibility — they simply let the exception propagate by not having a matching catch. The catch in `main` handles it.

**What does NOT prevent stack unwinding.**

Functions without local variables still unwind correctly — there is just nothing to destroy. And code between the throw and the catch is simply not executed:

```cpp
void f() {
    std::cout << "f: before throw\n";
    throw std::runtime_error("x");
    std::cout << "f: after throw\n";  // never runs
}

int main() {
    try {
        std::cout << "main: before call\n";
        f();
        std::cout << "main: after call\n"; // never runs
    } catch (const std::runtime_error&) {
        std::cout << "main: caught\n";
    }
    return 0;
}
```

Output:
```
main: before call
f: before throw
main: caught
```

## Common mistakes

**Mistake 1 — a destructor that throws during unwinding.**

```cpp
struct Bad {
    ~Bad() {
        throw std::runtime_error("destructor threw!"); // DANGEROUS
    }
};

int main() {
    try {
        Bad b;
        throw std::runtime_error("original");
    } catch (...) {}
    return 0;
}
```

If a destructor throws while the stack is already unwinding from a prior exception, `std::terminate` is called immediately. The program crashes. Destructors must never throw — this is a firm C++ rule. If an operation in a destructor can fail, swallow the failure silently or log it.

**Mistake 2 — assuming a function without a catch is "safe" from exceptions.**

```cpp
void middle() {
    std::string s = "hello"; // local variable
    call_that_might_throw();
    // s is destroyed here... right?
}
```

If `call_that_might_throw()` throws and `middle` has no catch, `s` is still properly destroyed — unwinding handles it. But if `middle` allocates raw memory with `new` (without wrapping it in a smart pointer), that raw pointer leaks because a raw pointer has no destructor. This is the core motivation for RAII: use objects with destructors to own resources.

**Mistake 3 — continuing after a partial operation.**

```cpp
try {
    open_file("config.txt");     // may throw
    read_header();               // may throw
    process_data();              // may throw
} catch (const std::runtime_error& e) {
    // Is the file open? Was the header read? Unknown state!
    std::cout << "Error: " << e.what() << "\n";
}
// Trying to use file state here is undefined behavior
```

After catching an exception, the program state may be partially modified. Do not assume the system is in a consistent state inside the catch block unless you explicitly clean up. The solution is RAII objects that reset state in their destructors.

## When to use this

Understanding stack unwinding is most important when writing classes that own resources — you need to ensure your destructors release those resources and do not throw. When calling library code that may throw, wrap the call at the level where you can respond cleanly, not at every intermediate layer.

Knowing that intermediate functions do not need catch clauses lets you keep your call chains clean. Only the layer that can actually recover or report the error needs a try/catch.

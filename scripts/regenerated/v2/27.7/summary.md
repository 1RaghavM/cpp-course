## The idea

Normally a `try` block sits inside a function body. But there is a special syntax — the **function try block** — where the entire function body becomes the try block, and the catch clauses follow the closing brace. This syntax exists primarily for one situation that regular try blocks cannot handle: catching exceptions thrown by member initializers in a constructor's initialization list.

Regular code in a constructor body runs after all base classes and members have been constructed. If a member's constructor throws, the initialization list has already started — you cannot wrap individual initializer expressions in a regular try block because they are not inside the function body. The function try block catches exceptions from the initialization list as well as the body.

## How it works

**The function try block syntax.**

A regular function can use it, though it offers no advantage over an inner try block:

```cpp
#include <iostream>
#include <stdexcept>

int safe_divide(int a, int b)
try {
    if (b == 0) throw std::runtime_error("divide by zero");
    return a / b;
} catch (const std::runtime_error& e) {
    std::cout << "caught in function: " << e.what() << "\n";
    return -1;
}

int main() {
    std::cout << safe_divide(10, 0) << "\n";
    return 0;
}
```

Output:
```
caught in function: divide by zero
-1
```

The try encompasses the entire function body; the catch is appended after the closing brace.

**The real purpose: catching initializer-list exceptions in constructors.**

```cpp
#include <iostream>
#include <stdexcept>
#include <string>

class Config {
public:
    std::string name;
    int value;

    Config(const std::string& n, int v)
    try : name(n), value(v) {
        if (v < 0)
            throw std::invalid_argument("value must be non-negative");
    } catch (const std::exception& e) {
        std::cout << "Config ctor failed: " << e.what() << "\n";
        // NOTE: must rethrow or the constructor returns in an invalid state
        throw;
    }
};

int main() {
    try {
        Config c("test", -1);
    } catch (...) {
        std::cout << "outer: construction failed\n";
    }
    return 0;
}
```

Output:
```
Config ctor failed: value must be non-negative
outer: construction failed
```

The `try` appears between the parameter list and the `: name(n), value(v)` initializer list. The catch runs if anything in either the initializer list or the function body throws.

**Critical rule: constructors must rethrow.**

Inside a constructor's function try block catch clause, you cannot suppress the exception and allow the constructor to complete normally. The object is partially constructed, and C++ requires that a constructor either completes successfully or throws. If you do not explicitly `throw;` in the catch, the compiler implicitly rethrows the exception anyway. Do not count on silent re-throw — write `throw;` explicitly for clarity.

```cpp
SomeClass::SomeClass()
try : member_(/* may throw */) {
    // body
} catch (...) {
    // do cleanup here
    throw; // must rethrow — writing it explicitly makes intent clear
}
```

## Common mistakes

**Mistake 1 — trying to suppress a constructor exception.**

```cpp
Widget::Widget(int x)
try : data_(x) {
} catch (...) {
    std::cout << "failed, recovering\n";
    // no rethrow — do you think the object is valid?
}
// The compiler inserts: throw; here anyway.
// Attempting to use a Widget built this way is undefined behavior.
```

The standard requires that if a constructor's function try block catch runs, the exception propagates (either from your explicit `throw;` or from the implicit one the compiler inserts). You cannot construct a half-baked object and hand it to the caller silently.

**Mistake 2 — using a function try block when an inner try will do.**

```cpp
void process()
try {
    // ...
} catch (...) { }
```

For regular functions, this is identical to wrapping the entire body in a `try`. It is not wrong, but it is unfamiliar syntax that confuses readers. Reserve function try blocks for constructors where they are actually needed.

**Mistake 3 — referencing members in the catch clause.**

```cpp
Config::Config()
try : name_(""), count_(0) {
} catch (...) {
    std::cout << name_ << "\n"; // DANGEROUS: name_ may not be constructed
    throw;
}
```

During the catch of a constructor's function try block, the object's members may not be fully constructed. Accessing them is undefined behavior. Only perform cleanup of explicitly acquired external resources; do not touch member data.

## When to use this

Use function try blocks exclusively in constructors when a member or base class might throw and you need to log the failure, translate the exception type, or clean up a non-RAII external resource before the object is abandoned. For all other functions, an inner try block is clearer.

The pattern pairs naturally with the RAII design: if all your members are RAII types, they clean up in their own destructors during stack unwinding, and you need only rethrow without extra cleanup in the catch.

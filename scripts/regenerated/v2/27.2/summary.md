## The idea

You already know from the previous lesson that exceptions separate error detection from handling. This lesson fills in the mechanics: how `throw`, `try`, and `catch` work together, and what rules govern which `catch` clause handles a given exception.

Think of `try` as a safety net stretched below a section of code. Any `throw` that happens inside the net — or inside a function called from inside the net — can land in one of the `catch` clauses hanging off the edge. The key insight is that you can have multiple `catch` clauses for different types, and C++ tries them in order from top to bottom, picking the first one whose type matches the thrown object.

## How it works

**The try block and a single catch clause.**

```cpp
#include <iostream>
#include <stdexcept>

int main() {
    try {
        int x = -5;
        if (x < 0)
            throw std::out_of_range("value must be non-negative");
        std::cout << "x = " << x << "\n";
    } catch (const std::out_of_range& e) {
        std::cout << "Caught: " << e.what() << "\n";
    }
    std::cout << "Done\n";
    return 0;
}
```

Output:
```
Caught: value must be non-negative
Done
```

The `throw` abandons the `try` block. The `catch` clause whose type matches `std::out_of_range` runs. Then execution falls through to `"Done"` — past the entire try/catch structure.

**Multiple catch clauses.**

```cpp
#include <iostream>
#include <stdexcept>

void risky(int code) {
    if (code == 1) throw std::runtime_error("runtime problem");
    if (code == 2) throw std::invalid_argument("bad argument");
    if (code == 3) throw 42;   // throwing an int
}

int main() {
    for (int code = 1; code <= 3; ++code) {
        try {
            risky(code);
        } catch (const std::runtime_error& e) {
            std::cout << "runtime_error: " << e.what() << "\n";
        } catch (const std::invalid_argument& e) {
            std::cout << "invalid_argument: " << e.what() << "\n";
        } catch (int val) {
            std::cout << "int exception: " << val << "\n";
        }
    }
    return 0;
}
```

Output:
```
runtime_error: runtime problem
invalid_argument: bad argument
int exception: 42
```

Catch clauses are checked from top to bottom. The first match wins — the others are skipped. This ordering matters especially with inheritance hierarchies (covered in a later lesson).

**What you can throw.**

You can throw any copyable type: integers, strings, or objects. However, throwing instances of classes derived from `std::exception` is by far the most common practice because it gives you `what()` for free and lets calling code catch `const std::exception&` to intercept any standard exception. The standard library itself throws `std::runtime_error`, `std::out_of_range`, `std::invalid_argument`, and several others — all derived from `std::exception`.

## Common mistakes

**Mistake 1 — placing a broader catch before a narrower one.**

```cpp
try {
    throw std::out_of_range("too far");
} catch (const std::exception& e) {      // catches everything from std
    std::cout << "generic\n";
} catch (const std::out_of_range& e) {   // never reached!
    std::cout << "specific\n";
}
```

Because `std::out_of_range` derives from `std::exception`, the first catch matches and the second is dead code. Most compilers warn about this. Always order catch clauses from most-specific to most-general.

**Mistake 2 — code after a throw inside the try block.**

```cpp
try {
    throw std::runtime_error("boom");
    std::cout << "This never prints\n"; // unreachable
} catch (const std::runtime_error& e) {
    std::cout << "caught\n";
}
```

Statements after a `throw` inside the same block are unreachable. The throw is unconditional: as soon as it executes, control leaves the try block. This is not a compiler error (the compiler might warn), but it is a logic mistake.

**Mistake 3 — assuming the catch resumes inside the try.**

```cpp
try {
    std::cout << "A\n";
    throw std::runtime_error("x");
    std::cout << "B\n"; // skipped
} catch (const std::runtime_error& e) {
    std::cout << "C\n";
}
std::cout << "D\n"; // runs after catch
```

Many beginners expect execution to jump back to `"B"` after the catch runs. It does not. The catch handles the exception and then falls through to whatever follows the entire try/catch group — here, `"D"`. The try block itself is finished.

## When to use this

Wrap code in a `try` block at the level where you can meaningfully respond to the error: display a user-friendly message, retry the operation, use a fallback value, or log and continue. Wrapping every single line in its own try/catch produces clutter without benefit; wrap logical units.

Use multiple catch clauses when different error types require different recovery strategies. When you want one handler for all standard library exceptions, catch `const std::exception&` as the last (or only) handler. The `catch (...)` catch-all — which matches any thrown type — is covered in the next lesson and reserved for final-resort scenarios.

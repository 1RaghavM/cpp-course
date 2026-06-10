## The idea

A lambda in the previous lesson was stateless — it only used its own parameters. But real-world callbacks often need to refer to variables from the surrounding context: a threshold set by the caller, a running total that accumulates across calls, or a configuration value read earlier. Lambda captures give a lambda access to variables from the scope where it is defined.

Think of a capture as a snapshot or a reference that the lambda carries in its pocket. When you capture by value, the lambda takes a copy of the variable at the moment of capture and that copy is frozen inside the lambda. When you capture by reference, the lambda holds a reference to the original variable and reads or writes through it every time it runs. The capture list — the `[]` at the front of the lambda — specifies what to carry and how.

## How it works

**Capture by value: `[x]`**

Writing a variable name in the capture list copies its value into the lambda when the lambda is created:

```cpp
#include <iostream>

int main() {
    int threshold = 5;
    auto isAbove = [threshold](int x) { return x > threshold; };

    threshold = 100;  // changing the original has no effect
    std::cout << isAbove(7)  << "\n";  // 1 (true: 7 > 5)
    std::cout << isAbove(3)  << "\n";  // 0 (false: 3 > 5)
}
```

The lambda captured `threshold` when it was 5. Changing `threshold` afterward does not affect the captured copy.

**Capture by reference: `[&x]`**

Prefixing a name with `&` captures it by reference. The lambda reads and writes through the original variable:

```cpp
#include <iostream>

int main() {
    int count = 0;
    auto increment = [&count]() { ++count; };

    increment();
    increment();
    increment();
    std::cout << count << "\n";  // 3
}
```

Every call to `increment` modifies `count` in the enclosing scope. This is how a lambda can accumulate state across multiple calls.

**Default captures: `[=]` and `[&]`**

Instead of listing each variable, you can use a default: `[=]` captures all referenced variables by value; `[&]` captures all by reference. Mix defaults with overrides:

```cpp
#include <iostream>

int main() {
    int base = 10;
    int factor = 3;

    // Capture everything by value
    auto scaled = [=](int x) { return base + factor * x; };
    std::cout << scaled(4) << "\n";  // 10 + 3*4 = 22

    int total = 0;
    // Capture everything by reference
    auto accumulate = [&](int x) { total += x; };
    accumulate(5);
    accumulate(8);
    std::cout << total << "\n";  // 13
}
```

Prefer explicit captures over `[=]` or `[&]` in production code — they document exactly what the lambda depends on.

## Common mistakes

**Mistake 1 — dangling reference capture**

Capturing a local variable by reference, then using the lambda after that variable has been destroyed, is undefined behavior. The classic trap is returning a lambda that captures a local:

```cpp
auto makeAdder(int addend) {
    return [&addend](int x) { return x + addend; }; // WRONG
    // addend is destroyed when makeAdder returns
    // the reference in the lambda now dangles
}
```

Capture by value instead when the lambda might outlive the captured variable:

```cpp
auto makeAdder(int addend) {
    return [addend](int x) { return x + addend; }; // correct: copies addend
}
```

**Mistake 2 — expecting a value-captured variable to update inside the lambda**

A value capture is a frozen copy. Modifying the original after capture has no effect inside the lambda:

```cpp
int limit = 10;
auto check = [limit](int x) { return x < limit; };
limit = 100;
// check still uses limit == 10, not 100
std::cout << check(50);  // prints 0 (false), not 1 — surprises many learners
```

If you need the lambda to see the latest value, capture by reference. If you need a snapshot, capture by value — but know it is frozen.

**Mistake 3 — modifying a value-captured variable (without `mutable`)**

By default, value-captured variables are `const` inside the lambda — you cannot modify the copy:

```cpp
int x = 5;
auto bad = [x]() { x += 1; };  // compile error: x is const in the capture
```

If you need to modify a captured copy (not the original), mark the lambda `mutable`:

```cpp
int x = 5;
auto ok = [x]() mutable { x += 1; std::cout << x << "\n"; };
ok();   // prints 6 — modifies the local copy, not the original x
ok();   // prints 7 — lambda's own copy was modified again
```

## When to use this

Use value captures when the lambda needs a snapshot of a value at the time of creation and should not be affected by later changes to the original. Use reference captures when the lambda needs to observe or modify a variable that outlives the lambda call, such as accumulating into an outer counter.

Never capture by reference when the lambda might be called after the captured variable's lifetime ends — prefer value captures in that case or restructure so the variable outlives the lambda.

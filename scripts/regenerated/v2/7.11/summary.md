## The idea

A normal local variable is born when its function is called and dies the moment the function returns. Every call starts fresh with a new variable. Sometimes you want a variable that lives inside a function — private to that function, invisible to the rest of the program — but persists between calls. A static local variable does exactly that.

The mental model: imagine a small, locked box bolted to the function. The box is created and initialised the very first time the function is called. After that, the box stays where it is — it does not reset when the function returns. The next call opens the same box and reads or modifies whatever was left in it.

This is different from a global variable in one important way: a static local variable is only accessible inside the function that declares it. Code outside the function cannot read or change it. You get persistence without sacrificing encapsulation.

## How it works

**A call counter**

```cpp
#include <iostream>

void countCalls() {
    static int count = 0;   // initialised once, on the first call
    ++count;
    std::cout << "Called " << count << " time(s)\n";
}

int main() {
    countCalls();   // Called 1 time(s)
    countCalls();   // Called 2 time(s)
    countCalls();   // Called 3 time(s)
    return 0;
}
```

The `static int count = 0;` line runs once, the first time `countCalls` is entered. On every subsequent call the line is skipped — `count` already exists — and `++count` increments the value that has been sitting in the function's private box since the last call.

**Comparing static and non-static locals**

```cpp
#include <iostream>

void withStatic() {
    static int x = 10;
    x += 5;
    std::cout << x << "\n";
}

void withoutStatic() {
    int x = 10;
    x += 5;
    std::cout << x << "\n";
}

int main() {
    withStatic();     // 15
    withStatic();     // 20
    withoutStatic();  // 15
    withoutStatic();  // 15
    return 0;
}
```

`withStatic` accumulates: each call adds 5 to the surviving value. `withoutStatic` resets: each call starts with a fresh `x = 10`. The outputs make this concrete.

**Generating unique IDs**

A practical use is generating a sequence of unique identifiers without any global state:

```cpp
#include <iostream>

int nextId() {
    static int id = 0;
    return ++id;
}

int main() {
    std::cout << nextId() << "\n";  // 1
    std::cout << nextId() << "\n";  // 2
    std::cout << nextId() << "\n";  // 3
    return 0;
}
```

The counter is hidden inside `nextId`. Callers cannot reset it or access it directly. This is a cleaner design than a global `int gNextId = 0;` that any function in the program can accidentally modify.

## Common mistakes

**Expecting the initialiser to run on every call**

```cpp
void broken() {
    static int x = 100;   // runs ONCE
    x = 0;                // this runs every call and overwrites the static value
    ++x;
    std::cout << x << "\n";  // always prints 1 — static was pointless here
}
```

The `static int x = 100;` line initialises `x` once. But the explicit `x = 0;` assignment on the next line runs every call, defeating the persistence. The bug is not in the `static` declaration — it is in the unconditional reset. Static local variables accumulate state only if you do not explicitly reset them on each call.

**Confusing static duration with static linkage**

The word `static` in C++ has two distinct meanings depending on context:

- `static` on a local variable gives it **static storage duration** — it persists between calls.
- `static` on a global variable or function gives it **internal linkage** — it restricts visibility to the current translation unit (covered in lesson "Internal linkage").

Both use the same keyword, which is a C++ wart. A `static` local variable is NOT the same thing as a `static` global. The scope and visibility rules are completely different. When you see `static` inside a function, think "lives forever but only visible here". When you see `static` on a global, think "invisible outside this file".

**Assuming static locals are thread-safe**

Static local variables are initialised exactly once across the lifetime of the program, but in multi-threaded programs two threads can enter the function simultaneously and race on the initialisation. This is a topic for much later chapters — for now, just be aware that `static` does not automatically mean "safe to call from multiple threads."

## When to use this

Static local variables are the right tool when a function needs to remember something across calls — a running total, a call count, a cached result, an ID counter — without polluting the global namespace. They keep the state private to the function, which is a better design than a global variable. Prefer a static local over a global whenever the state is only meaningful in the context of one function. If multiple functions need to share the same persistent state, a global (or a better abstraction like a struct or class, covered in later chapters) is more appropriate. Avoid over-using static locals in complex functions where the hidden state makes the function hard to test or reason about.

## The idea

A struct is just a value. Like an `int` or a `double`, you can hand it to a function, and the function can hand one back. The question is how: do you give the function the original, or do you give it a photocopy? Passing a struct to a function by value hands over a photocopy — the function can scribble all over it without touching your original. Passing by const reference hands the function a read-only window onto the original, without the cost of copying every field. Returning a struct by value gives the caller a fresh copy of whatever the function computed.

Think of a recipe: passing by value is like giving the chef a copy of your shopping list — they can cross things off, it does not affect your list. Passing by const reference is like letting the chef read your list over your shoulder — fast, and they cannot change it.

## How it works

The simplest case is passing a struct by value. The function gets its own independent copy:

```cpp
#include <iostream>

struct Point {
    int x{ 0 };
    int y{ 0 };
};

void doubleCoords(Point p) {  // p is a copy
    p.x *= 2;
    p.y *= 2;
    std::cout << p.x << ' ' << p.y << '\n';
}

int main() {
    Point origin{ 3, 4 };
    doubleCoords(origin);            // prints 6 8
    std::cout << origin.x << ' ' << origin.y << '\n'; // prints 3 4
}
```

The caller's `origin` is untouched. If the struct is large, however, copying every field on every call is wasteful. Passing by `const` reference avoids the copy while still preventing the function from modifying the caller's data:

```cpp
#include <iostream>
#include <string>

struct Employee {
    std::string name{ "unnamed" };
    int salary{ 0 };
    int years{ 0 };
};

void printEmployee(const Employee& e) {  // no copy, read-only
    std::cout << e.name << " earns " << e.salary
              << " after " << e.years << " years\n";
}

int main() {
    Employee alice{ .name = "Alice", .salary = 85000, .years = 3 };
    printEmployee(alice);
}
```

Functions can also construct and return a struct by value. The compiler is typically allowed to build the struct directly in the caller's storage (called copy elision), so there may be no actual copy at runtime even though the syntax looks like one:

```cpp
#include <iostream>

struct Point {
    int x{ 0 };
    int y{ 0 };
};

Point midpoint(const Point& a, const Point& b) {
    return Point{ (a.x + b.x) / 2, (a.y + b.y) / 2 };
}

int main() {
    Point p{ 2, 4 };
    Point q{ 8, 10 };
    Point m{ midpoint(p, q) };
    std::cout << m.x << ' ' << m.y << '\n'; // 5 7
}
```

Returning a struct avoids the need to pass an output pointer or reference. It keeps functions focused on computing one result and returning it, which makes code easier to reason about.

## Common mistakes

**Mistake 1 — Passing by value and expecting the caller to see modifications.**

```cpp
struct Counter {
    int count{ 0 };
};

void increment(Counter c) {   // c is a copy
    c.count += 1;
    // change is lost when c goes out of scope
}

int main() {
    Counter c{};
    increment(c);
    // c.count is still 0, not 1
}
```

The function operates on a local copy. If you need the caller's struct to change, pass by non-const reference (`Counter&`). If you just need to read, use `const Counter&`.

**Mistake 2 — Passing a large struct by value repeatedly in a hot path.**

```cpp
struct BigData {
    int values[1000]{};
};

void process(BigData d) { /* ... */ }  // copies 4000 bytes each call
```

For small structs (a handful of fundamental-type fields), pass-by-value is fine. Once a struct gets large, prefer `const BigData&`. There is no strict size threshold, but if it holds arrays or `std::string` members, const reference is almost always the right choice.

**Mistake 3 — Forgetting `const` on a reference parameter and accidentally modifying the caller's data.**

```cpp
struct Config { bool debug{ false }; };

void run(Config& cfg) {   // non-const reference
    cfg.debug = true;     // unintended side effect on caller
}
```

If the function only reads the struct, write `const Config& cfg`. Non-const reference is a promise that modification is intentional and the caller expects it. Omitting `const` when you do not need to modify is a silent design bug.

## When to use this

Pass structs by `const` reference when a function only needs to read the data — this mirrors the guidance from the reference lessons and avoids unnecessary copies. Pass by value when the function needs a true independent working copy. Return structs by value when computing a new struct from inputs, as in the `midpoint` example; this is idiomatic and the compiler handles the efficiency. These patterns work together with default member initialization from lesson 13.9, letting callers create partially-initialized structs and pass them straight to functions without any extra setup code.

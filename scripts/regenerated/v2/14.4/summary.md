## The idea

You already know that `const` variables cannot be modified after initialization. The same idea applies to objects: you can declare a `const` object of a class type, and the compiler will prevent any code that could change its state from running.

But there is a subtlety. When you call a member function on a `const` object, the compiler has to decide: will this function modify the object? For free functions, `const` parameters make the answer obvious. For member functions, the answer lives in the function's declaration itself — you must mark the function `const` to say "I promise not to modify the object." Only `const`-marked member functions can be called on `const` objects.

This one feature does a lot: it lets you write functions that accept `const` object references (a common pattern for performance), it documents which operations are "read-only" versus "write", and it catches bugs where a supposedly-read-only function accidentally modifies something.

## How it works

To mark a member function as non-modifying, put the keyword `const` after the parameter list and before the function body.

```cpp
#include <iostream>

class Rectangle {
public:
    double width;
    double height;

    double area() const {       // const member function
        return width * height;
    }

    void scale(double factor) { // non-const: modifies the object
        width  *= factor;
        height *= factor;
    }
};
```

Now you can create a `const` `Rectangle` and call `area()` on it, but not `scale()`:

```cpp
int main() {
    const Rectangle r = {4.0, 3.0};  // aggregate init (struct-like)
    std::cout << r.area() << "\n";   // ok — area() is const
    // r.scale(2.0);                 // error: scale() is not const
}
```

The `const` keyword in the function declaration tells the compiler that inside `area()`, the implicit object is treated as `const`. Any attempt to modify a data member inside a `const` member function is a compile-time error.

The same rule applies when you pass objects by `const` reference — a very common pattern:

```cpp
void printArea(const Rectangle& r) {
    std::cout << r.area() << "\n";  // ok — area() is const
    // r.scale(2.0);                // error — scale() not const
}
```

If `area()` were not marked `const`, the compiler would refuse the call even though `printArea` only wants to read the data. This is why every member function that does not modify the object should be marked `const` — it is not just a documentation hint; it determines what you can do with `const` objects and references.

A `const` member function can still return values and call other `const` member functions. It simply cannot write to any data member (unless that member is marked `mutable`, which is an advanced case not needed here).

```cpp
class Point {
public:
    double x;
    double y;

    double squaredDistance() const {
        return x * x + y * y;
    }

    bool isOrigin() const {
        return squaredDistance() == 0.0;  // calling const from const — fine
    }
};
```

## Common mistakes

**Forgetting `const` on read-only functions, then being unable to call them on `const` objects.** This is the most frequent error. You write a function that only reads data, but forget `const`, and later the compiler refuses to call it when you have a `const` reference.

```cpp
class Score {
public:
    int value;
    int get() { return value; }  // forgot const
};

void print(const Score& s) {
    std::cout << s.get() << "\n";  // error: 'get' not marked const
}
```

Fix: add `const` to `get()`:

```cpp
int get() const { return value; }
```

**Trying to modify a data member inside a `const` member function.** Once a function is marked `const`, the compiler treats the implicit object as read-only. Any assignment to a member is an error.

```cpp
class Counter {
public:
    int count;
    void reset() const {
        count = 0;  // error: cannot assign to 'count' in a const member function
    }
};
```

Remove `const` from `reset()` — it modifies the object, so it is not a const function.

**Calling a non-`const` function from a `const` function.** If function A is marked `const` but calls function B which is not marked `const`, the compiler rejects the call even if B doesn't actually modify anything — because the compiler only has the declaration to go on.

```cpp
class Data {
public:
    int value;
    void log()       { std::cout << value; }     // not const
    void report() const { log(); }               // error: log() not const
};
```

Fix: mark `log()` as `const` if it truly doesn't modify the object.

## When to use this

Mark every member function `const` if it does not modify any data member. This is not optional — it is a correctness annotation that the compiler enforces. A `const`-correct class lets you safely pass objects by `const` reference (which avoids copying while guaranteeing the function won't mutate the object), and it makes your interfaces clearer: callers can immediately see which operations are safe on read-only data.

If you are adding a getter function (a function that just returns a member's value), it should always be `const`. If a function changes state — a setter, a modifier, an accumulator — it cannot be `const`. When in doubt, ask: "could this function be called on a `const` object without ever changing it?" If yes, mark it `const`.

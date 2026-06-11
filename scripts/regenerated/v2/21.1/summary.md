## The idea

When you write `a + b` in C++, the compiler translates that into a function call. For built-in types like `int` and `double`, the compiler already knows what `+` means. But when you write your own class — say a `Fraction` or a `Vector2D` — the compiler has no idea what adding two of them should mean. Operator overloading lets you teach the compiler: "when you see `+` applied to two of my objects, call *this* function."

The mental model is simple: operators are just syntactic sugar for function calls. `a + b` is really `operator+(a, b)`. Operator overloading means writing that function yourself.

This makes user-defined types feel native. A `Money` class that supports `+`, `-`, and `<<` is as natural to use as `int`. You don't need a clunky `.add()` method — you just write `total = price + tax`.

## How it works

An overloaded operator is a regular function whose name starts with the keyword `operator` followed by the operator symbol. You can overload it as a free function (outside any class) or as a member function (inside the class). Chapter 21 covers both — this lesson focuses on the concept.

**Example 1: The problem without overloading**

```cpp
#include <iostream>

struct Point {
    int x{};
    int y{};
};

int main() {
    Point a{1, 2};
    Point b{3, 4};
    // Point c = a + b;  // error: no match for 'operator+'
    std::cout << a.x + b.x << " " << a.y + b.y << "\n";
    return 0;
}
```

Without an overloaded `+`, you must manually write out every field combination. This gets unwieldy fast, and it makes code that uses `Point` much harder to read.

**Example 2: Teaching the compiler what `+` means**

```cpp
#include <iostream>

struct Point {
    int x{};
    int y{};
};

Point operator+(const Point& lhs, const Point& rhs) {
    return Point{lhs.x + rhs.x, lhs.y + rhs.y};
}

int main() {
    Point a{1, 2};
    Point b{3, 4};
    Point c = a + b;
    std::cout << c.x << " " << c.y << "\n";  // prints: 4 6
    return 0;
}
```

The function `operator+(const Point&, const Point&)` is a normal free function. The compiler sees `a + b`, recognizes that neither operand is a built-in type, and looks up `operator+` that accepts two `Point` arguments.

**Example 3: Operators can be chained**

Because `a + b` returns a new `Point` by value, you can chain operators just like with integers:

```cpp
Point d = a + b + Point{10, 10};
// evaluated left to right: (a + b) + {10, 10}
std::cout << d.x << " " << d.y << "\n";  // prints: 14 16
```

This works because each call to `operator+` returns a fresh `Point`, which becomes the left operand of the next `+`.

## Common mistakes

**Mistake 1: Returning a reference to a local variable**

```cpp
// WRONG
const Point& operator+(const Point& lhs, const Point& rhs) {
    Point result{lhs.x + rhs.x, lhs.y + rhs.y};
    return result;  // dangling reference! result is destroyed here
}
```

`result` lives on the stack inside `operator+`. When the function returns, that memory is gone. The caller receives a reference to dead memory, and accessing it is undefined behavior — your program might crash, print garbage, or appear to work in debug builds.

Always return arithmetic results by value, not by reference:

```cpp
Point operator+(const Point& lhs, const Point& rhs) {
    return Point{lhs.x + rhs.x, lhs.y + rhs.y};
}
```

**Mistake 2: Overloading operators for unrelated types**

```cpp
// WRONG — this compiles but makes no semantic sense
Point operator+(const Point& p, const std::string& s) {
    return Point{p.x + 1, p.y + 1};  // what does adding a string to a point mean?
}
```

Operator overloading should preserve the intuitive meaning of the operator. If `+` doesn't make semantic sense between two types, write a named function instead. The guideline: overload an operator only when the behavior it produces would be obvious to someone reading the call site without any documentation.

**Mistake 3: Forgetting that some operators cannot be overloaded**

These operators exist in C++ but cannot be overloaded: `::` (scope resolution), `.` (member access), `.*` (member pointer access), `?:` (ternary), `sizeof`, `typeid`, and `alignof`. Trying to write `operator.` or `operator::` is a compile error.

Also note that you cannot create new operators from scratch. `@` is not a C++ operator; you cannot write `operator@`.

## When to use this

Reach for operator overloading when your class represents a value or entity where mathematical, comparison, or I/O notation would be natural — numeric types, geometric types, string-like containers, or anything that logically supports equality. The key test: would a reader who has never seen your class immediately understand what the expression means?

Avoid overloading when the operator's meaning would be non-obvious or misleading. A `Database` class with `operator+` to merge tables is confusing; a `.merge()` method is clearer. As a rule, if you have to explain what the operator does, use a named function instead.

The next lessons in this chapter cover exactly how to write arithmetic operators using friend functions, I/O operators using `<<` and `>>`, comparison operators, and member vs. non-member forms — each with their own conventions.

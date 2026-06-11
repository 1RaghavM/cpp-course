## The idea

Every time you write `std::cout << value` or `std::cin >> variable`, you are calling an overloaded operator. For built-in types the compiler provides these automatically, but for your own classes you must teach them. This lesson covers how to overload `operator<<` (output) and `operator>>` (input) so your objects can participate in the standard I/O stream syntax.

The payoff is ergonomic code. Instead of a clunky `printPoint(p)` free function or `p.print()` method, you write `std::cout << p` — which reads naturally, chains easily, and works with any output stream (file, string stream, or console) without change.

## How it works

**Understanding the types involved**

`std::cout` is an object of type `std::ostream`. The `<<` operator takes that stream on the left and your object on the right. To allow chaining (`std::cout << a << b`), the operator must return a reference to the stream:

```
std::ostream& operator<<(std::ostream& out, const YourType& obj)
```

Similarly, `std::cin` is `std::istream`, and `>>` must return `std::istream&` for chaining:

```
std::istream& operator>>(std::istream& in, YourType& obj)
```

Note that `operator>>` takes the object by non-const reference — it has to modify it.

**Example 1: Overloading operator<< for output**

```cpp
#include <iostream>

class Point {
    int m_x{}, m_y{};
public:
    Point(int x, int y) : m_x{x}, m_y{y} {}
    friend std::ostream& operator<<(std::ostream& out, const Point& p);
};

std::ostream& operator<<(std::ostream& out, const Point& p) {
    out << "(" << p.m_x << ", " << p.m_y << ")";
    return out;
}

int main() {
    Point p{3, 7};
    std::cout << p << "\n";   // prints: (3, 7)
    return 0;
}
```

Two things to notice: the operator takes `std::ostream&` by non-const reference (because writing to a stream changes its internal state), and it returns `out` so chaining works. The `friend` declaration is required because `m_x` and `m_y` are private.

**Example 2: Overloading operator>> for input**

```cpp
#include <iostream>

class Point {
    int m_x{}, m_y{};
public:
    Point() = default;
    Point(int x, int y) : m_x{x}, m_y{y} {}
    friend std::ostream& operator<<(std::ostream& out, const Point& p);
    friend std::istream& operator>>(std::istream& in, Point& p);
};

std::ostream& operator<<(std::ostream& out, const Point& p) {
    out << "(" << p.m_x << ", " << p.m_y << ")";
    return out;
}

std::istream& operator>>(std::istream& in, Point& p) {
    in >> p.m_x >> p.m_y;
    return in;
}

int main() {
    Point p;
    std::cin >> p;            // reads two integers
    std::cout << p << "\n";   // prints: (X, Y)
    return 0;
}
```

`operator>>` takes `Point&` (non-const) because it fills the object's fields. It reads directly into `m_x` and `m_y` — hence the `friend` access.

**Example 3: Chaining output**

Because both operators return the stream by reference, chaining works exactly like the built-in types:

```cpp
Point a{1, 2}, b{3, 4};
std::cout << a << " and " << b << "\n";
// prints: (1, 2) and (3, 4)
```

Each `<<` call returns the same `std::cout` reference, so the next `<<` call operates on the same stream.

## Common mistakes

**Mistake 1: Returning void instead of the stream reference**

```cpp
// WRONG — chaining breaks
void operator<<(std::ostream& out, const Point& p) {
    out << "(" << p.m_x << ", " << p.m_y << ")";
}
```

This compiles and works for single use, but breaks the moment you try to chain:

```cpp
std::cout << p << "\n";  // error: cannot use void as left operand of <<
```

The return type must be `std::ostream&` and the function must `return out;`.

**Mistake 2: Making `operator<<` a member function**

```cpp
class Point {
    // ...
public:
    // WRONG: member function would require Point on the LEFT side
    std::ostream& operator<<(std::ostream& out) {
        out << "(" << m_x << ", " << m_y << ")";
        return out;
    }
};
```

A member function version has the implicit `this` pointer as the left operand, so you would write `p.operator<<(std::cout)` — or in expression syntax, `p << std::cout`. That is backwards. The I/O operators must always be free functions so `std::cout` sits on the left.

**Mistake 3: Taking the object by value in operator>>**

```cpp
// WRONG — copies the object, modifies the copy, original unchanged
std::istream& operator>>(std::istream& in, Point p) {  // should be Point&
    in >> p.m_x >> p.m_y;
    return in;
}
```

The whole purpose of `operator>>` is to fill the caller's object. If you take it by value, you fill a temporary copy that is immediately discarded. Always use a non-const reference.

## When to use this

Overload `operator<<` whenever you want a human-readable representation of an object in any stream context — printing to the console, logging to a file, or building strings with `std::ostringstream`. Overload `operator>>` when your type is meaningful to parse from text input, as numeric value types, coordinate types, or configuration records often are.

For complex formatting needs (multiple output modes, locale-sensitive formatting), a dedicated `print()` method may be cleaner. But for types where one obvious string representation exists, I/O operator overloading keeps calling code clean and idiomatic.

## The idea

A temporary object is an object that has no name — it is created on-the-fly as part of an expression, used immediately, and then destroyed at the end of that expression (or the end of the statement). You have been creating temporaries with fundamental types without noticing: the literal `5` in `int x = 5 + 3;` is a temporary integer. With classes, the same concept applies: you can construct an object, pass it to a function, and let it evaporate, all without ever giving it a name or a variable declaration.

Temporaries make code terser. Instead of declaring a named variable just to pass it once, you construct the object right at the call site.

## How it works

Any time you write a constructor call as an expression rather than as an initializer for a named variable, you get a temporary:

```cpp
#include <iostream>

class Point {
    int m_x;
    int m_y;
public:
    Point(int x, int y) : m_x{ x }, m_y{ y } {}
    int x() const { return m_x; }
    int y() const { return m_y; }
};

void printPoint(const Point& p) {
    std::cout << p.x() << ", " << p.y() << "\n";
}

int main() {
    printPoint(Point{ 3, 4 });  // temporary Point — no variable needed
}
```

`Point{ 3, 4 }` constructs a temporary `Point`, passes it to `printPoint` as a `const` reference, and the temporary is destroyed after `printPoint` returns.

Temporaries can also be used directly as part of an expression with member access:

```cpp
int main() {
    // Access a member of a temporary without naming the object
    std::cout << Point{ 7, 2 }.x() << "\n";  // prints 7
}
```

The key rule about lifetime: a temporary's lifetime ends at the semicolon of the full expression in which it was created (in most cases). Binding a temporary to a `const` reference extends its lifetime to the lifetime of the reference, but binding to a non-const reference is not allowed.

```cpp
const Point& ref = Point{ 1, 2 };  // lifetime extended — ref is valid here
// Point{ 1, 2 } lives as long as ref does

Point& bad = Point{ 1, 2 };  // compile error — cannot bind temporary to non-const ref
```

Temporaries can also be created with value initialization syntax — calling a constructor with no arguments:

```cpp
int main() {
    std::cout << Point{ 0, 0 }.x();  // temporary with explicit zero values
}
```

## Common mistakes

**Mistake 1: Trying to bind a temporary to a non-const reference.**

```cpp
void addOne(Point& p) { /* ... */ }

addOne(Point{ 5, 6 });  // compile error
```

A temporary is an rvalue. Non-const lvalue references can only bind to lvalues (named objects). If `addOne` needs to modify its argument and the caller wants to use a temporary, the design should be reconsidered — either pass by value, or bind to a `const` reference (read-only).

**Mistake 2: Storing the address of a temporary.**

```cpp
const Point* p = &Point{ 3, 4 };  // dangerous
// Point{ 3, 4 } is destroyed at the semicolon
// p now points to a destroyed object — undefined behavior
```

Taking the address of a temporary and storing it outlives the temporary's lifetime. Use a named variable or a `const` reference (which extends lifetime) instead.

**Mistake 3: Expecting a temporary to survive past the statement.**

```cpp
const int& val = Point{ 10, 20 }.x();  // val refers to a copy returned by value
// This works because x() returns by value, producing a temporary int
// that is lifetime-extended by the const int& binding.
// But beware: this pattern is subtle and easy to get wrong.
```

The takeaway: temporaries in C++ have short, well-defined lifetimes. Rely on them only for single-expression use unless you bind to a `const` reference.

## When to use this

Temporaries are ideal when you need an object for a single expression: passing to a function, calling one member function, or using in an arithmetic expression. They eliminate the clutter of single-use named variables.

If you find yourself writing `ClassName temp{ args }; someFunction(temp);` and `temp` is never used again, you can usually replace it with `someFunction(ClassName{ args });`. This is especially common in print functions and assertions.

Do not use temporaries when you need to modify the object or refer to it multiple times — give it a name in those cases. Clear code with a named variable is better than clever code with an anonymous temporary.

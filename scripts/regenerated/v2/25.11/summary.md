## The idea

You already know how to overload `operator<<` for a single class so you can write `std::cout << myObject`. The challenge with an inheritance hierarchy is that `operator<<` cannot be a virtual member function — it must be a free function (a non-member) because the left operand is `std::ostream&`. Since free functions cannot be virtual, the standard trick of `operator<<` calling a virtual member function does not apply directly.

The solution uses a small but important pattern: define a single non-member `operator<<` that calls a virtual member function, usually named `print` or `toString`, which derived classes can override. The operator delegates the real work to the virtual function, letting polymorphism handle the rest. One free function handles every class in the hierarchy; each class controls its own output through its own `print` override.

This pattern combines two techniques you already know — virtual dispatch from chapter 25 and operator overloading from chapter 21 — into a clean, extensible design.

## How it works

Start with a base class that has a virtual `print` function:

```cpp
#include <iostream>

class Shape {
public:
    virtual void print(std::ostream& out) const {
        out << "Shape";
    }
    virtual ~Shape() = default;

    // non-member operator<< declared as friend so it can call print
    friend std::ostream& operator<<(std::ostream& out, const Shape& s) {
        s.print(out);
        return out;
    }
};
```

The single `operator<<` takes a `const Shape&`. Because it takes a reference, it binds to any derived class without slicing. When it calls `s.print(out)`, virtual dispatch selects the correct override.

Derived classes override only `print`:

```cpp
class Circle : public Shape {
    double radius_;
public:
    Circle(double r) : radius_(r) {}
    void print(std::ostream& out) const override {
        out << "Circle(r=" << radius_ << ")";
    }
};

class Rect : public Shape {
    double w_, h_;
public:
    Rect(double w, double h) : w_(w), h_(h) {}
    void print(std::ostream& out) const override {
        out << "Rect(" << w_ << "x" << h_ << ")";
    }
};
```

Now the same `operator<<` works for all three types:

```cpp
int main() {
    Shape s;
    Circle c{3.0};
    Rect r{4.0, 5.0};
    Shape* shapes[3] = {&s, &c, &r};
    for (int i = 0; i < 3; ++i)
        std::cout << *shapes[i] << "\n";
}
```

Output:
```
Shape
Circle(r=3)
Rect(4x5)
```

The `operator<<` is defined in the base class once. New derived classes just override `print` — they never need to touch `operator<<` again.

A derived class that wants to include its base class's output can call the base `print` explicitly:

```cpp
void print(std::ostream& out) const override {
    Shape::print(out);            // prints "Shape"
    out << " + Circle(r=" << radius_ << ")";
}
```

## Common mistakes

**Mistake 1: Defining operator<< in derived classes instead of the base.**

```cpp
// Wrong: each derived class redefines operator<<
std::ostream& operator<<(std::ostream& out, const Circle& c) { ... }
std::ostream& operator<<(std::ostream& out, const Rect& r) { ... }
```

This seems to work for direct use (`std::cout << circle;`) but breaks through a base pointer — `std::cout << *shapes[i];` still calls the base version because the operator is resolved at compile time based on the static type `Shape`. Moving the dispatch into a virtual `print` function is the fix.

**Mistake 2: Making the operator take the base by value, causing slicing.**

```cpp
std::ostream& operator<<(std::ostream& out, Shape s) { ... }  // slicing!
```

When a derived object is passed here, it is sliced to a `Shape`. Always take the base class parameter by `const&`.

**Mistake 3: Forgetting the `friend` declaration when print is private.**

```cpp
class Shape {
    virtual void print(std::ostream& out) const { ... }  // private
    // operator<< cannot access print!
};
```

If `print` is private, the free `operator<<` cannot call it unless it is declared as a `friend`. Make `print` either `public` or declare the operator as a friend.

## When to use this

Use the virtual-`print`-called-by-`operator<<` pattern whenever you have a polymorphic hierarchy where objects should be printable via `std::cout`. It keeps the streaming interface unified (one operator) while allowing each derived type full control over its output format.

In practice, if you add a new derived class to the hierarchy, all you need to do is override `print` and the class immediately works with `std::cout`, streams to files, and any other `std::ostream`. No changes to caller code are needed.

The same delegation pattern applies to other operations that must be both polymorphic and work through the operator or free-function interface. For example, if you want `==` to compare two hierarchy objects polymorphically, you can make `print` and the operator pattern the model: a virtual `equals(const Base&)` member is called by a non-member `operator==`. The general rule is that any free function that needs polymorphic behavior should call a virtual member function that derived classes can override.

One practical detail: because `print` is called through a `const` reference, its signature must be `void print(std::ostream& out) const`. The `const` qualifier is non-negotiable — omitting it means the function has a different signature and does not override the base's `virtual void print(std::ostream&) const`. The compiler will silently generate the wrong call, or with `-Wall` it will warn about `hides overloaded virtual function`. Marking the override with `override` catches this immediately.

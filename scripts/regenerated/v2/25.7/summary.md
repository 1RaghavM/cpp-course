## The idea

Consider a `Shape` class hierarchy where every shape must be able to report its area. The base class `Shape` could provide a default `area()` that returns zero, but that is meaningless — no real shape has a zero area. What you want is for `Shape` to declare "every Shape must have an `area()`, but I am not able to define what it returns." A pure virtual function does exactly that: it declares a contract without supplying an implementation.

When a class contains at least one pure virtual function it becomes an abstract base class. You cannot instantiate an abstract class — the compiler refuses. Any class that derives from it and does not override every pure virtual function remains abstract itself. Only when a derived class supplies a real implementation for every pure virtual function does it become a concrete class that you can instantiate. This forces the hierarchy to behave correctly: every object you can actually create is guaranteed to satisfy the contract.

An interface class takes this a step further. It contains nothing but pure virtual functions (and usually a virtual destructor). It has no data members and no non-virtual functions. It acts purely as a list of obligations that concrete classes must fulfill. Interface classes model capabilities — things an object can do — rather than what an object is.

## How it works

Declare a pure virtual function by placing `= 0` after the function signature:

```cpp
#include <iostream>

class Shape {
public:
    virtual double area() const = 0;   // pure virtual
    virtual ~Shape() = default;
};
```

Attempting `Shape s;` is now a compile error: "cannot instantiate abstract class." You must derive from `Shape` and implement `area()`:

```cpp
class Circle : public Shape {
    double radius_;
public:
    Circle(double r) : radius_(r) {}
    double area() const override { return 3.14159 * radius_ * radius_; }
};

class Square : public Shape {
    double side_;
public:
    Square(double s) : side_(s) {}
    double area() const override { return side_ * side_; }
};
```

Now `Circle` and `Square` are concrete. You can store them through a `Shape*` and call `area()` polymorphically:

```cpp
int main() {
    Circle c{3.0};
    Square s{4.0};
    Shape* shapes[2] = {&c, &s};
    for (int i = 0; i < 2; ++i)
        std::cout << shapes[i]->area() << "\n";
}
```

Output: `28.27431` and `16`.

An interface class has only pure virtual functions and a virtual destructor:

```cpp
class Printable {
public:
    virtual void print() const = 0;
    virtual ~Printable() = default;
};

class Saveable {
public:
    virtual bool save(const std::string& path) const = 0;
    virtual ~Saveable() = default;
};
```

A class can implement multiple interface classes because they impose no conflicting data or behavior:

```cpp
class Document : public Printable, public Saveable {
    std::string content_;
public:
    Document(const std::string& c) : content_(c) {}
    void print() const override { std::cout << content_ << "\n"; }
    bool save(const std::string& path) const override {
        // would write to disk; return true for now
        return true;
    }
};
```

`Document` fulfills both contracts. A `Printable*` can hold a `Document` and call `print()`; a `Saveable*` can hold a `Document` and call `save()`.

Pure virtual functions may still have an implementation defined outside the class body (useful for providing a default that derived classes can call via `Base::func()`), but providing an implementation is optional and uncommon.

## Common mistakes

**Mistake 1: Forgetting to implement a pure virtual function in a derived class.**

```cpp
class Rectangle : public Shape {
    double w_, h_;
public:
    Rectangle(double w, double h) : w_(w), h_(h) {}
    // forgot to override area()!
};

Rectangle r{3.0, 4.0};  // compile error: abstract class
```

The compiler reports that `Rectangle` is abstract because `area()` was never overridden. The fix is to implement every pure virtual function declared in every base class in the hierarchy.

**Mistake 2: Calling a pure virtual function on the abstract base directly.**

```cpp
Shape s;           // error: abstract class
s.area();          // doubly wrong
Shape* p = new Shape(); // still an error
```

You cannot create an instance of an abstract class in any way, including via `new`. Pointers and references to an abstract base are perfectly fine; objects of it are not.

**Mistake 3: Confusing an abstract class for an interface class.**

An abstract class can have data members, constructors, and non-virtual member functions alongside its pure virtual functions. An interface class intentionally has none of those. Mixing data into what should be a pure interface makes multiple inheritance harder and complicates the design. Keep interfaces lean.

## When to use this

Use a pure virtual function whenever a base class must declare a capability that every derived class must implement but that the base itself has no meaningful way to define. Common examples include `area()` on geometric shapes, `serialize()` on objects that write to disk, and `update()` on game entities.

Use an interface class when you want to describe a capability that unrelated classes share — like `Printable` or `Comparable` — without forcing them into a common inheritance hierarchy that carries data or behavior. A class can inherit from many interface classes with no structural conflict.

Avoid pure virtual functions when a sensible default exists in the base; use a regular `virtual` function with an implementation in that case. The pure virtual form is the right choice when there is no reasonable default and leaving it unimplemented would be actively wrong.

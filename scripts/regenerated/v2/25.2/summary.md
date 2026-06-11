## The idea

In the previous lesson you saw that a base pointer can hold the address of a derived object, but calling a non-virtual function on that pointer always dispatches to the base-class version. That is often the wrong behavior. Suppose you have a `Shape` hierarchy and a `Shape*` that might point to a `Circle` or a `Rectangle`. When you call `area()` through that pointer, you want the right formula — the circle's formula when the object is a circle, the rectangle's formula when the object is a rectangle.

This is polymorphism: the ability to call one function on many types and have each type respond in its own way. In C++, you get this behavior by marking a base-class function `virtual`. Once a function is virtual, the runtime looks at the actual type of the object — not the declared type of the pointer — and dispatches to the correct override. The decision happens at runtime, not at compile time.

## How it works

Declaring a function `virtual` in the base class is all you need to do. Any class that overrides that function (with the same signature) will have its version called when the function is invoked through a base pointer or reference.

```cpp
#include <iostream>

class Shape {
public:
    virtual double area() const { return 0.0; }
};

class Circle : public Shape {
public:
    double radius;
    Circle(double r) : radius(r) {}
    double area() const { return 3.14159 * radius * radius; }
};

class Rectangle : public Shape {
public:
    double w, h;
    Rectangle(double w, double h) : w(w), h(h) {}
    double area() const { return w * h; }
};

int main() {
    Circle c{5.0};
    Rectangle r{4.0, 3.0};

    Shape* shapes[2] = { &c, &r };
    for (int i = 0; i < 2; ++i) {
        std::cout << shapes[i]->area() << "\n";
    }
}
```

Output:
```
78.5397
12
```

Without `virtual`, both calls would print `0`. With `virtual`, each call finds the actual type of the pointed-to object at runtime and dispatches to that type's `area()`.

Polymorphism also works with references:

```cpp
void printArea(const Shape& s) {
    std::cout << "Area: " << s.area() << "\n";
}

int main() {
    Circle c{2.0};
    Rectangle r{3.0, 4.0};
    printArea(c);   // Area: 12.5664
    printArea(r);   // Area: 12
}
```

A single function handles any `Shape` subtype, present or future. Adding a new `Triangle` class with its own `area()` override requires no changes to `printArea`.

An override does not have to call the base version, but it can use the `Shape::area()` syntax if it needs the base behavior. The base version is called through a scoped name, not through a pointer, so it never re-dispatches:

```cpp
class LoggedCircle : public Circle {
public:
    LoggedCircle(double r) : Circle(r) {}
    double area() const {
        std::cout << "[computing area]\n";
        return Circle::area();   // explicit base call, no virtual dispatch
    }
};
```

## Common mistakes

**Mistake 1: Forgetting `virtual` and wondering why the wrong function is called.**

```cpp
class Animal {
public:
    void speak() const { std::cout << "...\n"; }  // not virtual
};
class Dog : public Animal {
public:
    void speak() const { std::cout << "Woof!\n"; }
};

Dog d;
Animal* p = &d;
p->speak();   // prints "..." — Animal::speak, not Dog::speak
```

Without `virtual`, the compiler uses the pointer's static type (`Animal*`) to resolve the call. Adding `virtual` in front of `void speak()` in `Animal` fixes this — it costs nothing at the call site.

**Mistake 2: Different signatures do not override.**

```cpp
class Shape {
public:
    virtual double area() const { return 0.0; }
};
class Circle : public Shape {
public:
    double radius;
    Circle(double r) : radius(r) {}
    double area() { return 3.14159 * radius * radius; }  // missing const!
};
```

`area()` in `Circle` drops `const`. The compiler sees this as a new, unrelated function — it does not override `Shape::area()`. A `Shape*` pointing to a `Circle` still calls `Shape::area()` and returns `0`. Lesson 25.3 shows how `override` catches exactly this mistake at compile time.

**Mistake 3: Calling a virtual function in a constructor.**

```cpp
class Base {
public:
    Base() { greet(); }          // virtual call during construction
    virtual void greet() const { std::cout << "Base\n"; }
};
class Derived : public Base {
public:
    void greet() const override { std::cout << "Derived\n"; }
};

Derived d;   // prints "Base", not "Derived"
```

During a constructor, the object's virtual table only knows about the class being constructed at that moment. The derived override is not yet set up. This is a real trap — the call silently dispatches to the base version.

## When to use this

Use virtual functions when you have a hierarchy of related types and you want a single interface — usually through a base pointer or reference — to trigger the right behavior for whichever concrete type happens to be stored there at runtime. This is the core of runtime polymorphism in C++. If you always know the concrete type at compile time and never access objects through a base pointer, virtual functions add overhead for no benefit — prefer regular functions or function overloads in that case. Virtual functions become essential the moment you store mixed derived types in the same container or pass objects to functions that should not need to know the specific subtype.

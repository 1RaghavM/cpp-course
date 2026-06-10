## The idea

When you override a virtual function in a derived class, it is easy to accidentally write a slightly different signature — a missing `const`, a different parameter type, a different return type. The compiler silently treats it as a new, unrelated function. Your override does nothing, and you spend hours debugging. C++11 introduced two specifiers to prevent this: `override` and `final`.

`override` tells the compiler: "I intend for this function to override a virtual function in my base class — please confirm it actually does." If it does not, the compiler reports an error before you even run the program. `final` prevents further overriding and can also lock down an entire class. Covariant return types are a related feature: an override is allowed to return a pointer or reference to a more-derived type than the base declared, which is occasionally useful when the derived class knows more specifically what it returns.

## How it works

The `override` specifier goes after the function signature, before the body:

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
    double area() const override { return 3.14159 * radius * radius; }
};
```

If you accidentally wrote `double area() override` (without `const`), the compiler would stop with an error saying no base-class virtual function matches. That is the whole point — the compiler catches the mismatch immediately.

The `final` specifier prevents any further derived class from overriding the function:

```cpp
class Ellipse : public Shape {
public:
    double a, b;
    Ellipse(double a, double b) : a(a), b(b) {}
    double area() const override final { return 3.14159 * a * b; }
};

class SpecialEllipse : public Ellipse {
public:
    SpecialEllipse(double a, double b) : Ellipse(a, b) {}
    // double area() const override { ... }  // COMPILE ERROR: area is final in Ellipse
};
```

You can also mark an entire class `final` to prevent inheritance at all:

```cpp
class ConcreteLogger final {
    // no class can derive from ConcreteLogger
};
// class MyLogger : public ConcreteLogger {};  // compile error
```

Covariant return types allow an override to return a pointer or reference to a derived type while still satisfying the virtual dispatch contract:

```cpp
#include <iostream>

class Animal {
public:
    virtual Animal* clone() const {
        return new Animal(*this);
    }
    virtual void speak() const { std::cout << "...\n"; }
};

class Dog : public Animal {
public:
    Dog* clone() const override {   // covariant: Dog* instead of Animal*
        return new Dog(*this);
    }
    void speak() const override { std::cout << "Woof!\n"; }
};

int main() {
    Dog d;
    Dog* copy = d.clone();   // no cast needed because clone() returns Dog*
    copy->speak();
    delete copy;
}
```

Without covariant return types, `Dog::clone` would have to return `Animal*`, requiring the caller to cast back to `Dog*`. With covariance, the derived class returns the more specific type, and code that calls `clone()` on a `Dog*` directly gets a `Dog*` without casting.

## Common mistakes

**Mistake 1: Writing `override` without changing the mismatched signature.**

```cpp
class Base {
public:
    virtual void render() const {}
};
class Derived : public Base {
public:
    void render() override {}   // missing const — compiler ERROR
};
```

The compiler error message says something like "function does not override any base class virtual function." The fix is to add `const` to the derived version (or to find and fix whatever the mismatch actually is). Without `override`, this silently creates a new, unrelated `render()` in `Derived`.

**Mistake 2: Using `final` on non-virtual functions.**

`final` only makes sense on virtual functions (or on a class). Applying it to a non-virtual member function is a compile error.

```cpp
class Foo {
public:
    void bar() final {}   // error: 'final' can only be applied to virtual functions
};
```

**Mistake 3: Covariant return type with a value type instead of a pointer or reference.**

```cpp
class Base {
public:
    virtual Base clone() const;   // returning by value
};
class Derived : public Base {
public:
    Derived clone() const override;   // error: covariant return only works with pointers/references
};
```

Covariant return types apply only to pointer and reference return types. Returning by value does not qualify — the derived `clone()` is not a valid override and the compiler reports an error.

## When to use this

Always write `override` on every derived function that you intend to override. It has zero runtime cost and turns silent logic bugs into compile-time errors. Use `final` on functions you deliberately want to seal — either to express design intent ("nothing should change this") or as an optimization hint to the compiler. Use `final` on a class only when you are sure no future subclass should exist. Covariant return types are useful when the caller needs a derived pointer directly and casting would be awkward, but the pattern is rare — use it only when the concrete return type genuinely adds value over the base return type.

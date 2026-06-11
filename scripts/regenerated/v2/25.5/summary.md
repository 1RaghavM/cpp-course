## The idea

Every time you call a function in C++, the program has to know which machine-code address to jump to. The question is when that decision is made. With early binding (also called static binding), the decision is made by the compiler before the program runs — the function address is baked directly into the call instruction at compile time. With late binding (also called dynamic binding), the decision is deferred until runtime — the program looks up the right function address in a table while it is executing.

Think of the difference like a GPS system versus memorizing directions. Early binding is like memorizing the route before you leave: fast, but inflexible — if the road changes, your memorized directions are wrong. Late binding is like a GPS that recalculates in real time: slightly slower per turn but adapts to whatever is actually on the road.

In C++, regular (non-virtual) function calls use early binding. Virtual function calls use late binding. Both have their place, and understanding the tradeoff helps you use each appropriately.

## How it works

Early binding happens when the compiler can determine the exact function to call based on the static types involved. This covers all non-virtual member functions, free functions, overloaded functions, and function templates:

```cpp
#include <iostream>

void greet() { std::cout << "Hello\n"; }

class Printer {
public:
    void print() const { std::cout << "Printing\n"; }
};

int main() {
    greet();           // early binding: address known at compile time
    Printer p;
    p.print();         // early binding: p's type is statically Printer
}
```

The call `p.print()` is resolved at compile time. The compiler writes the address of `Printer::print` directly into the binary.

Late binding is used for virtual function calls through pointers or references. The compiler cannot know the actual runtime type of the pointed-to object, so it emits code to look up the function address at runtime:

```cpp
#include <iostream>

class Animal {
public:
    virtual void speak() const { std::cout << "...\n"; }
};

class Dog : public Animal {
public:
    void speak() const override { std::cout << "Woof!\n"; }
};

void callSpeak(const Animal& a) {
    a.speak();   // late binding: which speak() depends on runtime type
}

int main() {
    Dog d;
    callSpeak(d);   // prints "Woof!"
}
```

Inside `callSpeak`, the compiler cannot tell whether `a` is an `Animal`, a `Dog`, or some future derived type. It generates code to look up the correct `speak` in a virtual function table at runtime.

You can force early binding on a virtual call by using the scope-resolution operator:

```cpp
class Dog : public Animal {
public:
    void speak() const override {
        Animal::speak();    // explicit early binding — always calls Animal::speak
        std::cout << "Woof!\n";
    }
};
```

This skips virtual dispatch and calls `Animal::speak` directly, which is useful when an override wants to extend the base behavior rather than replace it entirely.

The cost difference between early and late binding: early binding is a direct call (single instruction). Late binding adds one pointer dereference (to find the vtable) plus one indirect call through the looked-up address. On modern hardware this is typically a single extra memory read — negligible for most code, but relevant in extremely tight inner loops.

## Common mistakes

**Mistake 1: Expecting late binding when calling a virtual function on a value (not a pointer or reference).**

```cpp
Animal a = Dog{};    // object slicing — d is copied into a as an Animal!
a.speak();           // calls Animal::speak — early binding on a value type
```

Late binding only works through pointers and references. When you assign a `Dog` to an `Animal` value, the derived portion is sliced off. `a` is a pure `Animal` object, and calling `speak()` on it uses early binding to `Animal::speak`. This is object slicing, covered in lesson 25.9.

**Mistake 2: Thinking early binding is always faster.**

For straightforward code, early binding is indeed a direct call. But inlining is often more important than call overhead. Virtual functions cannot be inlined in general (since the target is unknown at compile time). For methods called millions of times in a loop, the inability to inline can matter more than the single indirect call itself.

**Mistake 3: Calling virtual functions in constructors and expecting late binding.**

```cpp
class Base {
public:
    Base() { init(); }          // calls virtual during construction
    virtual void init() { std::cout << "Base::init\n"; }
};
class Derived : public Base {
public:
    void init() override { std::cout << "Derived::init\n"; }
};

Derived d;   // prints "Base::init" — vtable is not yet set to Derived during Base ctor
```

During construction, the virtual table pointer is set to the class currently being constructed. The `Derived` overrides are not yet registered when `Base`'s constructor runs. This is the same trap mentioned in lesson 25.2.

## When to use this

You do not usually choose between early and late binding explicitly — the choice follows from whether a function is `virtual`. Use virtual functions (late binding) when you genuinely need runtime polymorphism: when the same code must handle different derived types through a common interface, and the type is not known at compile time. Use regular functions (early binding) everywhere else — they are simpler, often faster, and easier for the compiler to optimize and inline. Understanding the binding model helps you predict behavior, especially in edge cases like constructors, value semantics, and explicit scope-resolution calls.

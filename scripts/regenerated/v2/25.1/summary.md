## The idea

Imagine you have a `Shape` base class and two derived classes: `Circle` and `Rectangle`. In previous chapters you learned how to create objects of these types and call their member functions. But what if you have a collection of mixed shapes and want to process them all through a single function? The key insight is that C++ lets you point at or reference a derived object using a pointer or reference to its base class.

Think of it like a job description. A manager who accepts "an Employee" can accept any specific employee — whether they are a developer, accountant, or HR specialist — because all of them are employees. A `Shape*` pointer can hold the address of a `Circle` or a `Rectangle` because both are shapes. This relationship is the foundation of runtime polymorphism and everything in this chapter builds on it.

## How it works

The fundamental rule: a pointer or reference to a base class can refer to any object of a class derived from that base. No cast is required — the conversion is implicit and safe.

```cpp
#include <iostream>

class Animal {
public:
    std::string name;
    Animal(std::string n) : name(n) {}
    void describe() const {
        std::cout << "I am an animal named " << name << "\n";
    }
};

class Dog : public Animal {
public:
    Dog(std::string n) : Animal(n) {}
    void fetch() const {
        std::cout << name << " fetches the ball!\n";
    }
};

int main() {
    Dog d{"Rex"};
    Animal* ptr = &d;      // base pointer points to derived object
    Animal& ref = d;       // base reference binds to derived object
    ptr->describe();       // calls Animal::describe()
    ref.describe();        // calls Animal::describe()
}
```

Through a base pointer or reference, you can only access members that are declared in the base class. The pointer `ptr` knows nothing about `fetch()` — that member belongs to `Dog`, but `ptr`'s type is `Animal*`, so `ptr->fetch()` would be a compile error.

This becomes powerful when you write functions that take a base pointer or reference:

```cpp
void printAnimal(const Animal& a) {
    std::cout << "Animal: " << a.name << "\n";
}

int main() {
    Dog d{"Rex"};
    Animal a{"Generic"};
    printAnimal(a);   // works — Animal is an Animal
    printAnimal(d);   // works — Dog is also an Animal
}
```

A single function `printAnimal` works for both `Animal` and all classes derived from it, now and in the future. You do not need to write one overload per type.

The same pattern applies to pointer arrays or containers:

```cpp
#include <iostream>

class Shape {
public:
    std::string color;
    Shape(std::string c) : color(c) {}
};

class Circle : public Shape {
public:
    double radius;
    Circle(std::string c, double r) : Shape(c), radius(r) {}
};

class Rectangle : public Shape {
public:
    double width, height;
    Rectangle(std::string c, double w, double h)
        : Shape(c), width(w), height(h) {}
};

int main() {
    Circle c{"red", 5.0};
    Rectangle r{"blue", 4.0, 3.0};

    Shape* shapes[2] = { &c, &r };

    for (int i = 0; i < 2; ++i) {
        std::cout << "Shape color: " << shapes[i]->color << "\n";
    }
}
```

Both a `Circle` and a `Rectangle` fit into a `Shape*` slot. The loop processes them uniformly through the base-class interface.

## Common mistakes

**Mistake 1: Trying to call derived-only members through a base pointer.**

```cpp
Dog d{"Rex"};
Animal* ptr = &d;
ptr->fetch();   // compile error: 'class Animal' has no member named 'fetch'
```

The type of the pointer — not the type of the object it points to — determines which members are accessible at compile time. `ptr` is an `Animal*`, so only `Animal`'s members are visible. To call `fetch`, you need a `Dog*` or `Dog&`.

**Mistake 2: Assigning a base object to a derived pointer.**

```cpp
Animal a{"Generic"};
Dog* dptr = &a;   // compile error: cannot convert 'Animal*' to 'Dog*'
```

The implicit conversion only flows one direction: derived-to-base (called an upcast). Base-to-derived (a downcast) requires an explicit cast and comes with risks that chapter 25 covers later with `dynamic_cast`.

**Mistake 3: Expecting the derived version of a regular (non-virtual) function to be called.**

```cpp
class Animal {
public:
    void speak() const { std::cout << "..."; }
};
class Dog : public Animal {
public:
    void speak() const { std::cout << "Woof!"; }
};

Dog d;
Animal* ptr = &d;
ptr->speak();   // prints "..." — calls Animal::speak, NOT Dog::speak
```

With a plain (non-virtual) function, the call resolves based on the static type of the pointer, which is `Animal*`. The object is really a `Dog`, but the compiler does not know to look for `Dog::speak` unless you declare `speak` as `virtual`. Lesson 25.2 covers virtual functions.

## When to use this

You reach for base-class pointers and references whenever you want one function, container, or algorithm to work with a family of related types without knowing which specific type it is. Writing `void process(Shape& s)` instead of separate overloads for every shape type is idiomatic C++. If you need to manipulate only one specific derived type and you already know which one, use a pointer or reference of that derived type directly — the generality is only useful when the exact type varies at runtime.

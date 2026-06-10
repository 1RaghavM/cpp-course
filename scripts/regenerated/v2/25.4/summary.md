## The idea

You have a `Base*` pointer holding a dynamically allocated `Derived` object. When you call `delete` on that pointer, which destructor runs? Without any special care, only the `Base` destructor runs — the `Derived` destructor is never called. Any resources that `Derived` owns (heap memory, open files, locks) are leaked. This is a silent, frequently occurring bug in polymorphic hierarchies.

The fix is simple and always required: declare the base class destructor `virtual`. With a virtual destructor, `delete` through a base pointer correctly dispatches to the most-derived destructor first, then up the chain to the base. The same virtual dispatch mechanism that makes `virtual` functions work applies to destructors.

## How it works

A destructor without `virtual`:

```cpp
#include <iostream>

class Base {
public:
    ~Base() { std::cout << "~Base\n"; }
};

class Derived : public Base {
public:
    ~Derived() { std::cout << "~Derived\n"; }
};

int main() {
    Base* p = new Derived{};
    delete p;   // only prints "~Base" — ~Derived never runs!
}
```

Adding `virtual` to the base destructor:

```cpp
#include <iostream>

class Base {
public:
    virtual ~Base() { std::cout << "~Base\n"; }
};

class Derived : public Base {
public:
    ~Derived() override { std::cout << "~Derived\n"; }
};

int main() {
    Base* p = new Derived{};
    delete p;   // prints "~Derived" then "~Base" — correct!
}
```

Now both destructors run in the right order. The derived destructor runs first, then the base destructor — the reverse of construction order.

You can also use `= default` to declare a virtual destructor without writing a body, which is the idiomatic choice when the destructor has no special work to do:

```cpp
class Shape {
public:
    virtual ~Shape() = default;
    virtual double area() const = 0;
};
```

This satisfies the requirement while adding no code noise.

Regarding virtual assignment: `operator=` can be made virtual, but this is rarely done in practice and introduces complexity (the base `operator=` cannot know which derived type to copy into). A better pattern is to define `operator=` in each class without making it virtual, because assignment between unrelated derived types should simply not compile. The rule of thumb: make the destructor virtual, leave assignment non-virtual.

The related concept of "disabling virtualization" is the explicit base-class call. When you write `Base::foo()` inside a derived function, you call the base version directly — skipping virtual dispatch entirely. This is not often needed for destructors (they chain automatically), but it is used when an override wants to extend rather than replace the base behavior.

## Common mistakes

**Mistake 1: Omitting `virtual` on the destructor and deleting through a base pointer.**

This is undefined behavior when the object is a derived type. Resource leaks and corrupted memory are the typical symptoms. The rule is simple: if a class has any virtual function, its destructor must be virtual too.

```cpp
class Animal {
public:
    virtual void speak() const {}
    ~Animal() {}   // WRONG — should be virtual ~Animal()
};
class Dog : public Animal {
    std::string name;
public:
    Dog(std::string n) : name(n) {}
    ~Dog() {}   // never called when deleted via Animal*
};
```

**Mistake 2: Making destructors `virtual` in classes not intended for polymorphic use.**

If you never delete through a base pointer and never intend the class to be subclassed, making the destructor `virtual` wastes memory (adds a vtable pointer to every instance). Only add `virtual ~T()` to classes in a hierarchy where pointer-based polymorphism is intended.

**Mistake 3: Expecting derived destructors to be called in construction order.**

Destructors always run in reverse construction order: most-derived first, then each base in reverse order of construction. Thinking they run in the same direction as constructors leads to confusion when the destructor of a base accesses a member that was already destroyed by a derived destructor.

## When to use this

Whenever you design a base class with any virtual functions, add `virtual ~Base() = default` (or a custom body if needed). This is a hard rule with essentially no exceptions in production code. The cost is one pointer per object (the vtable pointer, which is already there if you have other virtual functions) and one level of indirection on `delete`. That cost is negligible compared to the correctness guarantee. If you deliberately want to prevent anyone from inheriting and deleting through a base pointer, you can make the destructor `protected` and non-virtual, but that pattern is advanced and uncommon.

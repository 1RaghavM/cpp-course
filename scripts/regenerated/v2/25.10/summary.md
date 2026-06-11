## The idea

You have a `Base*` pointer that might be pointing at a `Derived` object. You want to call a function that exists only in `Derived`, not in `Base`. If you are wrong about the type — if the pointer actually points at something that is not a `Derived` — you need to know that, rather than have the program crash or corrupt memory.

`dynamic_cast` is the tool for this. It performs a runtime check using the object's vtable (the type information stored there) to verify whether a cast is actually valid. If the cast is valid, you get a pointer or reference to the more-derived type and can call its specific functions. If the cast is not valid, a pointer cast returns `nullptr` and a reference cast throws `std::bad_cast`. Either way, you find out safely.

This runtime type checking is called RTTI — Run-Time Type Information. It is the mechanism that makes `dynamic_cast` possible. RTTI is only available for polymorphic classes (those with at least one virtual function), because the runtime type is stored alongside the vtable.

## How it works

The basic pointer cast: `dynamic_cast<Derived*>(base_ptr)`. If the object `base_ptr` points to is actually a `Derived` (or a class derived from `Derived`), the cast succeeds and you get a valid `Derived*`. Otherwise you get `nullptr`.

```cpp
#include <iostream>

class Animal {
public:
    virtual ~Animal() = default;
};

class Dog : public Animal {
public:
    void fetch() const { std::cout << "fetching!\n"; }
};

class Cat : public Animal {
public:
    void purr() const { std::cout << "purring!\n"; }
};

void tryDog(Animal* a) {
    Dog* d = dynamic_cast<Dog*>(a);
    if (d) {
        d->fetch();
    } else {
        std::cout << "not a Dog\n";
    }
}

int main() {
    Dog dog;
    Cat cat;
    tryDog(&dog);   // prints "fetching!"
    tryDog(&cat);   // prints "not a Dog"
}
```

The pattern is always: cast, check for `nullptr`, then use. Never skip the null check.

For references, the syntax is `dynamic_cast<Derived&>(base_ref)`. If the cast fails it throws `std::bad_cast` (from `<typeinfo>`), so you would wrap it in a try-catch when the type is uncertain. Because exceptions are outside this chapter's scope, the pointer form is typically safer for general use.

A second use of `dynamic_cast` is downcasting through a hierarchy to verify the concrete type before accessing derived-only functionality:

```cpp
#include <iostream>

class Vehicle { public: virtual ~Vehicle() = default; };
class Car : public Vehicle {
public:
    int doors_ = 4;
};
class Truck : public Vehicle {
public:
    int payload_ = 1000;
};

void inspect(Vehicle* v) {
    if (Car* c = dynamic_cast<Car*>(v)) {
        std::cout << "Car with " << c->doors_ << " doors\n";
    } else if (Truck* t = dynamic_cast<Truck*>(v)) {
        std::cout << "Truck with " << t->payload_ << "kg payload\n";
    }
}

int main() {
    Car car;
    Truck truck;
    inspect(&car);
    inspect(&truck);
}
```

The `if (Car* c = dynamic_cast<Car*>(v))` idiom — declaring the pointer inside the condition — is idiomatic C++ and limits the scope of `c` to the if-block.

`dynamic_cast` has a runtime cost because it inspects RTTI. For most programs this is negligible, but in performance-critical code it is worth noting.

## Common mistakes

**Mistake 1: Using `dynamic_cast` on a non-polymorphic class.**

```cpp
class Plain { int x; };
class Sub : public Plain { int y; };

Plain* p = new Sub;
Sub* s = dynamic_cast<Sub*>(p);  // compile error
```

`Plain` has no virtual functions, so it is not polymorphic and has no RTTI. `dynamic_cast` only works on polymorphic types. Add `virtual ~Plain() = default;` to fix this.

**Mistake 2: Not checking the result for `nullptr`.**

```cpp
Dog* d = dynamic_cast<Dog*>(some_animal);
d->fetch();   // crash if d is nullptr
```

If the cast returns `nullptr` and you dereference without checking, you get undefined behavior (usually a crash). Always verify the cast result before using the pointer.

**Mistake 3: Using `dynamic_cast` as a substitute for good virtual design.**

```cpp
void process(Animal* a) {
    if (Dog* d = dynamic_cast<Dog*>(a)) { d->fetchBall(); }
    else if (Cat* c = dynamic_cast<Cat*>(a)) { c->climbTree(); }
    else if (Bird* b = dynamic_cast<Bird*>(a)) { b->fly(); }
}
```

A long chain of `dynamic_cast` checks is a sign the hierarchy should have a virtual function instead. If every derived type has a different behavior for the same operation, that operation belongs in the base class as a virtual function. Reserve `dynamic_cast` for the cases where you genuinely need derived-only functionality that cannot be expressed through a virtual interface.

## When to use this

`dynamic_cast` is appropriate when you receive a pointer to a base class and need to access functionality that is specific to one derived type and that cannot reasonably be promoted to a virtual function in the base. A common example is a callback system where handlers of different concrete types need to do fundamentally different things.

Prefer virtual dispatch over `dynamic_cast` whenever the operation can be defined in the base class. When you must use `dynamic_cast`, always check the result, keep the cast-and-check block short, and prefer the pointer form over the reference form unless you are sure the cast will succeed.

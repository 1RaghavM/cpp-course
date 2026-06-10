## The idea

The previous lesson showed that the base class constructor always runs first. But you have not controlled *which* base constructor runs or *what arguments* it receives. When a base class has a constructor that requires arguments, the default behavior — calling the no-argument base constructor — does not work. You need a way for the derived constructor to pass initialization data up to the base.

C++ provides this through the **member initializer list**. You have already used the member initializer list to initialize your own members. The same syntax lets you call a specific base class constructor with arguments. This is the standard, idiomatic way to initialize base sub-objects.

## How it works

A member initializer list appears after the constructor's parameter list, separated by a colon. To invoke a specific base constructor, you use the base class name as if it were a member name.

```cpp
#include <iostream>
#include <string>

class Animal {
public:
    std::string name;
    int age;

    Animal(std::string n, int a) : name(n), age(a) {
        std::cout << "Animal(" << name << ", " << age << ")\n";
    }
};

class Dog : public Animal {
public:
    std::string breed;

    Dog(std::string n, int a, std::string b)
        : Animal(n, a),   // call Animal's constructor
          breed(b)        // initialize Dog's own member
    {
        std::cout << "Dog(" << breed << ")\n";
    }
};

int main() {
    Dog d("Rex", 3, "Husky");
}
```

Output:
```
Animal(Rex, 3)
Dog(Husky)
```

`Animal(n, a)` in the initializer list tells the compiler: "use the `Animal(std::string, int)` constructor to initialize the base sub-object." This runs before any part of `Dog`'s constructor body executes. `breed(b)` initializes the Dog-specific member in the same way as any other member.

If you do not name the base class in the initializer list, the base's **default constructor** (the one with no parameters) is called automatically. If the base has no default constructor, you get a compile error.

```cpp
class Vehicle {
public:
    std::string type;
    Vehicle(std::string t) : type(t) {}
    // no default constructor
};

class Car : public Vehicle {
public:
    int doors;
    Car(int d) : doors(d) {   // ERROR: Vehicle has no default constructor
    }
};
```

The fix is to name the base in the initializer list:

```cpp
Car(int d) : Vehicle("automobile"), doors(d) {}
```

The order of items in the initializer list follows the same rule you know from regular member initialization: the base sub-object is always initialized first (regardless of where it appears in your list), then members in declaration order.

```cpp
class Manager : public Employee {
public:
    int teamSize;
    Manager(std::string n, int a, int id, std::string dept, int ts)
        : Employee(n, a, id, dept),
          teamSize(ts)
    {}
};
```

## Common mistakes

**Mistake 1 — Assigning base members in the derived constructor body instead of the initializer list.**

```cpp
class Dog : public Animal {
public:
    std::string breed;
    Dog(std::string n, int a, std::string b) {
        name  = n;   // assignment, not initialization
        age   = a;   // assignment, not initialization
        breed = b;
    }
};
```

This compiles when `Animal` has a default constructor, but it first default-constructs the `Animal` sub-object (empty name, uninitialized age) and then assigns the values. If `Animal` has no default constructor, it is a compile error. The correct approach is always to use the initializer list to pass values to the base constructor.

**Mistake 2 — Assuming the order in the initializer list controls initialization order.**

The base sub-object is always initialized first, no matter where you place `Animal(...)` in the list. And own members are initialized in declaration order, not in the order written in the list. This does not change behavior in most cases, but if you initialize member B using member A in the list, and A is declared after B, you have a read-before-initialization bug.

**Mistake 3 — Calling the base constructor in the constructor body.**

```cpp
Dog(std::string n, int a, std::string b) : breed(b) {
    Animal(n, a);  // Wrong: this creates a temporary Animal, discards it
}
```

`Animal(n, a)` inside the constructor body creates a temporary, anonymous `Animal` object and immediately destroys it. It does NOT initialize the base sub-object. The base sub-object was already default-constructed. The only place to initialize the base sub-object is in the initializer list.

## When to use this

Any time a base class requires constructor arguments, the derived class must use the initializer list to forward those arguments. This is not optional — if the base has no default constructor, omitting the base from the initializer list is a compile error.

Even when the base does have a default constructor, prefer to explicitly call a named base constructor in the initializer list when you have initial values to provide. It is clearer and more efficient than assigning inside the body.

The initializer list form is the same pattern you use when a class contains other objects as members and those objects need construction arguments — inheritance just adds the base class to the list of things to initialize.

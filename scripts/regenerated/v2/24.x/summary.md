## The idea

Chapter 24 covered the full lifecycle of inheritance in C++ — from introducing the concept through multiple inheritance and controlling what a derived class exposes. Inheritance lets one class (the derived class) absorb all of another class's (the base class's) public and protected interface and data, then extend, restrict, or replace parts of it.

Think of inheritance as a *specialization* relationship: a `Manager` *is an* `Employee` with extra responsibilities. Every place an `Employee` is expected, a `Manager` can appear — it already has everything an `Employee` has, plus more.

The chapter moved through six sub-topics in a deliberate sequence: establishing what inheritance is and why it exists; seeing the syntax; understanding the construction order; learning how to initialize base sub-objects; controlling visibility through access specifiers; adding new members; calling inherited vs. replaced functions; hiding inherited functions through access changes and deletion; and finally the edge case of multiple inheritance.

## How it works

**The inheritance chain and construction order**

When you define `class Manager : public Employee`, the `Manager` object contains a complete `Employee` sub-object. Construction happens from the most-base class outward — `Employee` is constructed first, then `Manager`'s constructor body runs. Destruction runs in reverse. If the base class requires arguments, the derived constructor must provide them through its member-initializer list:

```cpp
class Employee {
    std::string name_;
    double salary_;
public:
    Employee(std::string n, double s) : name_{std::move(n)}, salary_{s} {}
    void print() const {
        std::cout << name_ << " $" << salary_ << "\n";
    }
};

class Manager : public Employee {
    int teamSize_;
public:
    Manager(std::string n, double s, int ts)
        : Employee{std::move(n), s}, teamSize_{ts} {}
    void print() const {
        Employee::print();   // call base version first
        std::cout << "Team: " << teamSize_ << "\n";
    }
};
```

**Inheritance and access specifiers**

Derived classes can only access `public` and `protected` members of the base. `private` members are inherited in the sense that they exist in the object, but the derived class code cannot name them — only the base's own member functions can.

The inheritance access specifier (`public`, `protected`, `private`) sets a ceiling on how the base's members appear in the derived class:

- `public` inheritance: base's public stays public, protected stays protected (most common — preserves the is-a relationship).
- `protected` inheritance: base's public and protected both become protected in the derived class.
- `private` inheritance: everything from the base becomes private in the derived class (models "implemented-in-terms-of", rarely used).

**Calling inherited functions and overriding without virtual**

Without `virtual`, a derived class's function with the same name *hides* the base's version for derived-type variables. The base's version is still reachable via the `Base::function()` scope qualifier. Without virtual, calling through a base pointer or reference always calls the base's version regardless of what the object actually is.

**Hiding inherited functionality**

A derived class can change a member's access level using a `using` declaration in the desired access section. It can completely remove an operation using `= delete`. Both are compile-time tools — they affect code that uses the derived type directly but can be bypassed through a base reference.

**Multiple inheritance**

A class can list more than one base: `class C : public A, public B`. Construction follows the base-class list order; destruction reverses it. If both bases define a member with the same name, any call on the derived class is ambiguous unless a scope qualifier or a derived-class override resolves it. Without virtual inheritance, two bases that share a common grandparent each bring their own copy of that grandparent's data — the diamond problem.

```cpp
class Flyable {
public:
    void fly() { std::cout << "flying\n"; }
};
class Swimmable {
public:
    void swim() { std::cout << "swimming\n"; }
};
class Duck : public Flyable, public Swimmable {
public:
    void quack() { std::cout << "quack\n"; }
};
```

## Common mistakes

**Forgetting to chain the base constructor in the initializer list**

When the base class has no default constructor, omitting the base from the derived class's initializer list is a compile error. Even when a default constructor exists, always initialize explicitly to make intent clear.

```cpp
class Manager : public Employee {
public:
    Manager(std::string n, double s, int ts)
        // WRONG if Employee has no default constructor:
        : teamSize_{ts}   // Employee constructor not called — compile error
    {}
};
```

**Expecting `private` base members to be accessible in the derived class**

Private members are truly private. The derived class cannot name them, even to read them. Use protected members for data the derived class must touch:

```cpp
class Employee {
    double salary_;   // private — derived class cannot access
};

class Manager : public Employee {
    void giveRaise(double amount) {
        salary_ += amount;   // compile error: 'salary_' is private in Employee
    }
};
```

**Calling a derived function through a base pointer and expecting it to dispatch to the derived version (without virtual)**

This is the most common conceptual error in this chapter. Without `virtual`, the function that runs is determined by the *static type* of the pointer or reference, not by the actual object type:

```cpp
Manager m{"Alice", 90000, 5};
Employee* ptr = &m;
ptr->print();   // calls Employee::print — NOT Manager::print (no virtual)
```

Virtual functions (covered in the next chapter) exist specifically to solve this problem.

## When to use this

Use `public` inheritance to model *is-a* relationships: a `Manager` is an `Employee`, a `Circle` is a `Shape`. Use `protected` inheritance sparingly — it is mostly useful when a class wants to reuse a base class's implementation without advertising an is-a relationship to the outside world. Avoid `private` inheritance in favor of composition (a member variable) when "implemented-in-terms-of" is the goal.

Use derived-function redefinition (hiding) when the derived class has a genuinely different implementation of the same operation. Add `= delete` to inherited functions that are meaningless or dangerous for the derived type. Use multiple inheritance cautiously — it shines when combining pure behavior classes, but adds complexity when bases share state.

## The idea

A derived class inherits all of a base class's public and protected member functions. But sometimes the derived class wants to provide its own version of an inherited function — not a separate function with a different name, but a *replacement* for the inherited one. When a derived class defines a function with the same name and parameters as a base class function, the derived version **hides** the base version for derived class objects.

This is not the same as virtual function overriding (which comes in a later chapter). Without `virtual`, when you call the function on a derived object, C++ uses the **static type** of the variable to decide which version to call. If the variable is declared as the derived type, the derived version runs. If it is declared as the base type, the base version runs, even if the object is actually derived. This lesson is about the non-virtual case.

There is also a pattern where the derived version does not fully replace the base but *extends* it — the derived function does additional work and then calls the base function explicitly using the `Base::functionName()` syntax.

## How it works

**Redefining an inherited function**

```cpp
#include <iostream>

class Animal {
public:
    void speak() {
        std::cout << "...\n";
    }
};

class Dog : public Animal {
public:
    void speak() {  // hides Animal::speak
        std::cout << "Woof!\n";
    }
};

int main() {
    Dog d;
    d.speak();        // calls Dog::speak → "Woof!"

    Animal a;
    a.speak();        // calls Animal::speak → "..."
}
```

When you have a `Dog` object and call `speak()`, the compiler finds `Dog::speak` in `Dog` first and uses that. `Animal::speak` is hidden — it still exists, but it is not reached through a plain `speak()` call on a `Dog`.

**Calling the base version explicitly**

Sometimes the derived version wants to do a little extra work and then delegate to the base:

```cpp
class Employee {
public:
    std::string name;
    double salary;

    Employee(std::string n, double s) : name(n), salary(s) {}

    void print() {
        std::cout << "Name: " << name << ", Salary: " << salary << "\n";
    }
};

class Manager : public Employee {
public:
    int teamSize;

    Manager(std::string n, double s, int ts)
        : Employee(n, s), teamSize(ts) {}

    void print() {
        Employee::print();          // call the base version explicitly
        std::cout << "Team: " << teamSize << "\n";
    }
};

int main() {
    Manager m("Alice", 90000, 5);
    m.print();
}
```

Output:
```
Name: Alice, Salary: 90000
Team: 5
```

`Employee::print()` runs first (base behavior), then the `Manager`-specific line is added. The `Base::function()` syntax lets you call the hidden base version explicitly at any time.

**The static type rule without virtual**

```cpp
int main() {
    Manager m("Bob", 80000, 3);

    Employee& ref = m;   // reference to base type, pointing at a Manager
    ref.print();         // calls Employee::print() — NOT Manager::print()
                         // because ref is declared as Employee&
}
```

Without `virtual`, the function that runs is determined by the *declared type of the variable*, not by the runtime type of the object. `ref` is declared as `Employee&`, so `Employee::print()` runs. This is a limitation that virtual functions (in a later chapter) address.

## Common mistakes

**Mistake 1 — Expecting the derived version to run through a base reference without virtual.**

```cpp
Animal* ptr = new Dog();  // base pointer, points to derived object
ptr->speak();             // calls Animal::speak — NOT Dog::speak (no virtual)
delete ptr;
```

Without `virtual` on `Animal::speak`, calling through a base pointer always calls the base version. This surprises learners who expect "smart" dispatch. This is exactly the problem virtual functions solve.

**Mistake 2 — Calling the base function without the scope qualifier, causing infinite recursion.**

```cpp
class Manager : public Employee {
public:
    void print() {
        print();           // ERROR: calls Manager::print recursively!
        // ...
    }
};
```

Without `Employee::`, `print()` inside `Manager::print()` refers to `Manager::print` itself — infinite recursion. Always use `Base::function()` to call the base version.

**Mistake 3 — Accidentally hiding a base function due to a parameter mismatch.**

If the derived class function has a different parameter list from the base, both names coexist. But if one of the derived-class functions matches in name (even with a different signature), the base version can still be hidden in some contexts. The safe habit: if you intend to replace the base function, match its signature exactly.

## When to use this

Use derived-function redefinition when the derived class has a genuinely different implementation for the same conceptual operation. A `Dog` speaks differently than a generic `Animal`.

Use the `Base::function()` call-through pattern when the derived version needs the base behavior plus something extra — for example, `Manager::print()` extending `Employee::print()`.

Without virtual functions, this technique works well when you always know the static type of your object. For code that manipulates objects through base class pointers or references, virtual functions (covered in the next chapter) are the appropriate tool.

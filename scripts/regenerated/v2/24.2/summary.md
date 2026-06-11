## The idea

The previous lesson established the concept: a derived class *is-a* base class. This lesson makes that concrete in C++ syntax. You will see exactly how to write the inheritance declaration, what you automatically get from the base class, and how the `public` keyword in the inheritance specifier controls what the outside world sees.

Think of a base class as a blueprint for the shared part of a family of types. When you say `class Dog : public Animal`, you are telling the compiler: "A `Dog` object physically contains an `Animal` sub-object — give it everything `Animal` has, and expose it publicly." The `public` in the specifier is not about the members' own access level; it is about how the derived class relationship is exposed. `public` inheritance is the standard form and the one you will use almost always.

## How it works

The basic syntax for defining a derived class is:

```cpp
class DerivedClass : public BaseClass {
    // additional members
};
```

The colon followed by `public BaseClass` is the **base class specifier**. Here is a complete working example:

```cpp
#include <iostream>
#include <string>

class Person {
public:
    std::string name;
    int age;

    void greet() {
        std::cout << "Hi, I am " << name << ".\n";
    }
};

class Student : public Person {
public:
    int studentId;
};

int main() {
    Student s;
    s.name      = "Alice";  // inherited from Person
    s.age       = 20;       // inherited from Person
    s.studentId = 1042;     // Student-specific
    s.greet();              // inherited function from Person
    std::cout << "Student ID: " << s.studentId << "\n";
}
```

Output:
```
Hi, I am Alice.
Student ID: 1042
```

`Student` inherits `name`, `age`, and `greet()` from `Person`. You can call `greet()` on a `Student` object because `Student` contains a complete `Person` sub-object. The derived class adds `studentId` on top.

The public members of the base class are accessible from outside the class hierarchy — the standard rules apply. If a member in the base was `public`, it is reachable through the derived object.

A derived class can also define its own member functions alongside the inherited ones:

```cpp
class Student : public Person {
public:
    int studentId;

    void printId() {
        std::cout << "ID: " << studentId << "\n";
    }
};
```

The derived class can call base members from inside its own functions freely:

```cpp
void printAll() {
    std::cout << name << " (age " << age << ") ID: " << studentId << "\n";
}
```

Inside `Student`'s member functions, `name` and `age` are directly accessible because they are inherited public members.

One important structural point: a derived class object is **larger** than a base class object because it contains the base sub-object plus its own additions. You can visualize a `Student` object in memory as `[name][age][studentId]` — the base class fields come first, followed by the derived class fields.

## Common mistakes

**Mistake 1 — Forgetting `public` in the specifier.**

```cpp
class Student : Person {  // missing 'public'
public:
    int studentId;
};

int main() {
    Student s;
    s.name = "Alice";  // ERROR: 'name' is inaccessible
}
```

Without the `public` keyword, the default is `private` inheritance for classes. This makes all inherited public members inaccessible from outside the derived class. The fix is simple: always write `class Derived : public Base`. The lesson on access specifiers covers `private` and `protected` inheritance in detail, but for now `public` is almost always what you want.

**Mistake 2 — Treating a base class variable as a derived class.**

```cpp
Person p;
p.name = "Bob";
// p.studentId = 99;  // ERROR: Person has no member 'studentId'
```

A `Person` variable only has `Person` data. You cannot store `studentId` in it. Derived members exist only on derived objects. This is the reverse of the earlier mistake (expecting the base to know derived members) but the cause is the same: the base class has no knowledge of its derived classes.

**Mistake 3 — Defining the same member name in both base and derived.**

```cpp
class Person {
public:
    std::string name = "Unknown";
};

class Student : public Person {
public:
    std::string name = "Student";  // hides Person::name
};

int main() {
    Student s;
    std::cout << s.name << "\n";  // prints "Student"
}
```

This compiles, but `s.name` now refers to `Student::name`, silently hiding `Person::name`. Most compilers will warn about this with `-Wall`. This is called *name hiding* and is almost never intentional at this stage. The fix is to remove the duplicate definition in the derived class.

## When to use this

Use `public` inheritance whenever one type is genuinely a more-specific version of another and you want the outside world to be able to treat derived objects as base objects. That unrestricted substitutability is exactly what `public` inheritance promises.

Use composition (a member variable) instead when the relationship is has-a: a `Car` has an `Engine`, so `Car` should have an `Engine` member, not inherit from `Engine`.

The mechanics shown here — the base specifier, inherited member access, derived member functions accessing base members — are the foundation for everything in the rest of this chapter, including constructors, access specifiers, and function overriding.

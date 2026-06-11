## The idea

A derived class is not just a copy of the base class with a new name. Its purpose is to *extend* — to add behavior that is specific to the more concrete type. You have already seen that derived classes add new data members. This lesson focuses on adding new **member functions** that the base does not have.

The key insight is that derived class member functions can do two things at once: access everything the derived object already has (its own members) and access everything the base part has (inherited members). The derived class function is not restricted to "only touching derived stuff" — it can freely use the whole object.

## How it works

Adding a new function to a derived class is syntactically no different from adding a function to any class. The function simply belongs to the derived class and has no counterpart in the base.

```cpp
#include <iostream>
#include <string>

class Animal {
public:
    std::string name;
    int age;

    Animal(std::string n, int a) : name(n), age(a) {}

    void describe() {
        std::cout << name << " is " << age << " years old.\n";
    }
};

class Dog : public Animal {
public:
    std::string breed;

    Dog(std::string n, int a, std::string b)
        : Animal(n, a), breed(b) {}

    // New function — only in Dog, not in Animal
    void fetch() {
        std::cout << name << " (" << breed << ") fetches the ball!\n";
    }
};

int main() {
    Dog d("Rex", 3, "Husky");
    d.describe();  // inherited from Animal
    d.fetch();     // new function in Dog
}
```

Output:
```
Rex is 3 years old.
Rex (Husky) fetches the ball!
```

The `fetch()` function accesses `name` (from `Animal`) and `breed` (from `Dog`) in the same body. It can do this because the `Dog` object contains both, and derived member functions have access to all non-private members.

A derived class can also have functions that compute derived-specific results:

```cpp
class Rectangle {
public:
    double width;
    double height;
    Rectangle(double w, double h) : width(w), height(h) {}
    double area() { return width * height; }
};

class Square : public Rectangle {
public:
    Square(double side) : Rectangle(side, side) {}

    // New function specific to Square
    double perimeter() {
        return 4.0 * width;  // width == height, so either works
    }

    bool isUnitSquare() {
        return width == 1.0;
    }
};

int main() {
    Square s(5.0);
    std::cout << s.area() << "\n";       // inherited: 25
    std::cout << s.perimeter() << "\n";  // new in Square: 20
    std::cout << s.isUnitSquare() << "\n"; // false (0)
}
```

`perimeter()` and `isUnitSquare()` make sense for a square but are not part of the `Rectangle` interface. They live only in `Square`.

New derived functions can also call other derived or inherited functions:

```cpp
class Employee {
public:
    std::string name;
    double salary;
    Employee(std::string n, double s) : name(n), salary(s) {}
    void printName() { std::cout << "Name: " << name << "\n"; }
};

class Manager : public Employee {
public:
    int teamSize;
    Manager(std::string n, double s, int ts)
        : Employee(n, s), teamSize(ts) {}

    void printReport() {
        printName();   // calls inherited function
        std::cout << "Salary: " << salary << "\n";
        std::cout << "Team size: " << teamSize << "\n";
    }
};
```

## Common mistakes

**Mistake 1 — Trying to call a derived-only function on a base class object.**

```cpp
Animal a("Cat", 2);
// a.fetch();  // ERROR: Animal has no member 'fetch'
```

`fetch()` exists only in `Dog`. A plain `Animal` variable does not have it. You can only call `fetch()` on a `Dog` object (or a reference/pointer to `Dog`). The base class is unaware of anything added in derived classes.

**Mistake 2 — Accessing private base members from a derived function.**

```cpp
class Animal {
private:
    int secretId = 99;
public:
    std::string name;
};

class Dog : public Animal {
public:
    void showSecret() {
        // std::cout << secretId;  // ERROR: private in Animal
    }
};
```

Private base members are off-limits even inside new derived functions. Use `protected` in the base if derived classes genuinely need access to that data.

**Mistake 3 — Shadowing an inherited function accidentally.**

If you add a function in the derived class with the same name as one in the base, the derived version *hides* the base version for objects of the derived type. This can be intentional (see the next lesson), but is often accidental. If you meant to add a new, unrelated function, choose a different name.

## When to use this

Add new functions to derived classes when the more-specific type has behavior that does not generalize to the base. A `Square` can have `perimeter()` in a way that `Rectangle` cannot generalize without additional knowledge. A `Manager` can have `printReport()` that makes sense only for managers.

The derived-only function pattern is most useful in the early stages of a hierarchy, before you introduce virtual functions. In later lessons you will see how to make base class function calls dispatch to the right derived version automatically.

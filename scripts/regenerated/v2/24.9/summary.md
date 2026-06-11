## The idea

Every class you have seen so far inherits from exactly one base class — or from no class at all. C++ also allows a class to inherit from *multiple* base classes simultaneously. A `FlyingCar` could inherit from both `Car` and `Aircraft`, picking up the interface and data members of both.

Multiple inheritance sounds convenient, but it introduces complications that single inheritance avoids. The most famous is the **diamond problem**: if two base classes share a common ancestor, the most-derived class ends up with two separate copies of that ancestor's data. C++ resolves this through **virtual inheritance**, but even without the diamond, multiple inheritance requires careful management of constructor calls and name conflicts.

In practice, multiple inheritance works well in a narrow set of situations — especially when one or more of the bases is a pure interface (a class with no data members and only pure virtual functions, though virtual functions themselves come in the next chapter). Most day-to-day C++ code uses single inheritance, and many design guides recommend treating multiple inheritance as an advanced feature to reach for deliberately.

## How it works

**Declaring multiple base classes**

The syntax extends the base-class list with a comma-separated sequence of `access-specifier ClassName` pairs:

```cpp
#include <iostream>

class Flyable {
public:
    void fly() { std::cout << "Flying\n"; }
};

class Swimmable {
public:
    void swim() { std::cout << "Swimming\n"; }
};

class Duck : public Flyable, public Swimmable {
public:
    void quack() { std::cout << "Quack\n"; }
};

int main() {
    Duck d;
    d.fly();    // from Flyable
    d.swim();   // from Swimmable
    d.quack();  // Duck's own function
}
```

`Duck` inherits all public and protected members of both `Flyable` and `Swimmable`. The constructor order follows the order of the base-class list: `Flyable` is constructed first, then `Swimmable`, then `Duck`'s own body runs. Destruction is exactly reversed.

**Initializing multiple base classes**

If a base class has a non-default constructor, the derived class must call it explicitly in the member-initializer list — one entry per base:

```cpp
class Flyable {
public:
    int altitude_;
    explicit Flyable(int alt) : altitude_{alt} {}
};

class Swimmable {
public:
    int depth_;
    explicit Swimmable(int d) : depth_{d} {}
};

class Duck : public Flyable, public Swimmable {
public:
    Duck(int alt, int depth) : Flyable{alt}, Swimmable{depth} {}
    void status() const {
        std::cout << "alt=" << altitude_ << " depth=" << depth_ << "\n";
    }
};
```

**Name conflicts**

If both bases define a member with the same name, calling it on a derived object is ambiguous. The compiler reports an error unless you use the scope qualifier to specify which base:

```cpp
class A {
public:
    void greet() { std::cout << "Hello from A\n"; }
};

class B {
public:
    void greet() { std::cout << "Hello from B\n"; }
};

class C : public A, public B {
public:
    void greetBoth() {
        A::greet();   // unambiguous
        B::greet();   // unambiguous
    }
};

int main() {
    C c;
    // c.greet();     // compile error: ambiguous
    c.A::greet();     // explicit scope — OK
    c.greetBoth();    // calls both via scope qualifier
}
```

**The diamond problem and virtual inheritance**

When two bases share a common grandparent, the derived class inherits two separate copies of the grandparent's data by default:

```cpp
class Animal { public: int id_; };

class Dog    : public Animal {};
class Robot  : public Animal {};

class RoboDog : public Dog, public Robot {
    // has TWO copies of Animal::id_: Dog::id_ and Robot::id_
};
```

Accessing `id_` directly on a `RoboDog` is ambiguous. The fix is **virtual inheritance**: replace the normal base declarations with `virtual public`:

```cpp
class Dog   : virtual public Animal {};
class Robot : virtual public Animal {};

class RoboDog : public Dog, public Robot {
    // ONE shared copy of Animal::id_
};
```

With virtual inheritance, the most-derived class is responsible for constructing the virtual base — even if the direct bases also list it in their initializer lists.

## Common mistakes

**Mistake 1 — Calling an ambiguous inherited member without a scope qualifier**

When both bases provide a function with the same name, the call on the derived class fails with an ambiguity error. The fix is always to qualify the call:

```cpp
C c;
c.greet();        // ERROR: ambiguous
c.A::greet();     // OK
```

Alternatively, the derived class can define its own `greet()` that explicitly delegates to one or both bases.

**Mistake 2 — Forgetting that construction order follows the base-class list, not the initializer list**

In the initializer list of a derived constructor, you can list the bases in any order — but construction always happens in the order the bases are listed in the class declaration, and destruction in reverse order. Writing the initializer list in a different order than the class declaration will compile but may confuse readers and trigger compiler warnings.

**Mistake 3 — Expecting virtual base construction to happen in a direct base**

With virtual inheritance, the virtual base is constructed by the *most-derived* class, not by the intermediate classes. If `RoboDog`'s constructor does not explicitly call `Animal{}`'s constructor, the default constructor is used — even if `Dog` and `Robot` each call `Animal{someValue}` in their own initializer lists. Those calls are silently ignored for virtual bases when a more-derived constructor is running.

## When to use this

Multiple inheritance is most justified when your class genuinely *is* both things — not just when it needs to *use* both things. A `FlyingBoat` that truly has both naval and aviation behavior in its interface is a reasonable candidate. When only one base has real data and the others provide pure behavior specifications (what later chapters call interfaces via pure virtual functions), multiple inheritance is clean and widely used.

Avoid multiple inheritance when the bases share state or have ambiguous names, as this forces scope qualifiers everywhere and makes the code harder to read. In those situations, prefer combining behavior through composition (a member variable that holds an object of the second type) rather than inheriting from both.

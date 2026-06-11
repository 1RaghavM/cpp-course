## The idea

The previous lesson introduced friend non-member functions — standalone functions granted access to a class's private members. The `friend` mechanism extends further: an entire class can be declared a friend of another class, or just specific member functions of one class can be declared friends of another. This is useful when two closely related classes need to collaborate deeply without making their internals public.

Think of two departments in a company: Accounting and Payroll. Accounting handles general finances, but the Payroll department needs to read Accounting's internal ledger figures to compute salaries. You would not make the ledger publicly available to the whole company — you would specifically authorize Payroll to access it. Friend classes model exactly this: Payroll is declared a friend of Accounting, giving Payroll's entire staff access, while the rest of the company still sees only the public interface.

## How it works

**Friend class:** declare `friend class OtherClass;` inside the class that is granting access. Every member function of `OtherClass` can then access the granting class's private and protected members.

```cpp
#include <iostream>

class Engine;   // forward declaration

class Car {
    int m_horsepower{ 200 };
    friend class Mechanic;  // Mechanic can see everything in Car
};

class Mechanic {
public:
    void tune(Car& c) {
        c.m_horsepower += 50;   // accesses private member of Car
        std::cout << "Tuned to " << c.m_horsepower << " hp\n";
    }
};

int main() {
    Car myCar;
    Mechanic bob;
    bob.tune(myCar);  // Tuned to 250 hp
}
```

`Mechanic` is a friend of `Car`, so `Mechanic::tune` can read and write `m_horsepower` directly. `Car` is not a friend of `Mechanic` — friendship is one-directional unless both classes grant it.

**Friend member function:** instead of granting an entire class access, you can grant a single member function of another class. This is more precise but requires careful ordering of class definitions because the compiler needs the full definition of the other class before it can see the member function's name.

```cpp
#include <iostream>

class Treasury;   // forward declaration

class Auditor {
public:
    void inspect(const Treasury& t);  // declared but not yet defined
};

class Treasury {
    int m_balance{ 1000 };
    friend void Auditor::inspect(const Treasury& t);  // only this function
};

void Auditor::inspect(const Treasury& t) {
    std::cout << "Balance: " << t.m_balance << "\n";  // legal — it's a friend
}

int main() {
    Treasury gov;
    Auditor alice;
    alice.inspect(gov);  // Balance: 1000
}
```

The ordering matters. `Auditor` must be declared before `Treasury` so that `Auditor::inspect` is a known name when `Treasury` declares it as a friend. But `Auditor::inspect` can only be *defined* after `Treasury` is fully defined, because the definition references `Treasury`'s private members. This is why `Auditor::inspect` is declared in `Auditor`'s class but defined outside both classes, after `Treasury`'s definition.

**Friendship is not inherited and not mutual.** If `Car` grants `Mechanic` friend access, that does not mean `Car` can access `Mechanic`'s private members. And if `SpecialMechanic` inherits from `Mechanic`, it does not automatically inherit the friendship — `Car` would have to separately declare `SpecialMechanic` a friend.

## Common mistakes

**Assuming friendship is mutual.** Granting `friend class B` inside class `A` means `B` can see `A`'s private members. It does not give `A` access to `B`'s private members. Beginners sometimes add member access in the wrong direction after declaring a friendship.

```cpp
class A {
    int m_x{ 10 };
    friend class B;
};

class B {
    int m_y{ 20 };
public:
    void showA(const A& a) {
        std::cout << a.m_x;  // OK — B is a friend of A
    }
    void showSelf(const A& a) {
        // a.m_y would be a compile error — A is not a friend of B
    }
};
```

**Assuming friendship is inherited.** A derived class does not automatically inherit friendship with a class that its base class is friends with. Each class must be explicitly declared a friend.

**Granting whole-class friendship when only one method needs access.** If only one function in `Auditor` needs to see `Treasury`'s internals, granting `friend class Auditor` gives every Auditor method that access — including future ones added later. Prefer the more precise `friend void Auditor::inspect(const Treasury&)` when only one method is involved, keeping the access surface minimal.

## When to use this

Friend classes and friend member functions are most justified when two classes model different views of the same underlying concept and genuinely need deep mutual access — a `Matrix` and its `Iterator`, a `LinkedList` and its `Node`, or two classes that are part of the same subsystem and designed to be used together. In those cases, making them friends is more honest than adding a large public interface just to enable collaboration.

Avoid over-relying on friendship as a substitute for good design. If a large number of external classes need to be friends, the class's interface is probably too narrow, or the responsibilities are poorly divided. Friendship is a precise surgical tool; treat it like one. Prefer friend member functions over friend classes when only one function needs access, because the smaller the access grant, the easier the code is to maintain.

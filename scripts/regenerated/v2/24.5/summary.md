## The idea

You already know that class members can be `public` (accessible everywhere), `private` (accessible only within the class itself), or `protected` (a middle ground you have not seen yet). Inheritance adds a new dimension: the access specifier on the base class *in the derived class's declaration* controls how the base's members are re-exposed by the derived class.

Think of it this way. The base class has its own rules for who can see what. When the derived class inherits, it can either open those rules to the world (`public` inheritance), tighten them (`protected` or `private` inheritance), or somewhere in between. The derived class never gets *more* access than the base already grants — it can only maintain or restrict.

The most important thing to understand is `protected`. A `protected` member is invisible outside the class hierarchy, but fully visible to any derived class. It is the designated slot for "internal implementation detail that subclasses need but the public does not."

## How it works

**The `protected` access specifier**

`protected` members behave like `private` to the outside world but like `public` to derived classes:

```cpp
#include <iostream>

class BankAccount {
protected:
    double balance;   // derived classes can use this; public cannot

public:
    BankAccount(double b) : balance(b) {}
    double getBalance() const { return balance; }
};

class SavingsAccount : public BankAccount {
public:
    SavingsAccount(double b) : BankAccount(b) {}

    void addInterest(double rate) {
        balance += balance * rate;  // OK: balance is protected
    }
};

int main() {
    SavingsAccount sa(1000.0);
    sa.addInterest(0.05);
    std::cout << sa.getBalance() << "\n";  // 1050
    // sa.balance = 0;  // ERROR: balance is protected, not accessible outside
}
```

`SavingsAccount` can read and modify `balance` directly. Code in `main()` cannot.

**The inheritance access specifier (what `: public Base` actually controls)**

The specifier after the colon is the **inheritance access specifier**. It caps the effective access level of all inherited members:

- `public` inheritance: base's `public` stays `public`, base's `protected` stays `protected`
- `protected` inheritance: base's `public` and `protected` both become `protected` in the derived class
- `private` inheritance: base's `public` and `protected` both become `private` in the derived class

In practice, `public` inheritance is used almost always. `protected` and `private` inheritance model "is-implemented-in-terms-of" rather than "is-a," and are rarely needed.

```cpp
class Animal {
public:
    void breathe() { std::cout << "breathe\n"; }
protected:
    int heartRate = 60;
};

class Dog : public Animal {
public:
    void showRate() {
        std::cout << heartRate << "\n";  // OK: heartRate is protected
    }
};

class Cat : private Animal {
public:
    void showRate() {
        std::cout << heartRate << "\n";  // OK: still accessible inside Cat
    }
};

int main() {
    Dog d;
    d.breathe();        // OK: public inheritance keeps breathe() public
    // d.heartRate = 80; // ERROR: heartRate is protected

    Cat c;
    // c.breathe();     // ERROR: private inheritance made breathe() private
}
```

**`private` members are never inherited**

A derived class can never access the base class's `private` members, regardless of the inheritance specifier. Private members are fully encapsulated in the base class. If you need a derived class to access something, use `protected` in the base.

```cpp
class Widget {
private:
    int secret = 42;
protected:
    int shared = 10;
};

class Button : public Widget {
public:
    void show() {
        // std::cout << secret; // ERROR: private, inaccessible
        std::cout << shared;    // OK: protected
    }
};
```

## Common mistakes

**Mistake 1 — Confusing `private` members with `protected` members.**

Private members of the base are off-limits in derived classes regardless of what inheritance specifier you use. Changing `: public` to `: protected` does not help you access a private base member. If you need derived classes to access a member, declare it `protected` in the base.

**Mistake 2 — Using `protected` where `private` is appropriate.**

Some learners mark everything in their base class `protected` "just in case a derived class needs it." This is a mistake. Protected members become part of the public API of your class hierarchy. Prefer `private` by default; use `protected` only when you know a derived class genuinely needs direct access.

**Mistake 3 — Forgetting that default class access is `private`.**

If you write `class Derived : Base` with no specifier, the default inheritance is `private`. This surprises learners who expect the base's public interface to remain accessible. Always write `: public Base` explicitly unless you have a deliberate reason for `private` inheritance.

## When to use this

Use `protected` in a base class when you are designing a class specifically to be inherited and when derived classes need to modify internal state that the public should not touch — like the `balance` in a bank account hierarchy.

Use `public` inheritance (`: public Base`) for almost all inheritance. It preserves the is-a relationship that makes the derived class substitutable for the base.

Use `private` inheritance only when you are implementing one class in terms of another without exposing the is-a relationship — a use case that arises rarely and is usually better served by composition.

## The idea

When you design a class, you are making a promise to everyone who uses it: "I will give you a way to interact with this object, and I will protect its internal state from accidental corruption." Access specifiers are the mechanism that lets you make and enforce that promise.

Think of a bank account. You can deposit money, withdraw money, and check your balance — those are the public-facing operations. But you cannot directly reach into the vault and change the balance number yourself. The bank controls access to the actual stored value. A C++ class works the same way: some things are open to the world, and some things are kept internal.

The two access specifiers you need to know right now are `public` and `private`. Everything listed under `public:` can be used by any code that has an object of that class. Everything listed under `private:` can only be accessed from inside the class itself — its member functions. Any code outside the class that tries to read or write a `private` member gets a compile error.

By default, members of a `class` are private. Members of a `struct` are public. That single difference is the traditional reason C++ has both keywords.

## How it works

**Basic public and private layout**

```cpp
class BankAccount {
private:
    double m_balance;          // only BankAccount member functions can touch this

public:
    void deposit(double amount) {
        if (amount > 0)
            m_balance += amount;
    }

    double getBalance() const { return m_balance; }
};
```

`m_balance` is private. `deposit` and `getBalance` are public. Code outside `BankAccount` can call `deposit` and `getBalance` but cannot read or write `m_balance` directly. Attempting `account.m_balance = 1000;` from outside the class is a compile error.

**What "outside the class" means**

Member functions are part of the class, so they can access private members freely. The access check happens at the call site — who is asking, not where the member was declared:

```cpp
class Counter {
private:
    int m_count{ 0 };

public:
    void increment()       { ++m_count; }     // OK: member function
    void reset()           { m_count = 0; }   // OK: member function
    int  getCount() const  { return m_count; } // OK: member function
};

int main() {
    Counter c;
    c.increment();           // OK: calls a public member function
    c.m_count = 5;           // ERROR: m_count is private
    return 0;
}
```

**Multiple access sections**

A class can have as many `public:` and `private:` blocks as you want, though one of each is the typical style. The specifier applies to every member declared after it until the next specifier:

```cpp
class Temperature {
public:
    void setCelsius(double c)  { m_celsius = c; }
    double getCelsius() const  { return m_celsius; }

private:
    double m_celsius{ 0.0 };

public:
    void setFahrenheit(double f) { m_celsius = (f - 32.0) * 5.0 / 9.0; }
    double getFahrenheit() const { return m_celsius * 9.0 / 5.0 + 32.0; }
};
```

This compiles fine. Having two `public:` blocks is legal, just unusual. Most codebases pick one order and stick with it — commonly `public:` first so readers see the interface before the implementation details.

## Common mistakes

**Mistake 1: Forgetting that `class` defaults to private**

A common error when first switching from `struct` to `class` is forgetting that all members in a `class` are private unless you say otherwise:

```cpp
class Point {
    int m_x;   // private — the default for class
    int m_y;   // private
};

int main() {
    Point p;
    p.m_x = 3;  // ERROR: m_x is private
    return 0;
}
```

The compiler error will say something like "m_x is private within this context." The fix is to add `public:` before the members you want accessible, or declare the member functions that do the work under `public:`.

**Mistake 2: Trying to access private members from free functions**

A free function (one defined outside any class) is not a member function. Even if it takes a class object as a parameter, it cannot touch private members:

```cpp
class Box {
private:
    int m_side{ 5 };
};

void printSide(const Box& b) {
    // ERROR: m_side is private — this function is not a member
    // std::cout << b.m_side;
}
```

Only member functions (and designated friends, a later topic) bypass private access. The fix here is to add a public getter method to `Box`.

**Mistake 3: Assuming private means hidden from the same object**

Private means "hidden from code outside the class." It does not mean an object cannot see another object of the same type's private members — it can, because the access check is per-class, not per-object:

```cpp
class Score {
private:
    int m_value{ 0 };

public:
    bool isHigherThan(const Score& other) const {
        return m_value > other.m_value;  // OK — both are Score objects
    }
};
```

This compiles and runs correctly. Both `m_value` accesses are inside a `Score` member function, so both are allowed.

## When to use this

Make data members `private` by default in every class you write. Keep them private even when it feels tedious — it lets you change the internal representation later without breaking any caller. Expose only the operations that make sense from the outside world.

Use `public` only for member functions (and occasionally constants) that form the class's intended interface. If you find yourself making a data member public because "it's simpler," that is a sign the class's design needs more thought: either the member should be private with an accessor, or it belongs in a `struct` aggregate instead of a class.

The struct-vs-class rule of thumb: if a type is a passive bundle of data with no invariant to protect (like a coordinate pair), a `struct` with all-public members is fine. Once the type has an invariant — a rule that must always be true about its internal state, like "balance is never negative" — use a `class` with `private` data and `public` member functions.

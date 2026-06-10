## The idea

Up until now, programs have been organized around *procedures* — sequences of instructions that manipulate separate chunks of data. A function receives some data, does something with it, and passes results back. The data and the code that operates on it live in different places, and you have to keep them in sync yourself. Object-oriented programming (OOP) is a different way of organizing programs: you bundle related data and the functions that work on it together into one unit called an **object**.

Think of a car. A car has state — its current speed, gear, fuel level — and it has behavior — accelerate, brake, shift gears. In a procedural program, you might store those values in separate variables and write separate functions that accept them as arguments. In an object-oriented program, the car *is* a single object that knows its own speed and knows how to accelerate itself. The data and the behavior are inseparable.

OOP is not a magic trick. It is a design philosophy — a way of thinking about programs that tends to produce code that is easier to reason about, extend, and reuse. C++ supports OOP as one style among several; you choose it when it fits the problem.

## How it works

The three pillars of OOP in C++ are **encapsulation**, **abstraction**, and eventually inheritance and polymorphism (those come later). Right now, focus on the first two.

**Encapsulation** means packaging data and the functions that operate on it into one unit, and controlling what the outside world can see.

Consider a struct-based approach you already know:

```cpp
#include <iostream>

struct BankAccount {
    std::string owner;
    double balance;
};

void deposit(BankAccount& account, double amount) {
    account.balance += amount;
}

int main() {
    BankAccount acct;
    acct.owner = "Alice";
    acct.balance = 100.0;
    deposit(acct, 50.0);
    std::cout << acct.balance << "\n";  // 150
}
```

This works, but `balance` is freely modifiable by anyone. Nothing stops code elsewhere from writing `acct.balance = -9999.0`. With OOP you would make `balance` private — only the object's own functions can touch it — and expose a `deposit` function as part of the object itself.

**Abstraction** means hiding the *how* and exposing only the *what*. Users of a `BankAccount` object shouldn't need to care whether the balance is stored as `double` or `int` or anything else. They just call `deposit()` and trust it works. This separation of interface from implementation is what makes large programs manageable.

Here is the procedural mindset written down plainly:

```cpp
// Procedural: data here, logic over there
struct Point { double x; double y; };

double distanceFromOrigin(Point p) {
    return p.x * p.x + p.y * p.y;  // simplified, no sqrt
}
```

And here is the OOP mindset for the same idea (using `class` syntax, which the next lesson introduces fully):

```cpp
// OOP: the object knows how to compute its own distance
class Point {
public:
    double x;
    double y;
    double distanceFromOrigin() {
        return x * x + y * y;
    }
};
```

The behavior now belongs to the data. You call it as `p.distanceFromOrigin()` rather than `distanceFromOrigin(p)`.

## Common mistakes

**Thinking OOP is always better.** OOP is a tool, not a religion. A short utility program that reads two numbers and prints their sum does not benefit from classes. Classes add structure, and structure is overhead — mental overhead if the problem is trivial. Reach for OOP when you have entities with meaningful state and behavior, multiple instances of the same kind of thing, or code that must be extended or maintained over time.

**Confusing objects with structs.** Students who have just learned structs often think OOP just means "use struct more". Structs in C++ are nearly identical to classes in syntax (the next lesson explains the one real difference), but OOP is the *discipline* of bundling behavior with state and controlling access — not merely using a struct. A struct whose fields are all public and is only ever passed to standalone functions is procedural code, even if the keyword is `struct`.

**Assuming OOP eliminates bugs.** OOP does not prevent logic errors. It provides a structure that makes certain classes of error more visible (a private member can't be corrupted from outside) but it introduces its own pitfalls: forgetting to initialize a member, designing interfaces that are too wide, or creating unnecessary inheritance hierarchies. Encapsulation is a discipline you enforce; the compiler only helps as much as you ask it to.

## When to use this

OOP is the right choice when your program models real-world or conceptual *entities* — a `BankAccount`, a `Player`, a `Sensor` — that each carry their own state and respond to messages (method calls). It also shines when you have many instances of the same type that all need the same behaviors but hold different data.

If your code is mostly transformations over plain data — parsing text, computing a formula, running a simulation step — procedural or even functional style may be cleaner. C++ lets you mix styles: use structs (from lesson "Introduction to structs, members, and member selection") for plain data, and classes when behavior belongs to the data. The chapters ahead introduce the mechanics; this lesson is the motivation.

## The idea

Imagine you are building a game with different types of characters: warriors, mages, and archers. All of them share common traits — they have a name, health points, and a position. But each type also has something unique: warriors have armor, mages have mana, archers have arrows. Without inheritance, you would copy the common fields into every class definition. Any change to the shared behavior would need to be made in three places. That is fragile.

Inheritance solves this by letting you define the shared traits in one **base class** and then create **derived classes** that automatically get everything the base class has. A `Mage` *is-a* `Character` — it has everything a character has, plus the mage-specific additions. The relationship is called an **is-a** relationship, and it is the central test for whether inheritance is appropriate.

Inheritance is a mechanism for code reuse and for expressing a hierarchical relationship between types. It does not replace composition (having one object *contain* another). The rule is: use inheritance when a derived type genuinely *is a* more-specific version of the base type, not merely when two classes happen to share some fields.

## How it works

The simplest inheritance hierarchy has two levels: one base class and one derived class.

```cpp
#include <iostream>
#include <string>

class Animal {
public:
    std::string name;
    int age;
};

class Dog : public Animal {
public:
    std::string breed;
};

int main() {
    Dog d;
    d.name  = "Rex";   // inherited from Animal
    d.age   = 3;       // inherited from Animal
    d.breed = "Husky"; // Dog-specific
    std::cout << d.name << " is " << d.age << " years old.\n";
}
```

`Dog` inherits `name` and `age` from `Animal` as if they were declared directly in `Dog`. The `: public Animal` syntax says "Dog is a publicly-inheriting derived class of Animal." You will learn exactly what `public` means here in a later lesson; for now it is the standard form.

Inheritance chains can be longer. A derived class can itself be a base for another class.

```cpp
class LivingThing {
public:
    bool alive = true;
};

class Animal : public LivingThing {
public:
    std::string name;
};

class Dog : public Animal {
public:
    std::string breed;
};
```

A `Dog` object now carries `alive` (from `LivingThing`), `name` (from `Animal`), and `breed` (from `Dog`). Each level in the chain adds to what the type provides. This is sometimes called a **class hierarchy** or an **inheritance chain**.

One more key point: the relationship only goes one way. A base class knows nothing about its derived classes. `Animal` cannot access `breed`; `LivingThing` cannot access `name`. The derived class depends on the base, not the other way around.

```cpp
int main() {
    Animal a;
    a.name = "Cat";
    // a.breed = "Siamese"; // ERROR: Animal has no member 'breed'
}
```

## Common mistakes

**Mistake 1 — Using inheritance for "has-a" relationships.**

```cpp
// Wrong: an Engine is not a Car
class Engine { public: int horsepower; };
class Car : public Engine { };  // Car "has an" engine, not "is an" engine
```

The correct design is composition: `Car` has an `Engine` member. Using inheritance here creates a confusing interface where `Car` exposes `horsepower` as a direct member, which misrepresents the real relationship. The is-a test: ask "Is a Car an Engine?" The answer is no, so do not inherit.

**Mistake 2 — Expecting the base class to know about derived members.**

```cpp
class Shape {
public:
    std::string color;
};

class Circle : public Shape {
public:
    double radius;
};

int main() {
    Shape s;
    // s.radius = 5.0;  // ERROR: 'Shape' has no member named 'radius'
}
```

A `Shape` variable holds only `Shape` data. You cannot store a `Circle`'s `radius` in a plain `Shape` object. Derived members are only accessible through a derived-class variable (or pointer/reference, which is covered much later). This surprises learners who expect the base class to somehow "see" derived additions.

**Mistake 3 — Thinking inherited members are copied each time.**

Inheritance does not copy code. The derived class object contains the base class sub-object directly — as if the base's fields were physically embedded in the derived object. There is no duplication of logic at runtime. When you call a function defined in the base class on a derived object, you call the single definition that lives in the base. This matters for understanding object size and for debugging.

## When to use this

Use inheritance when you have a genuine is-a relationship: a `SavingsAccount` is-a `BankAccount`, a `Manager` is-a `Employee`. The derived class should be a more specific version of the base, not merely a class that shares some data.

Do not use inheritance just to share data between unrelated classes — use composition or free functions instead. If you find yourself inheriting from a class only to get its private fields, that is a design smell.

Inheritance becomes most powerful when combined with virtual functions and polymorphism, which are covered in later chapters. In this chapter the focus is on the structural mechanics: what you get, how objects are built, and how access rules work.

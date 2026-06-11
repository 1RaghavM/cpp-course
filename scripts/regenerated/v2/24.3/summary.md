## The idea

When you create a derived class object, the compiler has to build both the base part and the derived part. The question is: in what order? And which constructors get called?

The rule is simple and consistent: the **base class is always constructed first**, then the derived class is constructed on top of it. Think of it like building a house — you pour the foundation before you frame the walls. The base class is the foundation. You cannot initialize the derived members until the base sub-object exists and is fully constructed.

This ordering also applies to destruction: destructors run in the **reverse** order — derived first, then base. Whatever was constructed last is destroyed first. This ensures that a derived destructor can still safely use the base sub-object (since the base is destroyed after the derived).

## How it works

The simplest demonstration uses constructors with visible output:

```cpp
#include <iostream>

class Base {
public:
    Base() {
        std::cout << "Base constructor\n";
    }
    ~Base() {
        std::cout << "Base destructor\n";
    }
};

class Derived : public Base {
public:
    Derived() {
        std::cout << "Derived constructor\n";
    }
    ~Derived() {
        std::cout << "Derived destructor\n";
    }
};

int main() {
    Derived d;
}
```

Output:
```
Base constructor
Derived constructor
Derived destructor
Base destructor
```

The base constructor runs first, then the derived constructor. Destruction runs in the exact reverse order. This happens automatically — you do not write any special code to trigger it.

The same rule applies when the chain is three levels deep:

```cpp
class A {
public:
    A()  { std::cout << "A ctor\n"; }
    ~A() { std::cout << "A dtor\n"; }
};

class B : public A {
public:
    B()  { std::cout << "B ctor\n"; }
    ~B() { std::cout << "B dtor\n"; }
};

class C : public B {
public:
    C()  { std::cout << "C ctor\n"; }
    ~C() { std::cout << "C dtor\n"; }
};

int main() {
    C obj;
}
```

Output:
```
A ctor
B ctor
C ctor
C dtor
B dtor
A dtor
```

Construction goes from the root of the hierarchy down; destruction goes from the leaf back to the root.

The reason for this rule: when a derived constructor runs, it may try to use or depend on data in the base sub-object. That data must be initialized before the derived constructor body executes. The compiler enforces this ordering automatically.

```cpp
class Shape {
public:
    std::string color;
    Shape() : color("white") {
        std::cout << "Shape constructed, color=" << color << "\n";
    }
};

class Circle : public Shape {
public:
    double radius;
    Circle() : radius(1.0) {
        // color is already "white" here — Shape was constructed first
        std::cout << "Circle constructed, color=" << color << " radius=" << radius << "\n";
    }
};
```

Output when you create a `Circle`:
```
Shape constructed, color=white
Circle constructed, color=white radius=1
```

## Common mistakes

**Mistake 1 — Assuming derived constructors run first.**

Some learners guess that the derived constructor runs first because "it is the class I actually asked for." The opposite is true: the base always runs first. If you add a print statement at the top of your derived constructor and expect it to appear before the base prints, you will be surprised.

**Mistake 2 — Forgetting that member initialization order also matters within a class.**

Members of a class are constructed in the order they are *declared in the class*, not the order they appear in the member initializer list. This is a separate rule from the base-first ordering, but the two can compound if a derived class's initializer list refers to base members. Prefer to initialize base members through base constructors (covered in the next lesson) rather than by assigning them in derived constructors.

**Mistake 3 — Assuming the base destructor does not run automatically.**

```cpp
// Wrong mental model:
{
    Derived d;
}
// Learner thinks: "Only Derived destructor runs because d is a Derived."
```

Both destructors run. The compiler inserts a call to `~Base()` at the end of `~Derived()` automatically. You never write `Base::~Base()` manually in a derived destructor. If you do call it explicitly, the base destructor will run twice, which is undefined behavior.

## When to use this

Understanding construction order matters whenever a derived constructor needs to rely on the base sub-object being valid when it runs its own body. That is guaranteed — the base is always fully constructed first.

It also matters for debugging: if your program crashes in a derived constructor, the base was already constructed. If it crashes in a derived destructor, the derived body ran (or partially ran) before the base destructor fired.

In the next lesson you will see how to pass arguments to base constructors using the member initializer list, which is the standard way to give base sub-objects their initial state when no-argument base constructors are not sufficient.

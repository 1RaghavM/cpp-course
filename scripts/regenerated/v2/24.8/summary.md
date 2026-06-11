## The idea

Inheritance gives a derived class all of its base class's public and protected members. But sometimes the derived class needs to prevent users from calling a particular inherited function — either because the operation does not make sense for the derived type, or because the derived class wants to expose a renamed, restricted, or modified version instead.

C++ provides two tools for this. First, a derived class can *change the access level* of an inherited member: by declaring the member inside a different access section (using a `using` declaration), the derived class can promote a protected member to public, or demote a public member to private. Second, a derived class can *delete* a member function using `= delete`, which makes any attempt to call it a compile error.

Both techniques are distinct from *overriding* (which requires `virtual` and is covered in a later chapter). These are purely compile-time mechanisms that control what callers can see when they hold a derived-type variable.

## How it works

**Changing access with a `using` declaration**

A `using` declaration inside the derived class, placed in the desired access section, changes the visibility of a name inherited from the base:

```cpp
#include <iostream>

class Base {
public:
    void greet() { std::cout << "Hello from Base\n"; }
protected:
    void secret() { std::cout << "Base secret\n"; }
};

class Derived : public Base {
public:
    using Base::secret;    // promote protected → public

private:
    using Base::greet;     // demote public → private
};

int main() {
    Derived d;
    d.secret();   // OK — now public
    // d.greet(); // compile error — now private
}
```

The `using` declaration does not copy the function. It just changes what access label applies to the inherited name in the derived class.

**Deleting an inherited function**

A derived class can declare an inherited function as `= delete`. Any call to that function on a derived-type variable becomes a hard compile error:

```cpp
class IntBase {
public:
    void printDouble(int x) { std::cout << x * 2 << "\n"; }
    void printHalf(int x)   { std::cout << x / 2 << "\n"; }
};

class PositiveOnly : public IntBase {
public:
    void printHalf(int x) = delete;  // hide this — nonsensical for our use
};

int main() {
    PositiveOnly p;
    p.printDouble(10);    // OK → 20
    // p.printHalf(10);   // compile error: call to deleted function
}
```

Deleting a function is a stronger statement than demoting it to `private`. `private` still allows calls from within the class; `= delete` prohibits the function entirely, including from within the class and from friends.

**Using `using` to expose an overloaded set**

When a derived class defines a function with the same name as a base function but different parameters, the base's overloads are *hidden* — even the overloads that do not conflict. A `using` declaration pulls the entire overload set back into scope:

```cpp
class Shape {
public:
    void describe()           { std::cout << "Shape\n"; }
    void describe(int detail) { std::cout << "Shape detail=" << detail << "\n"; }
};

class Circle : public Shape {
public:
    using Shape::describe;   // bring both base overloads into scope

    void describe(double r) {
        std::cout << "Circle r=" << r << "\n";
    }
};

int main() {
    Circle c;
    c.describe();      // calls Shape::describe() — without the using, this would be hidden
    c.describe(2);     // calls Shape::describe(int)
    c.describe(3.14);  // calls Circle::describe(double)
}
```

Without the `using Shape::describe;`, writing `c.describe()` would be a compile error because `Circle::describe(double)` hides all inherited `describe` overloads.

## Common mistakes

**Mistake 1 — Expecting a demoted function to be completely unreachable**

Making a function `private` in a derived class only stops external callers. The function can still be called through a base-type reference or pointer (without virtual), because access control is checked at compile time using the *static type* of the expression:

```cpp
Derived d;
Base& b = d;
b.greet();   // compiles! Base::greet is public in Base, and b's type is Base&
             // access check uses static type Base — derived's private label is ignored
```

If you need to block a function entirely regardless of how the object is accessed, use `= delete`.

**Mistake 2 — Forgetting the `using` declaration when adding an overload**

When a derived class adds a new overload of an inherited function, it unintentionally hides ALL inherited overloads with the same name. This surprises learners who expect the base's overloads to remain visible:

```cpp
class Circle : public Shape {
public:
    void describe(double r) { /* ... */ }
    // MISSING: using Shape::describe;
    // Now c.describe() and c.describe(2) are compile errors!
};
```

**Mistake 3 — Using `= delete` and then trying to call via a base pointer**

Deleting a function in the derived class only affects calls through the derived type. Calling through a base pointer still reaches the base version (unless `virtual` is involved):

```cpp
PositiveOnly p;
IntBase* ptr = &p;
ptr->printHalf(10);   // compiles and runs — calls IntBase::printHalf, not deleted
```

This is the same static-type rule as mistake 1.

## When to use this

Change access levels when a derived type genuinely restricts the contract of the base. A `ReadOnlyQueue` derived from a `Queue` might demote `push` to private or delete it to enforce read-only semantics.

Use `= delete` to enforce invariants: if an operation is fundamentally nonsensical for a derived type (e.g., `resize` on a fixed-capacity container), deleting it makes the constraint visible at compile time rather than leaving it as a runtime assertion.

Add a `using Base::name;` declaration whenever you add a new overload to a name that exists in the base and want the base's other overloads to remain available. Without the `using`, the derived overload hides everything.

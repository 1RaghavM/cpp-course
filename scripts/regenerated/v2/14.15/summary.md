## The idea

When you write `Fraction f = Fraction{3, 4};`, something interesting may happen: the compiler is allowed to skip creating a temporary object and directly construct `f` in place. This optimization is called **copy elision**, and its mandatory form is called **Return Value Optimization (RVO)**. Understanding it helps you reason about object lifetimes and why C++ classes tend to be cheaper to use than they first appear.

Copy elision sits at the intersection of two ideas: how objects are initialized in different ways, and when the compiler can collapse redundant copy or move steps. The mental model is a conveyor belt that builds objects. Naively, returning a value from a function stamps out an object at the factory, drops it on the belt, and the receiving variable picks it up — two stamp-outs. With copy elision, the compiler sees that the temporary will immediately overwrite the destination and arranges for the stamp to happen directly at the destination — one stamp-out, zero copies.

## How it works

**The five initialization forms for class objects**

Before copy elision makes sense, you need to know the five ways a class object can be initialized:

```cpp
class Fraction {
public:
    Fraction(int n, int d) : m_num{n}, m_den{d} {}
    Fraction(const Fraction& other) : m_num{other.m_num}, m_den{other.m_den} {}
    int num() const { return m_num; }
    int den() const { return m_den; }
private:
    int m_num;
    int m_den;
};

Fraction a{3, 4};             // direct-list initialization → calls Fraction(int, int)
Fraction b(3, 4);             // direct initialization → calls Fraction(int, int)
Fraction c = {3, 4};          // copy-list initialization → calls Fraction(int, int)
Fraction d = Fraction{3, 4};  // copy initialization → would call copy ctor, but...
Fraction e = a;               // copy initialization → calls copy constructor
```

Forms `a`, `b`, and `c` directly invoke the matching constructor. Form `d` is copy initialization with a class-type right-hand side of the same type. The language says the compiler may elide (skip) the copy/move here. Form `e` genuinely invokes the copy constructor.

**Mandatory copy elision (C++17)**

C++17 made certain forms of copy elision mandatory. The most important case is constructing directly from a *prvalue* (a temporary that has not been given a name):

```cpp
Fraction make() {
    return Fraction{2, 5};   // prvalue returned directly
}

int main() {
    Fraction f = make();     // C++17: guaranteed no copy
    // f is constructed once, directly in its storage
}
```

Before C++17, the compiler was permitted but not required to elide the copy. From C++17 onward, `Fraction{2, 5}` returned and immediately assigned to `f` is treated as if `f` is initialized with `Fraction(2, 5)` — the temporary never materializes as a distinct object.

**Named Return Value Optimization (NRVO) — permitted but not guaranteed**

When you return a *named* local variable, elision is still optional:

```cpp
Fraction make_half() {
    Fraction result{1, 2};   // named local
    return result;            // NRVO may or may not fire
}
```

Most modern compilers apply NRVO here too, but the standard only requires it for prvalue returns. You can rely on it in practice, but you must not write code that observes whether the copy constructor ran or not.

**Copy-list initialization vs. direct-list initialization**

A subtlety worth noting: `Fraction c = {3, 4}` still calls `Fraction(int, int)` — it does not require a copy constructor to exist. This is because the `= {…}` form on a class type goes through constructor resolution directly, much like `Fraction{3, 4}`. The `=` here is syntax, not a copy.

## Common mistakes

**Mistake 1 — Assuming copy elision fires for all copy initializations**

```cpp
Fraction a{1, 2};
Fraction b = a;    // NOT elided — a is an lvalue, the copy constructor runs
```

Elision is only guaranteed for prvalue temporaries (C++17). When the right-hand side is a named variable (an lvalue), the copy constructor genuinely executes. If `Fraction` had no accessible copy constructor, `b = a` would fail to compile.

**Mistake 2 — Expecting elision when the copy constructor is deleted**

A common interview question: "Does this compile?"

```cpp
class NoCopy {
public:
    NoCopy(int x) : m_x{x} {}
    NoCopy(const NoCopy&) = delete;
private:
    int m_x;
};

NoCopy n = NoCopy{5};   // C++17: yes, the copy ctor is never called
NoCopy m = n;           // NO — copy constructor is deleted, this fails
```

In C++17, `NoCopy{5}` is a prvalue and `NoCopy n = NoCopy{5}` is mandatory copy elision — the deleted copy constructor is irrelevant because it is not called. But `NoCopy m = n` tries to copy from a named variable (`n` is an lvalue) and the deleted copy constructor is invoked, causing a compile error.

**Mistake 3 — Returning a member variable by value expecting NRVO**

```cpp
Fraction Pair::first() const {
    return m_first;    // m_first is a data member, not a local variable
}
```

NRVO only applies to local variables. A return of a data member is a copy regardless of any optimization the compiler might apply. If the copy constructor is cheap this is fine, but it does invoke the copy constructor.

## When to use this

Copy elision is an automatic compiler optimization — you do not opt into it. The main practical takeaway is to write code that *enables* it: return class objects by value from factory functions and constructors, prefer returning a fresh temporary `return Type{args}` over naming a result and then returning it, and do not add side effects to copy constructors that your logic depends on.

Understanding the five initialization forms helps you choose the clearest one for each context: `Type x{args}` (direct-list) for most construction, `Type x = expr` (copy initialization) when reading from an existing value, and `Type x = {args}` (copy-list) when initializing from a braced list. The forms are largely interchangeable for concrete types, but direct-list initialization provides the safest narrowing-conversion behavior, which is why it is preferred throughout this course.

Cross-reference: this lesson builds on the copy constructor covered in "Introduction to the copy constructor" and on the temporary-object lifetime rules from "Temporary class objects".

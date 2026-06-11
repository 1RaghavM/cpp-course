## The idea

Chapter 14 taught you the complete foundation of C++ object-oriented programming: how to define classes, how to control access to their internals, how to initialize them reliably, and how they copy themselves. Before moving on, it is worth pausing to see how all the pieces form a single coherent design philosophy: **a class is a type that manages its own invariants**.

An invariant is a condition that must always be true about an object's state. A `Fraction` class maintains the invariant that the denominator is never zero. A `BankAccount` class maintains the invariant that the balance never goes below the allowed minimum. The entire chapter was about the tools C++ gives you to enforce those invariants from the moment an object is born until it dies.

## How it works

**The access specifier layer (lessons 14.2–14.5, 14.8)**

`private` data members and `public` member functions are the first line of defense. Private members cannot be touched from outside the class, so every change to the object's state must pass through a member function that can enforce invariants. Access functions (getters and setters) provide controlled read/write windows, and `const` member functions declare their intent not to modify state — enabling the object to be used with `const` objects and const references.

```cpp
class Fraction {
public:
    Fraction(int n, int d) : m_num{n}, m_den{d} {
        // invariant: denominator must not be zero
        if (m_den == 0) m_den = 1;
    }
    int numerator() const { return m_num; }
    int denominator() const { return m_den; }
private:
    int m_num;
    int m_den;
};
```

**The constructor family (lessons 14.9–14.13)**

Constructors are the gateway through which every object enters existence. Member initializer lists (lesson 14.10) initialize members before the body executes, which is the only way to initialize `const` members and references. Default constructors (lesson 14.11) let objects come into existence without explicit arguments. Delegating constructors (lesson 14.12) let one constructor reuse another's logic without duplication. Temporary objects (lesson 14.13) are unnamed, single-use objects created inline.

```cpp
class Point {
public:
    Point() : Point{0, 0} {}           // delegates to the two-argument ctor
    Point(int x, int y) : m_x{x}, m_y{y} {}
    int x() const { return m_x; }
    int y() const { return m_y; }
private:
    int m_x;
    int m_y;
};

Point origin;              // default constructor
Point p{3, 4};             // two-argument constructor
Point q = Point{1, 2};     // temporary, copy-elided in C++17
```

**Copy semantics (lessons 14.14–14.15)**

When an object is copied — passed by value, returned from a function, or initialized from another object of the same type — the copy constructor runs. For simple value types, the compiler-generated copy constructor (which copies each member) is correct. Copy elision (lesson 14.15) means the compiler can skip the copy entirely when constructing from a prvalue temporary; in C++17, this is mandatory for direct prvalue returns.

**Converting constructors and explicit (lesson 14.16)**

Any constructor callable with a single argument acts as an implicit conversion path. The `explicit` keyword disables that path, preventing the compiler from silently converting unrelated types. Marking single-argument constructors `explicit` is the default-safe choice; leave it off only when the implicit conversion is genuinely natural.

**Constexpr classes (lesson 14.17)**

Marking a constructor and its member functions `constexpr` lets the class participate in compile-time computation — `static_assert` conditions, array sizes, and compile-time constants. Simple value types are natural candidates. `constexpr` on a constructor does not force compile-time use; it merely enables it.

**The this pointer (lesson 14.x context)**

Every non-static member function receives an implicit pointer `this` pointing to the calling object. You rarely need to use `this` explicitly, but it becomes important when a member function needs to return `*this` for chaining, or when a parameter name shadows a member name.

## Common mistakes

**Mistake 1 — Initializing members in the constructor body instead of the initializer list**

```cpp
class Timer {
public:
    Timer(int ms) {
        m_elapsed = ms;       // assignment in body, not initialization
    }
private:
    const int m_elapsed;      // const member — MUST be initialized in MIL
};
```

This fails to compile because `m_elapsed` is `const`. Even for non-const members, the initializer list is preferred because it initializes directly rather than default-constructing and then assigning. Use the member initializer list for every member.

**Mistake 2 — Forgetting explicit on single-argument constructors**

```cpp
class Seconds {
public:
    Seconds(int v) : m_val{v} {}  // no explicit
private:
    int m_val;
};
void wait(Seconds s);

wait(3);     // silently converts 3 to Seconds{3} — was this intended?
wait(true);  // also compiles: bool→int→Seconds — almost certainly not intended
```

Mark single-argument constructors `explicit` unless you have a deliberate reason for the implicit conversion.

**Mistake 3 — Assuming the compiler-generated copy constructor does the right thing for resource-owning classes**

For classes that only hold values (`int`, `double`, other value-type objects), the implicit copy constructor is correct. When a class manages a resource — a pointer to dynamically allocated memory, a file handle — the implicit copy constructor copies the pointer, leaving two objects that believe they own the same resource. Chapter 14 does not cover that case (it requires chapter 22's move semantics and Rule of Five), but recognizing the pattern is the first step.

## When to use this

Chapter 14's tools form the everyday toolkit for every C++ class you write. Use `private` data and `public` member functions unless you have a specific reason not to. Prefer the member initializer list over body assignment. Mark converting constructors `explicit` by default. Add `constexpr` to constructors and member functions of pure-value types so they can participate in compile-time computation.

The chapters ahead (ch 15 on `this`, ch 16 on operator overloading, and eventually the chapters on inheritance and templates) layer additional capabilities on top of this foundation. Every new tool assumes you have mastered the invariants, constructors, and access-control model covered here.

## The idea

A common problem when writing multiple constructors is duplication: each constructor has to set up the object in a valid initial state, and when those setup steps are identical across constructors, you end up writing the same code more than once. If you later need to change how initialization works, you have to remember to update every constructor.

Delegating constructors solve this by letting one constructor call another constructor of the same class as the very first thing it does. The delegated-to constructor handles the shared setup; the delegating constructor adds whatever extra steps it needs on top. Think of it as a constructor that says "first do everything the other constructor does, then do this extra thing."

## How it works

A delegating constructor uses the member initializer list — but instead of naming a data member, it names the class itself followed by arguments for the target constructor.

```cpp
class Date {
    int m_year;
    int m_month;
    int m_day;
public:
    // Primary constructor — all three values must be provided
    Date(int year, int month, int day)
        : m_year{ year }, m_month{ month }, m_day{ day }
    {}

    // Delegating constructor — defaults to January 1st of the given year
    Date(int year)
        : Date{ year, 1, 1 }   // delegates to the three-argument constructor
    {}
};
```

When `Date d{ 2024 }` is called, the one-argument constructor delegates to `Date{ 2024, 1, 1 }` first. The primary constructor runs in full, including its member initializer list. Only after it finishes does control return to the delegating constructor's body (if it has one).

A delegating constructor can add logic after the delegation:

```cpp
class Token {
    int m_id;
    bool m_valid;
public:
    Token(int id, bool valid)
        : m_id{ id }, m_valid{ valid }
    {}

    Token(int id)
        : Token{ id, true }       // delegate, then add extra logic
    {
        if (m_id < 0) m_valid = false;  // post-delegation fixup
    }
};
```

Note one firm restriction: a delegating constructor cannot also initialize any data members directly in its own initializer list. If it delegates, it delegates entirely — the delegation must be the only item in the initializer list. Any member setup must go into the constructor body (as assignment, not initialization).

```cpp
// This does NOT compile:
Token(int id)
    : Token{ id, true }, m_id{ id }  // error: cannot mix delegation and member init
{}
```

It is also illegal to create a delegation cycle. If constructor A delegates to constructor B and constructor B delegates back to A, the compiler will reject it.

## Common mistakes

**Mistake 1: Trying to initialize members alongside delegation.**

```cpp
class Circle {
    double m_radius;
    double m_x;
    double m_y;
public:
    Circle(double r, double x, double y)
        : m_radius{ r }, m_x{ x }, m_y{ y }
    {}

    Circle(double r)
        : Circle{ r, 0.0, 0.0 }, m_radius{ r }  // compile error
    {}
};
```

The member initializer list must contain either a delegation call or member initializations — never both.

**Mistake 2: Delegating to a constructor that doesn't exist.**

```cpp
class Widget {
    int m_val;
public:
    Widget(int val) : m_val{ val } {}

    Widget() : Widget{ }  // calls Widget() again — infinite recursion / cycle
    {}
};
```

`Widget()` delegates back to itself, which is a cycle and a compile error. Always delegate to a constructor with a different signature.

**Mistake 3: Expecting delegation to re-run after an exception.**

If the delegated-to constructor throws, the delegating constructor's body never runs. The object is in a partially constructed state and cannot be used. This is rarely a concern for classes without exceptions, but it is worth knowing that delegation and exception safety are closely linked.

## When to use this

Use delegating constructors whenever two or more constructors share initialization logic. The most common pattern is a "primary" constructor that does all the real work, and several "convenience" constructors that fill in sensible defaults and delegate to the primary one.

Do not create a separate `init()` member function just to avoid code duplication in constructors — delegating constructors serve that role without the risk of an uninitialized object being visible before `init()` is called. The "call a separate setup function" pattern leaves objects in a partially constructed state between construction and the setup call, which breaks the invariant that a constructed object is always valid.

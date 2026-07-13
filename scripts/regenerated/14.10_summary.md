## The idea

When you write a constructor, you need a way to set the initial values of the class's data members before the body of the constructor runs. The member initializer list is the designated place to do this — it sits between the constructor's parameter list and its opening brace, introduced by a colon. Think of it as the "setup list" that runs before the constructor body executes.

The alternative — assigning to members inside the constructor body — works for plain data types, but it is not the same thing. Initialization and assignment are distinct operations in C++. The member initializer list initializes each member directly; the constructor body then assigns to already-constructed members. For fundamental types like `int` or `double` the difference is invisible, but for `const` members and reference members the difference is mandatory — those members must be initialized and cannot be reassigned.

## How it works

The member initializer list appears after the constructor signature, separated by a colon. Each member to initialize is listed as `member_name(value)` or `member_name{value}`, and multiple members are separated by commas.

```cpp
class Rectangle {
    int m_width;
    int m_height;
public:
    Rectangle(int width, int height)
        : m_width{ width }, m_height{ height }
    {
        // constructor body: can add other logic here
    }

    int area() const { return m_width * m_height; }
};
```

Here `m_width` and `m_height` are initialized directly, not assigned after construction. When `Rectangle r{ 4, 5 }` is called, `m_width` becomes 4 and `m_height` becomes 5 before the constructor body even begins.

The initializer list is mandatory when a member is `const` or a reference:

```cpp
class Timer {
    const int m_maxSeconds;
    int& m_sharedCounter;
public:
    Timer(int max, int& counter)
        : m_maxSeconds{ max }, m_sharedCounter{ counter }
    {}
    // Without the initializer list, the compiler would reject this:
    // const and reference members MUST be initialized, not assigned.
};
```

A subtle but important rule: members are initialized in the order they are declared in the class, not the order they appear in the initializer list. This can matter when one member's initial value depends on another.

```cpp
class Pair {
    int m_first;
    int m_second;
public:
    Pair(int val)
        : m_second{ val * 2 }, m_first{ m_second }  // bug: m_first is initialized first!
    {}
    // m_first is declared before m_second in the class, so m_first
    // is initialized first — but m_second hasn't been set yet.
    // m_first ends up with garbage.
};
```

To be safe, always write the initializer list in the same order as the member declarations in the class body.

## Common mistakes

**Mistake 1: Assigning `const` or reference members in the constructor body instead of the initializer list.**

```cpp
class Config {
    const int m_timeout;
public:
    Config(int t) {
        m_timeout = t;  // compile error: cannot assign to a const member
    }
};
```

The fix is to move the initialization into the list:

```cpp
Config(int t) : m_timeout{ t } {}
```

A `const` member that is not initialized in the initializer list also causes a compile error, because by the time the body runs, initialization is already over.

**Mistake 2: Trusting the initializer list order instead of the declaration order.**

```cpp
class Bounds {
    int m_max;
    int m_min;
public:
    // m_max is declared first, so it's initialized first — but the list
    // mentions m_min first. The compiler still initializes m_max first.
    Bounds(int lo, int hi)
        : m_min{ lo }, m_max{ m_min + hi }  // m_max is actually initialized before m_min!
    {}
};
```

When the compiler initializes `m_max`, `m_min` is still uninitialized, so `m_max` gets garbage. The fix is to reorder the declarations (or the list) so the dependency direction is correct.

**Mistake 3: Shadowing parameter names.**

```cpp
class Box {
    int width;
public:
    Box(int width)
        : width{ width }  // this works — parameter shadows member, but
                          // the list knows which is which
    {}
};
```

This actually compiles and works correctly — inside the initializer list, `width` on the left refers to the member, while `width` on the right refers to the parameter. But many teams prefer the `m_` prefix to make the distinction explicit and avoid confusion.

## When to use this

Use member initializer lists for every constructor, all the time — it is the idiomatic C++ way to set member values. Never assign members inside the constructor body when initialization is possible.

The initializer list is not just style: it is required for `const` members, reference members, and (as you will see in later lessons) member objects that have no default constructor. Getting into the habit of using it everywhere avoids hard-to-debug issues when those types appear.

If a member needs complex initialization logic (such as a computation that requires multiple statements), that logic belongs in the constructor body — but the member should still appear in the initializer list with an intermediate value, or the computation result should be passed in as a parameter. Keep the initializer list as the definitive source of initial values and the body as the place for post-initialization side effects.

## The idea

The previous lesson established that `operator+` is just a named function. The simplest approach is to write it as a free function outside the class. But free functions can only see the public members of a class. When your class keeps its data private — as good encapsulation requires — the free function cannot reach the fields it needs.

Friend functions solve this cleanly: a class can grant a specific external function access to its private members by declaring it a `friend` inside the class body. The function still lives outside the class; it just has a special key that unlocks private access.

For arithmetic operators (`+`, `-`, `*`, `/`) the friend-function approach is the idiomatic C++ pattern. You write the operator as a free function (which keeps the parameter list symmetric), and you add a `friend` declaration inside the class so the operator can read private data.

## How it works

**Example 1: Friend operator+ for a Fraction class**

```cpp
#include <iostream>

class Fraction {
    int m_num{};
    int m_den{1};
public:
    Fraction(int n, int d) : m_num{n}, m_den{d} {}

    friend Fraction operator+(const Fraction& a, const Fraction& b);
};

Fraction operator+(const Fraction& a, const Fraction& b) {
    return Fraction{
        a.m_num * b.m_den + b.m_num * a.m_den,
        a.m_den * b.m_den
    };
}

int main() {
    Fraction f1{1, 3};   // 1/3
    Fraction f2{1, 6};   // 1/6
    Fraction r = f1 + f2;
    std::cout << r.m_num << "/" << r.m_den << "\n";  // 9/18
    return 0;
}
```

The `friend Fraction operator+(...)` line inside the class body does two things at once: it declares the function so the compiler knows it exists, and it grants it access to `m_num` and `m_den`. The actual definition appears outside the class — no class name prefix is needed.

**Example 2: Multiple arithmetic operators**

You can overload several operators for the same class; each needs its own friend declaration:

```cpp
class Vec2 {
    int m_x{}, m_y{};
public:
    Vec2(int x, int y) : m_x{x}, m_y{y} {}

    friend Vec2 operator+(const Vec2& a, const Vec2& b);
    friend Vec2 operator-(const Vec2& a, const Vec2& b);
};

Vec2 operator+(const Vec2& a, const Vec2& b) {
    return Vec2{a.m_x + b.m_x, a.m_y + b.m_y};
}

Vec2 operator-(const Vec2& a, const Vec2& b) {
    return Vec2{a.m_x - b.m_x, a.m_y - b.m_y};
}
```

Each definition is a regular free function. Neither is a member of `Vec2` — they just have private access. This means both `a + b` and `b + a` work identically, which is what you expect for addition.

**Example 3: Mixing class and scalar**

A common need is to allow both `obj + scalar` and `scalar + obj`. With a member function you can only write `obj + scalar`. With friend free functions, you write two separate overloads:

```cpp
class Vec2 {
    int m_x{}, m_y{};
public:
    Vec2(int x, int y) : m_x{x}, m_y{y} {}
    friend Vec2 operator+(const Vec2& v, int s);
    friend Vec2 operator+(int s, const Vec2& v);
};

Vec2 operator+(const Vec2& v, int s) { return Vec2{v.m_x + s, v.m_y + s}; }
Vec2 operator+(int s, const Vec2& v) { return Vec2{v.m_x + s, v.m_y + s}; }
```

Both `v + 5` and `5 + v` now compile. You cannot achieve this with a single member function.

## Common mistakes

**Mistake 1: Defining the function inside the class body**

```cpp
class Foo {
    int m_val{};
public:
    // Looks right but is actually a member function definition, not a friend free function
    friend Foo operator+(const Foo& a, const Foo& b) {
        return Foo{a.m_val + b.m_val};  // compiles, but this IS inside the class
    }
};
```

Defining the body inside the class body while using `friend` actually works in modern C++ (it creates an inline friend function). However, it is confusing and non-idiomatic. The conventional style is: write only the declaration inside the class, and put the full definition outside. Mixing the two creates maintenance confusion about where to look for the implementation.

**Mistake 2: Missing const on parameters**

```cpp
// WRONG — takes by value, needlessly copying both objects
Foo operator+(Foo a, Foo b) {
    return Foo{a.m_val + b.m_val};
}
```

Arithmetic operators should always take their operands as `const` references. Taking by value makes an unnecessary copy of each object on every call. For cheap types this is only a performance issue; for types with expensive constructors it is a significant bug.

**Mistake 3: Returning `*this` from an arithmetic operator**

```cpp
// WRONG — modifies and returns the left operand
Foo& operator+(Foo& a, const Foo& b) {
    a.m_val += b.m_val;
    return a;
}
```

Arithmetic operators must return a new object by value, not modify their operands. `a + b` must not change `a` — that's the job of `+=`. If you return a reference to one of the parameters, chained expressions like `a + b + c` silently corrupt `a`.

## When to use this

Use friend functions for arithmetic operators (`+`, `-`, `*`, `/`) whenever your class keeps data private. Friend functions let the operator's parameter list stay symmetric — neither operand is forced to be on the left — which matters whenever you want `scalar OP object` to work in addition to `object OP scalar`.

If you don't need private access (all relevant data is public), a plain free function without the `friend` keyword works identically. Member functions are a reasonable alternative for some operators, but they prevent commutative forms like `5 + v`. The next lessons in this chapter cover when to prefer each style.

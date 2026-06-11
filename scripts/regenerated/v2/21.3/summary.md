## The idea

The previous lesson used `friend` functions to let free operator functions access a class's private members. But `friend` is a strong coupling mechanism — it gives external functions intimate access to implementation details. Before reaching for `friend`, check whether the class already exposes enough information through its public interface. If it does, you can write the operator as a completely normal free function that only touches public members.

Normal (non-friend) free functions maintain a stricter separation between a class's interface and its implementation. They're the right tool when: (a) the class has public accessors that return what you need, or (b) you're overloading an operator between two different types and neither one needs to be modified.

## How it works

**Example 1: Using accessors instead of friend**

If your class has public getters, you don't need `friend` at all:

```cpp
#include <iostream>

class Vec2 {
    int m_x{}, m_y{};
public:
    Vec2(int x, int y) : m_x{x}, m_y{y} {}
    int x() const { return m_x; }
    int y() const { return m_y; }
};

// No friend needed — uses only public x() and y()
Vec2 operator+(const Vec2& a, const Vec2& b) {
    return Vec2{a.x() + b.x(), a.y() + b.y()};
}

int main() {
    Vec2 u{1, 2}, v{3, 4};
    Vec2 r = u + v;
    std::cout << r.x() << " " << r.y() << "\n";  // 4 6
    return 0;
}
```

This works because `Vec2` already exposes `x()` and `y()`. No private access is needed.

**Example 2: When the comparison becomes clean**

Normal functions are especially natural when both operands are compared using only their public interface:

```cpp
class Rectangle {
    int m_w{}, m_h{};
public:
    Rectangle(int w, int h) : m_w{w}, m_h{h} {}
    int area() const { return m_w * m_h; }
};

bool operator<(const Rectangle& a, const Rectangle& b) {
    return a.area() < b.area();
}
```

`area()` is public, so `operator<` needs no friend access. The operator uses only the class's own abstraction — area — rather than reaching into width and height directly. This is actually better design: if you later change the internal representation, the operator automatically adapts.

**Example 3: Normal function vs. friend function — both valid**

```cpp
class Score {
    int m_pts{};
public:
    Score(int p) : m_pts{p} {}
    int pts() const { return m_pts; }

    // Only declare friend if you need private access:
    // friend Score operator+(const Score& a, const Score& b);
};

// Normal free function — only uses the public pts() accessor
Score operator+(const Score& a, const Score& b) {
    return Score{a.pts() + b.pts()};
}
```

Here, `pts()` is public, so no `friend` declaration is needed inside `Score`. The operator lives entirely in the public API space.

## Common mistakes

**Mistake 1: Using a normal function when private access is needed**

```cpp
class Angle {
    double m_degrees{};   // private — no public accessor
public:
    Angle(double d) : m_degrees{d} {}
};

// WRONG — cannot access m_degrees through normal function
Angle operator+(const Angle& a, const Angle& b) {
    return Angle{a.m_degrees + b.m_degrees};  // error: m_degrees is private
}
```

If there is no public accessor and you need the data, you must either add an accessor, or make the function a `friend`. Choosing between the two depends on whether exposing the data publicly is appropriate for your design.

**Mistake 2: Accidentally writing a member function when you meant a free function**

```cpp
class Foo {
    int m_v{};
public:
    Foo(int v) : m_v{v} {}
    int v() const { return m_v; }

    // This looks like a free function, but it's a MEMBER function
    // because it's inside the class body without `friend`
    Foo operator+(const Foo& other) {  // takes implicit `this` as left operand
        return Foo{m_v + other.m_v};
    }
};
```

Inside a class body without `friend`, `operator+` becomes a member function. That is a valid pattern covered in a later lesson, but it has different semantics: only `foo + bar` works, not `someOtherType + foo`. If you intend a free function, write it outside the class.

**Mistake 3: Forgetting that a normal free function cannot use private members**

```cpp
class Counter {
    int m_count{};     // private
public:
    Counter(int c) : m_count{c} {}
    // no accessor for m_count
};

Counter operator+(const Counter& a, const Counter& b) {
    return Counter{a.m_count + b.m_count};  // compile error!
}
```

This is the same error as Mistake 1, stated differently. The fix options are: (a) add `int count() const { return m_count; }`, (b) add `friend Counter operator+(...)` inside the class, or (c) make `m_count` public (rarely right).

## When to use this

Prefer normal free functions over friend functions whenever the class already provides the public accessors you need. This keeps the class's private section small and uncoupled from its operators. A good design principle: if you find yourself adding a friend just to write one operator, consider whether a simple accessor would serve the same purpose with less coupling.

Use friend functions when: (a) no suitable accessor exists and adding one would expose too much internal detail, or (b) performance matters and calling getters repeatedly in a tight loop has measurable cost. In most application-level code, public accessors are the right choice.

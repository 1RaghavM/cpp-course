## The idea

Everything you have learned about classes so far happens at runtime: objects are constructed, member functions are called, and values are computed while the program is running. But C++ offers a second timeline — compile time — where the compiler itself can evaluate expressions and produce constants that are baked directly into the executable.

The `constexpr` keyword says "this can be evaluated at compile time if the inputs are known at compile time." When applied to a class constructor and member functions, it allows objects of that class to participate in constant expressions: array sizes, `static_assert` conditions, template arguments, and `constexpr` variable initializers. The mental model is that `constexpr` unlocks a second, faster, zero-overhead version of your class that lives entirely in the compiler.

## How it works

**constexpr constructors**

A constructor can be `constexpr` as long as its body would be valid as a constant expression — which for most simple classes means: the member initializer list performs only constant-evaluable operations, and the body does not allocate memory or call non-constexpr functions.

```cpp
class Point {
public:
    constexpr Point(int x, int y) : m_x{x}, m_y{y} {}
    constexpr int x() const { return m_x; }
    constexpr int y() const { return m_y; }
private:
    int m_x;
    int m_y;
};

constexpr Point origin{0, 0};       // evaluated at compile time
constexpr Point p{3, 4};            // also compile time
static_assert(p.x() == 3);          // checked at compile time — zero runtime cost
```

The variable `origin` and `p` are compile-time constants. Their addresses still exist at runtime (they are just `const` objects in memory), but their values were computed during compilation, not during program startup.

**constexpr member functions**

Any member function can be `constexpr`. The function is evaluated at compile time when all its arguments are constant expressions, and falls back to a normal runtime call when they are not:

```cpp
class Vec2 {
public:
    constexpr Vec2(int x, int y) : m_x{x}, m_y{y} {}
    constexpr Vec2 add(Vec2 other) const {
        return Vec2{m_x + other.m_x, m_y + other.m_y};
    }
    constexpr int x() const { return m_x; }
    constexpr int y() const { return m_y; }
private:
    int m_x, m_y;
};

constexpr Vec2 a{1, 2};
constexpr Vec2 b{3, 4};
constexpr Vec2 c = a.add(b);     // compile-time: c = {4, 6}
static_assert(c.x() == 4);

int rx = 5, ry = 6;
Vec2 d = Vec2{rx, ry}.add(a);   // runtime: inputs are not constexpr
```

**constexpr aggregates**

Aggregates (structs or classes with no user-provided constructors, no private members, no base classes) can be initialized with aggregate initialization at compile time without any special annotation:

```cpp
struct Color {
    int r, g, b;
};

constexpr Color red{255, 0, 0};        // aggregate, no constructor needed
constexpr Color mix(Color a, Color b) {
    return Color{(a.r + b.r) / 2, (a.g + b.g) / 2, (a.b + b.b) / 2};
}
constexpr Color midpoint = mix(red, Color{0, 0, 255});
static_assert(midpoint.r == 127);
```

The free function `mix` is also `constexpr` here, not a member function — that is fine. Any function whose body satisfies the constant-expression rules can be `constexpr`.

## Common mistakes

**Mistake 1 — Forgetting constexpr on the member function, not just the constructor**

```cpp
class Box {
public:
    constexpr Box(int side) : m_side{side} {}
    int volume() const { return m_side * m_side * m_side; }  // NOT constexpr
private:
    int m_side;
};

constexpr Box b{3};
constexpr int vol = b.volume();  // error: volume() is not a constexpr function
```

Marking the constructor `constexpr` is not enough if you want to call member functions in constant expressions. Each function you want to use at compile time must itself be marked `constexpr`.

**Mistake 2 — Using constexpr where the value is not constant**

```cpp
int side;
std::cin >> side;
constexpr Box b{side};   // error: 'side' is not a constant expression
```

`constexpr` variables must be initialized from constant expressions. A value read from `std::cin` at runtime is never a constant expression. Use `const` (not `constexpr`) for variables whose values are only known at runtime but should not change afterwards.

**Mistake 3 — Expecting static_assert to work with runtime values**

```cpp
int n;
std::cin >> n;
static_assert(n > 0, "must be positive");  // error: n is not constexpr
```

`static_assert` is evaluated at compile time. Its condition must be a constant expression. For runtime checks, use a regular `if` statement or an `assert()` from `<cassert>`.

## When to use this

Reach for `constexpr` constructors and member functions when your class represents a small, value-like type whose interesting properties can be known at compile time: mathematical vectors, colors, fixed-size geometric shapes, compile-time configuration constants, or unit-conversion factors. The benefit is zero runtime cost for those computations and the ability to use `static_assert` to verify invariants in the type system.

When objects must be built from runtime data (user input, file contents), `constexpr` on the constructor is still harmless — it simply means the constructor is also usable in constant contexts, not that it must be called at compile time.

Cross-reference: `constexpr` variables were first introduced in "Constexpr variables" (chapter 5). The distinction between `const` (runtime immutability) and `constexpr` (compile-time evaluability) was covered there. This lesson extends that distinction to user-defined class types.

## The idea

Composition is the relationship where one object *owns* another object as an inseparable part of itself. The part cannot exist independently: it is created when the whole is created, lives inside the whole, and is destroyed when the whole is destroyed. This mirrors how physical objects work — a heart is part of a person, a wheel is part of a bicycle, an engine is part of a car. Remove the whole, and the part goes with it.

In code, composition is the bread and butter of class design. Whenever you add a non-pointer, non-reference member variable to a class, you are expressing composition. The class *is responsible for* that member's construction, copying, moving, and destruction. You do not have to write any special code for this — the compiler orchestrates everything automatically through constructors and destructors.

## How it works

The simplest way to compose objects is to add them as member variables:

```cpp
struct Point {
    double x{};
    double y{};
};

struct Circle {
    Point center;  // composed: Circle owns a Point
    double radius{};
};
```

When you create a `Circle`, a `Point` is automatically constructed inside it. When the `Circle` is destroyed, the `Point` is destroyed with it. There is no separate allocation, no pointer to manage, no lifetime to track.

Member initialization order follows declaration order, and you can initialize composed members in a constructor initializer list:

```cpp
class Rectangle {
    Point topLeft;
    Point bottomRight;
public:
    Rectangle(double x1, double y1, double x2, double y2)
        : topLeft{x1, y1}, bottomRight{x2, y2}
    {}

    double width() const  { return bottomRight.x - topLeft.x; }
    double height() const { return bottomRight.y - topLeft.y; }
    double area() const   { return width() * height(); }
};
```

`topLeft` and `bottomRight` are composed inside `Rectangle`. Users of `Rectangle` cannot extract either point and keep it alive after the rectangle is destroyed — the points belong to the rectangle.

Composition chains naturally. A `Window` can own a `Rectangle`, which owns two `Point` objects, and the entire structure tears down in reverse-construction order:

```cpp
struct Window {
    Rectangle bounds;
    std::string title;

    Window(double x1, double y1, double x2, double y2, const std::string& t)
        : bounds{x1, y1, x2, y2}, title{t}
    {}
};
```

Constructing a `Window` constructs `bounds` (which constructs two `Point`s), then `title`. Destroying the `Window` destroys `title`, then `bounds` (which destroys the two `Point`s).

## Common mistakes

**Confusing composition with dynamic allocation.** Some beginners write `new Point` inside a class and store the result in a raw pointer. This does not give you composition semantics automatically — if you forget to delete in the destructor, or copy the class without a deep-copy constructor, you get a leak or a double-free. True composition stores the part *by value* (or, if the object must be heap-allocated for size reasons, uses `std::unique_ptr`, which restores the correct ownership semantics):

```cpp
// BAD: raw pointer does not compose
struct BadCircle {
    Point* center;  // who deletes this? What happens on copy?
    double radius{};
    BadCircle(double x, double y, double r)
        : center{new Point{x, y}}, radius{r} {}
    // Missing: destructor, copy constructor, copy assignment
};

// GOOD: by-value composition
struct GoodCircle {
    Point center;   // automatically constructed, copied, and destroyed
    double radius{};
};
```

**Exposing composed members by non-const reference.** If the class's invariant depends on its composed members, giving callers a `Point&` accessor lets them modify the internals without going through the class's logic:

```cpp
class Circle {
    Point center;
    double radius{};
public:
    Point& getCenter() { return center; }  // caller can corrupt invariant
};
```

Prefer returning `const Point&` or a copy, or expose specific setters that enforce any constraints.

**Assuming member destruction order.** Members are destroyed in *reverse* declaration order. If one member's destructor depends on another member still being valid, the declaration order matters:

```cpp
struct Foo {
    std::vector<int> data;
    int size{};  // destroyed before data — fine
    // If size's destructor needed data, this would be a bug
};
```

## When to use this

Composition is the default relationship. When an object needs to manage the existence of sub-objects — when it would make no sense for those sub-objects to outlive the containing object — compose them by value. A `Person` with a `Name` and a `BirthDate`, a `Car` with an `Engine` and four `Wheel` objects, a `Window` with a bounding `Rectangle`: these are all natural compositions.

Move to aggregation (storing pointers or references to externally owned objects) only when the sub-objects need to be shared between containers or when their lifetimes genuinely extend beyond the containing object. If you find yourself writing a destructor that calls `delete`, first ask whether `std::unique_ptr` or by-value composition would express the intent more directly — it almost always does.

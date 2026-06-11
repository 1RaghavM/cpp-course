## The idea

When you copy a value of a fundamental type — say `int x = y;` — C++ simply duplicates the bits. For classes, the compiler provides something analogous: the copy constructor. It is a special constructor whose job is to create a new object that is an independent copy of an existing object of the same class.

You have already been triggering copy constructors without knowing it: every time you pass an object by value to a function, or initialize one object from another with `=`, a copy constructor runs. The compiler generates a default one for you that copies each member individually (member-wise copy). For most simple classes that is exactly right. The lesson for now is to understand when and how the copy constructor fires, and how to write your own when the default is not appropriate.

## How it works

The copy constructor signature always takes a `const` reference to the same class type. That reference must be `const` (you are just reading the source) and a reference (not a value — if it were a value, copying it would call the copy constructor again, causing infinite recursion):

```cpp
class Point {
    int m_x;
    int m_y;
public:
    Point(int x, int y) : m_x{ x }, m_y{ y } {}

    // Copy constructor
    Point(const Point& source)
        : m_x{ source.m_x }, m_y{ source.m_y }
    {}

    int x() const { return m_x; }
    int y() const { return m_y; }
};
```

If you do not write a copy constructor, the compiler generates one that does exactly what this example does — copies each member in order.

**When does the copy constructor run?**

It runs in three common situations:

```cpp
Point a{ 3, 4 };

// 1. Direct initialization from another object
Point b{ a };         // copy constructor called

// 2. Copy initialization (= syntax)
Point c = a;          // copy constructor called

// 3. Passing by value to a function
void print(Point p) { std::cout << p.x() << "\n"; }
print(a);             // copy constructor called to make p
```

It does NOT run when passing by reference or by pointer — those just share access to the same object.

You can see the copy constructor firing by printing from it:

```cpp
class Widget {
    int m_id;
public:
    Widget(int id) : m_id{ id } {}

    Widget(const Widget& src) : m_id{ src.m_id } {
        std::cout << "Copied Widget " << m_id << "\n";
    }

    int id() const { return m_id; }
};

void show(Widget w) { std::cout << w.id() << "\n"; }

int main() {
    Widget w{ 7 };
    show(w);       // prints: Copied Widget 7 \n 7
}
```

## Common mistakes

**Mistake 1: Writing a copy constructor that takes by value instead of by reference.**

```cpp
// Compile error or infinite recursion:
Point(Point source)  // incorrect — should be Point(const Point& source)
    : m_x{ source.m_x }, m_y{ source.m_y }
{}
```

Passing by value would require calling the copy constructor to make `source`, which calls the copy constructor again — infinite recursion. The compiler prevents this by requiring the parameter to be a reference.

**Mistake 2: Forgetting that pass-by-value calls the copy constructor.**

```cpp
void compute(Point p) {  // copy constructor runs here
    // ...
}
```

If your copy constructor is expensive (or has side effects like printing), calling `compute` by value copies the object. If you do not need to modify `p` inside the function, prefer `const Point& p` to avoid the copy.

**Mistake 3: Assuming the default copy constructor is always correct.**

For classes that own resources (like heap-allocated memory), the default member-wise copy creates two objects pointing at the same memory. When both objects are destroyed, the memory is freed twice — undefined behavior. You will see this issue in detail when dynamic allocation is introduced. For now, classes with only simple (non-pointer) members are safe with the default copy constructor.

## When to use this

The compiler-generated copy constructor is correct for any class whose members are all copyable values — integers, doubles, strings, other well-behaved class objects. You do not need to write one for such classes.

Write your own copy constructor when the default member-wise copy is wrong — specifically when your class directly manages a resource (raw pointer, file handle, etc.) that must not be shared between copies. For classes covered so far in this chapter, the default is almost always the right choice. The key skill at this stage is recognizing when a copy happens (by value passing, initialization from another object) so you can reason about performance and behaviour.

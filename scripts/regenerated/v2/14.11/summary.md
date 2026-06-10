## The idea

When you create an object without providing any constructor arguments — like `Rectangle r;` — C++ needs a constructor that takes no arguments. That is called a default constructor. If you do not write any constructor at all, the compiler quietly generates one for you. But the moment you write your own constructor, the compiler stops generating the default one. Understanding when the default constructor exists, when it doesn't, and how to add one is what this lesson is about.

A related feature lets you assign default values to constructor parameters. If a caller omits an argument, the default kicks in automatically. This lets one constructor serve both the "all arguments provided" and "some arguments omitted" call sites.

## How it works

**The compiler-generated default constructor** exists only when you have written no constructors yourself. It value-initializes members that have in-class default member initializers, and leaves others in whatever state they happen to be in (undefined for primitive types).

```cpp
class Counter {
    int m_count;  // no in-class default
public:
    // no constructor written — compiler generates:
    // Counter() {}
    // m_count is uninitialized (undefined behavior if read before setting)
};

Counter c;   // OK — uses compiler-generated default constructor
```

**Writing your own constructor removes the implicit default.** Once you write any constructor, the compiler will no longer generate a default one:

```cpp
class Timer {
    int m_seconds;
public:
    Timer(int seconds) : m_seconds{ seconds } {}
    // compiler no longer generates Timer()
};

Timer t;     // compile error: no default constructor
Timer t2{5}; // OK
```

**Providing default arguments lets one constructor cover multiple call sites.** You can give a parameter a default value in the constructor declaration, and callers may omit it:

```cpp
class Box {
    int m_width;
    int m_height;
public:
    Box(int width = 1, int height = 1)
        : m_width{ width }, m_height{ height }
    {}
    int area() const { return m_width * m_height; }
};

Box b1;        // width = 1, height = 1 — default constructor
Box b2{ 4 };   // width = 4, height = 1
Box b3{ 4, 6 };// width = 4, height = 6
```

The rule for default arguments: only trailing parameters can have defaults. If parameter 2 has a default, parameter 3 (and beyond) must also have a default.

**Explicitly defaulting or deleting constructors** uses the `= default` and `= delete` syntax. `= default` tells the compiler to generate the default constructor even when other constructors exist. `= delete` prevents construction with that signature entirely:

```cpp
class Sensor {
    int m_id;
public:
    Sensor() = default;           // compiler-generated default constructor
    Sensor(int id) : m_id{ id } {}
};

Sensor s1;    // OK — uses = default
Sensor s2{7}; // OK — uses parameterized constructor
```

## Common mistakes

**Mistake 1: Expecting a default constructor after writing any other constructor.**

```cpp
class Point {
    int m_x, m_y;
public:
    Point(int x, int y) : m_x{x}, m_y{y} {}
};

Point p;  // compile error: no matching constructor
```

Once you write a constructor, the compiler stops. If you need both `Point{}` and `Point{1,2}`, either add a `Point() = default;` line, add a default-argument constructor, or write a second constructor explicitly.

**Mistake 2: Confusing default arguments with overloaded constructors.**

Two constructors that both become callable with no arguments is ambiguous:

```cpp
class Widget {
public:
    Widget() {}           // default constructor
    Widget(int x = 0) {}  // also callable with zero arguments
};

Widget w;  // compile error: ambiguous — both constructors match
```

The compiler cannot pick between them. Never have two constructors that can both match the same argument list.

**Mistake 3: Leaving primitive members uninitialized via the default constructor.**

```cpp
class Score {
    int m_value;  // no in-class default
public:
    Score() = default;
    int get() const { return m_value; }  // undefined behavior!
};

Score s;
std::cout << s.get();  // reads uninitialized memory
```

Fix it by giving `m_value` an in-class default:

```cpp
int m_value{ 0 };
```

or by writing `Score() : m_value{ 0 } {}` explicitly.

## When to use this

Provide a default constructor whenever your class represents something that has a natural "empty" or "zero" state — a counter starting at zero, a box with unit dimensions, a timer at zero seconds. Prefer giving data members in-class defaults (e.g., `int m_count{ 0 };`) so that any constructor that forgets to mention the member still leaves it in a known state.

Use default arguments when you have one logical constructor with optional parameters. Use `= default` when you add a parameterized constructor but still want the no-argument form to work. Use `= delete` to explicitly prevent construction with certain signatures, which is clearer than leaving users to discover a link error.

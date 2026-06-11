## The idea

In lesson 13.7 you learned how to create a struct and assign its members one by one: create the variable, then write `p.x = 3; p.y = 4;`. That works, but it leaves a gap: the struct exists for a moment with uninitialized members before you fill them in, and if you forget to assign one, you have silent undefined behavior.

Aggregate initialization lets you supply all the initial values in a single expression at the point where you declare the variable. The struct is never in an uninitialized state, every member is set before any code can read it, and the definition site clearly shows the full picture of the object being created. It is the same convenience that brace-initialization gives you for plain ints and arrays, extended to cover structs.

## How it works

Provide the initial values in braces in member-declaration order:

```cpp
#include <iostream>

struct Point
{
    int x;
    int y;
};

int main()
{
    Point p{ 3, 4 };   // x=3, y=4
    std::cout << p.x << ' ' << p.y << '\n';   // 3 4
    return 0;
}
```

The values are matched to members left-to-right. `3` goes to `x`, `4` goes to `y`. If you provide fewer values than members, the remaining members are value-initialized (to zero for numeric types, to empty for `std::string`):

```cpp
struct Point { int x; int y; };

Point p{ 7 };    // x=7, y=0
Point q{};       // x=0, y=0  (value-initialize everything)
```

C++20 also supports designated initializers, which name each member explicitly. This is less order-sensitive and often reads more clearly for structs with several members:

```cpp
#include <iostream>

struct Config
{
    int width;
    int height;
    bool fullscreen;
};

int main()
{
    Config cfg{ .width = 1920, .height = 1080, .fullscreen = false };
    std::cout << cfg.width << 'x' << cfg.height << '\n';   // 1920x1080
    return 0;
}
```

Designated initializers must still appear in the same order as the member declarations. You can skip members (they will be value-initialized), but you cannot reorder them relative to how the struct was defined.

Aggregate initialization works just as well with mixed types:

```cpp
#include <iostream>
#include <string>

struct Employee
{
    int id;
    std::string name;
    double salary;
};

int main()
{
    Employee e{ 1, "Alice", 90000.0 };
    std::cout << e.id << ' ' << e.name << ' ' << e.salary << '\n';
    return 0;
}
```

## Common mistakes

**Providing values in the wrong order.**

```cpp
struct Rect { int width; int height; };

Rect r{ 10, 3 };   // width=10, height=3 — correct
Rect s{ 3, 10 };   // width=3, height=10 — swapped by accident
```

There is no compile-time warning when the types match. This is a classic bug with structs that have multiple members of the same type. Designated initializers (`{ .width = 10, .height = 3 }`) eliminate the ambiguity.

**Narrowing conversions in the initializer list.**

```cpp
struct Pixel { unsigned char r; unsigned char g; unsigned char b; };

Pixel p{ 255, 128, -1 };   // BUG: -1 narrows to unsigned char (value 255 by wrap)
```

Brace initialization forbids narrowing conversions for arithmetic types in most contexts, but `unsigned char` initialized with an `int` may not trigger an error on all compilers. The safe approach is to use values that fit the declared type and enable warnings (`-Wall -Wextra`).

**Using `=` with a brace list instead of direct brace initialization.**

```cpp
struct Point { int x; int y; };

Point p = { 3, 4 };   // works, copy-list initialization
Point q{ 3, 4 };      // also works, direct brace initialization (preferred)
```

Both forms work for aggregates. The direct brace form `q{ 3, 4 }` is generally preferred in modern C++ because it is consistent with how other types use brace initialization and because it cannot call a converting constructor by accident.

## When to use this

Use brace initialization for every struct variable whose member values are known at construction time. It is shorter than the assign-after-construct pattern from lesson 13.7, it is self-documenting, and it eliminates the window of uninitialized state. When a struct has more than two or three members of the same type, prefer designated initializers (`{ .member = value }`) to prevent assignment-order bugs. For struct members whose values are not yet known at construction time — for example, a struct you will populate by reading from stdin — create the variable with `{}` to zero-initialize it first, then assign individual members as the data arrives.

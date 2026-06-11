## The idea

As programs grow, name collisions become a real problem: two functions or variables with the same name in the same scope produce a compile error. Namespaces solve this by partitioning the global scope into named regions. Code inside the `foo` namespace and code inside the `bar` namespace can both define a function called `print` without interfering with each other.

Think of namespaces like filing cabinet drawers: the drawer labelled "Accounting" and the drawer labelled "Engineering" can each contain a folder called "Reports" without any confusion, because you always specify which drawer you are opening before reaching for the folder.

The scope resolution operator `::` is the syntax that opens the drawer. `foo::print` means "the `print` defined inside the `foo` namespace", while `bar::print` means the one inside `bar`.

## How it works

**Defining a namespace**

A namespace is introduced with the `namespace` keyword followed by a name and a block:

```cpp
#include <iostream>

namespace geometry
{
    double pi { 3.14159 };

    double circleArea(double r)
    {
        return pi * r * r;
    }
}

int main()
{
    std::cout << geometry::circleArea(2.0) << '\n';   // prints 12.5664
    return 0;
}
```

Everything inside the `geometry` block belongs to that namespace. From outside, you reach it with `geometry::`. Inside the namespace, members refer to each other without the prefix — `circleArea` can use `pi` directly.

**Multiple definitions in the same namespace**

You can define things in the same namespace across multiple places in the same file. The compiler merges them:

```cpp
#include <iostream>

namespace text
{
    void hello() { std::cout << "Hello\n"; }
}

namespace text
{
    void goodbye() { std::cout << "Goodbye\n"; }
}

int main()
{
    text::hello();     // Hello
    text::goodbye();   // Goodbye
    return 0;
}
```

This is the same `text` namespace, not two separate ones.

**Unqualified access inside the same namespace**

Functions in the same namespace can call each other without a prefix:

```cpp
#include <iostream>

namespace math
{
    int square(int n) { return n * n; }

    int sumOfSquares(int a, int b)
    {
        return square(a) + square(b);   // no math:: needed here
    }
}

int main()
{
    std::cout << math::sumOfSquares(3, 4) << '\n';   // prints 25
    return 0;
}
```

`square` inside `sumOfSquares` resolves within the same namespace automatically.

## Common mistakes

**Using the name without the namespace qualifier**

The most common error is forgetting the `::` when calling a function from outside the namespace:

```cpp
namespace calc
{
    int double_val(int n) { return n * 2; }
}

int main()
{
    double_val(5);   // ERROR: 'double_val' was not declared in this scope
}
```

The compiler sees `double_val` as an unknown name. The fix is `calc::double_val(5)`.

**Confusing the global scope operator with a namespace qualifier**

`::` with nothing on its left refers to the global scope, not to any namespace. Beginners sometimes write `::pi` expecting it to mean "the global `pi`" when they actually want `geometry::pi`:

```cpp
namespace geometry { double pi { 3.14159 }; }

int main()
{
    double x { ::pi };   // ERROR: 'pi' is not in global scope
    double y { geometry::pi };   // correct
    return 0;
}
```

`::pi` would only work if `pi` was defined at global scope (outside any namespace).

**Defining something in the wrong namespace block**

Opening a second block with the same name is valid, but accidentally misspelling the namespace name creates a new, separate namespace:

```cpp
namespace math { int square(int n) { return n * n; } }
namespace maths { int cube(int n) { return n * n * n; } }   // different!

int main()
{
    math::cube(3);   // ERROR: 'cube' is not in namespace 'math'
}
```

The typo (`maths` vs `math`) creates two distinct namespaces. The compiler error points at `cube` being unknown in `math`, which is confusing if you didn't notice the spelling difference.

## When to use this

Reach for a user-defined namespace whenever you are writing reusable utility code that you want to keep separate from other code — a math utilities namespace, a string helpers namespace, a geometry primitives namespace. In real projects, libraries always live inside their own namespace to avoid name collisions with user code.

For a single `main.cpp` student exercise, namespaces are most valuable when you want to group related functions and constants without mixing them into the global scope. If you find yourself prefixing every name manually (like `geo_circle`, `geo_rect`) that is a signal that a namespace would be cleaner. For one-off helper functions that belong to nothing reusable, just leave them at global scope — the overhead of a namespace is not worth it.

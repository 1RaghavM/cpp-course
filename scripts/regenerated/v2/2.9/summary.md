## The idea

Imagine you work at a large company and you ask for "the report". Your colleague asks "which report?" — there are dozens of them, filed by different teams under the same generic name. Programs face the same problem. When a project grows or combines code from multiple sources, different parts of the code often choose the same names for their functions or variables. Two libraries might both define a function called `print`, or two developers might write a helper called `calculate`. When the compiler sees a call to `print` or `calculate`, it has no way to know which one you meant — a **naming collision**.

A **namespace** is C++'s solution. It is a named container for identifiers. Anything declared inside a namespace is accessed with the `::` operator: `geometry::area` and `physics::area` are distinct names even though `area` is the same word. The namespace acts like a last name that disambiguates identically-worded first names.

You have already used one namespace without thinking about it: `std`. Every name from the C++ Standard Library — `cout`, `cin`, `endl` — lives in the `std` namespace. Writing `std::cout` is not decorative syntax; it is telling the compiler exactly which `cout` you want.

## How it works

**Defining and using a namespace**

```cpp
#include <iostream>

namespace greetings
{
    void sayHello()
    {
        std::cout << "Hello!\n";
    }
}

int main()
{
    greetings::sayHello();   // fully qualified call
    return 0;
}
```

The function `sayHello` belongs to the `greetings` namespace. Outside the namespace block, you reach it with `greetings::sayHello()`. Inside the namespace block, you can call it as `sayHello()` directly.

**Resolving a naming collision**

Without namespaces, two libraries defining the same name would clash. With namespaces, they coexist:

```cpp
#include <iostream>

namespace geometry
{
    int area(int w, int h) { return w * h; }
}

namespace physics
{
    int area(int base, int height) { return (base * height) / 2; }
}

int main()
{
    std::cout << geometry::area(4, 5) << "\n";   // 20
    std::cout << physics::area(6, 3) << "\n";    // 9
    return 0;
}
```

Both functions are named `area`, but they live in different namespaces. The compiler resolves the call unambiguously.

**The `using` directive — convenience with trade-offs**

Typing `std::` before every standard name is tedious. The `using namespace std;` directive brings all names from `std` into the current scope so you can write `cout` instead of `std::cout`:

```cpp
#include <iostream>
using namespace std;

int main()
{
    cout << "Hello\n";   // std:: omitted
    return 0;
}
```

This is convenient for small programs, but introduces risk in larger ones: if you also define a function named `sort`, the compiler can no longer tell it apart from `std::sort`. For that reason, `using namespace std;` is common in tutorials but discouraged in production code and headers. The fully qualified form (`std::cout`) is always unambiguous.

## Common mistakes

**Mistake 1: Expecting `using namespace std;` to be always safe**

```cpp
#include <iostream>
using namespace std;

int count(int n) { return n + 1; }  // collides with std::count

int main()
{
    cout << count(5) << "\n";  // which count? ambiguous
    return 0;
}
```

Once you write `using namespace std;`, every unqualified name you write is checked against `std` as well as the global scope. A function you name `count`, `find`, or `max` can silently collide with a standard one, leading to a compiler error or an unexpected call. Prefer `std::cout` over `using namespace std;` in any file that grows beyond a few lines.

**Mistake 2: Thinking `::` is just decoration**

Beginners sometimes write `std::cout` mechanically without understanding that `std` is a real namespace. This matters when they encounter other namespaces. If you write a helper in `namespace math` and then call `area(3, 4)` from outside that namespace, the compiler reports that `area` is undeclared — even though it exists. The fix is `math::area(3, 4)`.

**Mistake 3: Defining the same namespace block in multiple places and expecting them to merge automatically**

In C++, you can reopen a namespace in the same file to add more declarations:

```cpp
namespace tools { int add(int a, int b) { return a + b; } }
// ... other code ...
namespace tools { int sub(int a, int b) { return a - b; } }
```

Both `tools::add` and `tools::sub` exist — they merged into one namespace. This is intentional and correct. The common mistake is assuming that two separate definitions of the *same function* inside the same namespace also merge, which would be a multiple-definition error.

## When to use this

Use namespaces whenever code from multiple sources shares a project, or whenever a library you write might be included alongside other libraries. For small, single-file programs with no risk of collision, namespaces are optional overhead. Always prefer the fully qualified `std::cout` form over `using namespace std;` in files that will be included elsewhere or that define many names. The `using` directive is acceptable — and common — inside function bodies where its scope is tightly limited, but its use at file scope is a well-known source of subtle bugs that experienced C++ programmers avoid.

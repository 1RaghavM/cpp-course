## The idea

When a C++ class grows beyond a few dozen lines, keeping everything in one `.cpp` file becomes impractical. The conventional solution is to split the class into two files: a **header file** (`.h` or `.hpp`) that holds the class definition — member names, types, and declarations — and an **implementation file** (`.cpp`) that holds the bodies of those member functions. Any other `.cpp` file that needs to use the class simply `#include`s the header.

Think of the header as a contract: it tells the compiler what the class looks like (what members exist and what their types are) without revealing how every function works. The implementation file fulfills that contract. This separation lets large projects compile faster (only the implementation file changes when you update a function body) and makes interfaces readable without wading through implementation details.

## How it works

**The header file**

The header contains the full class definition — data members and function *declarations*. Short functions that are defined inside the class body are implicitly inline, so they may also live in the header without causing multiple-definition errors.

```cpp
// point.h
#pragma once    // prevents the header from being included twice

class Point {
public:
    Point(int x, int y);
    int getX() const;
    int getY() const;
    void print() const;
private:
    int m_x;
    int m_y;
};
```

`#pragma once` (or the equivalent `#ifndef` include guard) is essential. Without it, if two `.cpp` files both include `point.h`, the compiler sees the class definition twice and reports an error.

**The implementation file**

Member functions defined *outside* the class body must be prefixed with the class name and `::` (the scope resolution operator) so the compiler knows which class the function belongs to.

```cpp
// point.cpp
#include "point.h"
#include <iostream>

Point::Point(int x, int y) : m_x{x}, m_y{y} {}

int Point::getX() const { return m_x; }
int Point::getY() const { return m_y; }

void Point::print() const {
    std::cout << '(' << m_x << ", " << m_y << ")\n";
}
```

The `#include "point.h"` at the top is how the `.cpp` file knows the class definition exists. Without it, the compiler would not recognize `Point::` as a valid scope.

**Using the class from another file**

A third file that needs `Point` only has to include the header. The linker connects the compiled `point.o` to the rest of the program automatically.

```cpp
// main.cpp
#include "point.h"

int main() {
    Point p{3, 4};
    p.print();      // prints: (3, 4)
    return 0;
}
```

For single-file learning exercises the class definition and implementations are written in one `.cpp` file — that is fine and is what the exercises in this course use. The header-file pattern is the real-world convention you will use in any multi-file project.

## Common mistakes

**Mistake 1 — Forgetting `#pragma once` (or an include guard)**

```cpp
// bad_header.h  — no include guard
class Widget { int data; };
```

If `main.cpp` includes `bad_header.h` twice — directly or via another header — the compiler sees `class Widget { ... }` defined twice and reports a *redefinition* error. Fix: always open a new header with `#pragma once`.

**Mistake 2 — Defining a non-inline function in the header**

```cpp
// myclass.h
class Foo {
public:
    void greet();
};

void Foo::greet() {   // WRONG — defined in the header, outside the class body
    std::cout << "Hi\n";
}
```

If two `.cpp` files include this header, both translation units contain a definition of `Foo::greet`, causing a *multiple definition* linker error. Functions defined *inside* the class body are implicitly `inline` and are exempt, but a function defined *outside* the class body — even in a header — is not inline by default. Fix: move the function body to a `.cpp` file (or explicitly mark it `inline` if it must stay in the header).

**Mistake 3 — Missing `ClassName::` prefix in the implementation file**

```cpp
// myclass.cpp
#include "myclass.h"

void greet() {        // WRONG — defines a free function, not MyClass::greet
    std::cout << "Hi\n";
}
```

Without `MyClass::greet`, you have defined a separate global function that just happens to have the same name. The member function declared in the header remains unimplemented, and the linker reports an *undefined reference to `MyClass::greet`*. Fix: write `void MyClass::greet() { ... }`.

## When to use this

Split a class across header and implementation file whenever the class will be used in more than one `.cpp` file. For very small helper types used in exactly one file, keeping everything in that `.cpp` file is acceptable and avoids needless boilerplate. Inline the shortest functions (one-liners like getters) directly in the class definition in the header — the compiler will fold them away. Reserve the `.cpp` for functions that contain real logic. As a rough rule: if a function body would exceed two or three lines, define it in the `.cpp`.

In this course the exercises are intentionally single-file to keep compilation simple in the browser sandbox. In any real C++ project — and on any job — you will follow the header-plus-implementation convention for nearly every class you write.

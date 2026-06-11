## The idea

You already know two ways to get at a struct's members: through a value (using `.`) and through a reference (also using `.`). When you have a pointer to a struct, you need to dereference it before accessing a member. The `->` operator bundles "dereference and then get member" into one symbol, so you do not have to write the awkward `(*ptr).member` spelling every time. Pointers to structs come up naturally when a function is handed a pointer, or when structs live inside containers — and `->` is the idiomatic way to reach their members in those cases.

Think of it like a mailbox key. A reference is a trusted roommate who already knows where the mailbox is and can open it directly with `.`. A pointer is a slip of paper with the mailbox address written on it — you have to look up the address (`*`) and then open the box (`.`), or you use `->` as the shortcut that does both at once.

## How it works

Given a pointer to a struct, both of these expressions access the same member:

```cpp
#include <iostream>

struct Point {
    int x{ 0 };
    int y{ 0 };
};

int main() {
    Point p{ 4, 9 };
    Point* ptr{ &p };

    std::cout << (*ptr).x << '\n'; // explicit dereference then dot
    std::cout << ptr->x   << '\n'; // arrow operator — identical result
    // both print 4
}
```

`ptr->x` is not a different operation — it is defined as exactly `(*ptr).x`. The arrow form simply removes the parentheses and the awkward `*` placement.

Passing a pointer to a function lets the function modify the original struct, just like passing a reference does. The call site reads differently though: you pass `&obj` to give a function a pointer, and `.` to give a reference:

```cpp
#include <iostream>

struct Counter {
    int count{ 0 };
};

void incrementViaPointer(Counter* c, int n) {
    c->count += n;       // dereferences c, then accesses count
}

void incrementViaRef(Counter& c, int n) {
    c.count += n;        // reference: no dereference needed
}

int main() {
    Counter hits{};
    incrementViaPointer(&hits, 3); // pass address-of
    incrementViaRef(hits, 2);      // pass reference
    std::cout << hits.count << '\n'; // 5
}
```

Both approaches modify the same `Counter`. The choice between them is mostly a matter of style and context: references cannot be null, which makes them safer by default; pointers are used when null is a meaningful value or when the function is following a pointer it already has.

You can also use `->` through a `const` pointer or a pointer to `const`. If the pointer is `const Point*`, the pointed-to object is read-only, so `->` can only be used to read members, not to modify them:

```cpp
#include <iostream>

struct Point { int x{ 0 }; int y{ 0 }; };

void printPoint(const Point* ptr) {
    if (ptr != nullptr) {
        std::cout << ptr->x << ' ' << ptr->y << '\n';
    }
}

int main() {
    Point p{ 7, 3 };
    printPoint(&p);  // 7 3
    printPoint(nullptr); // no output, null check guards this
}
```

The null check `if (ptr != nullptr)` is important: dereferencing a null pointer (including via `->`) is undefined behavior.

## Common mistakes

**Mistake 1 — The precedence trap: writing `*ptr.member` instead of `(*ptr).member`.**

```cpp
Point* ptr{ &p };
int val{ *ptr.member }; // compile error (or wrong target)
```

The `.` operator has higher precedence than `*`. So `*ptr.member` parses as `*(ptr.member)`, which tries to apply `.member` to the pointer itself — a compile error since pointers do not have members. Always parenthesize: `(*ptr).member`. Or, better, just use `ptr->member`.

**Mistake 2 — Dereferencing a null pointer.**

```cpp
Point* ptr{ nullptr };
std::cout << ptr->x << '\n'; // undefined behavior — crash likely
```

`->` dereferences the pointer before accessing the member. If the pointer is null, this is UB. Always check for null before using `->` when the pointer might legitimately be null.

**Mistake 3 — Confusing when to use `.` versus `->`.**

```cpp
Point  val{ 1, 2 };
Point& ref{ val };
Point* ptr{ &val };

val.x  = 10;   // value: use dot
ref.x  = 10;   // reference: use dot
ptr->x = 10;   // pointer: use arrow
```

The rule is simple: if the thing on the left is a pointer, use `->`. If it is a value or a reference, use `.`. References behave syntactically like values — you never dereference a reference explicitly.

## When to use this

Use `->` any time you have a pointer to a struct and need to access its members — this is the standard idiom and every C++ programmer recognizes it immediately. When you have a choice between passing a pointer and passing a reference, prefer the reference (as covered in the reference lessons) because it cannot be null and the syntax is cleaner. Pointers are appropriate when null is a meaningful state (such as "no object here"), when iterating over arrays of structs, or when working with functions that hand you a pointer. These concepts sit on top of everything covered since lesson 13.1: you now have the full toolkit for defining types with enums and structs, initializing them safely, passing and composing them, and accessing their members whether you hold a value, a reference, or a pointer.

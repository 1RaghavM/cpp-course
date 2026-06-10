## The idea

The previous lesson explained *why* object-oriented programming bundles data and behavior together. This lesson introduces the C++ mechanism that makes it real: the **class**.

A class is a user-defined type — exactly like `struct`, which you already know — but with one critical difference in how access works. Think of a class as a blueprint for an object. The blueprint says what data the object holds (its *member variables*, also called *data members*) and what operations it can perform (its *member functions*, also called *methods*). Every object you create from that blueprint gets its own copy of the data, but shares the same behavior.

The word "class" carries some conceptual weight in OOP, but syntactically in C++ it is almost interchangeable with `struct`. The real difference, and the reason OOP practitioners prefer `class`, is the default access rule — more on that in the "Common mistakes" section.

## How it works

Declare a class with the `class` keyword, a name, and a body enclosed in braces. Members are listed in the body. End the declaration with a semicolon.

```cpp
#include <iostream>

class Rectangle {
public:
    double width;
    double height;

    double area() {
        return width * height;
    }
};

int main() {
    Rectangle r;
    r.width  = 4.0;
    r.height = 3.0;
    std::cout << r.area() << "\n";  // 12
}
```

The keyword `public:` is an *access specifier*. It means that everything declared after it — `width`, `height`, and `area()` — can be accessed from outside the class. Without `public:` the members would be private by default (inaccessible from `main`). Access specifiers are covered in full in a later lesson; for now, always write `public:` unless you know you want privacy.

You create objects the same way you create structs — by declaring a variable of the class type. Each object gets its own copy of `width` and `height`.

```cpp
Rectangle small;
small.width  = 2.0;
small.height = 1.5;

Rectangle large;
large.width  = 10.0;
large.height = 8.0;

std::cout << small.area() << "\n";  // 3
std::cout << large.area() << "\n";  // 80
```

`small` and `large` are two independent objects. Changing `small.width` does not affect `large.width`. This is one of the most useful properties of classes: many independent instances, each with its own state, all sharing the same behavior.

The only syntactic difference between `class` and `struct` in C++ is the default access level. For a `struct`, members are `public` by default; for a `class`, they are `private` by default. That's it — no other difference in what you can do.

```cpp
struct PointS { double x; double y; };   // x and y are public by default
class  PointC { double x; double y; };   // x and y are private by default
```

Because the access default differs, the convention in modern C++ is: use `struct` for plain data aggregates (no or minimal member functions, all public), and use `class` for anything that controls access to its internals. Following this convention makes your intent clear to other programmers.

## Common mistakes

**Forgetting the `public:` label and getting "member is private" errors.** The most common beginner mistake with `class` is writing a class body, trying to access a member from `main`, and getting a compiler error like `error: 'width' is a private member of 'Rectangle'`. The fix is to add `public:` before the members you want accessible. This is a feature — the compiler is protecting you — but it is surprising if you expected `class` to behave exactly like `struct`.

```cpp
class Box {
    int side;   // private — compiler error if you write box.side = 5; in main
};
```

Add `public:` to fix it (until you intentionally want privacy):

```cpp
class Box {
public:
    int side;
};
```

**Forgetting the semicolon after the closing brace.** This mistake comes from C and affects both `struct` and `class`. The class definition is a declaration that ends with `;`. Forgetting it produces confusing cascading errors on the lines that follow.

```cpp
class Timer {
public:
    int seconds;
}   // ← missing semicolon — compiler error on next line
```

**Treating all member functions as free functions.** A member function is called on an object using the dot operator — `r.area()`, not `area(r)`. Inside the body of a member function, the member variables (`width`, `height`) are accessed directly without any prefix, because the function is implicitly operating on *this* object. Students coming from purely procedural code sometimes try to pass the object as an argument, which is not needed.

## When to use this

Reach for `class` (over `struct`) whenever the type has behavior that belongs to it, or whenever you want to control which members the outside world can read and write. Classic examples: `BankAccount` with a `deposit()` and `balance()` method; `Timer` with `start()`, `stop()`, and `elapsed()`. If the type is just a data bag — a pair of coordinates, a color triple — a `struct` with all-public members is the right choice and signals that intent to your readers.

As you add more behavior to a `class`, you'll naturally want to prevent outside code from corrupting internal state by making some members private. That is the next step in OOP, coming in the lessons on access specifiers and encapsulation.

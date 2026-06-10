## The idea

A **member function** is a function that is declared inside a class (or struct) and operates on one specific instance of that type. You already know free functions — functions that live outside any class and receive data as arguments. Member functions are different: they have direct access to the object's own data members without any explicit argument, because they are *called on* an object.

Think of it this way. A free function says: "Give me a rectangle, and I'll compute its area." A member function says: "I *am* the rectangle, tell me to compute my own area." The difference is subtle in small programs but becomes powerful when objects get complex — the function and the data are bound together, and neither can wander off on its own.

Member functions also form the *interface* of a class — the set of operations the outside world can perform on objects of that type. A well-designed class exposes a small, focused interface through member functions and hides the rest.

## How it works

Declare a member function just like a regular function, but inside the class body. From inside the function, you can access any data member directly by name.

```cpp
#include <iostream>

class Rectangle {
public:
    double width;
    double height;

    double area() {
        return width * height;
    }

    bool isSquare() {
        return width == height;
    }
};

int main() {
    Rectangle r;
    r.width  = 4.0;
    r.height = 4.0;
    std::cout << r.area()     << "\n";  // 16
    std::cout << r.isSquare() << "\n";  // 1 (true)
}
```

Inside `area()` and `isSquare()`, the identifiers `width` and `height` refer to the data members of whichever `Rectangle` object the function was called on. When you write `r.area()`, the compiler passes `r` as the implicit receiver; `width` inside `area()` means `r.width`.

Member functions can also take parameters, just like free functions:

```cpp
class Counter {
public:
    int value;

    void addAmount(int amount) {
        value += amount;
    }

    void reset() {
        value = 0;
    }
};

int main() {
    Counter c;
    c.value = 0;
    c.addAmount(5);
    c.addAmount(3);
    std::cout << c.value << "\n";  // 8
    c.reset();
    std::cout << c.value << "\n";  // 0
}
```

`addAmount` takes a parameter (`amount`) *in addition to* the implicit object. Inside the function, `value` is the member and `amount` is the parameter — no ambiguity.

Member functions can return references to data members, return by value, or return nothing (`void`). They follow the same return-type rules as free functions. The difference is only in how they are called (on an object with `.`) and what names they can see (the object's own members).

## Common mistakes

**Trying to call a member function without an object.** Member functions are not free functions — they must be called on an instance.

```cpp
class Score {
public:
    int value;
    void print() { std::cout << value << "\n"; }
};

// WRONG — no object
print();        // error: no matching function

// WRONG — class name is not an object
Score::print(); // error: member function requires an object

// CORRECT
Score s;
s.value = 10;
s.print();      // 10
```

**Shadowing a member name with a parameter of the same name.** If your parameter has the same name as a data member, the parameter hides the member inside the function body. This is a classic silent bug.

```cpp
class Box {
public:
    int width;

    void setWidth(int width) {  // parameter named 'width' shadows the member
        width = width;          // assigns the parameter to itself — member unchanged!
    }
};
```

The fix is to give the parameter a distinct name (e.g., `w` or `newWidth`) or to use `this->width = width;` (covered in a later lesson). The safest habit is: choose different names for parameters and member variables.

**Defining a member function outside the class without a qualifier.** If you write the function body outside the class braces, you must tell the compiler which class it belongs to using the `ClassName::` qualifier. Omitting it defines a free function instead.

```cpp
class Timer {
public:
    int seconds;
    void tick();  // declaration only
};

void Timer::tick() {   // ← ClassName:: is required here
    seconds += 1;
}
```

Without `Timer::`, the compiler sees a free function `tick()` that tries to use an undefined name `seconds`.

## When to use this

Put a function inside a class whenever it logically belongs to the type — when it reads or modifies the object's own state, or when its meaning only makes sense in the context of an instance. Free functions remain the right choice when the operation does not depend on any specific object's state (utility functions, I/O helpers that work on primitive types) or when it works equally well across unrelated types.

As a rule of thumb from later lessons on encapsulation: if a function would need to be passed the object anyway, make it a member function instead. This keeps the interface discoverable — a user of your class can just type `object.` and see what operations are available.

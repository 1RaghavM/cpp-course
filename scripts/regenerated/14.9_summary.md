## The idea

Every time you create an object, something has to put it in a valid initial state. For structs you have relied on in-class initializers and aggregate initialization. For classes, especially when the initial values depend on arguments passed at the moment of creation, you need a **constructor**.

A constructor is a special member function that runs automatically every time an object of its class is created. It has no return type — not even `void` — and its name is always exactly the class name. Its job is to bring the object into a valid, usable state before the very first line of any other code touches it.

Think of a constructor as the setup crew that arrives before the main event. Nobody calls them explicitly; they just show up whenever you announce that an object of this type is being created.

## How it works

**A basic constructor**

```cpp
class Timer {
private:
    int m_seconds;

public:
    Timer(int startSeconds) {
        m_seconds = startSeconds;
    }

    int getSeconds() const { return m_seconds; }
};

int main() {
    Timer t{ 60 };            // constructor called with 60
    int s = t.getSeconds();   // s == 60
    return 0;
}
```

`Timer(int startSeconds)` is the constructor. When `Timer t{ 60 }` is executed, C++ automatically calls this constructor with `60` as the argument, setting `m_seconds = 60`. No constructor call in your code — it is implicit.

**Constructor with multiple parameters**

```cpp
class Rectangle {
private:
    int m_width;
    int m_height;

public:
    Rectangle(int width, int height) {
        m_width  = width;
        m_height = height;
    }

    int area() const { return m_width * m_height; }
};

int main() {
    Rectangle r{ 4, 3 };
    int a = r.area();  // a == 12
    return 0;
}
```

The object `r` is immediately usable because the constructor set both members before `area()` is ever called.

**Overloaded constructors**

A class can have more than one constructor, as long as the parameter lists differ. This is ordinary function overloading applied to constructors:

```cpp
class Label {
private:
    std::string m_text;

public:
    Label() {
        m_text = "untitled";
    }

    Label(const std::string& text) {
        m_text = text;
    }

    const std::string& getText() const { return m_text; }
};

int main() {
    Label a;                // calls the no-argument constructor
    Label b{ "hello" };    // calls the one-argument constructor
    return 0;
}
```

## Common mistakes

**Mistake 1: Treating the constructor like an ordinary function call**

The constructor is never called by name like a regular function:

```cpp
Timer t;
t.Timer(60);   // ERROR: constructors cannot be called this way after creation
```

The constructor runs exactly once, automatically, at the moment of creation. Once an object exists, its constructor has already run.

**Mistake 2: Forgetting to initialize a member in the constructor body**

If the class has two members but the constructor only assigns one, the other is uninitialized. Reading it is undefined behavior:

```cpp
class Point {
private:
    int m_x;
    int m_y;     // uninitialized if constructor only sets m_x

public:
    Point(int x) {
        m_x = x;
        // m_y was never set — reading it is undefined behavior
    }
};
```

Make sure every member is either set in the constructor body, has an in-class initializer, or will get one through a member initializer list (covered in the next lesson).

**Mistake 3: Defining a constructor with a return type**

Adding `void` or any other return type is a compile error:

```cpp
class Box {
public:
    void Box(int side) { }  // ERROR: constructors cannot have a return type
};
```

Constructors are special: no return type, no `return` statement, just the class name and parameters.

## When to use this

Write a constructor any time an object of a class needs external information to be in a valid state. If the only valid `Timer` is one with a defined starting count, require that count as a constructor parameter — do not leave it as a separate `setSeconds` call that callers might forget to make.

If every valid object of the type can be represented by a fixed default (like a counter that always starts at zero), an in-class initializer or a zero-argument constructor is sufficient. Constructors exist precisely to prevent the class of bug where an object is created but then used before it is properly set up.

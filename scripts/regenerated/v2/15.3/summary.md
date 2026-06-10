## The idea

A class in C++ can define its own types — enums, structs, or other classes — right inside its body. These are called **nested types** (or member types). The idea is simple: if a type only makes sense in the context of a particular class, keep it there. A `Color` enum that only ever appears as part of a `Pixel` class has no good reason to live in the global namespace cluttering up every file that includes the header.

Nested types provide a scope: outside the class, you refer to them as `ClassName::NestedType`. Inside the class body and its member functions, you can use the short name directly. This scoping is the same mechanism as member functions — the class name acts as a namespace for everything inside it.

## How it works

**Nested enum**

The most common nested type is an `enum class` that describes the possible states or options of the enclosing class. Placing it inside the class means the enum values are doubly scoped: `ClassName::EnumName::Value`.

```cpp
class TrafficLight {
public:
    enum class State { Red, Yellow, Green };

    State current() const { return m_state; }
    void  next();
private:
    State m_state{State::Red};
};
```

Inside `TrafficLight`, you write `State::Red`. Outside, you write `TrafficLight::State::Red`. Users of the class see exactly where the enum belongs.

**Nested struct**

A nested struct is useful when the class needs a small aggregate to pass around internally or to expose as part of its interface.

```cpp
class Matrix {
public:
    struct Dimensions {
        int rows;
        int cols;
    };

    Dimensions size() const { return {m_rows, m_cols}; }
private:
    int m_rows{0};
    int m_cols{0};
};

int main() {
    Matrix m;
    Matrix::Dimensions d = m.size();
    // d.rows == 0, d.cols == 0
}
```

`Matrix::Dimensions` is visible to callers as a self-documenting return type. It lives in the `Matrix` scope, signalling that it is tightly coupled to `Matrix`.

**Access rules**

Nested types follow the same `public`/`private`/`protected` access rules as data members and functions. A `private` nested type is completely invisible to code outside the class — useful for internal implementation details.

```cpp
class Logger {
public:
    void log(const std::string& msg);
private:
    struct Entry {       // private — callers cannot name this type
        std::string text;
        int level;
    };
    Entry m_last{"", 0};
};
```

## Common mistakes

**Mistake 1 — Forgetting the class qualifier when using the nested type outside the class**

```cpp
TrafficLight light;
State s = light.current();  // error: 'State' is not in scope
```

Outside the class, `State` alone is not visible. You must write `TrafficLight::State s = light.current();`. This is the most common error beginners make with nested types: trying to use the short name as if it were global.

**Mistake 2 — Nesting a type that is used in many unrelated classes**

If `Color` describes pixels in a `Canvas` and also shapes in a `Renderer` and also labels in a `Chart`, it does not belong to any one class. Nesting it inside one forces the other classes to write `Canvas::Color`, creating a misleading dependency. Types used across many unrelated contexts belong in the global namespace or in their own namespace.

**Mistake 3 — Confusing a nested class with inheritance**

A nested class is not a subclass. `class Inner` inside `class Outer` has no automatic access to `Outer`'s members and no `is-a` relationship with `Outer`. To access an `Outer` object's members from `Inner`, you must pass a reference explicitly. Beginners sometimes assume that because `Inner` is defined inside `Outer`, it can freely read `Outer`'s private data — it cannot (unless declared a friend, which is a separate feature).

## When to use this

Use nested types when the type is tightly coupled to exactly one class and would be confusing or incomplete without that context. A state machine's `State` enum, a key-value store's `Entry` struct, and a parser's `Token` type are all strong candidates. Avoid nesting when the type is a general-purpose building block used in many places — keep those in the enclosing namespace or in their own header. As a rule of thumb: if the name of the nested type only makes sense with the enclosing class name in front of it, it belongs inside the class.

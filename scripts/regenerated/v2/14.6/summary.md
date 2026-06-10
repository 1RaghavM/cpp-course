## The idea

In the previous lesson you learned to make data members private so outside code cannot reach in and change them arbitrarily. But completely locking everything away is usually not the goal — you still need some way for the outside world to read (and sometimes update) values. That is exactly what access functions are for.

An access function is a public member function whose only job is to get or set a private data member. The conventional names reflect this:
- A **getter** (also called an accessor) reads a private member and returns its value.
- A **setter** (also called a mutator) takes a value and stores it in a private member.

Think of a locked cash register with two purpose-built slots: one lets you slide a receipt in to log a sale (setter), and another dispenses a printed receipt showing the current total (getter). You never open the drawer yourself.

## How it works

**A simple getter and setter**

```cpp
class Score {
private:
    int m_value{ 0 };

public:
    int  getValue() const { return m_value; }  // getter
    void setValue(int v)  { m_value = v; }     // setter
};

int main() {
    Score s;
    s.setValue(42);
    int v = s.getValue();   // v == 42
    return 0;
}
```

Naming convention: getters start with `get`, setters with `set`, followed by the member name without the `m_` prefix. `const` on the getter is mandatory — it signals that calling it does not change the object. The setter is not `const` because it modifies the member.

**Getters that return by value vs. by const reference**

For small types (int, double, bool) always return by value. For larger types, returning by `const&` avoids a copy:

```cpp
class Label {
private:
    std::string m_text{ "hello" };

public:
    const std::string& getText() const { return m_text; }
    void setText(const std::string& t) { m_text = t; }
};
```

Returning `const std::string&` means the caller gets a reference directly into the object's storage. The `const` prevents the caller from modifying the string through that reference, maintaining the class's control over its data.

**Setters with validation**

The real power of setters is that they can enforce invariants — rules the object must always satisfy — that a bare `public` data member could never enforce:

```cpp
class Percentage {
private:
    double m_value{ 0.0 };

public:
    double getValue() const { return m_value; }

    void setValue(double v) {
        if (v < 0.0) v = 0.0;
        if (v > 100.0) v = 100.0;
        m_value = v;
    }
};
```

Here `m_value` can never escape the 0–100 range no matter what the caller does. A public data member would allow `p.m_value = 9999.0` without complaint.

## Common mistakes

**Mistake 1: Forgetting `const` on a getter**

A getter that modifies nothing should always be `const`. Omitting it means you cannot call the getter on a `const` object or via a `const` reference:

```cpp
class Box {
private:
    int m_side{ 5 };

public:
    int getSide() { return m_side; }  // not const — a problem
};

void print(const Box& b) {
    // ERROR: getSide() is not const, can't call it on a const Box&
    // std::cout << b.getSide();
}
```

The fix is `int getSide() const { return m_side; }`. Always make getters `const`.

**Mistake 2: Returning a non-const reference from a getter**

Returning a raw (non-const) reference to a private member defeats encapsulation entirely — the caller can then modify the member through the reference without going through the setter:

```cpp
class Counter {
private:
    int m_count{ 0 };

public:
    int& getCount() { return m_count; }  // dangerous
};

Counter c;
c.getCount() = 99;  // bypasses any setter logic — m_count is now 99
```

Return by value for cheap types. Return by `const&` for expensive types. Never return a non-const reference to a private member from a public getter.

**Mistake 3: Writing setters for every member by default**

A setter for every private member gives callers the same power they would have had with a public member. The point of a setter is to add validation or enforce invariants. If a member is truly read-only after construction, provide only a getter (or no accessor at all and expose it only via constructor). Only write a setter when outside code genuinely needs to change that value.

## When to use this

Use a getter whenever outside code needs to read a private value. Use a setter only when outside code legitimately needs to change a private value and you have invariants to enforce (or may want to add them later).

If you find you are writing trivial getters and setters for every single member with no validation, step back and ask whether the class needs to be a class at all. A passive bundle of data — like a coordinate pair — belongs in a `struct` with public members (covered in "Introduction to classes" and "Const class objects and const member functions"). Reserve classes with private members for types that actually have rules to protect.

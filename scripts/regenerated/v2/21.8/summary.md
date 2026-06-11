## The idea

The increment (`++`) and decrement (`--`) operators are special because they each have two forms: prefix and postfix. Writing `++counter` applies the operator before the value is used — prefix form. Writing `counter++` applies the operator after the value is used — postfix form. Both forms appear on a single object with no second argument, yet they behave differently in expressions like `x = counter++` versus `x = ++counter`.

When you overload these operators for your own class, you must implement both forms separately. C++ distinguishes them with a syntactic convention: the postfix version takes a dummy `int` parameter that you never use. It has no value; it exists solely to give the two overloads distinct signatures so the compiler can tell them apart.

## How it works

**Prefix increment**

The prefix form increments the object and returns a reference to the (now-modified) object. This is exactly what the built-in `++x` does for an integer.

```cpp
#include <iostream>

class Counter {
    int m_count{};
public:
    Counter(int c = 0) : m_count{ c } {}
    int get() const { return m_count; }

    // Prefix ++counter
    Counter& operator++() {
        ++m_count;
        return *this;
    }
};

int main() {
    Counter c{ 5 };
    Counter& ref = ++c;
    std::cout << c.get() << '\n';   // 6
    std::cout << ref.get() << '\n'; // 6  (same object)
}
```

Returning `*this` by reference is important: it allows chaining (`++(++c)`) and ensures no copy is made.

**Postfix increment**

The postfix form must return the value the object had *before* the increment. To do that, you save a copy, increment the real object, and return the copy.

```cpp
class Counter {
    int m_count{};
public:
    Counter(int c = 0) : m_count{ c } {}
    int get() const { return m_count; }

    Counter& operator++() {           // prefix
        ++m_count;
        return *this;
    }

    Counter operator++(int) {         // postfix — dummy int parameter
        Counter old{ *this };         // save copy of current state
        ++(*this);                    // increment via prefix form
        return old;                   // return the saved copy
    }
};
```

The postfix form returns `Counter` by value (not by reference), because `old` is a local variable that must be copied out. Notice that the body of the postfix operator calls `++(*this)` — the prefix form — so the incrementing logic lives in exactly one place.

**Decrement is symmetric**

`operator--` follows the same pattern: prefix returns `*this` by reference after decrementing; postfix saves a copy, decrements via prefix, and returns the copy.

```cpp
class Counter {
    int m_count{};
public:
    Counter(int c = 0) : m_count{ c } {}
    int get() const { return m_count; }

    Counter& operator--() {
        --m_count;
        return *this;
    }

    Counter operator--(int) {
        Counter old{ *this };
        --(*this);
        return old;
    }
};
```

**Using both forms**

```cpp
Counter c{ 10 };
std::cout << (c++).get() << '\n'; // 10 — old value returned
std::cout << c.get()     << '\n'; // 11
std::cout << (++c).get() << '\n'; // 12 — incremented value returned
```

## Common mistakes

**Postfix operator returns a reference**

```cpp
Counter& operator++(int) {     // wrong: returning reference to local
    Counter old{ *this };
    ++(*this);
    return old;                // old is destroyed when function returns!
}
```

`old` is a local variable. Returning a reference to it produces undefined behavior. Postfix must return by value.

**Forgetting the dummy `int` parameter on postfix**

```cpp
Counter operator++() {   // this is prefix, not postfix
    Counter old{ *this };
    ++m_count;
    return old;
}
```

Without the `int` parameter, the compiler sees two functions with identical signatures and raises a redefinition error. The dummy `int` is required syntax to mark postfix — you never name it or use it.

**Postfix incrementing directly instead of calling prefix**

```cpp
Counter operator++(int) {
    Counter old{ *this };
    ++m_count;             // direct increment — OK here, but duplicates logic
    return old;
}
```

This works but if the incrementing logic ever changes (e.g., wrapping at a maximum value), you must update both functions. Call `++(*this)` to reuse the prefix overload.

## When to use this

Overload `++` and `--` when your type models something that advances or retreats in a sequence: loop counters, iterators over a custom container, day-of-week cycles, enum-like state machines. Prefer the prefix form in loops (write `++it`, not `it++`) because postfix must create a copy even when the returned value is discarded.

If you only need one direction (e.g., a monotonically increasing counter), implement only `operator++`. There is no requirement to define both `++` and `--`. Combine this with "Overloading operators using member functions" — all four forms (`++pre`, `post++`, `--pre`, `post--`) are most naturally implemented as member functions.

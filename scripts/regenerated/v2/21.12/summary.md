## The idea

When you write `a = b` for two objects of a class, C++ calls the *assignment operator*. By default the compiler generates one for you: it copies each member of `b` into the corresponding member of `a`, one by one — this is called *memberwise copy assignment*. For many simple classes that is exactly right. But when your class manages a resource — a raw pointer, a file handle, an allocated buffer — the default assignment can cause serious problems: two objects end up owning the same resource, and when both try to release it you get a double-free. The solution is to overload `operator=` yourself.

The assignment operator is a member function (always — it cannot be a non-member). It gets called on the *left* operand and receives the *right* operand as its argument. It must modify `*this` to match the right operand, then return a reference to `*this` so that chained assignments like `a = b = c` work correctly.

## How it works

**Basic signature and return type:**

```cpp
ClassName& operator=(const ClassName& rhs);
```

The return type is `ClassName&` (a reference to the current object). You return `*this` at the end. The parameter is `const ClassName&` — a const reference to the right-hand side — because assignment should not change the source.

**Example — a simple wrapper class:**

```cpp
#include <iostream>

class Box {
    int m_width;
    int m_height;
public:
    Box(int w, int h) : m_width{w}, m_height{h} {}

    Box& operator=(const Box& rhs) {
        m_width  = rhs.m_width;
        m_height = rhs.m_height;
        return *this;
    }

    void print() const {
        std::cout << m_width << 'x' << m_height << '\n';
    }
};

int main() {
    Box a{3, 4};
    Box b{10, 20};
    a = b;      // calls operator=
    a.print();  // 10x20
}
```

For this class the compiler-generated assignment would have done the same thing. Writing it out explicitly is only necessary when the default is wrong.

**The self-assignment check:**

When the same object appears on both sides — `a = a` — a naive implementation can corrupt the object or crash. The canonical fix is to check `if (this == &rhs) return *this;` at the top:

```cpp
Box& operator=(const Box& rhs) {
    if (this == &rhs)    // self-assignment guard
        return *this;
    m_width  = rhs.m_width;
    m_height = rhs.m_height;
    return *this;
}
```

For a class with only plain values (no owned heap memory) self-assignment is harmless, but the guard is cheap and conventional — add it whenever you write a custom assignment operator.

**Why chaining requires returning `*this`:**

```cpp
Box a{1,1}, b{2,2}, c{3,3};
a = b = c;   // parsed as: a = (b = c)
```

`b = c` assigns `c` to `b` and returns a reference to `b`. Then `a = b` assigns that reference to `a`. If `operator=` returned `void`, or returned by value, the chain would either fail to compile or produce a copy instead of the intended chain.

## Common mistakes

**Returning by value instead of by reference:**

```cpp
// WRONG
Box operator=(const Box& rhs) {
    m_width = rhs.m_width;
    return *this;   // returns a copy, not *this
}

Box a{1,1}, b{2,2}, c{3,3};
a = b = c;  // a gets a copy of the temporary, not b after assignment
```

Chained assignments silently give wrong results because each step hands a temporary to the next, not the actual modified object. Return `Box&` and `return *this`.

**Forgetting the self-assignment guard when managing resources:**

```cpp
class Buffer {
    int* m_data;
    int  m_size;
public:
    Buffer(int sz) : m_size{sz}, m_data{new int[sz]} {}
    ~Buffer() { delete[] m_data; }

    Buffer& operator=(const Buffer& rhs) {
        // NO self-assignment guard here
        delete[] m_data;             // deletes our own data...
        m_size = rhs.m_size;
        m_data = new int[m_size];    // ...then rhs.m_data is already gone!
        return *this;
    }
};
```

If `buf = buf` is called, `delete[] m_data` destroys the array that `rhs.m_data` also points to. The subsequent `new` plus copy reads freed memory. The fix: add `if (this == &rhs) return *this;` before the `delete`.

**Confusing assignment with initialization:**

```cpp
Box a{3, 4};
Box b = a;   // initialization — calls the copy constructor, NOT operator=
a = b;       // assignment — calls operator=
```

`Box b = a;` uses the copy constructor even though it looks like assignment. Only calls to `operator=` on an *already-constructed* object invoke the assignment operator.

## When to use this

Write a custom `operator=` whenever your class manages a resource that would be unsafe to copy shallowly — raw pointers, open file descriptors, or anything that requires a deep copy or careful resource transfer. The *Rule of Three* says: if you write a custom destructor, you almost certainly need a custom copy constructor and a custom assignment operator too, because all three are needed to properly manage ownership. For classes that use only value members (integers, `std::string`, `std::vector`), the compiler-generated assignment is fine — do not write one unnecessarily.

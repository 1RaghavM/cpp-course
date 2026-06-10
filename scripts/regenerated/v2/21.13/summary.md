## The idea

When C++ copies an object — either through copy construction (`MyClass b = a;`) or copy assignment (`b = a;`) — it has to decide what "copy" means for each member. For members that are plain values (integers, floats, even `std::string`), copying is straightforward. The problem appears when a member is a *pointer to heap memory*. The default strategy, called *shallow copy*, copies the pointer itself — the address — rather than duplicating the data it points to. The result is two objects sharing one block of memory. When the first object's destructor frees that block, the second object is left with a dangling pointer, and when *its* destructor runs you get a crash from a double-free.

*Deep copy* solves this: instead of copying the pointer, you allocate a brand-new block of memory for the copy and duplicate the contents there. Each object now owns its own independent resource.

## How it works

Consider a small class that owns a heap-allocated integer array:

```cpp
class MyArray {
    int* m_data;
    int  m_size;
public:
    MyArray(int size) : m_size{size}, m_data{new int[size]{}} {}
    ~MyArray() { delete[] m_data; }
};
```

**Shallow copy — the default and its problem:**

The compiler-generated copy constructor and copy-assignment operator both do memberwise copy. For pointer members that means copying the address, not the contents:

```cpp
MyArray a{3};      // a.m_data -> [0,0,0] on heap
MyArray b{a};      // b.m_data == a.m_data  (same address!)
// b goes out of scope: ~MyArray frees the block
// a goes out of scope: ~MyArray frees the SAME block → double-free, crash
```

Both `a.m_data` and `b.m_data` hold the same pointer. The first destructor legitimately frees it; the second destructor tries to free already-freed memory — undefined behavior, usually a crash.

**Deep copy — the fix:**

Provide a copy constructor and a copy-assignment operator that allocate new storage and copy the data element by element:

```cpp
#include <algorithm>

class MyArray {
    int* m_data;
    int  m_size;
public:
    MyArray(int size) : m_size{size}, m_data{new int[size]{}} {}

    // deep copy constructor
    MyArray(const MyArray& src)
        : m_size{src.m_size}, m_data{new int[src.m_size]} {
        std::copy(src.m_data, src.m_data + src.m_size, m_data);
    }

    // deep copy assignment
    MyArray& operator=(const MyArray& rhs) {
        if (this == &rhs) return *this;
        delete[] m_data;
        m_size = rhs.m_size;
        m_data = new int[m_size];
        std::copy(rhs.m_data, rhs.m_data + m_size, m_data);
        return *this;
    }

    ~MyArray() { delete[] m_data; }
};
```

Now `MyArray b{a}` gives `b` its own independent array with the same values. Modifying `b`'s data does not affect `a`, and their destructors each free their own block.

**The Rule of Three:**

If a class needs a custom destructor (because it owns a resource), it almost certainly needs a custom copy constructor and a custom copy-assignment operator too. These three functions form a group. Missing any one of them when managing raw resources almost always leads to crashes or data corruption.

## Common mistakes

**Forgetting to deep-copy after resize in operator=:**

```cpp
MyArray& operator=(const MyArray& rhs) {
    if (this == &rhs) return *this;
    // forgot to delete[] m_data first
    m_size = rhs.m_size;
    m_data = new int[m_size];          // leaks the old block
    std::copy(rhs.m_data, rhs.m_data + m_size, m_data);
    return *this;
}
```

The old `m_data` is abandoned on the heap — a memory leak. Every subsequent assignment adds another unreachable block. Always `delete[]` the old resource before allocating the new one, and always guard with a self-assignment check first.

**Shallow copy causing silent data corruption:**

```cpp
MyArray a{3};
a.m_data[0] = 99;
MyArray b{a};          // shallow copy — b.m_data == a.m_data
b.m_data[0] = 0;       // changes a.m_data[0] too!
std::cout << a.m_data[0]; // prints 0, not 99
```

The modification of `b`'s array reaches through to `a`'s array because they share the same pointer. There is no compile-time warning — the code runs and gives wrong results silently.

**Skipping the self-assignment guard in deep copy:**

```cpp
MyArray& operator=(const MyArray& rhs) {
    delete[] m_data;        // if rhs == *this, this just freed our data
    m_size = rhs.m_size;    // rhs.m_size still OK (it's a value)
    m_data = new int[m_size];
    std::copy(rhs.m_data, ...);  // rhs.m_data is now a dangling pointer
    return *this;
}
```

Assigning an object to itself — `a = a` — first deletes the data, then tries to read from the same now-deleted data. Add `if (this == &rhs) return *this;` at the top.

## When to use this

Deep copy is required whenever your class *owns* heap memory (or any other resource that should not be shared). If your class only contains value members or standard library containers like `std::vector` or `std::string` — which already implement deep copy internally — the compiler-generated copy operations are correct and you should not write your own. The distinction "does this class own raw memory?" is the key question. Whenever the answer is yes, think Rule of Three: destructor + copy constructor + copy-assignment operator, all three together. Later you will also encounter move semantics, which provide an efficient alternative to deep copy when the source is a temporary.

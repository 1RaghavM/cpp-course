## The idea

When you return a large object from a function, or pass one as a temporary, C++ by default creates a full copy. For objects that own heap memory — a buffer, a file handle, a dynamically allocated array — that copy means allocating new memory and duplicating every byte. For a one-megabyte buffer this is expensive and pointless if the original is about to be destroyed anyway.

Move semantics gives classes two extra special member functions: a **move constructor** and a **move assignment operator**. Their job is not to copy the resource but to *steal* it. The move constructor takes ownership of the donor's heap allocation and sets the donor's pointer to null. The move assignment operator does the same for an existing object: it releases whatever it currently owns, then steals from the donor.

Think of a cardboard box filled with books. Copying means buying a new box and photocopying every book. Moving means picking up the original box and handing it to someone else. The original owner is left with an empty box (null pointer), and no copying happens.

This distinction matters because the compiler can automatically choose the move path whenever the source is a temporary or an explicitly cast-to-rvalue object. The result is correct ownership semantics with the performance of a pointer swap.

## How it works

**Example 1 — a class with heap memory: copy vs move constructor**

```cpp
#include <iostream>
#include <cstring>

struct Buffer {
    char* data;
    int   size;

    Buffer(int n) : data(new char[n]), size(n) {
        std::cout << "constructed\n";
    }

    // Copy constructor — deep copy
    Buffer(const Buffer& other) : data(new char[other.size]), size(other.size) {
        std::memcpy(data, other.data, size);
        std::cout << "copied\n";
    }

    // Move constructor — steal the resource
    Buffer(Buffer&& other) noexcept : data(other.data), size(other.size) {
        other.data = nullptr;
        other.size = 0;
        std::cout << "moved\n";
    }

    ~Buffer() { delete[] data; }
};

int main() {
    Buffer a(10);
    Buffer b = a;             // copy
    Buffer c = std::move(a);  // move
    return 0;
}
```

Output:
```
constructed
copied
moved
```

The move constructor takes `other`'s `data` pointer directly and nulls `other.data`. No allocation, no `memcpy`. The destructor of the moved-from `a` safely calls `delete[] nullptr` (which is a no-op).

**Example 2 — move assignment operator**

```cpp
#include <iostream>

struct Buffer {
    char* data;
    int   size;

    Buffer(int n) : data(new char[n]), size(n) {}

    Buffer& operator=(Buffer&& other) noexcept {
        if (this != &other) {
            delete[] data;       // release current resource
            data = other.data;   // steal
            size = other.size;
            other.data = nullptr;
            other.size = 0;
        }
        return *this;
    }

    ~Buffer() { delete[] data; }
};

int main() {
    Buffer x(5);
    Buffer y(20);
    y = std::move(x);  // move-assign: y releases its 20-byte block, steals x's 5-byte block
    return 0;
}
```

The self-assignment guard (`this != &other`) prevents a class from destroying its own data. After the move, `x` holds a null pointer and its destructor does nothing harmful.

**Example 3 — the noexcept keyword and why it matters**

```cpp
#include <iostream>
#include <vector>

struct Item {
    Item() = default;
    Item(Item&&) noexcept { std::cout << "move\n"; }
    Item(const Item&)     { std::cout << "copy\n"; }
};

int main() {
    std::vector<Item> v;
    v.push_back(Item{});   // constructs one Item
    v.push_back(Item{});   // may trigger reallocation
    return 0;
}
```

When `std::vector` reallocates its internal buffer, it uses the move constructor only if it is marked `noexcept`. If the move constructor might throw, `vector` falls back to the copy constructor to preserve the strong exception guarantee. Marking your move constructor `noexcept` is therefore not just style — it enables the standard library to use the fast path.

## Common mistakes

**Mistake 1 — forgetting to null the donor's pointer**

```cpp
Buffer(Buffer&& other) : data(other.data), size(other.size) {
    // Bug: other.data still points to the same block
}
// ~Buffer() calls delete[] data for both original and moved-from → double free
```

If you steal the pointer but do not set `other.data = nullptr`, then when the moved-from object's destructor runs, it calls `delete[]` on memory that the new owner also holds — undefined behavior. Always null out the donor after stealing.

**Mistake 2 — using a moved-from object**

```cpp
Buffer a(10);
Buffer b = std::move(a);
a.data[0] = 'x';   // undefined behavior: a.data is nullptr
```

After a move, the donor is in a valid but unspecified state. For a custom class, it is often explicitly null. Accessing `a.data[0]` dereferences null. The safe rule is to treat a moved-from object as destroyed and not use it again (you may reassign it).

**Mistake 3 — omitting move semantics on a class with a user-defined destructor**

If you write a destructor but do not write a move constructor, the compiler will not generate one (the rule of five). The class will use the copy constructor in situations where the move constructor would have been faster — or it will fail to compile when an object needs to move but cannot copy (like `std::unique_ptr`). Provide all five: destructor, copy constructor, copy assignment, move constructor, move assignment.

## When to use this

Write a move constructor and move assignment operator whenever your class directly manages a resource (owns a raw pointer, a file descriptor, a socket). If your class only holds standard-library types like `std::string` or `std::vector`, their move semantics compose automatically and you probably need nothing. The rule of five is the guideline: if you write any one of destructor, copy constructor, copy assignment, move constructor, or move assignment, you should explicitly define (or `= delete`) all five.

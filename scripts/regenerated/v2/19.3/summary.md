## The idea

You have learned that a class can have a **constructor** — a special member function that runs automatically when an object is created, setting it up for use. C++ also provides the opposite: a **destructor**, a special member function that runs automatically when an object is destroyed.

Think of it this way: if a constructor is the opening act (acquiring resources, initialising members), the destructor is the closing act (releasing resources, cleaning up). The guarantee that the destructor runs on every exit path — normal return, early return, even exception — is what makes C++ resource management reliable. This pairing of acquisition in the constructor and release in the destructor is a fundamental C++ idiom called RAII (Resource Acquisition Is Initialization).

In this chapter's context, the most important resource a destructor can release is heap memory. A class that allocates memory in its constructor must free it in its destructor, or every object of that class will leak.

## How it works

**Declaring a destructor**

A destructor has the same name as the class, preceded by a tilde (`~`), takes no parameters, and returns nothing:

```cpp
class Buffer {
public:
    int* data;
    int  size;

    Buffer(int n) : size{n} {
        data = new int[n]{};   // allocate in constructor
    }

    ~Buffer() {                // destructor
        delete[] data;         // free in destructor
        data = nullptr;
    }
};
```

The destructor body runs automatically when a `Buffer` object goes out of scope, is deleted (if heap-allocated), or is otherwise destroyed. You never call the destructor directly.

**Automatic invocation — stack and heap objects**

For a stack object, destruction happens when the enclosing scope closes:

```cpp
#include <iostream>

class Tracker {
public:
    int id;
    Tracker(int i) : id{i} { std::cout << "Created " << id << "\n"; }
    ~Tracker()              { std::cout << "Destroyed " << id << "\n"; }
};

int main() {
    Tracker a{1};
    {
        Tracker b{2};
    }   // b's destructor runs here
    // a's destructor runs here (end of main)
}
```

Output:
```
Created 1
Created 2
Destroyed 2
Destroyed 1
```

Objects are destroyed in reverse construction order, matching the stack discipline.

For a heap-allocated object, the destructor runs when you call `delete`:

```cpp
Tracker* p = new Tracker{3};
delete p;   // destructor runs here, then memory is freed
```

**Destructor + dynamic array: a practical class**

```cpp
class IntList {
public:
    int* items;
    int  count;

    IntList(int n) : count{n} {
        items = new int[n]{};
    }

    ~IntList() {
        delete[] items;
    }
};
```

Every `IntList` — whether on the stack or the heap — will free its array automatically when destroyed. No manual `delete[]` needed by the caller.

## Common mistakes

**Mistake 1 — Forgetting the destructor when the class owns heap memory**

```cpp
class Grid {
public:
    int* cells;
    Grid(int n) { cells = new int[n]{}; }
    // no destructor — cells is never freed
};
```

Every `Grid` object leaks its array. The fix is to add `~Grid() { delete[] cells; }`. Classes that own heap memory must always have a destructor.

**Mistake 2 — Calling the destructor manually**

```cpp
Buffer buf{5};
buf.~Buffer();   // explicitly calls the destructor
// ... buf goes out of scope — destructor runs AGAIN
```

When `buf` goes out of scope, C++ will call its destructor again automatically. Double-destructing an object that frees heap memory in its destructor is a double-delete — undefined behavior. Never call a destructor manually on an automatic (stack) object. The only legitimate manual destructor call is in advanced placement-new scenarios, which are beyond this lesson.

**Mistake 3 — Shallow copy leading to double-delete**

```cpp
Buffer a{3};
Buffer b = a;   // copies the pointer, not the data
// Both a and b now point to the same heap array
// When they go out of scope, delete[] runs twice on the same block
```

When a class owns a heap resource, the compiler-generated copy constructor copies the pointer shallowly. Both objects then try to delete the same block, causing undefined behavior. The proper fix (a deep-copying copy constructor and copy-assignment operator) is covered in later lessons. For now, be aware that classes with destructors usually need a full set of copy/move operations.

## When to use this

Add a destructor to any class that owns a resource — heap memory, an open file handle, a network connection, a lock. The destructor ensures the resource is freed on every exit path without the caller needing to remember to clean up. This is the foundation of RAII, the idiom that underlies `std::vector`, file streams, mutexes, and most other resource-managing types in the standard library. If a class allocates with `new` in its constructor, it must `delete` in its destructor.

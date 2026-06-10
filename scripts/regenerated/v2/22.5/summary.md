## The idea

`std::unique_ptr<T>` is the simplest smart pointer. It wraps a raw pointer and enforces a single rule: exactly one `unique_ptr` owns the resource at any time. When the `unique_ptr` is destroyed — because it goes out of scope, the function returns, or an exception is thrown — it calls `delete` (or `delete[]` for arrays) on the managed pointer automatically.

Think of it as a ticket stub at a coat check. Only one person holds the stub for any given coat. You can transfer the stub to someone else (move), but you cannot photocopy it (copy is deleted). When the stub holder leaves the building, the coat is returned (memory freed).

The uniqueness invariant means there is no reference counting overhead and no extra allocation. A `unique_ptr<T>` is the same size as a raw `T*` and has zero runtime cost compared to `delete`-by-hand management. It simply makes the ownership explicit in the type system.

## How it works

**Example 1 — basic construction and automatic cleanup**

```cpp
#include <iostream>
#include <memory>

struct Node {
    int value;
    Node(int v) : value(v) {
        std::cout << "Node " << v << " created\n";
    }
    ~Node() {
        std::cout << "Node " << value << " destroyed\n";
    }
};

int main() {
    {
        std::unique_ptr<Node> p = std::make_unique<Node>(42);
        std::cout << "inside block: " << p->value << "\n";
    } // p goes out of scope here
    std::cout << "after block\n";
    return 0;
}
```

Output:
```
Node 42 created
inside block: 42
Node 42 destroyed
after block
```

The destructor runs when `p` leaves its enclosing block. You never write `delete p;`. This works even if the block exits through an exception.

**Example 2 — move semantics and transfer of ownership**

```cpp
#include <iostream>
#include <memory>

std::unique_ptr<int> make_int(int v) {
    return std::make_unique<int>(v); // moves out by NRVO
}

void consume(std::unique_ptr<int> p) {
    std::cout << "consumed: " << *p << "\n";
} // p destroyed here

int main() {
    auto p = make_int(99);
    consume(std::move(p)); // transfer ownership to the function
    if (!p) {
        std::cout << "p is now null\n";
    }
    return 0;
}
```

Output:
```
consumed: 99
p is now null
```

Returning a `unique_ptr` from a function does not require `std::move` in the return statement (NRVO handles it). Passing it into a function that takes by value requires `std::move` because `p` is a named variable.

**Example 3 — arrays and custom deleters**

```cpp
#include <iostream>
#include <memory>

int main() {
    // unique_ptr for a dynamically allocated array
    std::unique_ptr<int[]> arr = std::make_unique<int[]>(5);
    for (int i = 0; i < 5; ++i) {
        arr[i] = i * 2;
    }
    for (int i = 0; i < 5; ++i) {
        std::cout << arr[i] << " ";
    }
    std::cout << "\n";
    return 0;
}
```

Output:
```
0 2 4 6 8
```

`unique_ptr<int[]>` uses `delete[]` instead of `delete` when it destructs. Use the array specialization whenever you manage a heap-allocated array. Prefer `std::vector` for resizable sequences, but `unique_ptr<T[]>` is useful for fixed-size buffers that need clear single ownership.

## Common mistakes

**Mistake 1 — constructing from a raw pointer and then deleting the raw pointer too**

```cpp
int* raw = new int(5);
std::unique_ptr<int> sp(raw);
delete raw;   // double delete when sp destructs
```

Once a raw pointer is handed to a `unique_ptr`, the smart pointer owns the memory. Any further use of the raw pointer — including `delete` — leads to undefined behavior. Use `std::make_unique` and never store the raw pointer separately.

**Mistake 2 — calling get() and storing the result**

```cpp
std::unique_ptr<int> p = std::make_unique<int>(10);
int* raw = p.get();   // raw is a non-owning observer
p.reset();            // p deletes the int
*raw = 20;            // dangling pointer: undefined behavior
```

`p.get()` returns the raw pointer without transferring ownership. If the `unique_ptr` is reset or destroyed while `raw` is still alive, `raw` becomes a dangling pointer. Use `p.get()` only for calls that need a raw pointer and are guaranteed to complete before the `unique_ptr` is destroyed.

**Mistake 3 — passing unique_ptr by value without std::move**

```cpp
void take(std::unique_ptr<int> p) {}

int main() {
    auto p = std::make_unique<int>(1);
    take(p);   // ERROR: unique_ptr is not copyable
    return 0;
}
```

`unique_ptr` deletes its copy constructor. You must write `take(std::move(p))`. The compiler error ("use of deleted function") is clear but can confuse beginners who do not yet know the copy constructor is intentionally removed.

## When to use this

Use `std::unique_ptr` as your default choice for any heap allocation. If a function creates a resource and is the sole owner, return it as `unique_ptr`. If a class owns a heap object, store it as a `unique_ptr` member — the move semantics compose automatically. Prefer `std::make_unique<T>(args)` over `new` for exception safety (two sub-expressions of a function call can interleave, and `make_unique` ensures the allocation and the constructor are atomic from the caller's perspective). Use a raw pointer only when you need a non-owning observer or when interoperating with a C API that does not understand smart pointers.

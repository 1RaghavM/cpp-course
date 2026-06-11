## The idea

Imagine you own a large painting. You want to give it to a friend. You have two choices: make a photocopy and hand them that (a copy), or physically carry the original painting over and hand it off (a move). Copying is fine for small things like a postcard, but for a museum-quality canvas it is wasteful and slow. Moving is instant — you hand over the original, and afterwards you no longer own it.

C++ programs manage heap memory the same way. When you write `new int[1000000]`, the program asks the operating system for a chunk of memory and gives you a raw pointer to it. For as long as that pointer lives, your code must remember to call `delete[]` exactly once — not zero times (leak) and not twice (crash). This bookkeeping is error-prone and scattered.

A **smart pointer** wraps a raw pointer inside a class. The class owns the memory: its destructor calls `delete` automatically when the smart pointer goes out of scope. You never write `delete` by hand. The smart pointer is the "owner of the painting." When the smart pointer dies, the painting is destroyed with it.

**Move semantics** is the mechanism that lets ownership transfer from one smart pointer to another without copying the underlying data. Instead of duplicating the heap allocation, you simply reassign who holds the raw pointer and set the donor's pointer to null. The recipient now owns the resource; the donor owns nothing. This is as cheap as changing two pointer values.

Together, smart pointers and move semantics solve the two main problems of manual memory management: automatic cleanup and safe, cheap ownership transfer.

## How it works

The standard library provides `std::unique_ptr` (one owner at a time) and `std::shared_ptr` (shared ownership with reference counting) in `<memory>`. This lesson introduces the motivation; later lessons cover each in depth. Here, let's see the ownership idea in action.

**Example 1 — raw pointer problem (why we need smart pointers)**

```cpp
#include <iostream>

void risky() {
    int* p = new int(42);
    std::cout << *p << "\n";
    // if we forget delete p; — memory leak
    // if we call delete p; twice — undefined behavior
    delete p;
}

int main() {
    risky();
    return 0;
}
```

The programmer must remember to call `delete p` in every code path, including after exceptions. Miss it once and the allocation leaks for the life of the process.

**Example 2 — unique_ptr: automatic cleanup**

```cpp
#include <iostream>
#include <memory>

void safe() {
    std::unique_ptr<int> p = std::make_unique<int>(42);
    std::cout << *p << "\n";
    // No delete needed. When p goes out of scope, it calls delete automatically.
}

int main() {
    safe();
    return 0;
}
```

The destructor of `std::unique_ptr<int>` calls `delete` on the managed pointer. It does not matter whether the function returns normally or an exception is thrown — the destructor always runs.

**Example 3 — ownership transfer without copying (move semantics preview)**

```cpp
#include <iostream>
#include <memory>

int main() {
    std::unique_ptr<int> owner = std::make_unique<int>(100);
    std::unique_ptr<int> new_owner = std::move(owner); // transfer ownership
    // owner is now null; new_owner holds the int
    if (!owner) {
        std::cout << "owner is empty\n";
    }
    std::cout << "new_owner has: " << *new_owner << "\n";
    return 0;
}
```

`std::move` does not actually move anything — it casts `owner` to an rvalue reference, signalling "I am done with this object, take it." `std::unique_ptr`'s move constructor then steals the internal raw pointer, leaving `owner` holding `nullptr`. No heap allocation is copied.

## Common mistakes

**Mistake 1 — copying a unique_ptr (compile error)**

```cpp
#include <memory>

int main() {
    std::unique_ptr<int> a = std::make_unique<int>(5);
    std::unique_ptr<int> b = a; // ERROR: copy constructor is deleted
    return 0;
}
```

`std::unique_ptr` intentionally has no copy constructor. Unique ownership means only one pointer can own the resource. The compiler refuses to copy it. The fix is to either `std::move(a)` into `b` (transferring ownership) or use `std::shared_ptr` if you genuinely want two owners.

**Mistake 2 — using a moved-from smart pointer**

```cpp
#include <iostream>
#include <memory>

int main() {
    std::unique_ptr<int> a = std::make_unique<int>(7);
    std::unique_ptr<int> b = std::move(a);
    std::cout << *a << "\n"; // undefined behavior: a is null
    return 0;
}
```

After `std::move`, `a` is in a valid but empty state — its internal pointer is `nullptr`. Dereferencing it is undefined behavior. Always check or avoid using a moved-from object. A good rule: treat a moved-from variable as destroyed.

**Mistake 3 — mixing raw and smart pointers for the same resource**

```cpp
#include <memory>

int main() {
    int* raw = new int(10);
    std::unique_ptr<int> sp(raw);
    delete raw; // double delete: sp will also delete when it destructs
    return 0;
}
```

If you construct a smart pointer from a raw pointer and then also manage the raw pointer manually, you will delete the memory twice. Use `std::make_unique` or `std::make_shared` exclusively, or hand the raw pointer to the smart pointer and never touch the raw pointer again.

## When to use this

Use `std::unique_ptr` as your default choice whenever you allocate heap memory. It is zero-overhead compared to a raw pointer — the destructor call is inlined and the size is the same as a raw pointer. Use `std::shared_ptr` when multiple parts of the program must share ownership of a single resource and you cannot determine a single owner statically. Avoid raw `new` and `delete` in new code; reserve them only for implementing low-level data structures where you control the lifetime manually. Move semantics come into play whenever you transfer ownership — passing a `unique_ptr` into a function, returning one from a function, or storing it in a container.

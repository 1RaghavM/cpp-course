## The idea

`std::unique_ptr` works perfectly when one owner is responsible for a resource. But sometimes several parts of a program legitimately share access to the same heap object, and you cannot know which part will be the last one standing. A raw pointer has no way to track this; if the "last user" frees the memory, all the others are left with dangling pointers.

`std::shared_ptr<T>` solves this with **reference counting**. It maintains a control block — a small heap allocation — that holds a count of how many `shared_ptr`s currently point to the managed object. Every time you copy a `shared_ptr`, the count goes up. Every time one is destroyed, the count goes down. When the count reaches zero, the managed object is deleted.

Think of a shared document in a cloud folder. Every team member who opens the document increments a "viewer count." The document is deleted only when the last viewer closes it. Each viewer can independently close their copy; only the final close triggers deletion.

The cost is real: two pointer-sized indirections (one to the object, one to the control block), atomic reference-count increments and decrements (for thread safety), and an extra heap allocation for the control block unless you use `std::make_shared`.

## How it works

**Example 1 — basic sharing and automatic cleanup**

```cpp
#include <iostream>
#include <memory>

struct Asset {
    std::string name;
    Asset(std::string n) : name(std::move(n)) {
        std::cout << name << " created\n";
    }
    ~Asset() { std::cout << name << " destroyed\n"; }
};

int main() {
    std::shared_ptr<Asset> a = std::make_shared<Asset>("Texture");
    {
        std::shared_ptr<Asset> b = a;  // copy: ref count = 2
        std::cout << "use count: " << a.use_count() << "\n";
    }  // b destroyed: ref count = 1
    std::cout << "use count: " << a.use_count() << "\n";
}  // a destroyed: ref count = 0 → Asset deleted
```

Output:
```
Texture created
use count: 2
use count: 1
Texture destroyed
```

Both `a` and `b` point to the same `Asset`. The destructor runs exactly once — when the last `shared_ptr` exits scope.

**Example 2 — make_shared vs constructor from raw pointer**

```cpp
#include <memory>

int main() {
    // Preferred: one allocation for object + control block
    auto p = std::make_shared<int>(42);

    // Avoid: two allocations (one for int, one for control block)
    std::shared_ptr<int> q(new int(99));

    return 0;
}
```

`std::make_shared<T>` allocates the managed object and the control block in a single allocation. This is faster and cache-friendlier than the two-allocation form. It also avoids an exception-safety hole: with `new T()`, if the `shared_ptr` constructor throws before it takes ownership, the `new` result leaks. Always prefer `make_shared`.

**Example 3 — sharing across functions**

```cpp
#include <iostream>
#include <memory>

struct Config {
    int timeout;
};

void use_config(std::shared_ptr<Config> cfg) {
    std::cout << "timeout: " << cfg->timeout << "\n";
    // cfg destructs here; if this was the last holder, Config is freed
}

int main() {
    auto cfg = std::make_shared<Config>();
    cfg->timeout = 30;
    use_config(cfg);             // copy: ref count goes 1 → 2 → 1
    std::cout << "still valid: " << cfg->timeout << "\n";
    return 0;
}
```

Output:
```
timeout: 30
still valid: 30
```

Passing `shared_ptr` by value copies it (incrementing the count). The caller's copy remains valid after the function returns. If you do not need shared ownership, prefer passing by `const reference` to avoid the count manipulation.

## Common mistakes

**Mistake 1 — creating two independent shared_ptrs from the same raw pointer**

```cpp
int* raw = new int(5);
std::shared_ptr<int> a(raw);
std::shared_ptr<int> b(raw);  // separate control block!
// Both a and b think they are the sole controller → double delete
```

Each `shared_ptr` constructed from a raw pointer creates its own control block. They do not know about each other. When both destruct, both try to delete `raw`. Use `std::make_shared` and copy the smart pointer to share ownership.

**Mistake 2 — unnecessary copies when const reference is enough**

```cpp
void read(std::shared_ptr<Config> cfg) { ... }  // copies, atomic increment
void read(const std::shared_ptr<Config>& cfg) { ... }  // no copy, no atomic op
```

Copying a `shared_ptr` involves an atomic increment of the reference count, which has a measurable cost in tight loops or high-frequency calls. If a function only reads the managed object and does not need to keep its own counted reference, pass `const shared_ptr<T>&` or, better, `const T&` directly.

**Mistake 3 — confusing shared_ptr with unique_ptr semantics**

```cpp
auto a = std::make_shared<int>(1);
auto b = std::move(a);   // a is now null; this is NOT shared
```

Moving a `shared_ptr` transfers ownership to `b` and leaves `a` null — the reference count stays at 1. This is the same as `unique_ptr` move semantics. To share ownership, copy (do not move): `auto b = a;`.

## When to use this

Use `std::shared_ptr` when multiple objects or parts of your program legitimately need to hold onto the same resource and you cannot determine a single lifetime owner statically. Classic examples: a scene graph where nodes are referenced by multiple parents; a cached resource shared across subsystems; callback objects kept alive by an event dispatcher. When ownership is clear and single, prefer `std::unique_ptr` — it is faster and communicates intent more clearly. If circular ownership is possible (A holds a `shared_ptr` to B, and B holds one back to A), that creates a memory leak; `std::weak_ptr` breaks the cycle, covered in the next lesson.

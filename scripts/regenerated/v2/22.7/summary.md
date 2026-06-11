## The idea

`std::shared_ptr` uses a reference count to decide when to delete the managed object. The count drops to zero → the object is deleted. This works beautifully in directed ownership graphs, but breaks down in cycles.

Imagine two objects, A and B, each holding a `shared_ptr` to the other. A's count never reaches zero because B holds a reference to A, and B's count never reaches zero because A holds a reference to B. Neither is ever deleted. This is a **reference cycle** — a memory leak despite using smart pointers.

`std::weak_ptr<T>` breaks cycles. It observes a managed object without participating in the reference count. A `weak_ptr` does not prevent the object from being deleted; it only knows whether the object still exists. To access the object, you call `.lock()`, which returns a `shared_ptr` if the object is still alive, or an empty `shared_ptr` if it has already been deleted.

Think of a `weak_ptr` as a sticky note with someone's address written on it. The note does not prevent the person from moving out. Before you show up, you call to check whether they still live there (`.lock()`). If they do, you get an actual reference (a `shared_ptr`) for the duration of your visit.

## How it works

**Example 1 — weak_ptr does not extend lifetime**

```cpp
#include <iostream>
#include <memory>

int main() {
    std::weak_ptr<int> weak;
    {
        auto shared = std::make_shared<int>(42);
        weak = shared;   // weak_ptr observes; does not increment ref count
        std::cout << "inside: " << shared.use_count() << "\n";
    }  // shared destroyed; ref count → 0 → object deleted
    std::cout << "expired: " << weak.expired() << "\n";
    return 0;
}
```

Output:
```
inside: 1
expired: 1
```

`weak = shared` does not increment `shared.use_count()` — it stays at 1. After the inner block, the `int` is deleted and `weak.expired()` returns true (1).

**Example 2 — using lock() to safely access the object**

```cpp
#include <iostream>
#include <memory>

int main() {
    auto shared = std::make_shared<int>(99);
    std::weak_ptr<int> weak = shared;

    if (auto locked = weak.lock()) {   // locked is a shared_ptr
        std::cout << "value: " << *locked << "\n";
        std::cout << "count while locked: " << shared.use_count() << "\n";
    }
    // locked goes out of scope; count returns to 1
    std::cout << "count after: " << shared.use_count() << "\n";
    return 0;
}
```

Output:
```
value: 99
count while locked: 2
count after: 1
```

`weak.lock()` returns a `shared_ptr` that shares ownership for the duration of the if-block. The ref count temporarily rises to 2, then returns to 1 when `locked` destructs. If the object had already been deleted, `locked` would be null and the if-body would not execute.

**Example 3 — breaking a cycle with weak_ptr**

```cpp
#include <iostream>
#include <memory>
#include <string>

struct Node {
    std::string name;
    std::shared_ptr<Node> next;  // strong: keeps next alive
    std::weak_ptr<Node>   prev;  // weak: does not keep prev alive
    ~Node() { std::cout << name << " destroyed\n"; }
};

int main() {
    auto a = std::make_shared<Node>();  a->name = "A";
    auto b = std::make_shared<Node>();  b->name = "B";
    a->next = b;   // A holds a shared_ptr to B
    b->prev = a;   // B holds a weak_ptr to A (no cycle)
    // When main ends, a and b go out of scope.
    // a's count drops to 0 → A destroyed → a->next drops → B's count drops to 0 → B destroyed.
    return 0;
}
```

Output:
```
A destroyed
B destroyed
```

Because `b->prev` is a `weak_ptr`, it does not contribute to A's reference count. When `a` and `b` go out of scope, the cycle is broken and both objects are properly destroyed.

## Common mistakes

**Mistake 1 — calling lock() and ignoring the null check**

```cpp
std::weak_ptr<int> weak = getWeak();
auto locked = weak.lock();
std::cout << *locked;   // crash if locked is null
```

If the managed object has already been deleted, `lock()` returns a null `shared_ptr`. Dereferencing it is undefined behavior. Always check `if (locked)` before using the result.

**Mistake 2 — creating a weak_ptr from nothing**

```cpp
std::weak_ptr<int> w;   // default: empty, not associated with any object
auto locked = w.lock(); // always returns null
```

A default-constructed `weak_ptr` is always expired. You must construct it from an existing `shared_ptr`. Forgetting this can produce silent null-pointer dereferences.

**Mistake 3 — using weak_ptr where a cycle does not exist**

If two objects do not form a cycle, using `weak_ptr` is unnecessary and complicates the code with `.lock()` checks. Use `weak_ptr` specifically to break reference cycles or when you need a non-owning observer of an object that is independently managed by `shared_ptr`.

## When to use this

Use `std::weak_ptr` in two main situations: to break reference cycles in shared-ownership graphs (a back pointer in a doubly-linked structure, a parent pointer in a tree where children are owned by the parent), and as a non-owning cache handle (store `weak_ptr`s in a cache; if the cached object is still alive, lock and return it; if not, regenerate). It is never the right tool for new code that uses `unique_ptr` — `unique_ptr` does not have a weak variant because single ownership means there is no cycle risk. When in doubt, if you find yourself writing `b->weak_field = a` in a class that also has `a->shared_field = b`, you have identified a cycle and `weak_ptr` is the correct fix.

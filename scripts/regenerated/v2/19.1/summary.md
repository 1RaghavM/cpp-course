## The idea

When a program starts, most of its variables live in a region of memory called the **stack**. The stack is fast and automatic: variables spring into existence when you enter a function and disappear the moment you leave it. That is usually exactly what you want — except when it is not.

Sometimes you genuinely do not know how much memory you need until the program is already running. The user types a number, reads a file, or makes a choice, and only then do you know you need room for, say, 500 integers. The stack cannot help here because its layout is fixed at compile time (within each function call). You need a second pool of memory that you can reach into at any moment and carve out exactly the right amount. That pool is called the **heap** (also called dynamic memory or the free store).

In C++, the operators `new` and `delete` are your hands into that pool. `new` allocates memory on the heap and gives you a pointer to it. `delete` hands that memory back to the system. Unlike stack memory, heap memory has no automatic lifetime: it stays allocated until you explicitly release it, no matter what functions return or go out of scope.

This lesson covers allocating and freeing single objects. Allocating whole arrays comes in the next lesson.

## How it works

**Allocating with `new`**

```cpp
#include <iostream>

int main() {
    int* p = new int;   // allocate one int on the heap
    *p = 42;            // write through the pointer
    std::cout << *p << "\n";  // prints 42
    delete p;           // release the memory
    p = nullptr;        // best practice: clear the pointer
}
```

`new int` allocates enough heap memory for one `int` and returns a pointer to it. You own that pointer; nothing else will free the memory for you. After `delete p`, the block is returned to the heap and `p` is a dangling pointer — it still holds the old address, but that address no longer belongs to you. Assigning `nullptr` immediately makes that situation visible.

**Value-initialising at allocation time**

You can provide an initialiser directly with `new`:

```cpp
int* p = new int{7};     // allocates an int, initialises it to 7
double* d = new double{3.14};
std::cout << *p << " " << *d << "\n"; // 7 3.14
delete p;
delete d;
```

Without the initialiser, heap memory for built-in types is **uninitialised** — it holds whatever garbage bytes happened to be in that location. Always initialise, or check in the very next line.

**Deleting through the same pointer type**

`delete` must be called with the same pointer that `new` returned. You cannot pass an arbitrary address, a pointer to a stack variable, or a pointer that has already been deleted:

```cpp
int x = 5;
int* stack_ptr = &x;
// delete stack_ptr;   // ← undefined behavior — do not do this

int* heap_ptr = new int{10};
delete heap_ptr;
// delete heap_ptr;    // ← double delete — undefined behavior
heap_ptr = nullptr;
```

The third example shows a **double delete** — freeing the same block twice. The first `delete` returned the block to the heap, which may have handed it to a different allocation in between. Deleting it again corrupts the heap's bookkeeping.

## Common mistakes

**Mistake 1 — Forgetting to `delete` (memory leak)**

```cpp
void process() {
    int* data = new int{100};
    // ... do something ...
    return;  // ← data is never deleted
}
```

Each call to `process()` leaks one `int` on the heap. The pointer `data` is destroyed when `process` returns (it was on the stack), but the heap block it pointed to is never reclaimed. Over time, the program's memory footprint grows without bound. The fix is straightforward: always match every `new` with a `delete` before the pointer goes out of scope.

**Mistake 2 — Using a dangling pointer after `delete`**

```cpp
int* p = new int{5};
delete p;
std::cout << *p << "\n";   // undefined behavior
```

After `delete p`, the pointer still holds the old address, but the memory is no longer yours. Reading from it could print stale data, crash, or silently corrupt other heap objects. Always null the pointer immediately after deleting:

```cpp
delete p;
p = nullptr;
// *p would now crash visibly (null dereference) rather than silently
```

**Mistake 3 — Deleting a non-heap pointer**

```cpp
int local = 42;
int* p = &local;
delete p;   // undefined behavior — local is on the stack, not the heap
```

`delete` must only be called on addresses that came from `new`. Calling it on a stack variable, a global, or an already-freed pointer is undefined behavior. The address looks the same to you, but the heap's bookkeeper has no record of that block.

## When to use this

Reach for `new`/`delete` when you need an object to outlive the function that created it, or when the size or count of objects is determined at runtime and is too large for the stack. In practice, modern C++ wraps raw `new`/`delete` inside standard containers (`std::vector`, `std::string`) or smart pointers that automate the `delete` — the raw form appears most often in low-level systems code or when learning how those wrappers work internally. If you find yourself using raw `new` in application code, ask whether a `std::vector` or a value type would serve just as well.

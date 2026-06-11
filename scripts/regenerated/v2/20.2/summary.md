## The idea

Every running program has two separate regions of memory it uses for variables: the stack and the heap. Understanding the difference explains some of C++'s most confusing behaviors — why local variables disappear when a function returns, why `new` exists, and what "out of memory" really means.

Think of the stack as a physical stack of trays in a cafeteria. Each time a function is called, a new tray is pushed on top; local variables live on that tray. When the function returns, the tray is popped off and all the variables on it are gone. The process is automatic, fast, and has no overhead beyond moving a single pointer.

The heap is a large pool of unorganized memory managed explicitly by the program. You request a block when you need it and release it when you are done. Heap allocation is slower than stack allocation but the memory persists until you explicitly free it — it does not disappear when a function returns.

## How it works

**Stack allocation: automatic lifetime**

Every local variable lives on the stack. When the function that owns it returns, the variable is destroyed automatically:

```cpp
#include <iostream>

void show() {
    int x = 42;     // x lives on show()'s stack frame
    std::cout << x << "\n";
}   // x is destroyed here; stack frame is popped

int main() {
    show();   // prints 42
    // x does not exist here
}
```

The compiler manages all of this. Stack memory is limited — typically a few megabytes. A deep recursive call chain can exhaust it, producing a stack overflow.

**Heap allocation: manual lifetime with `new` and `delete`**

`new` requests memory on the heap and returns a pointer to it. `delete` releases it:

```cpp
#include <iostream>

int main() {
    int* p = new int{99};   // allocate one int on the heap
    std::cout << *p << "\n"; // prints 99

    *p = 7;
    std::cout << *p << "\n"; // prints 7

    delete p;   // release the memory
    p = nullptr; // good practice: null the pointer after deleting
}
```

The `int` pointed to by `p` outlives the allocation statement but is destroyed when `delete p` runs. If you forget `delete`, the memory is leaked — it stays allocated until the program ends.

**Arrays on the heap**

`new[]` allocates an array; `delete[]` releases it. Use `delete[]` for everything allocated with `new[]`, and plain `delete` for everything allocated with plain `new`. Mixing them is undefined behavior:

```cpp
#include <iostream>

int main() {
    int* arr = new int[5]{1, 2, 3, 4, 5};
    for (int i = 0; i < 5; ++i)
        std::cout << arr[i] << " ";
    std::cout << "\n";  // 1 2 3 4 5
    delete[] arr;
    arr = nullptr;
}
```

## Common mistakes

**Mistake 1 — returning a pointer to a local variable (dangling pointer)**

A local variable lives on the stack and is destroyed when its function returns. A pointer to it becomes a dangling pointer — pointing to memory that no longer belongs to that variable:

```cpp
int* bad() {
    int local = 10;
    return &local;   // WRONG: local is destroyed when bad() returns
}
int main() {
    int* p = bad();
    *p = 5;   // undefined behavior — writing to freed stack memory
}
```

If you need to return memory that outlives the function, allocate it on the heap with `new` (or better, use a `std::vector` or `std::unique_ptr`).

**Mistake 2 — memory leak (forgetting `delete`)**

Every `new` must eventually be paired with a `delete`. Failing to delete is a memory leak: the memory stays allocated, but you can no longer reach it:

```cpp
int main() {
    int* p = new int{5};
    p = nullptr;   // lost the only pointer to the allocation — leak!
    // the int is still allocated but unreachable; freed only at program exit
}
```

Modern C++ avoids raw `new`/`delete` in favor of smart pointers (`std::unique_ptr`, `std::shared_ptr`) that delete automatically. For now, every `new` you write should have a matching `delete` visible in the same scope or in a destructor.

**Mistake 3 — using `delete` instead of `delete[]` (or vice versa)**

`delete` and `delete[]` are not interchangeable. Using `delete` on a `new[]` allocation (or `delete[]` on a plain `new`) is undefined behavior — typically a crash or heap corruption:

```cpp
int* arr = new int[10];
delete arr;    // WRONG — must be delete[] arr
```

The rule is simple: match `new[]` with `delete[]` and `new` with `delete`.

## When to use this

In modern C++, you rarely write raw `new`/`delete` directly. `std::vector`, `std::string`, and `std::unique_ptr` manage heap memory for you through RAII — they allocate in their constructors and deallocate in their destructors automatically. Understanding the stack/heap distinction is still essential for reasoning about performance (stack allocation is essentially free), understanding why returning a local variable's address is wrong, and reading code that predates smart pointers.

Use the stack for small, short-lived values whose size is known at compile time. Use the heap (via smart pointers or containers) when you need data that outlives the function that created it, or whose size is determined at runtime.

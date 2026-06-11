## The idea

In the previous lesson you used `new` to allocate a single object on the heap. Very often, though, the thing you need is not one value but a whole sequence of values — and you will not know how many until the program is running.

A C-style array declared as `int data[100];` is fixed: the size must be a compile-time constant, and the entire array lives on the stack (which has limited space). A **dynamically allocated array** lets you ask for exactly the number of elements you need at runtime, stores them on the heap, and gives you a pointer to the first element. You read and write it using the same subscript syntax (`data[i]`) that you already know.

The key difference from single-object allocation is the syntax: `new[]` allocates an array and `delete[]` (note the square brackets) frees it. Mixing these up — using plain `delete` on an array — is undefined behavior.

## How it works

**Allocating and accessing a dynamic array**

```cpp
#include <iostream>

int main() {
    int n;
    std::cin >> n;

    int* arr = new int[n];   // n elements on the heap

    for (int i = 0; i < n; ++i)
        arr[i] = i * 2;      // same subscript syntax as a regular array

    for (int i = 0; i < n; ++i)
        std::cout << arr[i] << " ";
    std::cout << "\n";

    delete[] arr;            // MUST use delete[], not delete
    arr = nullptr;
}
```

`arr[i]` is identical to `*(arr + i)` — the pointer arithmetic you learned earlier. The runtime only knows the starting address; you are responsible for remembering the length.

**Value-initialising a dynamic array**

Without any initialiser, elements of a built-in type are uninitialised (contain garbage). Add an empty pair of braces to zero-initialise all elements:

```cpp
int* zeroed = new int[5]{};   // all five elements are 0
int* custom = new int[3]{10, 20, 30};  // explicit values
```

With a partial initialiser list, the first elements take the listed values and the rest are zero-initialised.

**Resizing by allocating a new block**

Dynamic arrays have a fixed size once allocated — there is no built-in "resize". The classic manual technique is to allocate a larger block, copy the old data, and free the old block:

```cpp
int oldSize = 4;
int* buf = new int[oldSize]{1, 2, 3, 4};

int newSize = 8;
int* bigger = new int[newSize]{};       // new, larger block
for (int i = 0; i < oldSize; ++i)
    bigger[i] = buf[i];                 // copy old data

delete[] buf;                           // free old block
buf = bigger;                           // pointer now owns the new block
bigger = nullptr;
// buf still holds 1,2,3,4 in first four slots; last four are 0
delete[] buf;
```

This manual pattern is exactly what `std::vector` does internally, automating every step.

## Common mistakes

**Mistake 1 — Using `delete` instead of `delete[]`**

```cpp
int* arr = new int[10];
delete arr;   // undefined behavior — must be delete[]
```

`delete` tells the runtime to free one object. For an array, the runtime needs to know it is an array so it can call the right bookkeeping. Using plain `delete` on an array is undefined behavior: the program may appear to work, corrupt the heap silently, or crash. Always pair `new[]` with `delete[]`.

**Mistake 2 — Out-of-bounds access**

```cpp
int* arr = new int[5]{};
arr[5] = 42;   // undefined behavior — valid indices are 0..4
```

Unlike `std::vector`, a raw dynamic array has no bounds checking. Index 5 reads or writes memory beyond the allocated block, potentially corrupting adjacent heap data or crashing unpredictably. The fix is to keep a separate `size` variable and validate every index against it.

**Mistake 3 — Forgetting to delete after an early return**

```cpp
void process(bool fail) {
    int* buf = new int[100]{};
    if (fail) return;   // ← buf is leaked; delete[] buf is never called
    // ...
    delete[] buf;
}
```

Any exit path that bypasses the `delete[]` causes a leak. In real code this is one of the strongest motivations for using `std::vector` or smart pointers: their destructors run on every exit path automatically.

## When to use this

Use a dynamically allocated array when the size is determined at runtime, the data needs to outlive the function that creates it, or the required size is large enough to risk a stack overflow with a plain array. In modern C++, prefer `std::vector<T>` for almost all of these cases: it handles the allocation, tracks the size, grows automatically, and frees itself. Raw `new[]`/`delete[]` is useful when studying how vector-like containers are implemented, when interfacing with C APIs that expect a raw pointer, or when tight control over memory layout is required.

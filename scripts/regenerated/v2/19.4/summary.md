## The idea

A pointer holds the address of some object. There is nothing that prevents that object from itself being a pointer. A **pointer to a pointer** (`int**`) holds the address of an `int*` variable. This extra level of indirection is occasionally needed when a function must modify a pointer that was passed in, or when building certain data structures.

The most common practical use of pointers to pointers in this chapter is the **jagged 2D array**: a dynamically allocated array of pointers, where each pointer points to a separately allocated row. Unlike a flat 2D array, the rows can each have different lengths, and the whole structure can be built up at runtime from sizes that are not known at compile time.

Understanding pointer-to-pointer also reinforces what you already know: a pointer is just a variable holding an address, and indirection can be layered as deep as the problem requires.

## How it works

**A pointer to a pointer — the basics**

```cpp
#include <iostream>

int main() {
    int  value = 42;
    int* p     = &value;   // p points to value
    int** pp   = &p;       // pp points to p

    std::cout << value  << "\n";  // 42
    std::cout << *p     << "\n";  // 42
    std::cout << **pp   << "\n";  // 42

    **pp = 99;
    std::cout << value  << "\n";  // 99
}
```

`**pp` dereferences twice: first `*pp` gives you the `int*` stored in `p`; then dereferencing that `int*` gives you `value`. Writing through `**pp` modifies `value` directly.

**Dynamic 2D array using a pointer to pointer**

The standard technique for a runtime-sized 2D array allocates the row-pointer array first, then allocates each row separately:

```cpp
#include <iostream>

int main() {
    int rows = 3;
    int cols = 4;

    int** grid = new int*[rows];        // array of row pointers
    for (int r = 0; r < rows; ++r)
        grid[r] = new int[cols]{};      // each row is its own array

    grid[1][2] = 7;                     // row 1, column 2
    std::cout << grid[1][2] << "\n";    // 7

    // Free in reverse: rows first, then the pointer array
    for (int r = 0; r < rows; ++r)
        delete[] grid[r];
    delete[] grid;
}
```

`grid[r][c]` is exactly `*(*(grid + r) + c)` — the outer pointer selects the row, the inner pointer selects the element within that row. Each row is a completely independent heap allocation.

**Jagged array — rows of different lengths**

```cpp
int rows = 3;
int* rowLens = new int[rows]{2, 4, 1};  // each row has a different length
int** jag = new int*[rows];
for (int r = 0; r < rows; ++r)
    jag[r] = new int[rowLens[r]]{};

jag[0][0] = 10; jag[0][1] = 20;   // row 0 has 2 elements
jag[1][3] = 99;                    // row 1 has 4 elements
// jag[2] has 1 element

for (int r = 0; r < rows; ++r)
    delete[] jag[r];
delete[] jag;
delete[] rowLens;
```

Each row is allocated with its own length. Trying to access beyond a row's length is undefined behavior — the rows do not touch each other in memory; there is no overflow into the next row.

## Common mistakes

**Mistake 1 — Freeing in the wrong order**

```cpp
int** grid = new int*[3];
for (int r = 0; r < 3; ++r)
    grid[r] = new int[4]{};

delete[] grid;                  // ← frees the pointer array first
for (int r = 0; r < 3; ++r)
    delete[] grid[r];           // ← then tries to use freed memory — undefined behavior
```

Once `grid` itself is freed, the values in `grid[r]` are gone. Always free the rows first, then the outer array.

**Mistake 2 — Using `delete` instead of `delete[]` on a row**

```cpp
for (int r = 0; r < 3; ++r)
    delete grid[r];    // ← undefined behavior; each row was new int[], not new int
delete[] grid;
```

Each row was allocated with `new int[cols]`, so each row must be freed with `delete[]`, not `delete`.

**Mistake 3 — Treating a pointer-to-pointer as a contiguous 2D array**

A dynamically allocated array-of-arrays is **not** the same as a flat row-major block like `int arr[3][4]`. The rows are at arbitrary addresses on the heap. Code that relies on pointer arithmetic across rows (e.g., iterating from `grid[0]` all the way through all rows in one loop) will produce undefined behavior. Access each row only within its own bounds.

## When to use this

Pointer-to-pointer is mainly useful for runtime-sized 2D data where either rows have different lengths, or the dimensions are not known until the program runs and you cannot use a fixed-size 2D array. For fixed-size or same-length-row cases, a flat 1D array with manual index arithmetic (`row * cols + col`) is simpler and has better cache behavior. In modern C++, a `std::vector<std::vector<int>>` provides the same jagged-array semantics with automatic memory management and no manual `delete`.

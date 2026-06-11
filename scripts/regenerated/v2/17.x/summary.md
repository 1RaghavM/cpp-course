## The idea

Chapter 17 is built around one question: how do you store and work with a fixed number of values of the same type? You explored two different answers — the modern `std::array` and the older C-style array — and traced how their differences ripple through initialization, function passing, string handling, multidimensional layouts, and the risk of undefined behavior from out-of-bounds access.

The unifying theme is *ownership and decay*. `std::array` knows its own size, never loses that information, and works naturally with range-based loops and standard-library algorithms. A C-style array is just a named block of memory; when passed to a function, it immediately loses its size and turns into a bare pointer — the property called array decay. Most of chapter 17's pitfalls trace back to forgetting that decay happened.

## How it works

**`std::array` — the modern fixed-size container**

`std::array<T, N>` wraps a C-style array in a thin struct that remembers its size at compile time. You declare it with both the element type and the count baked into the type:

```cpp
#include <array>
#include <iostream>

int main()
{
    std::array<int, 4> primes = {2, 3, 5, 7};
    std::cout << primes.size() << '\n';   // 4
    for (int p : primes)
        std::cout << p << ' ';
    std::cout << '\n';
    return 0;
}
```

Key operations: `operator[]` (no bounds check), `.at()` (bounds-checked), `.size()`, `.front()`, `.back()`, `.fill()`, and `.data()` (pointer to the underlying array). Passing a `std::array` by `const&` preserves all this information.

**C-style arrays and decay**

```cpp
#include <iostream>

void print(int arr[], int n)   // arr is really int*
{
    for (int i = 0; i < n; ++i)
        std::cout << arr[i] << ' ';
    std::cout << '\n';
}

int main()
{
    int nums[5] = {10, 20, 30, 40, 50};
    print(nums, 5);   // nums decays to int*
    return 0;
}
```

The function must receive the size separately because `arr` has no `.size()`. Pointer arithmetic (`arr + i`) and subscript notation (`arr[i]`) are equivalent once decay occurs. This chapter also covered how a C-style array of `char` ending in `'\0'` forms a C-style string, and how `const char*` can point to a string literal in read-only memory.

**Enumerations as indices**

Using an `enum` or `enum class` to index into an array — rather than magic integers — makes the intent explicit and catches transpositions at compile time. With `std::array` and a well-named enum, every element has a human-readable name.

**Multidimensional arrays**

Both kinds support multiple dimensions. A 2D C-style array `int grid[R][C]` is a flat block of memory in row-major order; passing a 2D C-style array requires specifying the column count in the function signature. A `std::array<std::array<T, C>, R>` keeps full size information and works with range-based `for` at every level.

## Common mistakes

**1. Assuming `sizeof(arr) / sizeof(arr[0])` gives the count after decay**

```cpp
void wrong(int arr[])
{
    int n = sizeof(arr) / sizeof(arr[0]);  // sizeof(int*) / sizeof(int) — likely 2 or 1
    // ...
}
```

Once a C-style array decays, `sizeof` measures the pointer, not the original array. This idiom only works in the same scope where the array was declared. The fix is to pass the count explicitly, or — better — switch to `std::array`.

**2. Modifying a string literal through a non-`const` pointer**

```cpp
char* msg = "Hello";   // deprecated/error; should be const char*
msg[0] = 'h';          // undefined behavior
```

String literals live in read-only memory. Declaring the pointer `const char*` makes the error a compile-time diagnostic instead of a runtime crash.

**3. Off-by-one access in C-style arrays**

```cpp
int arr[5] = {1, 2, 3, 4, 5};
for (int i = 0; i <= 5; ++i)   // i == 5 is out of bounds
    std::cout << arr[i];
```

`std::array` with `.at()` throws on out-of-bounds; a C-style array just reads garbage or crashes. The chapter's recurring theme: prefer `std::array` when you want the safety net.

## When to use this

Use `std::array` whenever the size is known at compile time and you want type safety, standard-library compatibility, and readable `.size()` calls. That covers most fixed-size tables, lookup arrays, and fixed-dimension matrices in application code.

Use C-style arrays — with appropriate `const char*` pointers — when interfacing with C libraries, writing low-level code where stack layout matters, or building a lookup table of string literals. For runtime-sized collections, the earlier chapter on `std::vector` is the right tool.

The chapter's most important takeaway: mixing C-style arrays with functions forces you to track size manually, while `std::array` handles that for you. Every time you catch yourself passing an array length as a separate parameter, ask whether a `std::array` (or `std::vector`) would be cleaner.

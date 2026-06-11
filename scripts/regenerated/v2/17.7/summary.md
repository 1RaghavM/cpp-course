## The idea

Before `std::array` existed, C++ inherited a simpler array type directly from C. A C-style array is a fixed-size sequence of objects stored contiguously in memory, declared with a type, a name, and a size in square brackets. Unlike `std::array`, it has no member functions, no `.size()`, and no bounds checking—it is the raw language mechanism that `std::array` is built on top of.

Understanding C-style arrays matters for two reasons: a huge amount of existing C++ code uses them, and the language still relies on them in a few unavoidable places (string literals, for example). The mental model is simple: `int scores[5]` reserves five consecutive `int`-sized slots in memory, numbered 0 through 4, and the name `scores` refers to the whole block.

## How it works

**Example 1 — declaration, initialization, and access**

```cpp
#include <iostream>

int main() {
    int scores[5]{ 10, 20, 30, 40, 50 };

    for (int i = 0; i < 5; ++i) {
        std::cout << scores[i] << '\n';
    }
}
```

The brace initializer fills slots left to right. Any slots not explicitly initialized are zero-initialized: `int data[4]{ 1, 2 }` gives `{ 1, 2, 0, 0 }`. Accessing `scores[i]` with `i` from 0 to 4 is safe; `scores[5]` is out of bounds—undefined behavior with no runtime error.

**Example 2 — const arrays and omitting the size**

```cpp
#include <iostream>

int main() {
    const char letters[]{ 'A', 'B', 'C', 'D' };

    // size omitted; compiler deduces it from the initializer (4 elements)
    std::cout << "Size deduced: " << sizeof(letters) << " bytes\n";
}
```

When you supply a full initializer list you can omit the size; the compiler counts the initializers and sets the length. `sizeof(arr)` returns the total byte size of the array, not the number of elements—for `char` those happen to be equal, but for `int[5]` it would return 20 (on a 32-bit `int` platform) rather than 5.

**Example 3 — iterating with a range-based for loop**

```cpp
#include <iostream>

int main() {
    double readings[3]{ 1.5, 2.7, 3.9 };

    for (double v : readings) {
        std::cout << v << '\n';
    }
}
```

C-style arrays support the range-based `for` loop directly when the array variable is in scope. This is the cleanest way to iterate without worrying about the index. Once the array decays to a pointer (discussed in the next lesson) the range-based loop no longer works.

## Common mistakes

**Mistake 1 — using `sizeof` to get the element count**

```cpp
int arr[5]{ 1, 2, 3, 4, 5 };
// ---- wrong ----
int count = sizeof(arr);        // 20, not 5 (sizeof returns bytes)
int also_wrong = sizeof(arr) / sizeof(int); // works here, but fragile
```

The classic workaround is `sizeof(arr) / sizeof(arr[0])`, which works only when `arr` is the actual array name in the same scope. Once the array decays to a pointer the trick breaks completely. Use `std::array` with `.size()` instead, or if you must use a C-style array, store the size in a `constexpr` constant separately.

**Mistake 2 — variable-length arrays**

Some compilers accept this as an extension, but it is not standard C++:

```cpp
int n{ 5 };
int arr[n]; // ---- non-standard: VLA ---- compile error in strict mode
```

The size of a C-style array must be a compile-time constant expression. Use `std::vector` (chapter 16) when you need a runtime-determined size.

**Mistake 3 — out-of-bounds access with no diagnostic**

```cpp
int vals[3]{ 10, 20, 30 };
// ---- wrong ----
std::cout << vals[3]; // undefined behavior — no compiler error, no runtime check
```

This compiles cleanly with no warning and often prints garbage or crashes unpredictably. C-style arrays do not perform any bounds checking; keeping the loop bound accurate is entirely the programmer's responsibility.

## When to use this

C-style arrays are appropriate in two situations: when interfacing with C libraries or system APIs that expect a raw `T*`, and when you need a fixed-size array with trivial element types and care about zero-overhead storage (no wrapper overhead, though `std::array` is equally zero-overhead). For any new code where you control the type, prefer `std::array`—it gives you `.size()`, copy semantics, and range safety with identical runtime performance. Reserve C-style arrays for places where the rest of the codebase or an external API demands them.

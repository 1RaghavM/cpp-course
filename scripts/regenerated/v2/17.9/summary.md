## The idea

A pointer to an array element is not just an address—it can move. Adding an integer to a pointer advances it by that many elements, not by that many bytes. This is pointer arithmetic, and it is the mechanical explanation for why `arr[2]` and `*(arr + 2)` mean exactly the same thing.

Think of a pointer as a cursor sitting on an element of a numbered row of boxes. Moving the cursor right by 3 means landing on the box 3 positions later. The machine handles the byte math (3 times the size of one element) automatically, so you think in elements rather than bytes.

Understanding pointer arithmetic matters because the subscript operator on both raw pointers and C-style arrays is defined in exactly these terms. It also explains why passing a pointer into the middle of an array is valid: the function just gets a cursor starting at a different position.

## How it works

**Example 1 — adding and subtracting integers**

```cpp
#include <iostream>

int main() {
    int arr[5]{ 10, 20, 30, 40, 50 };
    int* p = arr;          // p points to arr[0]

    std::cout << *p         << '\n';  // 10
    std::cout << *(p + 2)   << '\n';  // 30 — advance 2 elements
    std::cout << *(p + 4)   << '\n';  // 50

    int* q = arr + 3;      // q points to arr[3]
    std::cout << *q         << '\n';  // 40
    std::cout << *(q - 2)   << '\n';  // 20 — retreat 2 elements
}
```

`p + 2` does not add 2 bytes to the address—it adds `2 * sizeof(int)` bytes, landing at the second element after `p`. Dereferencing with `*` reads the value at that adjusted address.

**Example 2 — subscript is pointer arithmetic in disguise**

```cpp
#include <iostream>

int main() {
    int data[4]{ 100, 200, 300, 400 };
    int* p = data;

    // These four lines print the same value
    std::cout << data[2]    << '\n';  // 300
    std::cout << p[2]       << '\n';  // 300
    std::cout << *(data + 2)<< '\n';  // 300
    std::cout << *(p + 2)   << '\n';  // 300
}
```

`arr[i]` is defined as `*(arr + i)`. The subscript operator on a pointer is not a special array feature—it is pure pointer arithmetic wrapped in nicer syntax. This is why pointer-to-element and array-name support identical `[]` access.

**Example 3 — incrementing a pointer to walk an array**

```cpp
#include <iostream>

int main() {
    int nums[4]{ 5, 10, 15, 20 };
    int* end = nums + 4;   // one-past-the-end: valid address, never dereferenced

    for (int* p = nums; p != end; ++p) {
        std::cout << *p << '\n';
    }
}
```

`++p` moves the cursor one element forward. The loop ends when `p` equals `end` (one past the last valid element). Comparing pointers to the same array with `!=` and `<` is well-defined; pointing one past the end is also valid as long as you never dereference that position.

## Common mistakes

**Mistake 1 — pointer arithmetic on unrelated pointers**

```cpp
int a[3]{ 1, 2, 3 };
int b[3]{ 4, 5, 6 };

int* p = a + 1;
int* q = b + 1;
// ---- wrong ----
int diff = p - q;  // undefined behavior: pointers into different arrays
```

Pointer subtraction (and comparison with `<`, `>`) is only defined when both pointers point into the same array (or one past its end). Subtracting pointers to different arrays is undefined behavior even if the addresses happen to be near each other in memory.

**Mistake 2 — dereferencing the one-past-the-end pointer**

```cpp
int arr[3]{ 1, 2, 3 };
int* end = arr + 3;   // valid: holds address one past arr[2]
// ---- wrong ----
std::cout << *end;    // undefined behavior: nothing valid lives here
```

The language permits forming the address `arr + 3` for use as a sentinel in comparisons, but dereferencing it reads memory past the array boundary. This is undefined behavior—the compiler is not required to place anything meaningful there.

**Mistake 3 — confusing `*p++` precedence**

```cpp
int arr[3]{ 10, 20, 30 };
int* p = arr;
// ---- possibly wrong ----
std::cout << *p++ << '\n';   // prints 10 and then advances p to arr[1]
std::cout << (*p)++ << '\n'; // prints 20 and then increments arr[1] to 21 (modifies data!)
```

`*p++` is parsed as `*(p++)` — it yields the current element and then advances the pointer. `(*p)++` increments the value at the current position. Both compile silently; the difference matters when you want to walk without modifying the array. When in doubt, use an explicit index loop rather than increment expressions.

## When to use this

Pointer arithmetic shows up any time you need to traverse a range using only a pointer and a count: functions written for C APIs, custom algorithms on raw buffers, and iterator implementations inside containers all rely on this mechanism. For new code, prefer iterating with an index variable (`for (int i = 0; i < n; ++i)`) or a range-based for loop on `std::array`—both are clearer and less error-prone. Use pointer arithmetic directly only when the calling convention demands a pointer-and-count pair, which happens most often when interfacing with C-style arrays passed across function boundaries.

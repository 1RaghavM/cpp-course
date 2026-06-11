## The idea

Vectors become much more useful when you can process every element without knowing the exact count ahead of time. Loops and arrays are a natural pair: you can visit, transform, search, or accumulate every element in a collection by counting from the first index to the last.

The relationship between loops and vectors is one of the most important patterns in C++ programming. Once you can write a loop that walks an array, you can build counters, running totals, search algorithms, and transformations — all the fundamental building blocks of data processing.

This lesson focuses on the mechanics of combining index-based `for` loops with `std::vector`, the common patterns that arise, and the mistakes that trip up beginners almost universally.

## How it works

**Basic traversal — reading every element**

The simplest loop visits every element from index 0 to the last index. The last valid index is `size() - 1`. Calling `.size()` returns a `std::size_t`, which is an unsigned type, so to use it safely in an index-based loop the common practice is to cast it to `int`:

```cpp
#include <iostream>
#include <vector>

int main()
{
    std::vector<int> scores { 85, 92, 78, 95, 60 };
    int len { static_cast<int>(scores.size()) };
    for (int i = 0; i < len; ++i)
        std::cout << scores[i] << ' ';
    std::cout << '\n';
}
```

Output: `85 92 78 95 60`

Casting once before the loop (storing in `len`) is cleaner than casting inside the condition every iteration.

**Accumulation — computing a sum or count**

A second variable running alongside the index accumulates results:

```cpp
#include <iostream>
#include <vector>

int main()
{
    std::vector<int> temps { 22, 19, 25, 17, 21 };
    int sum { 0 };
    int len { static_cast<int>(temps.size()) };
    for (int i = 0; i < len; ++i)
        sum += temps[i];
    std::cout << "Average: " << sum / len << '\n';
}
```

Output: `Average: 20`

(Integer division truncates; if you need a decimal result you would cast to `double`.)

**Searching — finding the first match**

Break out of the loop as soon as you find what you are looking for:

```cpp
#include <iostream>
#include <vector>

int main()
{
    std::vector<int> values { 4, 7, 2, 9, 1 };
    int target { 9 };
    int foundAt { -1 };
    int len { static_cast<int>(values.size()) };
    for (int i = 0; i < len; ++i)
    {
        if (values[i] == target)
        {
            foundAt = i;
            break;
        }
    }
    if (foundAt >= 0)
        std::cout << "Found at index " << foundAt << '\n';
    else
        std::cout << "Not found\n";
}
```

Output: `Found at index 3`

Using `-1` as a sentinel "not found" value is a classic pattern. The variable is initialised before the loop, updated inside when a match is found, and checked after.

## Common mistakes

**Mistake 1: Off-by-one — using `<=` instead of `<`**

```cpp
std::vector<int> v { 1, 2, 3 };
for (int i = 0; i <= static_cast<int>(v.size()); ++i)  // BUG: <= accesses v[3]
    std::cout << v[i] << ' ';
```

`v.size()` is 3, so the last iteration accesses `v[3]`, which is out of bounds — undefined behavior that may corrupt memory or crash. The correct condition is `i < static_cast<int>(v.size())`. Remember: valid indices are 0 through `size() - 1`.

**Mistake 2: Comparing a signed `int` to `size()` directly**

```cpp
std::vector<int> v { 10, 20, 30 };
for (int i = 0; i < v.size(); ++i)  // warning: signed/unsigned comparison
    std::cout << v[i] << ' ';
```

`v.size()` returns `std::size_t` (an unsigned integer). Comparing `int i` to an unsigned value triggers a compiler warning and can cause bugs if the signed value is ever negative. Cast `v.size()` to `int` before the loop and store it in a variable.

**Mistake 3: Modifying the vector while iterating by index**

If you call `push_back` inside a loop that is walking the same vector, you extend the vector while the loop is still running. The loop's bound changes mid-flight, causing an infinite (or very long) loop or worse, invalidated iterators:

```cpp
std::vector<int> v { 1, 2, 3 };
int len { static_cast<int>(v.size()) };
for (int i = 0; i < len; ++i)
    v.push_back(v[i]);  // len was captured before: OK
```

The fix is to capture `size()` into `len` before the loop begins — exactly as shown above. Then the bound does not change as elements are added.

## When to use this

Reach for an index-based `for` loop when you need the index itself (to compare adjacent elements, to fill a second array in sync, or to report where something was found). When you only need the values and the index is irrelevant, a range-based `for` loop (introduced in "Range-based for loops") is cleaner. For accumulation tasks like summing or finding the maximum, an index-based loop is perfectly natural and easy to follow.

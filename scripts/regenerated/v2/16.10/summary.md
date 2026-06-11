## The idea

A `std::vector` is not a fixed-size container. Its defining superpower is dynamic resizing: you can add elements at runtime and the vector grows automatically. But "growing automatically" hides a subtlety — the vector manages two distinct numbers: *size* (how many elements you have put in) and *capacity* (how many elements the allocated memory block can hold before the vector must acquire a larger block).

Understanding the size/capacity split matters for two reasons. First, it explains why `push_back` is amortised O(1) rather than O(n): a vector typically doubles its capacity on each reallocation, so reallocation events become rarer as the vector grows. Second, it exposes a performance lever — if you know in advance how many elements you will add, you can call `reserve` to allocate the memory once and avoid all intermediate reallocations. These two points together explain one of the most common pieces of advice in C++ performance work: always `reserve` before a large batch of `push_back` calls.

## How it works

**size vs. capacity**

```cpp
#include <iostream>
#include <vector>

int main()
{
    std::vector<int> v;
    std::cout << "size=" << v.size() << " cap=" << v.capacity() << '\n';

    v.push_back(1);
    std::cout << "size=" << v.size() << " cap=" << v.capacity() << '\n';

    v.push_back(2);
    v.push_back(3);
    std::cout << "size=" << v.size() << " cap=" << v.capacity() << '\n';
}
```

The exact capacity values are implementation-defined (GCC often shows 1, then 2, then 4), but size is always the element count you inserted. Capacity is always ≥ size. When `push_back` needs to exceed capacity, the vector allocates a new (larger) block, copies or moves every existing element into the new block, then inserts the new one and releases the old block. This process is called reallocation, and it is the expensive step you want to avoid when performance matters.

**reserve: pre-allocate for known workloads**

```cpp
#include <iostream>
#include <vector>

int main()
{
    std::vector<int> v;
    v.reserve(100);   // request capacity for 100 elements
    std::cout << "size=" << v.size() << " cap=" << v.capacity() << '\n';

    for (int i = 0; i < 10; ++i)
        v.push_back(i * i);

    std::cout << "size=" << v.size() << " cap=" << v.capacity() << '\n';
}
```

After `reserve(100)`, size is still 0 — no elements have been added. Capacity is at least 100. The subsequent ten `push_back` calls do not trigger a reallocation. This is purely a performance optimisation; the observable behaviour of the vector is unchanged. If you later push beyond 100 elements, the vector will reallocate normally.

**resize: change size (and optionally fill)**

```cpp
#include <iostream>
#include <vector>

int main()
{
    std::vector<int> v(3, 1);   // {1, 1, 1}
    v.resize(5);                // grows to {1, 1, 1, 0, 0}
    v.resize(2);                // shrinks to {1, 1}  (capacity unchanged)

    for (int x : v)
        std::cout << x << ' ';
    std::cout << '\n';
}
```

`resize(n)` sets size to `n`. When growing, new elements are value-initialised (zero for `int`, empty string for `std::string`, and so on). When shrinking, elements beyond the new size are destroyed but the underlying memory is typically not released — capacity is unaffected by a shrink. The output is `1 1` because only the first two original elements remain after `resize(2)`.

## Common mistakes

**Mistake 1: confusing size and capacity**

```cpp
std::vector<int> v;
v.reserve(10);
std::cout << v[5];   // undefined behaviour!
```

`reserve` does not add elements — it only ensures memory exists. `v.size()` is still 0 after `reserve`, so `v[5]` is an out-of-bounds access even though the memory at that position technically exists in the buffer. To safely read or write element 5, you need `resize(6)` or six `push_back` calls first. This confusion between "memory is allocated" and "the element exists" is one of the most common misuses of `reserve`.

**Mistake 2: assuming capacity shrinks on resize-down**

```cpp
std::vector<int> big(1000, 0);
big.resize(3);
// big.capacity() is still 1000 (implementation-dependent but likely)
```

Shrinking the size with `resize` does not release memory. If you genuinely need to free the memory, the standard idiom is `big.shrink_to_fit()`, which is a non-binding request that implementations typically honour. The old "swap trick" `std::vector<int>(big).swap(big)` achieves the same effect portably but is less readable.

**Mistake 3: storing an iterator or pointer across a push_back**

```cpp
std::vector<int> v = {1, 2, 3};
int* p = &v[0];          // points into v's current buffer
v.push_back(4);          // may reallocate!
std::cout << *p;         // undefined behaviour if reallocation occurred
```

Any `push_back` that triggers reallocation invalidates all iterators, pointers, and references into the vector. After `push_back`, `p` may point into freed memory. Always re-acquire pointers and indices after structural modifications, or use indices rather than raw pointers when the vector may grow.

## When to use this

`push_back` with `reserve` is the standard idiom when you are building a vector of unknown final size — reading elements from stdin one by one, accumulating results from a loop, or collecting filtered values. Call `reserve` when you have a reasonable upper-bound estimate to avoid repeated reallocation. Use `resize` when you want to pre-size the vector and write directly via subscript rather than pushing elements one at a time.

For cases where size is known at compile time, the upcoming `std::array` (chapter 17) is a better fit — it has no heap allocation at all. And if you need a dynamically-sized collection with efficient insertion at both ends, `std::deque` covers that; `std::vector` remains the default because its contiguous storage is cache-friendly for both iteration and random access.

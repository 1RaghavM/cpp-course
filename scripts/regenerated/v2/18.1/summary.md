## The idea

Sorting is the problem of rearranging elements in a container so they end up in a well-defined order — usually smallest to largest. Before the standard library did this for you in one line, programmers had to write their own sorting loops. Selection sort is one of the simplest strategies: scan the entire unsorted region, find the smallest element, and swap it into position. Repeat until the whole array is ordered.

Working through a hand-written sort is valuable even if you will use `std::sort` in production code. It sharpens your understanding of loop indices, in-place swapping, and the relationship between an element's value and its position — concepts that come up constantly when working with arrays and vectors.

## How it works

### The core idea: find-and-swap

In each pass, you know that positions `0..i-1` are already sorted. You search positions `i..n-1` for the smallest element, then swap it into position `i`.

```cpp
#include <iostream>
#include <array>

int main()
{
    std::array<int, 5> a { 64, 25, 12, 22, 11 };
    int n = static_cast<int>(a.size());

    for (int i = 0; i < n - 1; ++i)
    {
        int minIdx = i;
        for (int j = i + 1; j < n; ++j)
        {
            if (a[j] < a[minIdx])
                minIdx = j;
        }
        // swap a[i] and a[minIdx]
        int tmp    = a[i];
        a[i]       = a[minIdx];
        a[minIdx]  = tmp;
    }

    for (int i = 0; i < n; ++i)
        std::cout << a[i] << ' ';
    std::cout << '\n';

    return 0;
}
```

Output: `11 12 22 25 64`

The outer loop variable `i` marks the boundary between the sorted prefix (left) and the unsorted suffix (right). The inner loop tracks `minIdx` — the index of the smallest value seen so far in the unsorted region. After the inner loop finishes, a three-variable swap moves that minimum into position `i`.

### Why `n - 1` passes?

If you have sorted the first `n-1` elements correctly, the last element must already be in the right place — there is nothing left to compare it against. Running the outer loop to `n - 1` instead of `n` avoids one redundant pass.

```cpp
// Demonstrating why the last pass is unnecessary:
// after placing elements at indices 0..n-2,
// the element at index n-1 is the largest by elimination.
```

### Swapping without a temporary

C++11 introduced `std::swap` in `<utility>` (included transitively by most headers), which does the same three-step swap but expresses intent more clearly:

```cpp
#include <utility>  // for std::swap

// inside the sorting loop:
std::swap(a[i], a[minIdx]);
```

Both approaches are correct; `std::swap` is preferred in real code because it reads as a single operation and handles more complex types safely.

## Common mistakes

### 1. Off-by-one in the outer loop bound

A common error is writing `i < n` instead of `i < n - 1` for the outer loop. This runs one extra pass where `i == n-1`. The inner loop `j = i + 1` would start at `n`, so it never executes — the swap is harmless in this case. However, it reveals a deeper misunderstanding: the last element never needs to be explicitly placed. The extra pass wastes time and signals unclear thinking about loop invariants.

### 2. Starting the inner loop at `j = 0` instead of `j = i + 1`

```cpp
// Wrong — re-scans the already-sorted region:
for (int j = 0; j < n; ++j)
{
    if (a[j] < a[minIdx])
        minIdx = j;
}
```

This can move a small element back into the sorted prefix, destroying the sorted order that was built up in previous passes.

### 3. Skipping the swap when `minIdx == i`

Swapping an element with itself is harmless — `tmp = a[i]; a[i] = a[i]; a[i] = tmp;` leaves everything unchanged. Some implementations add `if (minIdx != i)` before the swap as a micro-optimisation, but omitting it is not a bug. The common mistake is the opposite: thinking the check is *required* and writing buggy code trying to add it (e.g. breaking out of the loop too early).

## When to use this

Selection sort belongs in the classroom, not in production. Its O(n²) time complexity — n passes, each scanning up to n elements — becomes very slow once you have more than a few thousand elements. For any array or vector that might be large, use `std::sort` from `<algorithm>`, which runs in O(n log n).

The value of selection sort is pedagogical: it teaches loop-inside-loop thinking, index arithmetic, and the pattern of tracking the "best seen so far" across a range — a pattern that appears in many other algorithms. Once you understand how to sort by hand, it is much easier to read and trust what `std::sort` does for you in later chapters.

The "track best seen so far" pattern generalises widely. You used the same structure in earlier chapters when finding a maximum or minimum in a single pass. Selection sort extends it to repeated passes, using the previous pass's result to shrink the search region. Recognising this connection helps you see sorting not as a magic operation but as the straightforward application of a simple idea you already know.

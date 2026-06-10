## The idea

The C++ standard library ships with a collection of ready-made algorithms in the `<algorithm>` header. Rather than writing loops yourself every time you want to sort a vector, find a value, or transform elements, you call a named function that encapsulates the pattern. These functions work through iterators: you pass a begin and end iterator to mark the range, and the algorithm does the rest.

The key insight is that the algorithms are generic. `std::sort` does not know whether you are sorting a `std::vector<int>` or a `std::array<double>` — it only knows that it receives two iterators and can compare elements through them. This separation of algorithm from container is one of the most powerful ideas in modern C++. It means that once you learn the calling convention for one algorithm, you know how to call all of them.

## How it works

### std::find — searching for a value

`std::find` scans a range from first to last for the first element equal to a value. It returns an iterator pointing at the found element, or the end iterator if nothing matched.

```cpp
#include <iostream>
#include <vector>
#include <algorithm>

int main()
{
    std::vector<int> v { 4, 7, 2, 9, 3 };
    auto it = std::find(v.begin(), v.end(), 9);
    if (it != v.end())
        std::cout << "Found 9 at index " << (it - v.begin()) << '\n';
    else
        std::cout << "Not found\n";
    return 0;
}
```

Output: `Found 9 at index 3`

You always check the result against `v.end()` before dereferencing it, because `std::find` returns `v.end()` when the value is absent.

### std::sort — sorting a range in place

`std::sort` rearranges the elements in a range so they are in ascending order. It modifies the container directly.

```cpp
#include <iostream>
#include <vector>
#include <algorithm>

int main()
{
    std::vector<int> v { 5, 2, 8, 1, 9 };
    std::sort(v.begin(), v.end());
    for (auto x : v)
        std::cout << x << ' ';
    std::cout << '\n';
    return 0;
}
```

Output: `1 2 5 8 9 `

`std::sort` is far more efficient than selection sort for large inputs — it runs in O(n log n) on average. The compiler selects an algorithm (typically introsort, a hybrid of quicksort and heapsort) automatically.

### std::count — counting matching elements

`std::count` returns the number of elements in a range that are equal to a given value.

```cpp
#include <iostream>
#include <vector>
#include <algorithm>

int main()
{
    std::vector<int> v { 3, 1, 4, 1, 5, 9, 2, 6, 1 };
    int ones = static_cast<int>(std::count(v.begin(), v.end(), 1));
    std::cout << "Count of 1: " << ones << '\n';
    return 0;
}
```

Output: `Count of 1: 3`

`std::count` returns a `ptrdiff_t` (a signed size type). Casting to `int` avoids signed/unsigned comparison warnings in the common case where the count fits in an `int`.

## Common mistakes

### 1. Forgetting to include `<algorithm>`

The algorithms live in `<algorithm>`, not in `<vector>` or `<array>`. Including only the container header does not bring `std::sort` or `std::find` into scope. The resulting error message ("'sort' was not declared in this scope") confuses newcomers who expect the container header to provide everything needed to operate on the container.

### 2. Using `std::sort` on a range that does not support random-access iterators

`std::sort` requires random-access iterators — it needs to jump to arbitrary positions in the range in O(1). `std::vector` and `std::array` provide random-access iterators, so `std::sort` works on them. If you try to sort a `std::list`, it will not compile, because list iterators only support `++` and `--`, not arithmetic jumps. Each container type's documentation states which iterator category it provides.

### 3. Forgetting to check the result of `std::find` before dereferencing

```cpp
auto it = std::find(v.begin(), v.end(), 42);
std::cout << *it;  // undefined behaviour if 42 is not in v
```

If the value is not present, `it == v.end()`. Dereferencing the end iterator is undefined behaviour. Always guard with `if (it != v.end())` before using `*it`.

## When to use this

Reach for standard library algorithms whenever you find yourself writing a search loop, a sorting loop, or a counting loop by hand. They are tested, efficient, and communicate intent clearly to other programmers — `std::sort(v.begin(), v.end())` says exactly what it does in one line. Custom loops are appropriate when you need behaviour that no standard algorithm provides, or when you need to do multiple operations in a single pass for performance. For the vast majority of everyday tasks — searching, sorting, counting, and transforming — the standard algorithms save time and reduce bugs.

One pattern worth remembering: the algorithms in `<algorithm>` all accept a half-open range `[first, last)`. That means the element at `first` is included, and the element at `last` is excluded. This is the same convention used by `begin()` and `end()` throughout the standard library. Because the convention is consistent, you can pass any sub-range — not just the full container — to any algorithm. For example, to sort only the first three elements of a vector, you write `std::sort(v.begin(), v.begin() + 3)`. This flexibility is what makes the iterator model powerful: the algorithm and the container are independent, and the iterators are the bridge between them.

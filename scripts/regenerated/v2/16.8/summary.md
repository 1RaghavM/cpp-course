## The idea

Index-based `for` loops work well when you need the index — to compare adjacent elements, print positions, or write reverse loops. But when you only need to visit each element in order, the index variable is just noise. You declare it, increment it, compare it against a size, cast that size, and never actually use the number for anything meaningful. C++ provides a cleaner alternative: the **range-based for loop** (also called the for-each loop).

The range-based for loop says what you mean: "do this for each element in the collection." Instead of managing a counter and an upper bound, you declare a variable to receive each element and let the language handle the iteration. The result is shorter code, no signed/unsigned mismatch to worry about, and fewer opportunities for off-by-one errors.

## How it works

**Basic syntax — reading every element**

```cpp
#include <iostream>
#include <vector>

int main()
{
    std::vector<int> scores { 85, 92, 78, 95 };
    for (int score : scores)
        std::cout << score << ' ';
    std::cout << '\n';
}
```

Output: `85 92 78 95`

The colon reads as "in". `score` takes the value of each element in turn, starting from the first and ending at the last. No index, no `size()`, no cast. Compare this to the equivalent index-based loop — the range version is about half as long and carries no arithmetic risk.

**Reading vs. modifying elements — value vs. reference**

By default, the range variable is a copy of each element. Modifying it leaves the original vector unchanged:

```cpp
#include <iostream>
#include <vector>

int main()
{
    std::vector<int> v { 1, 2, 3 };
    for (int x : v)
        x *= 2;          // x is a copy; v is untouched
    for (int x : v)
        std::cout << x << ' ';
    std::cout << '\n';   // prints: 1 2 3
}
```

To modify the actual elements, declare the loop variable as a reference using `&` after the type:

```cpp
#include <iostream>
#include <vector>

int main()
{
    std::vector<int> v { 1, 2, 3 };
    for (int& x : v)
        x *= 2;          // x is a reference; v IS modified
    for (int x : v)
        std::cout << x << ' ';
    std::cout << '\n';   // prints: 2 4 6
}
```

The `&` makes `x` an alias to the element rather than a copy of it. Every write through `x` goes directly to the vector.

**Read-only access with const reference**

When you are only reading, you can bind a `const` reference to each element. For small types like `int` the difference from a plain copy is minor. For larger objects — structs, strings — `const&` avoids copying the entire object on every iteration:

```cpp
#include <iostream>
#include <vector>

int main()
{
    std::vector<int> data { 10, 20, 30, 40 };
    int sum { 0 };
    for (const int& val : data)
        sum += val;
    std::cout << "Sum: " << sum << '\n';
}
```

Output: `Sum: 100`

The three forms — `int x`, `int& x`, `const int& x` — cover every access pattern. Choose based on whether you need to modify the element and how large it is.

## Common mistakes

**Mistake 1: Modifying a copy and expecting the vector to change**

```cpp
std::vector<int> v { 1, 2, 3 };
for (int x : v)
    x = 0;             // x is a copy — v is unchanged
// v still holds {1, 2, 3}
```

This is completely silent: the code compiles, runs, and produces no error. The vector simply is not modified. If you want to change the elements, write `int& x`. This is the single most common mistake with range-based for loops.

**Mistake 2: Using a range-based for loop when you need the index**

```cpp
std::vector<int> v { 10, 20, 30 };
for (int x : v)
    std::cout << "value: " << x << '\n';  // fine, no index needed
```

Range-based for loops give you the values but not the positions. If your logic requires knowing the index — for example, to report "element at position 2 is the largest" or to compare `v[i]` against `v[i+1]` — you need the index-based loop. The range-based form is not a universal replacement, just a cleaner default for the common case where the index is irrelevant.

**Mistake 3: Modifying the vector's size during iteration**

Adding or removing elements from the vector inside a range-based for loop invalidates the internal state used to track the current position, leading to undefined behavior:

```cpp
std::vector<int> v { 1, 2, 3 };
for (int x : v)
    v.push_back(x * 2);  // undefined behavior — vector may reallocate mid-loop
```

If you need to build a result from the elements while iterating, create a separate result vector, fill it inside the loop, and use or return it afterward.

## When to use this

Use a range-based for loop as the default whenever you iterate over a `std::vector` and do not need the index. It removes the signed/unsigned mismatch that index-based loops introduce and eliminates the off-by-one risk. Use `int& x` when you need to modify elements in place. Use `const int& x` when reading elements of large or non-trivial types. Fall back to an index-based loop when you genuinely need the position: adjacent-element comparisons, reverse traversal, or keeping two collections in sync by shared index.

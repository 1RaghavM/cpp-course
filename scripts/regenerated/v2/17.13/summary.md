## The idea

In the previous lesson you learned that C-style 2D arrays decay to pointers when passed to functions, forcing you to pass dimension information separately. `std::array` removes those rough edges. A multidimensional `std::array` is simply a `std::array` whose element type is itself a `std::array`. Because it knows its own size, it never decays, and standard-library algorithms work on it directly.

The mental model is a box of boxes. `std::array<std::array<int, 4>, 3>` is an array of 3 elements, each of which is an array of 4 `int`s. The outermost type carries the row count; the inner type carries the column count. Both are compile-time constants baked into the type — no runtime dimension variables needed, no silent pointer decay.

## How it works

**Declaring and initializing**

```cpp
#include <array>
#include <iostream>

int main()
{
    std::array<std::array<int, 3>, 2> grid = {{
        {1, 2, 3},
        {4, 5, 6}
    }};

    std::cout << grid[0][1] << '\n';  // 2
    std::cout << grid[1][2] << '\n';  // 6
    return 0;
}
```

The double braces are required because `std::array` wraps a plain C-style array internally: the outer `{` is for the `std::array` aggregate, the next `{` is for the inner aggregate. Many compilers accept single braces for nested `std::array` due to brace elision, but double braces are explicit and always correct.

**Iterating with range-based for loops**

Because each row is itself a `std::array`, you can iterate with range-based `for` — no index arithmetic needed:

```cpp
#include <array>
#include <iostream>

int main()
{
    std::array<std::array<int, 3>, 2> scores = {{
        {85, 90, 78},
        {92, 88, 95}
    }};

    for (const auto& row : scores)
    {
        for (int val : row)
            std::cout << val << ' ';
        std::cout << '\n';
    }
    return 0;
}
```

`const auto& row` binds to each `std::array<int, 3>` without copying it. The inner loop iterates the individual integers. Alternatively, you can use index-based loops with `scores.size()` and `scores[r].size()`.

**Passing to a function (no decay)**

Unlike C-style arrays, `std::array` passed by `const` reference does not decay:

```cpp
#include <array>
#include <iostream>

using Row   = std::array<int, 4>;
using Grid  = std::array<Row, 3>;

void printGrid(const Grid& g)
{
    for (const auto& row : g)
    {
        for (int v : row)
            std::cout << v << ' ';
        std::cout << '\n';
    }
}

int main()
{
    Grid g = {{{1,2,3,4},{5,6,7,8},{9,10,11,12}}};
    printGrid(g);
    return 0;
}
```

The type alias `using Row = std::array<int, 4>; using Grid = std::array<Row, 3>;` makes the declaration readable. The function receives the whole grid by `const&` — all dimension information is preserved in the type.

## Common mistakes

**1. Wrong brace count during initialization**

```cpp
std::array<std::array<int, 2>, 2> m = {
    {1, 2},
    {3, 4}
};   // may or may not compile depending on compiler; intent is unclear
```

The outer `std::array` is an aggregate that contains one member: a C-style array of rows. The initializer needs an extra level of braces to reach the inner arrays. Use `{{ {1,2}, {3,4} }}` to be safe. Compilers often accept fewer braces (brace elision) but ambiguity creeps in for larger arrays.

**2. Writing `grid.size()` when you need the column count**

```cpp
std::array<std::array<int, 4>, 3> grid{};
for (std::size_t c = 0; c < grid.size(); ++c)   // BUG: iterates 3 times, not 4
    std::cout << grid[0][c] << '\n';
```

`grid.size()` returns 3 — the number of rows. The column count lives in the inner type: `grid[0].size()` returns 4. Mixing these gives silent access to the wrong elements or, in the `<` case above, merely printing too few.

**3. Forgetting `const auto&` on the outer loop variable**

```cpp
for (auto row : scores)   // copies each inner std::array
```

Without `&`, each `row` is a copy of the inner `std::array`. For a `std::array<int, 4>` that is inexpensive, but for larger element types it wastes time. More importantly, if you were modifying elements (without `const`), you would be modifying the copy, not the original. Use `const auto&` for read-only traversal and `auto&` when you need to write.

## When to use this

Use `std::array<std::array<T, C>, R>` when both the row count and the column count are known at compile time and you want the safety and expressiveness of `std::array` — member functions, range-based `for`, no decay. Good fits: small fixed-size game boards, rotation matrices, look-up tables indexed by two enum values.

When the dimensions are runtime values, use `std::vector<std::vector<T>>` (chapter 16). When you are interfacing with C APIs that expect a flat pointer, you can still pass `grid[0].data()` for the first row or `&grid[0][0]` — the memory layout is identical to a C-style 2D array.

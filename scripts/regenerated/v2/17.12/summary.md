## The idea

Most data is not a flat list. A multiplication table has rows and columns. A game board has cells identified by two coordinates. A set of temperature readings might be organized by day and by hour. Multidimensional C-style arrays give you a way to pack such tabular data into a single named block of memory, using multiple sets of square brackets to express each dimension.

The mental model: a two-dimensional C-style array is an array *of arrays*. If you write `int grid[3][4]`, you are declaring an array of 3 elements, each of which is itself an array of 4 `int`s. Memory is laid out in row-major order, meaning all four integers of row 0 come first, then all four of row 1, and so on. Each row is stored contiguously, and the rows themselves are stored contiguously.

## How it works

**Declaring and initializing a 2D array**

```cpp
#include <iostream>

int main()
{
    int table[2][3] = {
        {10, 20, 30},
        {40, 50, 60}
    };

    std::cout << table[0][1] << '\n';  // 20
    std::cout << table[1][2] << '\n';  // 60
    return 0;
}
```

`table[row][col]` selects element at the given row and column. The inner braces are optional — C++ allows you to collapse the initializers into a single flat list — but using inner braces makes the intent clear and is good practice.

**Iterating with nested for-loops**

The natural way to visit every element is a nested loop: the outer loop walks rows, the inner loop walks columns.

```cpp
#include <iostream>

int main()
{
    int scores[3][2] = {{85, 90}, {70, 88}, {95, 78}};
    int rows = 3;
    int cols = 2;

    for (int r = 0; r < rows; ++r)
    {
        for (int c = 0; c < cols; ++c)
            std::cout << scores[r][c] << ' ';
        std::cout << '\n';
    }
    return 0;
}
```

Output:
```
85 90
70 88
95 78
```

**Passing a 2D array to a function**

When you pass a C-style array to a function the array decays to a pointer. For a 2D array, the pointer is to the first *row* — an array of N elements. The column count must be specified at compile time because the compiler needs it to compute row offsets:

```cpp
#include <iostream>

void printRow(int row[], int cols)
{
    for (int c = 0; c < cols; ++c)
        std::cout << row[c] << ' ';
    std::cout << '\n';
}

int main()
{
    int mat[2][4] = {{1, 2, 3, 4}, {5, 6, 7, 8}};
    for (int r = 0; r < 2; ++r)
        printRow(mat[r], 4);
    return 0;
}
```

`mat[r]` decays to a pointer to the first element of row `r`. The function receives a `int[]` (which is `int*`) and the column count separately.

## Common mistakes

**1. Confusing the dimension order in `arr[row][col]`**

It is easy to mix up which index is the row and which is the column, especially when the array is not square. `table[2][3]` has 2 rows and 3 columns. `table[0][2]` is the last element of the first row, not the first element of the last column. A consistent habit — always write `[row][col]` — prevents this confusion. Drawing the array as a grid on paper before coding helps.

**2. Out-of-bounds access with the wrong limit**

```cpp
int grid[3][4]{};
for (int r = 0; r <= 3; ++r)       // should be r < 3
    for (int c = 0; c <= 4; ++c)   // should be c < 4
        grid[r][c] = 0;            // writes past the array
```

An off-by-one with `<=` instead of `<` walks one element past the declared size. The compiler does not catch this at runtime in release builds; the result is undefined behavior that may corrupt adjacent variables silently.

**3. Forgetting that inner braces are needed for intent**

```cpp
int t[2][3] = {1, 2, 3, 4, 5, 6};    // flat — works but obscures shape
int t[2][3] = {{1,2,3},{4,5,6}};      // clear — row structure is visible
```

Both forms compile, but the flat form hides the logical structure. When you later change the column count, a flat initializer silently shifts values into the wrong rows. Use inner braces.

## When to use this

Multidimensional C-style arrays are a good fit when the dimensions are both small and known at compile time — for example, a 3×3 rotation matrix, a 9×9 Sudoku grid, or a small game board. Because the array is a plain block of memory with no overhead, access is very fast.

When either dimension is determined at runtime, or when you need to resize rows independently, a `std::array<std::array<T, C>, R>` (covered in the next lesson) or a `std::vector<std::vector<T>>` (chapter 16) is a safer choice. If you need a fixed rectangular grid with compile-time dimensions and want bounds-checking and standard-library algorithms, prefer `std::array` nesting over raw C-style arrays.

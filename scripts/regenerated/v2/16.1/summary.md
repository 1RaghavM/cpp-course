## The idea

Imagine you are writing a program to track the high scores of ten players. Without containers, you would declare ten separate variables: `score1`, `score2`, ..., `score10`. Adding an eleventh player means editing the code. Doubling to twenty means rewriting it again. That is the problem containers solve: a **container** is a single object that holds a collection of values under one name, and you access any individual element by its position (its **index**).

The position-based version of this idea is called an **array**. An array stores its elements in a contiguous block of memory. "Contiguous" means element 0 is immediately followed by element 1 in RAM, which is immediately followed by element 2, and so on. That layout has a powerful consequence: looking up element 42 is just as fast as looking up element 0, because the computer can calculate its address directly from the base address and the index.

Two broad families of arrays exist in C++: those whose length is fixed at compile time (you decide at the point you write the code how many elements there are), and those whose length can change while the program runs. The chapter you are entering focuses on the second kind: **dynamic arrays**, where the container can grow or shrink at runtime in response to what the program needs.

The standard library's `std::vector` is the workhorse dynamic array. It wraps a heap-allocated block of memory, manages resizing automatically, and gives you the same fast index-based access that raw arrays provide. For most programs, `std::vector` is the right answer whenever you need to store a sequence of values.

## How it works

**Declaring a container conceptually.** Before touching `std::vector` syntax, think of a container as a variable with two dimensions: a *type* (what kind of thing it holds) and a *length* (how many it holds at a given moment). For a fixed-length array, you state both at definition time. For a dynamic array, you state the type at definition time and the length can change later.

**The index.** Every element in an array has a non-negative integer index, starting at 0. The last valid index is always `(length - 1)`. Accessing index 0 gives you the first element; accessing index `length - 1` gives you the last.

```cpp
// Conceptual mental model — not real C++ yet, just pseudocode
// array of 5 integers: indices 0, 1, 2, 3, 4
// array[0] = 10
// array[1] = 20
// array[2] = 30
// array[3] = 40
// array[4] = 50
```

The first and last element are the ones most commonly accessed. Getting the last element requires knowing the length: `array[length - 1]`.

**Why contiguous storage matters.** Because all elements live next to each other in memory, the CPU can read them in one efficient sweep. This is called **cache-friendly** access. It is one reason arrays outperform linked lists for most tasks where you iterate over all elements.

**Fixed-length versus dynamic-length.**

- A fixed-length array has its size baked in at compile time. The compiler knows exactly how much stack space to reserve.
- A dynamic array (like `std::vector`) allocates its storage on the heap and can grow. The container itself lives on the stack (a small control struct), but the actual element data lives on the heap.

```cpp
// Fixed-length: size must be a compile-time constant
// int scores[10]; // 10 ints on the stack, size never changes

// Dynamic: size can grow at runtime
// std::vector<int> scores; // data lives on heap, size can change
```

**The zero-based indexing convention.** Virtually every mainstream language (C, C++, Java, Python, JavaScript) indexes arrays from 0. The first element is at index 0, not index 1. This trips up many beginners who expect index 1 to be the first.

```cpp
#include <iostream>
#include <vector>

int main()
{
    std::vector<int> scores { 95, 87, 72, 60, 100 };

    // first element is index 0, last is index 4 (length 5 - 1)
    std::cout << scores[0] << '\n';  // prints 95
    std::cout << scores[4] << '\n';  // prints 100

    return 0;
}
```

## Common mistakes

**Mistake 1: off-by-one — accessing the element one past the end.**

```cpp
std::vector<int> v { 10, 20, 30 };
// Length is 3; valid indices are 0, 1, 2.
std::cout << v[3] << '\n';  // undefined behavior! index 3 does not exist
```

This is the most common array bug. The valid indices run from `0` to `length - 1`. Accessing `v[length]` reads memory past the end of the array. The program may print a garbage number, crash, or appear to work — all three are possible, which makes this bug hard to diagnose.

**Mistake 2: assuming arrays are 1-indexed.**

A beginner who thinks of the first score as "score number 1" often writes:

```cpp
std::vector<int> scores { 95, 87, 72 };
// Wrong: trying to print "the first score"
std::cout << scores[1] << '\n';  // prints 87, not 95
```

The first element is at index `0`. Think of the index as an *offset from the start*, not a *count from the start*.

**Mistake 3: confusing the length of the container with its last valid index.**

A vector of length 5 has elements at indices 0 through 4. The last valid index is `4`, not `5`. This distinction matters every time you write a loop or access the last element:

```cpp
std::vector<int> data { 1, 2, 3, 4, 5 };
int last_index = 4;          // correct: 5 - 1
// int last_index = 5;       // wrong: would be one past the end
std::cout << data[last_index] << '\n';  // prints 5
```

## When to use this

Reach for an array (and specifically `std::vector`) any time your program needs to store multiple values of the same type and you want to access them by position. Examples include scores for N players, pixel colors in an image, a list of words entered by the user, or sensor readings over time. The contiguous storage makes arrays the natural choice for sequences that need fast indexed access or that you will iterate over in order. When the number of elements is truly known at compile time and will never change, a fixed-size array (covered in the `std::array` chapter) is a lightweight alternative; for everything dynamic, `std::vector` is the standard tool.

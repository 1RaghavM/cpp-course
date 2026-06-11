## The idea

An iterator is a generalisation of a pointer. It is an object that knows how to point at one element inside a container and move to the next. Instead of writing `a[i]` with an integer index, you write `*it` with an iterator and advance with `++it` — the same way you walk forward through an array using a raw pointer.

The reason iterators exist is abstraction. An index only works when elements are laid out in contiguous memory and you can do arithmetic on their addresses. A `std::list`, for example, stores elements scattered across memory in individually allocated nodes — there is no integer offset that jumps from node to node. Iterators hide that internal structure. Code written with iterators works on a `std::vector`, a `std::array`, and many other containers without change, because each container provides its own iterator type that knows how to navigate itself.

## How it works

### begin() and end()

Every standard container has two member functions, `begin()` and `end()`, that return iterators. `begin()` points to the first element. `end()` points one past the last element — it is a sentinel that marks where the range stops, not an element you can dereference.

```cpp
#include <iostream>
#include <vector>

int main()
{
    std::vector<int> v { 10, 20, 30 };

    auto it = v.begin();   // points at 10
    std::cout << *it << '\n';  // prints 10
    ++it;                  // advance to 20
    std::cout << *it << '\n';  // prints 20

    return 0;
}
```

The dereference operator `*it` gives you the element the iterator currently points at, just like `*ptr` for a pointer. `++it` moves the iterator to the next element.

### Iterating with a loop

The standard pattern is a `for` loop that starts at `begin()` and stops when the iterator reaches `end()`:

```cpp
#include <iostream>
#include <array>

int main()
{
    std::array<int, 4> a { 5, 3, 8, 1 };

    for (auto it = a.begin(); it != a.end(); ++it)
        std::cout << *it << ' ';
    std::cout << '\n';

    return 0;
}
```

Output: `5 3 8 1 `

The condition `it != a.end()` is the standard way to check for the end of a range. You should not write `it < a.end()` for most containers, because only containers with contiguous memory (like `std::vector` and `std::array`) guarantee that `<` works on iterators. `!=` works for every standard iterator type.

### Modifying elements through an iterator

Because `*it` yields a reference to the element, you can assign through it:

```cpp
#include <iostream>
#include <vector>

int main()
{
    std::vector<int> v { 1, 2, 3, 4 };

    for (auto it = v.begin(); it != v.end(); ++it)
        *it *= 2;   // double each element in place

    for (auto it = v.begin(); it != v.end(); ++it)
        std::cout << *it << ' ';
    std::cout << '\n';

    return 0;
}
```

Output: `2 4 6 8 `

This modifies the original vector. A `const_iterator` (returned by `cbegin()` and `cend()`) gives you read-only access and produces a compile error if you try to assign through it.

## Common mistakes

### 1. Dereferencing `end()`

`end()` points one past the last element. Dereferencing it is undefined behaviour — it does not point at a real element.

```cpp
std::vector<int> v { 1, 2, 3 };
auto it = v.end();
std::cout << *it;  // undefined behaviour — do NOT do this
```

The program may crash, print garbage, or appear to work by accident. Always stop the loop at `it != v.end()` without dereferencing the end iterator.

### 2. Comparing iterators from different containers

Iterators from different container instances are unrelated. Comparing them with `==` or `!=` is undefined behaviour:

```cpp
std::vector<int> a { 1 }, b { 2 };
auto it = a.begin();
// it != b.end()  ← undefined behaviour: different containers
```

Always pair `begin()` and `end()` from the same object.

### 3. Forgetting that `end()` is past-the-end, not the last element

A newcomer trying to print the last element might write `*(v.end())` — which is the `end()` mistake above — instead of `*(v.end() - 1)` (only valid for random-access iterators like those of `std::vector`). For clarity, prefer `v.back()` when you just want the last element.

## When to use this

Use iterators explicitly when working with standard library algorithms that accept iterator pairs as their range arguments — the next lesson covers those. In simple loops over `std::vector` or `std::array`, range-based `for` loops (which use iterators under the hood) are cleaner and less error-prone. Understanding iterators directly matters most when you need to insert or erase elements in the middle of a container while iterating, when you need to pass a sub-range to an algorithm, or when you work with containers that do not support integer indexing.

The relationship between iterators and pointers is more than an analogy. For `std::vector` and `std::array`, the iterator is typically implemented as a plain pointer, and `it - v.begin()` is exactly the same computation as subtracting two pointers. This means every technique you learned in the arrays chapter — walking forward, computing distance, comparing positions — maps directly onto iterators. The difference is that when you switch to a more complex container, the iterator hides the internal navigation and your loop code does not need to change.

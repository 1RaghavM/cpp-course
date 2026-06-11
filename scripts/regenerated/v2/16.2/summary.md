## The idea

In the previous lesson you learned what a container is: an object that holds a collection of elements accessed by index. Now it is time to actually use one. `std::vector` is the standard C++ dynamic array. Think of it as a resizable shelf: you declare it, choose what type of item sits on the shelf (int, double, std::string, or any type you have defined), and the shelf can hold as many items as you need at runtime — starting empty and growing as you add things.

The key mental model: a `std::vector<int>` is a shelf of integers. A `std::vector<double>` is a shelf of doubles. The type parameter (the part inside `<>`) determines what kind of object each slot holds. You access any slot by its zero-based index, and the vector remembers how many slots are occupied at any given moment.

The "list constructor" part of this lesson's title refers to how you can hand a vector a brace-enclosed list of initial values at creation time. This mirrors how you would initialize a plain array, but with all of `std::vector`'s dynamic benefits.

## How it works

**Including the header.** `std::vector` lives in `<vector>`:

```cpp
#include <vector>
```

**Default construction — an empty vector.**

```cpp
std::vector<int> scores;  // empty; size() == 0
```

The vector exists but contains no elements. You can add elements later with `push_back`.

**List initialization — giving values at construction time.**

You can initialize a vector with a brace-enclosed list of values, exactly the way you initialize other variables:

```cpp
std::vector<int> primes { 2, 3, 5, 7, 11 };
```

This creates a vector of five ints. The elements are placed in the order listed; `primes[0]` is `2`, `primes[4]` is `11`. You may also use the `=` form:

```cpp
std::vector<double> temps = { 36.6, 37.1, 38.2 };
```

Both forms produce identical vectors; prefer the first (direct brace) style as it is consistent with modern C++ initialization.

**The size constructor — N copies of a value.**

A second frequently used constructor takes a count and an optional initial value. This creates a vector of N elements, all set to the same value:

```cpp
std::vector<int> zeros(10);       // 10 ints, each initialized to 0
std::vector<int> fives(5, 5);     // 5 ints, each set to 5
std::vector<double> temps(7, 98.6); // 7 doubles, all 98.6
```

Note the parentheses here, not braces — `std::vector<int>(10)` means "ten default-initialized ints". Braces would mean "a vector with one element whose value is 10". This is one of the more surprising distinctions in C++:

```cpp
std::vector<int> a(3);    // three elements: 0, 0, 0
std::vector<int> b { 3 }; // one element: 3
```

**Reading the size.** The member function `.size()` returns the number of elements currently in the vector:

```cpp
std::vector<int> v { 10, 20, 30 };
std::cout << v.size() << '\n';  // prints 3
```

**A complete example tying it together:**

```cpp
#include <iostream>
#include <vector>

int main()
{
    // list initialization
    std::vector<std::string> fruits { "apple", "banana", "cherry" };

    // access by index
    std::cout << fruits[0] << '\n';  // apple
    std::cout << fruits[2] << '\n';  // cherry

    // size
    std::cout << "Count: " << fruits.size() << '\n';  // Count: 3

    return 0;
}
```

## Common mistakes

**Mistake 1: confusing `(N)` and `{N}` when constructing.**

```cpp
std::vector<int> v(5);   // 5 elements, all 0
std::vector<int> w { 5 }; // 1 element whose value is 5
```

Both compile. The results are radically different. When you want N default-initialized elements, use round parentheses. When you want a vector containing the value `5` as its single element, use braces. This distinction trips up nearly everyone at least once.

**Mistake 2: accessing an element in an empty vector.**

```cpp
std::vector<int> v;      // empty — size is 0
std::cout << v[0] << '\n'; // undefined behavior!
```

If you construct a vector with no arguments and forget to add elements, its size is zero. Accessing `v[0]` reads past the (empty) storage. Always check that the vector is non-empty before accessing elements by index.

**Mistake 3: mixing up `size()` and the last valid index.**

```cpp
std::vector<int> v { 1, 2, 3, 4, 5 };
// v.size() is 5; last valid index is 4
std::cout << v[v.size()] << '\n';  // undefined behavior — one past the end
```

The last element is at index `v.size() - 1`, not `v.size()`. This is a classic off-by-one bug that does not produce a compile error, making it easy to miss.

## When to use this

Reach for `std::vector` with list initialization whenever you know the starting values up front — for example, hard-coded lookup tables, fixed test inputs, or initial state. Use the size constructor `vector<T>(N)` when you need a vector of a known length but will compute or fill the values later. For truly dynamic data (read at runtime, unknown count), start with the default constructor and use `push_back` to add elements as you read them. The vector constructors covered here are the foundation for every technique in this chapter; every subsequent lesson builds on these basics.

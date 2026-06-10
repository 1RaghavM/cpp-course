## The idea

Once you have a `std::array`, two questions come up immediately: how many elements does it hold, and how do you safely visit each one? In earlier chapters you used `int` counter variables and hard-coded the array size in loops. With `std::array` you no longer need to track the length yourself — the array object *knows* its own size and can tell you through a member function. Understanding how to query the length and how indexing works lets you write loops that never accidentally go out of bounds, regardless of whether you change N later.

## How it works

**Querying the length with `.size()`**

Every `std::array` provides a `.size()` member function that returns the number of elements as a `size_t` (an unsigned integer type alias defined by the standard library). You should use this rather than hard-coding the number in loops, because if you later change N in the type, every loop that uses `.size()` automatically stays correct.

```cpp
#include <array>
#include <iostream>

int main() {
    std::array<int, 6> nums { 1, 2, 3, 4, 5, 6 };
    std::cout << "Length: " << nums.size() << '\n'; // Length: 6
    return 0;
}
```

`.size()` is a `constexpr` member function, meaning it can be evaluated at compile time. In practice you usually call it at runtime inside a loop condition.

**Index-based loops using `.size()`**

When you need the index during iteration, use a counter variable. The natural type for the counter is the same unsigned type that `.size()` returns, which is `size_t`. Mixing signed and unsigned types in a comparison produces a compiler warning under `-Wextra`.

```cpp
#include <array>
#include <iostream>

int main() {
    std::array<double, 4> temps { 20.5, 21.3, 19.8, 22.0 };
    for (std::size_t i = 0; i < temps.size(); ++i) {
        std::cout << "Day " << i + 1 << ": " << temps[i] << '\n';
    }
    return 0;
}
```

The loop condition `i < temps.size()` is always correct: the last valid index is `temps.size() - 1`.

**Accessing the first and last elements: `.front()` and `.back()`**

`std::array` also provides `.front()` (same as `arr[0]`) and `.back()` (same as `arr[arr.size()-1]`). These are concise when you specifically need the first or last element without writing an index expression.

```cpp
#include <array>
#include <iostream>

int main() {
    std::array<int, 5> scores { 10, 30, 50, 70, 90 };
    std::cout << "First: " << scores.front() << '\n'; // 10
    std::cout << "Last:  " << scores.back()  << '\n'; // 90
    return 0;
}
```

## Common mistakes

**Mistake 1 — comparing signed index with unsigned `.size()`**

```cpp
std::array<int, 5> a { 1, 2, 3, 4, 5 };
for (int i = 0; i < a.size(); ++i) { // warning: signed/unsigned comparison
    std::cout << a[i];
}
```

`int` is signed; `a.size()` returns `std::size_t` which is unsigned. The compiler warns about this comparison because if `i` were negative (impossible here, but the compiler checks statically), the comparison would behave unexpectedly due to implicit conversion. Fix by declaring `i` as `std::size_t` or casting: `for (std::size_t i = 0; i < a.size(); ++i)`.

**Mistake 2 — off-by-one using size as an index**

```cpp
std::array<int, 3> arr { 10, 20, 30 };
std::cout << arr[arr.size()]; // undefined behavior: index 3 is out of range
```

Valid indices are `0` to `arr.size() - 1`. The value `arr.size()` (3 here) is one past the last element. Reading it with `operator[]` is undefined behavior. Use `arr.back()` to safely access the last element, or check `arr.at(arr.size() - 1)`.

**Mistake 3 — calling `.size()` on an empty-braced array and expecting 0**

```cpp
std::array<int, 5> a {};
std::cout << a.size(); // prints 5, not 0
```

`std::array<int, 5>` always holds exactly 5 elements, even when initialized with `{}`. The braces zero-initialize the elements but do not change the count. If you need a collection whose element count can be zero, use `std::vector`.

## When to use this

Query `.size()` any time you write a loop over a `std::array` and need the index — it keeps the loop self-consistent with the array declaration and eliminates a whole class of off-by-one bugs that come from hard-coding the length. Prefer range-based for when you do not need the index at all (see "Introduction to std::array"). Use `.front()` and `.back()` as readable shorthand for first and last elements. When you do need a collection that can shrink to zero elements at runtime, switch to `std::vector`.

## The idea

`std::vector` has a quirk that surprises nearly every C++ beginner at least once: `.size()` does not return an `int`. It returns `std::size_t`, an **unsigned** integer type. That single fact creates a whole family of subtle, sometimes silent bugs — and even more compiler warnings.

The problem is not that `std::size_t` is unusual; it is that C++ **mixes signed and unsigned integers freely**, silently converting one to the other according to promotion rules. When the conversion produces the wrong value — particularly when an unsigned type wraps around below zero — the result is undefined or dangerously incorrect behavior.

This lesson names the problem, shows the traps, and gives you the idiomatic tools to avoid them. Going forward in this chapter, you will see these patterns everywhere.

## How it works

**What `std::size_t` is.** It is an unsigned integer type guaranteed to be large enough to hold the size of any object in memory. On a 64-bit system it is typically 64 bits. Because it is unsigned, its minimum value is `0`, not a negative number. Values below zero do not exist — the bit pattern wraps around to a huge positive number instead.

```cpp
#include <iostream>
#include <vector>

int main()
{
    std::vector<int> v { 1, 2, 3 };
    auto len = v.size();  // type is std::size_t
    std::cout << len << '\n';  // prints 3
    return 0;
}
```

**The subscript operator also uses `std::size_t`.** When you write `v[i]`, the subscript operator's parameter is of type `std::size_t`. Passing a negative `int` to it results in an implicit conversion to a very large unsigned number, which then indexes wildly out of bounds.

**The loop counter problem.** The classic pattern for iterating over a vector with an index-based loop looks like this:

```cpp
std::vector<int> v { 10, 20, 30 };
for (int i = 0; i < static_cast<int>(v.size()); ++i)
{
    std::cout << v[i] << '\n';
}
```

Notice the cast: `static_cast<int>(v.size())`. Without it, the comparison `i < v.size()` compares a signed `int` (which can be negative) to an unsigned `std::size_t`. The compiler may warn about this signed/unsigned mismatch. Worse, if the loop ever tries to count down — for example, counting from `size - 1` to `0` — the unsigned counter wraps to a huge value when it goes below zero, causing an infinite loop or out-of-bounds access.

**The safest patterns.**

Option 1 — cast `.size()` to `int` at the loop head:

```cpp
int len = static_cast<int>(v.size());
for (int i = 0; i < len; ++i)
{
    std::cout << v[i] << '\n';
}
```

This is safe because the vector cannot have more than `INT_MAX` elements in practice, and the signed `int` comparison behaves exactly as expected.

Option 2 — use `std::ssize()` (C++20), which returns a **signed** size:

```cpp
for (int i = 0; i < std::ssize(v); ++i)
{
    std::cout << v[i] << '\n';
}
```

`std::ssize(v)` returns a signed integer equal to the size of the container. It is the cleanest solution when you need an index that might decrement below zero.

**The `.at()` accessor.** As an alternative to `operator[]`, `std::vector` provides `.at(i)` which performs a bounds check and throws `std::out_of_range` if the index is invalid. During development this is useful for catching index bugs early. In production code, if you already know the index is valid, `operator[]` is faster.

```cpp
std::vector<int> v { 5, 10, 15 };
std::cout << v.at(1) << '\n';   // prints 10 — safe
// v.at(5);                       // would throw std::out_of_range at runtime
```

## Common mistakes

**Mistake 1: comparing `int i` to `v.size()` without a cast, then decrementing `i`.**

```cpp
std::vector<int> v { 1, 2, 3 };
// Wrong: count down from end to start
for (std::size_t i = v.size() - 1; i >= 0; --i)
{
    std::cout << v[i] << '\n';
}
// Infinite loop! When i == 0 and we decrement, unsigned wraps to a huge number.
```

The condition `i >= 0` is always true for an unsigned integer — you can never have an unsigned value less than zero. The loop never stops. The fix: use a signed counter or restructure the loop.

**Mistake 2: subtracting from `.size()` when the vector might be empty.**

```cpp
std::vector<int> v;  // empty
std::cout << v.size() - 1 << '\n';  // unsigned underflow! prints a huge number
```

`v.size()` is `0` (unsigned). Subtracting `1` wraps around to the maximum value of `std::size_t` (typically `18446744073709551615` on 64-bit systems). Always guard with a size check before computing `size() - 1`.

**Mistake 3: ignoring the signed/unsigned comparison warning and assuming it is harmless.**

The compiler warning exists because the silent conversion can genuinely cause bugs. Do not silence it with a cast to `unsigned` to make the warning disappear — cast to `int` or use `std::ssize()` to make the code correct.

## When to use this

The `.size()` / `std::size_t` trap is encountered any time you write a loop with an integer counter over a `std::vector`. The safe habits — `static_cast<int>(v.size())` or `std::ssize(v)` — should become automatic. Use `.at()` during debugging or when the index comes from external input and you want a hard failure instead of undefined behavior. For production paths where the index is already validated, `operator[]` is fine. The range-based for loop (covered shortly in this chapter) sidesteps the indexing problem entirely for forward iteration.

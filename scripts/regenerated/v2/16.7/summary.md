## The idea

Arrays and loops interact through indices, and indices are integers. But `std::vector`'s `.size()` returns an *unsigned* integer (`std::size_t`), while loop variables are typically *signed* `int`. Mixing signed and unsigned arithmetic is a quiet source of bugs and compiler warnings that every C++ programmer needs to understand and solve deliberately.

The previous lesson introduced this tension. This lesson explores why it exists, what can go wrong, and the practical solutions that keep your loops correct and warning-free.

## How it works

**Why the mismatch exists**

`std::size_t` is unsigned because a size cannot logically be negative. On most 64-bit systems it is a 64-bit unsigned integer. An `int` is typically a 32-bit signed integer. Comparing them directly is technically valid but the compiler warns because the implicit conversion can produce surprising results when a signed value is negative.

Consider what happens when `i` is `-1` and you compare it to an unsigned `size_t`:

```cpp
#include <iostream>
#include <vector>

int main()
{
    std::vector<int> v { 10, 20, 30 };
    int i { -1 };
    if (i < static_cast<int>(v.size()))
        std::cout << "less\n";
    // Without the cast: if (i < v.size())
    //   -1 converts to a huge unsigned number — condition would be FALSE
}
```

With the cast, `-1 < 3` is true and the program prints `less`. Without the cast, `-1` wraps to `18446744073709551615` (on a 64-bit system) and the condition is false — the opposite of what you expect.

**Solution 1: cast size() to int once**

The most readable fix is to store the size as a signed `int` before the loop:

```cpp
#include <iostream>
#include <vector>

int main()
{
    std::vector<int> scores { 70, 85, 92, 60, 78 };
    int len { static_cast<int>(scores.size()) };
    for (int i = 0; i < len; ++i)
        std::cout << scores[i] << ' ';
    std::cout << '\n';
}
```

This is the recommended pattern for this course. The cast is explicit, the warning disappears, and the loop reads naturally.

**Solution 2: use a size_t loop variable**

Alternatively, make the loop variable unsigned to match `size()`:

```cpp
#include <iostream>
#include <vector>

int main()
{
    std::vector<int> v { 3, 1, 4, 1, 5 };
    for (std::size_t i = 0; i < v.size(); ++i)
        std::cout << v[i] << ' ';
    std::cout << '\n';
}
```

This avoids the cast entirely, but introduces a new trap: subtracting from a `std::size_t` when the result could underflow. For example, if you try to compute `i - 1` when `i` is `0`, the unsigned result wraps to a huge positive number. For simple forward loops this pattern is fine; it becomes awkward for reverse loops or comparisons involving negative deltas.

**Reverse loops and the underflow trap**

Reverse traversal is where unsigned indices cause the most pain:

```cpp
// WRONG with size_t:
std::vector<int> v { 1, 2, 3 };
for (std::size_t i = v.size() - 1; i >= 0; --i)  // infinite loop!
    std::cout << v[i] << ' ';
```

When `i` is `0` and you decrement it, the unsigned value wraps to the maximum possible `size_t`, which is always `>= 0` — so the condition is always true and the loop never ends.

The clean fix is to use a signed `int`:

```cpp
#include <iostream>
#include <vector>

int main()
{
    std::vector<int> v { 1, 2, 3 };
    for (int i = static_cast<int>(v.size()) - 1; i >= 0; --i)
        std::cout << v[i] << ' ';
    std::cout << '\n';
}
```

Output: `3 2 1`

## Common mistakes

**Mistake 1: Unsigned subtraction underflow in loop bounds**

```cpp
std::vector<int> v { 10, 20, 30 };
// WRONG: v.size() is size_t; if v is empty, v.size()-1 wraps to a huge number
for (std::size_t i = 0; i <= v.size() - 1; ++i)
    std::cout << v[i] << ' ';
```

If `v` is empty, `v.size()` is `0`, and `v.size() - 1` wraps to `18446744073709551615`. The loop runs an astronomically large number of times, accessing far beyond the vector's bounds. Guard against this by checking `v.empty()` first, or use the signed-int approach.

**Mistake 2: Comparing loop variable to size() without a cast**

```cpp
std::vector<int> v { 5, 10, 15 };
for (int i = 0; i < v.size(); ++i)   // warning: signed/unsigned mismatch
    std::cout << v[i];
```

The code runs correctly for small vectors because `i` is always non-negative and the implicit conversion is safe in practice — but the compiler warning is a red flag. Silence it with an explicit cast: `static_cast<int>(v.size())`.

**Mistake 3: Thinking size_t is the "right" type and signed int is wrong**

Neither is unconditionally correct. `size_t` matches the type the library uses and avoids the cast, but it makes reverse loops hazardous. Signed `int` is safer for arithmetic (negative results are natural) but requires the cast when comparing to `size()`. Pick one approach and apply it consistently.

## When to use this

Use the signed-int pattern (`int len { static_cast<int>(v.size()) }; for (int i = 0; ...)`) whenever you write index-based loops. It is explicit, consistent, and works correctly for both forward and reverse traversal. Switch to `size_t` only when you have a specific reason and you are certain no subtraction can underflow. The range-based `for` loop (covered in the next lesson) sidesteps the issue entirely by not exposing indices at all.

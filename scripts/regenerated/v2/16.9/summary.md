## The idea

Enumerators are named integer constants. std::vector indices are unsigned integers. These two facts combine into a surprisingly clean pattern: use an unscoped or scoped enum to give symbolic names to array positions, eliminating the "magic number index" problem and keeping your loop bounds self-documenting.

The core insight is that enumerators convert implicitly (or explicitly with a cast) to `std::size_t`, the type the subscript operator expects. So instead of writing `scores[2]` and hoping the reader knows that slot 2 means "math grade", you write `scores[Subject::math]` and the code reads like a sentence. When the enum also carries a sentinel value — a final enumerator that stores the total count — you never hard-code the vector's initial size or loop bound either.

## How it works

**Basic indexing with an unscoped enum**

```cpp
#include <iostream>
#include <vector>

enum Subject { english, math, science, count };

int main()
{
    std::vector<int> scores(count);   // size = 3

    scores[english]  = 88;
    scores[math]     = 92;
    scores[science]  = 79;

    std::cout << "Math: " << scores[math] << '\n';
}
```

`Subject::count` evaluates to `3`, so `std::vector<int> scores(count)` creates a vector of three elements. The subscripts `english`, `math`, and `science` expand to `0`, `1`, and `2` respectively. No cast is needed because unscoped enumerators implicitly convert to their underlying integer type, which then widens to `std::size_t`.

**Looping with the sentinel enumerator**

```cpp
#include <iostream>
#include <vector>

enum Month {
    jan, feb, mar, apr, may, jun,
    jul, aug, sep, oct, nov, dec,
    numMonths
};

int main()
{
    std::vector<int> sales(numMonths, 0);

    sales[mar] = 450;
    sales[dec] = 1200;

    for (int m = 0; m < numMonths; ++m)
        std::cout << m << ": " << sales[m] << '\n';
}
```

The loop uses `int m` to avoid signed/unsigned comparison warnings (the pattern from lesson 16.7) and compares `m < numMonths`. The sentinel `numMonths` is `12` — both the correct loop bound and the correct initial size — so there is exactly one place to update if the enum ever changes.

**Scoped enums require an explicit cast**

```cpp
#include <iostream>
#include <vector>

enum class Color { red, green, blue, count };

int main()
{
    std::vector<std::string> names(static_cast<int>(Color::count));

    names[static_cast<int>(Color::red)]   = "Red";
    names[static_cast<int>(Color::green)] = "Green";
    names[static_cast<int>(Color::blue)]  = "Blue";

    std::cout << names[static_cast<int>(Color::blue)] << '\n';
}
```

Scoped enumerators (`enum class`) do not implicitly convert to integers — that is by design, because `Color::red + 1` is usually a bug. The cost is verbosity: `static_cast<int>(Color::blue)`. When the cast noise is unacceptable, a small helper like `toIdx(Color c){ return static_cast<std::size_t>(c); }` cleans it up without sacrificing the scoping.

## Common mistakes

**Mistake 1: adding a new enumerator before the sentinel**

```cpp
enum Subject { english, math, science, count };     // size 3
// Later someone adds:
enum Subject { english, math, science, pe, count }; // size now 4
```

This is actually the correct usage — the sentinel automatically adjusts. The mistake is inserting the new enumerator *after* the sentinel:

```cpp
enum Subject { english, math, science, count, pe }; // BUG
```

Now `count` is `3` but `pe` is `4`. A vector sized with `count` will be too small, and `scores[pe]` is an out-of-bounds access at runtime — no compiler diagnostic, undefined behavior.

**Mistake 2: casting a scoped enumerator to the wrong type**

```cpp
enum class Color { red, green, blue, count };
std::vector<std::string> names(static_cast<std::size_t>(Color::count));
names[static_cast<int>(Color::red)] = "Red"; // subscript type: size_type
```

This specific example compiles and works, but if your platform has `int` smaller than `std::size_t` (a 32-bit `int` vs. a 64-bit `size_t`), the implicit conversion of a negative `int` subscript would wrap to a huge unsigned value and crash. Always cast to `std::size_t` (or `int` and use the signed-index pattern from lesson 16.7) consistently.

**Mistake 3: using the sentinel as a valid index**

```cpp
enum Gear { first, second, third, count };
std::vector<int> rpm(count); // size 3: indices 0, 1, 2

rpm[count] = 5000; // out-of-bounds! 'count' == 3, valid range is 0..2
```

The sentinel measures the *number* of meaningful slots; it is not itself a meaningful slot. Accessing `rpm[count]` is undefined behavior. The sentinel belongs only in size expressions and loop conditions, not as an index value.

## When to use this

Reach for enum-indexed vectors whenever a fixed set of named categories maps to a parallel array of values — test scores per subject, monthly sales figures, per-player statistics in a small game. The enum serves as a zero-cost compile-time label that makes both access and initial sizing self-documenting without any runtime overhead.

If the set of categories is not fixed at compile time (e.g., user-supplied subject names), a `std::vector` of structs or a map is the right tool instead. And if the set is truly fixed and small, `std::array` (chapter 17) pairs even more naturally with enum indexing because its size is a compile-time constant — the pattern learned here transfers directly.

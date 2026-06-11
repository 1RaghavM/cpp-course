## The idea

C++20 is the largest revision to C++ since C++11. Where C++11 rethought the language's foundations, C++20 builds on them to address four major gaps that professional C++ developers had been working around for years: there was no built-in way to express requirements on template parameters, no composable range algorithms, no module system, and no easy way to write coroutines. C++20 fills all four gaps with Concepts, Ranges, Modules, and Coroutines — plus a wave of smaller improvements that touch nearly every part of the language.

Think of C++20 as finishing the job C++11 started: the power was always there, but expressing intent required boilerplate and workarounds. C++20 lets you write what you mean directly.

## How it works

**Concepts — named constraints on template parameters.**

Before C++20, writing a function that only works for numeric types required either SFINAE tricks or silent misuse at the call site. Concepts let you name and enforce requirements:

```cpp
#include <concepts>
#include <iostream>

template <typename T>
concept Numeric = std::integral<T> || std::floating_point<T>;

template <Numeric T>
T square(T x) { return x * x; }

int main() {
    std::cout << square(4) << "\n";     // 16
    std::cout << square(2.5) << "\n";  // 6.25
    // square("hi"); // compile error: "hi" does not satisfy Numeric
    return 0;
}
```

The error when a constraint fails is produced at the call site, not buried in template instantiation output. Concepts also appear in abbreviated function templates: `auto square(Numeric auto x) { return x * x; }` is equivalent to the above.

**Ranges — composable, lazy algorithms.**

The classic `<algorithm>` functions take begin/end iterator pairs. `std::ranges` algorithms take a range directly and are composable through the pipe `|` operator:

```cpp
#include <algorithm>
#include <iostream>
#include <ranges>
#include <vector>

int main() {
    std::vector<int> v = {5, 3, 8, 1, 9, 2};

    // Sort and take the first three, without modifying v:
    auto top3 = v | std::views::filter([](int x){ return x > 2; })
                  | std::views::take(3);

    std::ranges::sort(v);
    for (int x : v)
        std::cout << x << " ";
    std::cout << "\n"; // 1 2 3 5 8 9
    return 0;
}
```

Views are lazy: they do not materialize a new container — they wrap the original range and produce elements on demand. `std::ranges::sort` works on a container directly without needing `.begin()` and `.end()`.

**std::span — a non-owning view of contiguous data.**

`std::span<T>` is a lightweight, non-owning reference to a contiguous sequence of `T` values. It replaces the pattern of passing a pointer and a length:

```cpp
#include <iostream>
#include <span>
#include <vector>

void print_all(std::span<const int> data) {
    for (int x : data)
        std::cout << x << " ";
    std::cout << "\n";
}

int main() {
    std::vector<int> v = {10, 20, 30};
    int arr[] = {1, 2, 3, 4};
    print_all(v);    // works with vector
    print_all(arr);  // works with array
    return 0;
}
```

**Three-way comparison (spaceship operator).**

The `<=>` operator returns a comparison category (`std::strong_ordering`, `std::weak_ordering`, or `std::partial_ordering`) that encodes whether the left operand is less than, equal to, or greater than the right. Defaulting `<=>` automatically synthesizes all six comparison operators:

```cpp
#include <compare>
#include <iostream>

struct Point {
    int x, y;
    auto operator<=>(const Point&) const = default;
};

int main() {
    Point a{1, 2}, b{1, 3};
    std::cout << (a < b) << "\n";  // 1
    std::cout << (a == b) << "\n"; // 0
    return 0;
}
```

## Common mistakes

**Mistake 1 — treating `std::views` as materializing a container.**

```cpp
auto result = v | std::views::filter([](int x){ return x > 0; });
result.push_back(99); // WRONG: a view has no push_back
```

A view is a lazy wrapper — it has no storage. To get an owned container, use `std::ranges::to<std::vector>()` (C++23) or copy into a vector explicitly with `std::ranges::copy`.

**Mistake 2 — using abbreviated function templates without knowing their limits.**

```cpp
auto add(auto a, auto b) { return a + b; }
```

This is valid C++20 (each `auto` parameter deduces independently), but `a` and `b` can be different types — `add(1, 1.5)` works silently and returns a `double`. Add a concept constraint if you need both parameters to be the same type.

**Mistake 3 — defaulting `<=>` when the type has pointer members.**

Defaulted spaceship comparison uses member-wise `<=>` with `std::strong_ordering`. Raw pointer members compare pointer values (addresses), not the pointed-to objects. If you want deep comparison, you must write `operator<=>` manually.

## When to use this

Use Concepts whenever you write a function template and want clear error messages and documented constraints — prefer them over raw SFINAE and `static_assert` for new code. Use Ranges when chaining multiple transformations on a sequence; they are more readable and composable than iterator-based algorithms. Use `std::span` instead of (pointer, length) pairs for contiguous data. Default `operator<=>` for value types where member-wise comparison is correct.

Modules and coroutines are powerful but require toolchain and project-structure investment — adopt them when your build system and team support them, rather than retrofitting an existing codebase hastily.

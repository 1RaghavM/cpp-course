## The idea

C++23 is a refinement release — it polishes rough edges left by C++20, fills obvious gaps in the standard library, and adds several quality-of-life features that make everyday code shorter and clearer. Where C++20 introduced sweeping new mechanisms (Concepts, Modules, Coroutines, Ranges), C++23 focuses on making those mechanisms and the existing library easier to use correctly.

The most impactful additions for typical programs are `std::print` and `std::println` for formatted output, `std::expected<T, E>` for explicit error-or-value return types, the `std::ranges::to` converter to materialize range views into containers, and a handful of smaller improvements to strings, deducing `this`, and `if consteval`.

## How it works

**`std::print` and `std::println` — format-based output.**

Before C++23, formatted output required `printf` (unsafe) or the combination of `std::cout` with `std::format` (verbose). C++23 adds `std::print` and `std::println` from `<print>` — they combine formatting and output in one call:

```cpp
#include <print>

int main() {
    int x = 42;
    std::println("The answer is {}", x);    // "The answer is 42\n"
    std::print("No newline here: {}", x);   // "No newline here: 42"
    std::println();                          // just a newline
    return 0;
}
```

`std::println` appends `\n` automatically. The format-string syntax is the same as `std::format` from C++20. Unlike `printf`, the format is type-safe — wrong argument types are compile errors.

**`std::expected<T, E>` — explicit error-or-value.**

Functions that can fail often have awkward return conventions: return -1 for error, use output parameters, throw exceptions, or return `std::optional` (which loses the error reason). `std::expected<T, E>` holds either a `T` (success) or an `E` (error) and makes the distinction explicit at the type level:

```cpp
#include <expected>
#include <string>
#include <iostream>

std::expected<int, std::string> parse_positive(const std::string& s) {
    int val = 0;
    for (char c : s) {
        if (c < '0' || c > '9')
            return std::unexpected("not a digit: " + std::string(1, c));
        val = val * 10 + (c - '0');
    }
    if (val <= 0)
        return std::unexpected("must be positive");
    return val;
}

int main() {
    auto result = parse_positive("42");
    if (result)
        std::cout << "parsed: " << *result << "\n";
    else
        std::cout << "error: " << result.error() << "\n";
    return 0;
}
```

`std::unexpected(e)` wraps the error value. `operator bool` checks success; `operator*` retrieves the value; `.error()` retrieves the error.

**`std::ranges::to` — materialize a view into a container.**

C++20 views are lazy. Getting a `std::vector` out of a filtered view required manual `std::ranges::copy` into a pre-sized vector. C++23 adds `std::ranges::to`:

```cpp
#include <ranges>
#include <vector>
#include <iostream>

int main() {
    std::vector<int> v = {1, 2, 3, 4, 5, 6};
    auto evens = v | std::views::filter([](int x){ return x % 2 == 0; })
                   | std::ranges::to<std::vector>();
    for (int x : evens)
        std::cout << x << " ";
    std::cout << "\n"; // 2 4 6
    return 0;
}
```

**Deducing `this` — explicit self-parameter.**

Member functions can now declare an explicit `this` parameter, which enables writing a single template member that works for both const and non-const objects (and for rvalue/lvalue references) without overloading:

```cpp
#include <iostream>

struct Buffer {
    int data[4] = {10, 20, 30, 40};

    // Works for const and non-const Buffer via deduced this:
    auto& at(this auto& self, int i) {
        return self.data[i];
    }
};

int main() {
    Buffer b;
    b.at(0) = 99;
    const Buffer cb;
    std::cout << cb.at(1) << "\n"; // 20
    return 0;
}
```

## Common mistakes

**Mistake 1 — confusing `std::expected` and `std::optional`.**

`std::optional<T>` signals "value or nothing." `std::expected<T, E>` signals "value or a specific error." If callers need to know *why* an operation failed, `std::expected` is the right tool; `std::optional` throws that information away. Use `std::optional` when absence is normal and the reason is irrelevant (e.g., a map lookup miss); use `std::expected` when the error must be propagated or reported.

**Mistake 2 — reading an `std::expected` value without checking success first.**

```cpp
auto r = parse_positive("-5");
std::cout << *r << "\n"; // WRONG: r holds an error, not a value
```

Dereferencing a failed `std::expected` is undefined behavior. Always check `if (r)` or use `r.value()` (which throws `std::bad_expected_access` on failure) rather than `*r` when you have not verified success.

**Mistake 3 — treating `std::print` as a drop-in for `printf` without sanitizing format strings.**

```cpp
std::string user_input = "{}";
std::print(user_input); // COMPILE ERROR or runtime format error
```

Unlike `printf`, `std::print`'s format string must be a compile-time constant string literal in most contexts. Passing a runtime string as the format argument is either a compile error or produces a `std::format_error` at runtime. Treat the format string as a literal, not a variable.

## When to use this

Use `std::println` and `std::print` for any new formatted output — they are safer and more readable than `printf` and less verbose than `std::cout` with `std::format`. Use `std::expected<T, E>` in library interfaces where callers need to distinguish between success and specific failure modes without exceptions. Use `std::ranges::to` to bridge the lazy-view world with code that needs an owned container.

Check your compiler's C++23 support before relying on these features: as of 2024, major compilers (GCC 14+, Clang 17+, MSVC 19.38+) support most of C++23, but `std::print` in particular requires up-to-date standard library headers.

## The idea

Functions sometimes need to say "I could not produce a result." Before `std::optional`, C++ programmers used sentinel values — returning `-1` when no valid index exists, returning `0.0` when no valid average can be computed, or using a pointer that might be `nullptr`. Sentinel values work but they are fragile: every caller must remember which value is special, and there is nothing in the type system to prevent them from forgetting.

`std::optional<T>` is a wrapper that makes optionality explicit in the type. An `optional<int>` is either an `int` with a value, or empty — and the type itself tells you that both possibilities exist. You cannot accidentally treat an empty optional as if it holds a value without explicitly checking first.

## How it works

**Creating and returning an optional.** Include `<optional>` and use `std::optional<T>` as the return type.

```cpp
#include <iostream>
#include <optional>

// Returns the index of the first negative number, or nothing if there are none
std::optional<int> findFirstNegative(const int* arr, int size) {
    for (int i = 0; i < size; ++i)
        if (arr[i] < 0) return i;   // return the value
    return std::nullopt;             // return empty
}

int main() {
    int data[] = {3, 7, -2, 5};
    auto result = findFirstNegative(data, 4);
    if (result)                       // test whether a value is present
        std::cout << "Found at: " << *result << '\n';
    else
        std::cout << "None found\n";
}
```

Returning a value wraps it automatically. Returning `std::nullopt` creates an empty optional. Testing with `if (result)` is equivalent to testing `result.has_value()`. Accessing the value is done with `*result` — the dereference operator.

**Using `.value()` and `.value_or()`.** Instead of the dereference operator, you can call member functions.

```cpp
#include <iostream>
#include <optional>

std::optional<int> parse(const char* s) {
    int n = 0;
    bool negative = false;
    if (*s == '-') { negative = true; ++s; }
    if (*s == '\0') return std::nullopt;
    while (*s >= '0' && *s <= '9') n = n * 10 + (*s++ - '0');
    return negative ? -n : n;
}

int main() {
    std::optional<int> a = parse("42");
    std::optional<int> b = parse("");

    std::cout << a.value_or(0) << '\n';  // 42
    std::cout << b.value_or(0) << '\n';  // 0 (default)
}
```

`.value()` returns the contained value or throws `std::bad_optional_access` if empty. `.value_or(default)` returns the value if present, otherwise returns the default — no exception, no branch. Prefer `.value_or()` when you have a sensible default and want concise code.

**Constructing directly and using `std::make_optional`.** You can also construct an optional explicitly.

```cpp
#include <iostream>
#include <optional>

int main() {
    std::optional<int> empty;         // default-constructed: empty
    std::optional<int> filled = 7;    // implicitly wraps 7
    auto also = std::make_optional(42);

    std::cout << empty.has_value()  << '\n';  // 0
    std::cout << filled.has_value() << '\n';  // 1
    std::cout << *also              << '\n';  // 42
}
```

## Common mistakes

**Dereferencing an empty optional leads to undefined behaviour (not a compile error).**

```cpp
#include <optional>
#include <iostream>

int main() {
    std::optional<int> x;
    std::cout << *x << '\n';  // undefined behaviour — x is empty
}
```

Unlike a pointer, there is no null address to crash at a predictable point. The program may appear to run and print garbage, or crash, or do nothing observable. Always test `if (x)` or call `x.has_value()` before dereferencing. Use `.value()` if you want a guaranteed exception on empty access rather than undefined behaviour.

**Comparing an optional to its contained type directly.**

```cpp
std::optional<int> result = 5;
if (result == 5)    // this actually works — the 5 is implicitly wrapped for comparison
    ...
if (result == 10)   // also compiles — compares the contained value if non-empty
    ...
```

This is legal but can be confusing. An empty optional compared to a value is always false. Be deliberate: check `has_value()` first if the empty case needs special handling.

**Using `std::optional<T&>` (references inside optional).** `std::optional<int&>` is not allowed — the standard prohibits optional references because their semantics (rebinding vs copying) are ambiguous. If you need an optional reference, use `std::optional<std::reference_wrapper<T>>` or, more commonly, just return a pointer that may be `nullptr`.

## When to use this

Reach for `std::optional<T>` whenever a function legitimately might not produce a result — searching for an element that might not exist, parsing input that might be invalid, or looking up a key that might be absent. It is far better than sentinel values (`-1`, `nullptr`, `0.0`) because the type itself communicates the possibility of absence and callers cannot ignore it without explicitly opting in. Avoid `std::optional` for performance-critical hot paths where the indirection overhead matters, but for most application code the cost is negligible. Compare this with the pointer-based approach from lesson 12.8: both can signal absence, but `std::optional` owns its storage (no dangling risk) and works equally well for value types like `int` that you would not normally want to allocate on the heap.

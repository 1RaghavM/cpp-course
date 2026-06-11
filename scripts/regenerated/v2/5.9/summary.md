## The idea

The previous lesson introduced `std::string_view` as a lightweight, non-owning read-only window into characters. That window has two important features that go beyond simple reading: you can **narrow** it — slide the window or shrink its length without touching the underlying bytes — and you need to understand the lifetime rules precisely so you never hold a view to characters that no longer exist.

Think of `string_view` as a highlighter on a printed page. You can move the highlighter to cover a different portion of the page, or narrow the highlighted region, without reprinting anything. But if someone shreds the page, the highlighter is useless — it still points at nothing meaningful.

## How it works

**Removing a prefix or suffix**

`remove_prefix(n)` slides the start pointer forward by `n` characters; `remove_suffix(n)` shortens the length by `n`. Neither changes the underlying string.

```cpp
#include <iostream>
#include <string_view>

int main() {
    std::string_view sv{ "  hello  " };
    sv.remove_prefix(2);   // skip 2 leading spaces → "hello  "
    sv.remove_suffix(2);   // drop 2 trailing spaces → "hello"
    std::cout << sv << '\n';  // hello
}
```

`sv` is mutated in place — the underlying string literal `"  hello  "` is never touched. After the two calls, `sv.data()` points two bytes further into the literal and `sv.size()` is five.

**Checking whether a view starts or ends with a substring**

```cpp
#include <iostream>
#include <string_view>

void classify(std::string_view filename) {
    if (filename.starts_with("tmp_"))
        std::cout << filename << " is temporary\n";
    else if (filename.ends_with(".bak"))
        std::cout << filename << " is a backup\n";
    else
        std::cout << filename << " is normal\n";
}

int main() {
    classify("tmp_work.txt");
    classify("report.bak");
    classify("main.cpp");
}
```

`starts_with` and `ends_with` are available from C++20 on `std::string_view` (and also on `std::string`). They return `bool` and do not allocate.

**The critical lifetime rule in detail**

A `string_view` stores a raw pointer. When the source string changes or is destroyed, the view's pointer becomes invalid. Two concrete scenarios follow.

Scenario A — `std::string` reallocation:

```cpp
#include <iostream>
#include <string>
#include <string_view>

int main() {
    std::string s{ "short" };
    std::string_view sv{ s };
    s += " but growing longer and longer"; // likely reallocation
    std::cout << sv;  // undefined behavior
}
```

Appending to `s` may force it to move its buffer to a larger allocation. `sv`'s pointer now refers to the old, freed block.

Scenario B — `string_view` from a function-local `string` is safe only when the view is not stored past the call:

```cpp
void printLength(std::string_view sv) {
    std::cout << sv.size() << '\n'; // safe: sv used only here
}
```

Passing a local `std::string` to this function is fine — the local lives for the entire duration of the call, and `sv` is discarded before it returns.

## Common mistakes

**Mistake 1 — Using `remove_prefix` / `remove_suffix` by more than the view's length**

```cpp
std::string_view sv{ "hi" };
sv.remove_prefix(5);  // undefined behavior: removes past the end
```

Both methods assert `n <= size()` only in debug builds; in release builds this silently corrupts `sv`. Always guard with `if (n <= sv.size()) sv.remove_prefix(n);`.

**Mistake 2 — Assuming `string_view::data()` is null-terminated**

```cpp
std::string_view sv{ "hello world" };
sv = sv.substr(0, 5);   // sv is now "hello" (5 chars)
// sv.data() points at 'h', but the buffer continues " world"
// Passing sv.data() to a C function expecting null-termination is wrong
```

After `substr` (or `remove_suffix`), the view no longer ends at a null terminator. Code that passes `sv.data()` directly to a C-style API expecting `const char*` will read beyond the intended length.

**Mistake 3 — Comparing string_view with == when one side comes from a mutated source**

```cpp
std::string original{ "cat" };
std::string_view sv{ original };
original = "dog";  // reassigns original — allocates fresh storage
// sv now points at freed or reused memory
bool same = (sv == "cat");  // undefined behavior
```

Reassigning a `std::string` (not just appending) replaces its buffer. `sv` dangles. The fix is to avoid mutation after creating a view, or to create the view after the mutation is done.

## When to use this

`string_view`'s prefix/suffix trimming and `starts_with` / `ends_with` checks make it ideal for writing parsers, command-line argument processors, and file-extension checkers — any code that reads and classifies strings without needing to own them. The zero-allocation guarantee matters in hot paths.

Avoid storing `string_view` values as long-lived data members in a class or as globals; the pointed-at string may be destroyed or modified independently. In those situations, store a `std::string` that owns its data. Cross-reference "Introduction to std::string_view" for the core creation and passing rules, and "Constant variables (named constants)" for combining `const`/`constexpr` with views of compile-time string literals.

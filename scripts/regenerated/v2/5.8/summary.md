## The idea

A `std::string` owns its characters — it allocates heap memory, manages that memory's lifetime, and copies the whole buffer whenever you pass it around. That ownership model is exactly what you want when a string needs to outlive the place it was created, or when you need to modify it. But most of the time you only want to *look* at a string: print it, compare it, or pass it into a function that does not change anything. Copying six hundred characters just so a function can read them is wasteful.

`std::string_view` is a read-only *window* into an existing sequence of characters. It stores only two things: a pointer to the first character and a length. It never allocates, never copies, and never frees. You can create a `string_view` from a `std::string`, from a string literal, or from any other contiguous block of characters, and the cost is negligible — just recording that pointer and that length.

Think of a newspaper. `std::string` is having your own personal copy delivered each morning; `std::string_view` is standing next to someone else's copy and reading it over their shoulder. You see exactly the same words, but you did not pay the printing cost.

## How it works

**Creating a string_view**

```cpp
#include <iostream>
#include <string>
#include <string_view>

int main() {
    std::string name{ "Bjarne Stroustrup" };
    std::string_view sv{ name };          // view into name
    std::string_view lit{ "Hello!" };     // view directly into the literal

    std::cout << sv  << '\n';   // Bjarne Stroustrup
    std::cout << lit << '\n';   // Hello!
}
```

Both lines produce output immediately. Neither line copies any characters. `sv` remembers where `name`'s characters live; `lit` remembers where the compiler stored `"Hello!"` in the read-only section of the program. `std::string_view` supports the same output and comparison operators as `std::string`.

**Using string_view as a function parameter**

```cpp
#include <iostream>
#include <string>
#include <string_view>

void greet(std::string_view who) {
    std::cout << "Hello, " << who << "!\n";
}

int main() {
    std::string user{ "Alice" };
    greet(user);          // no copy — view into user
    greet("Bob");         // no copy — view into the literal
    greet(std::string{ "Charlie" }); // temporary string; view is safe here
}
```

`greet` accepts a `std::string_view` and can be called with a `std::string`, a string literal, or a temporary — without any copies or overloads. This is the canonical use case: functions that only read a string should take `std::string_view` instead of `const std::string&` or a raw `const char*`.

**Substrings via substr**

```cpp
#include <iostream>
#include <string_view>

int main() {
    std::string_view sentence{ "the quick brown fox" };
    std::string_view word{ sentence.substr(4, 5) };  // "quick"
    std::cout << word << '\n';
}
```

`std::string_view::substr` returns another `std::string_view` — another pointer-and-length pair pointing into the *same* underlying buffer. No heap allocation occurs. Compare this to `std::string::substr`, which always allocates a brand-new string.

## Common mistakes

**Mistake 1 — Creating a view into a temporary that is then destroyed**

```cpp
std::string_view sv;
{
    std::string temp{ "gone soon" };
    sv = temp;
}  // temp is destroyed here; sv now points at freed memory
std::cout << sv;  // undefined behavior — reads garbage or crashes
```

A `string_view` does not extend the lifetime of the string it was created from. If the underlying `std::string` goes out of scope, the view becomes a dangling pointer. The rule: the string_view must never outlive its source. Keep the source alive as long as the view exists.

**Mistake 2 — Storing a string_view returned from a function**

```cpp
std::string_view getName() {
    std::string local{ "Ephemeral" };
    return local;  // returns a view into a local that dies immediately
}

int main() {
    std::string_view sv{ getName() };
    std::cout << sv;  // undefined behavior
}
```

When the function returns, `local` is destroyed. The caller holds a view into freed storage. A function should return `std::string` (ownership) when the string is created inside it; `std::string_view` is only safe to return when it refers to something the caller already owns — like a view into a function parameter that itself came from the caller.

**Mistake 3 — Modifying the source after creating a view**

```cpp
#include <iostream>
#include <string>
#include <string_view>

int main() {
    std::string s{ "hello" };
    std::string_view sv{ s };
    s += " world";     // may reallocate s's buffer
    std::cout << sv;   // undefined behavior — sv may now point at freed memory
}
```

`std::string` may reallocate its internal buffer when you append to it. After reallocation, `sv` still points at the old (freed) address. Mutating a `std::string` after creating a view of it invalidates that view.

## When to use this

Reach for `std::string_view` whenever a function needs to read a string but not own or modify it — log functions, validators, parsers, formatters. It collapses the three overloads `(const std::string&)`, `(const char*)`, and `(std::string_view)` into one. It is especially valuable in hot paths where avoiding copies matters.

Do not use `std::string_view` when you need to store the result beyond the lifetime of the original string, when you need a null-terminated `const char*` (string_view makes no such guarantee), or when the string will be modified. In those situations, keep `std::string`. Cross-reference "Introduction to std::string" for when ownership and mutation are the right choice.

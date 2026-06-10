## The idea

When you write `auto x = someExpression;`, the compiler deduces the type of `x` from the right-hand side. For simple values like integers and doubles, this is straightforward — `auto x = 5;` gives you an `int`. But when references and `const` enter the picture, `auto` does not simply mirror the declared type of the source variable. Instead, it applies a set of stripping rules that often surprise beginners: it drops the reference and it drops top-level `const`. Understanding these rules is essential because they determine what you actually get when you use `auto` with pointers, references, and const-qualified variables.

This lesson focuses on one clear question: given a variable of type `const int&` or `int*`, what type do I actually get when I write `auto x = that_variable;`? The answer is governed by a consistent set of deduction rules, and knowing them prevents silent bugs where you expected an alias or a read-only view but got an independent copy.

## How it works

**`auto` drops references.** When you copy-initialise a variable with `auto`, the compiler deduces the *value type*, not the reference type. The reference is stripped.

```cpp
#include <iostream>

int main() {
    int value = 42;
    int& ref = value;

    auto x = ref;  // x is int, not int& — a copy of value
    x = 99;
    std::cout << value << '\n';  // still 42 — x is its own variable
}
```

If you want `x` to be a reference, you must write `auto&` explicitly: `auto& x = ref;` — then `x` is `int&`.

**`auto` drops top-level `const`.** Top-level `const` means the variable itself is const (as opposed to `const` on the thing a pointer points to). `auto` strips it when deducing.

```cpp
#include <iostream>

int main() {
    const int limit = 100;
    auto copy = limit;   // copy is int, not const int
    copy = 200;          // legal — copy has no const
    std::cout << copy << ' ' << limit << '\n';  // 200 100
}
```

To keep `const`, write `const auto copy = limit;` explicitly.

**`auto&` keeps references and propagates const.** When you declare `auto& y = expr;`, the reference is preserved — you get a reference to the same object. If the source is `const`, the reference becomes a `const` reference.

```cpp
#include <iostream>

int main() {
    const int score = 95;
    auto& ref = score;   // ref is const int& — the const is preserved
    // ref = 90;         // would not compile — ref is const
    std::cout << ref << '\n';  // 95
}
```

**`auto` and pointers.** When you assign a pointer to an `auto` variable, the pointer-ness is *not* stripped — `auto` deduces a pointer type. However, top-level `const` on the pointer itself is dropped.

```cpp
#include <iostream>

int main() {
    int n = 7;
    int* ptr = &n;
    auto p = ptr;    // p is int* — pointer is preserved
    *p = 8;
    std::cout << n << '\n';  // 8

    const int* cptr = &n;
    auto cp = cptr;  // cp is const int* — the low-level const (on *int) is kept
    // *cp = 9;      // would not compile
}
```

The rule for pointers: the pointer itself is copied (top-level const on the pointer is dropped), but `const` on what the pointer *points to* (low-level const) is retained because it is part of the pointed-to type, not part of the pointer variable.

## Common mistakes

**Expecting `auto` to preserve a reference and getting a copy instead.**

```cpp
#include <iostream>

int main() {
    int x = 5;
    int& r = x;
    auto y = r;   // y is int, not int& — this is a copy
    y = 10;
    std::cout << x << '\n';  // 5, not 10 — x is unchanged
}
```

The misconception is that because `r` is a reference, `y` should be one too. But `auto` deduces the *underlying type* from the value, stripping the reference. Write `auto& y = r;` if you need an alias.

**Expecting `const auto` to be inferred automatically when copying from a `const` source.**

```cpp
#include <iostream>

int main() {
    const int MAX = 50;
    auto limit = MAX;  // limit is int, not const int
    limit = 100;       // compiles fine — silently loses the const
    std::cout << limit << '\n';  // 100
}
```

Beginners think "I'm copying a `const int`, so `limit` must be const too." It is not — top-level `const` is stripped. If the variable should be immutable, write `const auto limit = MAX;` explicitly.

**Confusing low-level and top-level `const` when working with `const` pointers.**

```cpp
int n = 5;
const int* ptr = &n;   // ptr is a pointer to const int (low-level const)
auto p = ptr;          // p is const int* — low-level const preserved
// *p = 9;             // error: cannot modify through p
```

The value pointed to is still const after `auto` deduction because that `const` applies to the pointee type, not to the pointer variable itself. Forgetting this leads to confusion: "I used `auto`, why can I still not modify the value?"

## When to use this

`auto` saves typing and can make code more readable, but you need to be deliberate: write `auto&` when you want a reference (to avoid copies or to alias the original), write `const auto&` when you want a read-only reference, and write plain `auto` only when a copy is genuinely what you want. These rules apply whenever you initialise a variable from a function return value — if a function returns `const int&`, `auto result = f()` gives you a copy, while `const auto& result = f()` gives you a binding to what the function returned. Earlier lessons on return by reference (12.12) and pass by reference (12.5 and 12.6) give context for when aliases matter.

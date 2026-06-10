## The idea

Structs can hold other structs as members. This is not a special feature — it follows directly from the rule that a struct member can be of any type, and a struct is a type. When one struct lives inside another, you access the inner fields by chaining dot operators. You can also declare a struct as `const`, which freezes the whole object: every member becomes read-only at once, without you having to mark each one individually. Finally, the `sizeof` operator applied to a struct often returns a number larger than you might expect, because the compiler is allowed to insert padding bytes between members to align them efficiently in memory.

## How it works

Nesting a struct inside another is straightforward — just use the inner type as the member type:

```cpp
#include <iostream>

struct Point {
    int x{ 0 };
    int y{ 0 };
};

struct Rectangle {
    Point topLeft{ 0, 0 };
    Point bottomRight{ 100, 100 };
};

int main() {
    Rectangle r{ .topLeft = {10, 20}, .bottomRight = {90, 80} };
    std::cout << r.topLeft.x << ' ' << r.topLeft.y << '\n';
    // 10 20
    std::cout << r.bottomRight.x << ' ' << r.bottomRight.y << '\n';
    // 90 80
}
```

Access chains as many dots as there are nesting levels. `r.topLeft.x` reads as: get `r`, then get its `topLeft` member (a `Point`), then get that `Point`'s `x` member.

Declaring a struct variable as `const` makes the entire object immutable. You cannot change any field, including fields of nested structs:

```cpp
#include <iostream>

struct Config {
    int width{ 1280 };
    int height{ 720 };
    bool vsync{ true };
};

int main() {
    const Config defaults{};
    // defaults.width = 1920;  // compile error: cannot modify const object
    std::cout << defaults.width << 'x' << defaults.height << '\n';
    // 1280x720
}
```

This is the natural way to express "this struct is set up once and never changes." It is the struct-level equivalent of marking every field `const`, but you only write the keyword once.

The `sizeof` operator reveals how much memory a struct occupies. The result is always at least the sum of its members' sizes, but can be larger due to alignment padding:

```cpp
#include <iostream>

struct Padded {
    char flag{};   // 1 byte
    int  value{};  // 4 bytes (compiler may insert 3 bytes of padding before this)
};

int main() {
    std::cout << sizeof(char) << '\n';    // 1
    std::cout << sizeof(int) << '\n';     // 4
    std::cout << sizeof(Padded) << '\n';  // typically 8, not 5
}
```

The exact padding depends on the target platform, but on most 64-bit systems `Padded` is 8 bytes because the compiler aligns `int` to a 4-byte boundary. Ordering members from largest to smallest type often reduces padding, but this is an optimization you apply only when you have a measured reason to care.

## Common mistakes

**Mistake 1 — Trying to copy-assign a `const` struct.**

```cpp
const Config a{};
Config b{};
a = b;  // compile error: a is const
```

`const` applies to the variable, not to the type. Once `a` is declared `const`, no assignment to `a` is allowed. This also means you cannot pass a `const` struct to a function that takes a non-const reference — the function signature would require the ability to modify it.

**Mistake 2 — Assuming `sizeof(struct)` equals the sum of its members.**

```cpp
struct Surprise {
    bool active{};  // 1 byte
    double value{}; // 8 bytes — but must be 8-byte aligned
};

// sizeof(Surprise) is likely 16, not 9
```

People are sometimes surprised when binary serialization or network protocols send incorrect data because they assumed a struct was tightly packed. If exact layout matters, you need `#pragma pack` or a static assertion — but those topics are beyond this lesson. For now, just remember that `sizeof` is the reliable way to find out the true size.

**Mistake 3 — Over-nesting structs and losing track of which dot accesses which level.**

```cpp
struct A { int x{}; };
struct B { A inner{}; };
struct C { B nested{}; };

C c{};
c.nested.inner.x = 5;  // three dots
```

The chaining is correct C++, but deeply nested member access is a sign the design might benefit from named intermediate variables or helper functions. Keep nesting shallow — two levels is common and readable; three or more starts to obscure intent.

## When to use this

Nested structs are the natural way to compose data when one concept is a part of another, such as a `Rectangle` holding two `Point` members, or an `Employee` holding an `Address`. Mark a struct variable `const` whenever you create it once and never change it — this mirrors the advice from the `const` lessons and prevents accidental mutation. Check `sizeof` only when you care about memory layout, such as when writing to binary files or comparing struct sizes for performance reasons. These techniques build on passing and returning structs from lesson 13.10: a function that takes `const Rectangle&` can freely access `rect.topLeft.x` without copying or risking modification.

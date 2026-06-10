## The idea

You have already seen how namespaces let you group related names and how `static` on a global variable gives it internal linkage, keeping it invisible to other translation units. C++ offers two more namespace forms that solve related but distinct problems: **unnamed namespaces** and **inline namespaces**.

An **unnamed namespace** (also called an anonymous namespace) is a namespace with no name. Everything inside it is given internal linkage automatically — the same effect as writing `static` on each declaration, but more general because it works on types, function overloads, and other things that `static` cannot make internal. Think of it as a private room in your translation unit: names live there but no other file can reach them.

An **inline namespace** is a named namespace marked `inline`. Its contents are treated as if they also belong to the enclosing namespace — they are visible in the outer namespace without a qualifier. The primary use-case is library versioning: you can ship multiple versions of an API in sibling namespaces but designate one as the default by marking it `inline`. For a learner, the key insight is that `inline` makes a namespace's contents "fall through" to the parent.

These two features complete the namespace toolkit you started building with user-defined namespaces and the scope resolution operator. They both shape linkage and visibility in ways that matter when a program grows past a single file.

## How it works

**Unnamed namespaces** give everything inside them internal linkage:

```cpp
// file: math_helpers.cpp
#include <iostream>

namespace {
    int helperValue = 42;      // internal linkage — no other file can see this

    void printHelper() {
        std::cout << helperValue << "\n";
    }
}

int main() {
    printHelper();   // OK — same translation unit
    return 0;
}
```

The name `helperValue` cannot be referred to from another `.cpp` file, even with `extern`. The compiler generates a unique internal name for the namespace, so nothing outside this translation unit can form a qualified reference to it. This is the preferred modern way to get internal linkage for non-variable entities.

**Inline namespaces** let inner names appear directly in the outer namespace:

```cpp
#include <iostream>

namespace Math {
    inline namespace v2 {
        int add(int a, int b) { return a + b; }
    }

    namespace v1 {
        int add(int a, int b) { return a + b - 1; }  // old, buggy version
    }
}

int main() {
    std::cout << Math::add(3, 4) << "\n";    // calls v2::add (the inline one) → 7
    std::cout << Math::v1::add(3, 4) << "\n"; // explicitly calls v1::add → 6
    return 0;
}
```

Because `v2` is `inline`, `Math::add` resolves to `Math::v2::add`. The old `Math::v1::add` is still reachable through its full qualified path. This pattern lets a library upgrade its default without breaking code that needs the old version.

**Combining both:** It is also valid to put an unnamed namespace inside a named namespace, giving you internal-linkage helpers that are logically grouped:

```cpp
namespace App {
    namespace {
        int secretCounter = 0;   // internal to this translation unit, grouped under App
    }

    void increment() { ++secretCounter; }
    int count()      { return secretCounter; }
}
```

## Common mistakes

**Mistake 1: thinking the unnamed namespace is shared across files.**

Learners sometimes write a helper inside an unnamed namespace in one file and try to call it from another, expecting it to be found. It is not — that is the whole point. Each translation unit gets its own unnamed namespace.

```cpp
// file_a.cpp
namespace { int helper() { return 1; } }

// file_b.cpp
// Trying: extern int helper();  — LINKER ERROR: no such symbol with external linkage
```

**Mistake 2: confusing `inline namespace` with `using namespace`.**

`inline namespace v2 { ... }` is not the same as `using namespace v2;`. The `inline` keyword is part of the namespace declaration and affects all translation units that see the header. A `using namespace v2;` directive is a local name-lookup tool that can be placed in a single scope. The two are not interchangeable.

**Mistake 3: using an unnamed namespace in a header file.**

Placing an unnamed namespace in a header means every translation unit that includes the header gets its own private copy of those definitions. This is usually a mistake: each copy is a separate entity, so a global defined in an unnamed namespace inside a header has a different address in each translation unit. The result is subtle bugs where modifications to one translation unit's copy are invisible in another.

```cpp
// bad_header.h
namespace {
    int sharedCount = 0;  // WRONG: each includer gets its own copy
}
```

## When to use this

Use an **unnamed namespace** in `.cpp` files whenever you need a function, variable, or type that should stay private to that translation unit. It is the modern, idiomatic alternative to `static` for functions and types. Never put an unnamed namespace in a header.

Use an **inline namespace** when you are writing a library that ships versioned APIs and you want the newest version to be the default. For application code, you will rarely reach for `inline namespace` directly — but you will encounter it when reading standard-library implementations (for example, `std::literals`).

Both tools reinforce the discipline introduced by internal linkage (lesson 7.6): limit what is visible to only what needs to be visible. A translation unit's private implementation details belong in an unnamed namespace; the public, versioned interface of a library belongs in an inline namespace.

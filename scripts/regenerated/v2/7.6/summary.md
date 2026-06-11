## The idea

A C++ program is usually split across multiple source files. Each `.cpp` file is compiled independently into a translation unit, and the linker then combines all the translation units into a single executable. This process raises a question: when two translation units both define a name — a function, a variable — does the linker treat them as the same thing or as two separate things?

*Linkage* is the property that answers this question for each name. A name with **internal linkage** is visible only within the translation unit where it is defined. The linker never sees it; other `.cpp` files cannot refer to it. A name with external linkage (covered in the next lesson) is shared across translation units.

Think of internal linkage like a whiteboard in a locked meeting room. Everything written on it is visible to everyone in that room, but people in other rooms have no idea it exists. If another room happens to write the same thing on their whiteboard, the two are completely independent — changing one does not affect the other.

Internal linkage is the tool you reach for when you want to define something in one file for use only by that file, without risking accidental name collisions with other translation units.

## How it works

The keyword `static` applied at namespace (file) scope gives a variable or function internal linkage. This is distinct from `static` inside a function (which controls storage duration — that comes in a later lesson).

```cpp
// math_helpers.cpp
#include <iostream>

static int callCount { 0 };   // internal linkage — only this file can use it

static void increment()       // internal linkage function
{
    ++callCount;
}

int main()
{
    increment();
    increment();
    std::cout << callCount << '\n';  // 2
    return 0;
}
```

`callCount` and `increment` are invisible outside `math_helpers.cpp`. If another `.cpp` file happens to define its own `static int callCount`, the two variables are completely independent and there is no conflict.

For `const` and `constexpr` variables at file scope, C++ gives them internal linkage automatically — you do not need the `static` keyword, though adding it is harmless and explicit:

```cpp
// config.cpp
const int maxRetries { 3 };       // internal linkage by default for const
constexpr double pi { 3.14159 };  // internal linkage by default for constexpr
```

Non-const global variables at file scope have external linkage by default. Adding `static` changes them to internal linkage:

```cpp
// counters.cpp
int globalCounter { 0 };          // external linkage (default for non-const globals)
static int privateCounter { 0 };  // internal linkage
```

A third mechanism is the unnamed namespace. Anything defined inside `namespace { ... }` has internal linkage without needing `static`:

```cpp
namespace
{
    int hiddenValue { 42 };         // internal linkage
    void helperFunc() { }           // internal linkage
}
```

Modern C++ style prefers unnamed namespaces over `static` for giving internal linkage to groups of names, but both are valid and you will see both in real codebases.

## Common mistakes

**Mistake 1 — Confusing `static` at file scope with `static` inside a function.** Both use the keyword `static` but mean completely different things. At file scope, `static` controls *linkage* — it hides the name from other files. Inside a function, `static` controls *storage duration* — it makes the local variable persist across function calls. They look the same and are easy to conflate:

```cpp
static int x { 0 };   // file scope: internal linkage

void foo()
{
    static int x { 0 }; // function scope: static storage duration, not linkage
}
```

**Mistake 2 — Assuming `const` global variables are visible across files.** Because `const` globals have internal linkage by default, placing one in a `.cpp` file and then trying to declare `extern const int maxRetries;` in another file will fail at link time — the linker finds no externally visible definition. If you need a constant to be shared across translation units, you need `inline constexpr` (covered in a later lesson) or to put the definition in a header.

**Mistake 3 — Declaring internal-linkage names in a header.** If you put a `static` variable definition in a header file and include that header in multiple `.cpp` files, each translation unit gets its own independent copy of the variable. They all compile without error, but they are separate variables with the same name — any change in one file is invisible to another. The usual intent is one shared variable, but you get several private ones.

## When to use this

Reach for internal linkage — via `static` or an unnamed namespace — when you are writing helper functions or module-private variables that are implementation details of a single `.cpp` file. It is a form of encapsulation at the file level: it prevents other files from accidentally depending on your internal names and shields you from name collisions with other translation units. The corresponding concept, external linkage, is what you use when you genuinely need a name to be shared across files — but that should be the deliberate choice, not the default. When in doubt, prefer internal linkage for file-local helpers.

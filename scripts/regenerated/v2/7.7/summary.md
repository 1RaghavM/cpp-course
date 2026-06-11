## The idea

Internal linkage keeps a name confined to one translation unit. But sometimes you genuinely need to share a variable or function across multiple source files — a global configuration value, a shared counter, a function defined in one `.cpp` and called from several others. That is what **external linkage** is for.

A name with external linkage is visible to the linker, which means any translation unit in the program can refer to it — provided it knows the name's type. The definition lives in exactly one `.cpp` file; other files that need to use the name add a **forward declaration** using the `extern` keyword. The forward declaration tells the compiler "this name exists and has this type; the linker will find the actual definition elsewhere."

Think of it like a company's central database. The database (the definition) lives on one server. Other offices (other translation units) can query it if they know the address (the `extern` declaration). The database holds real data; the address held in each office is just a reference to it — not a copy.

## How it works

Non-`const` global variables have external linkage by default, so no extra keyword is needed in the defining file. In any other file that wants to use the variable, add an `extern` declaration:

```cpp
// counter.cpp  (definition — external linkage by default)
int globalCounter { 0 };

void increment()
{
    ++globalCounter;
}
```

```cpp
// main.cpp  (forward declaration)
#include <iostream>

extern int globalCounter;  // declaration — no memory allocated here
void increment();          // forward declaration for the function

int main()
{
    increment();
    increment();
    std::cout << globalCounter << '\n';  // 2
    return 0;
}
```

The `extern int globalCounter;` line in `main.cpp` is a declaration, not a definition. No storage is allocated; the linker resolves it to the variable defined in `counter.cpp`. If you omit `extern` and write `int globalCounter;` in `main.cpp`, you get a second definition, and the linker will report a duplicate-symbol error (unless one of the files has the definition inside an unnamed namespace or uses `static`).

Functions have external linkage by default as well. The familiar function forward declaration is exactly the same mechanism — the compiler needs to know the signature, and the linker finds the body:

```cpp
// greet.cpp
#include <iostream>

void greet(const std::string& name)
{
    std::cout << "Hello, " << name << '\n';
}
```

```cpp
// main.cpp
#include <string>
void greet(const std::string& name);   // forward declaration

int main()
{
    greet("World");
    return 0;
}
```

To give a non-`const` global variable internal linkage instead — preventing other files from seeing it — use `static` at file scope as discussed in the previous lesson. When in doubt about whether something should be shared, default to internal linkage and promote to external linkage only when necessary.

An important rule: `const` and `constexpr` global variables have internal linkage by default. If you want to share a `const` across files via external linkage you must explicitly add `extern`:

```cpp
// limits.cpp
extern const int maxSize { 100 };  // extern needed to give const external linkage
```

```cpp
// main.cpp
extern const int maxSize;          // declaration
```

Without `extern`, each translation unit that includes a header with `const int maxSize { 100 };` gets its own private copy — no sharing.

## Common mistakes

**Mistake 1 — Omitting `extern` on the declaration and accidentally creating a second definition.** In standard C++, defining the same non-`const` variable in two translation units without `extern` violates the One Definition Rule and produces a linker error. The fix is to have the definition in exactly one file and use `extern` declarations in all others:

```cpp
// WRONG in file2.cpp:
int globalCounter { 0 };   // second definition — linker error

// CORRECT in file2.cpp:
extern int globalCounter;  // declaration only
```

**Mistake 2 — Using `extern` on the definition.** Writing `extern int x { 0 };` in a `.cpp` file is technically valid (C++ allows it), but `extern` combined with an initializer still counts as a definition. The intent is usually misunderstood: developers sometimes write this thinking it is a declaration-only form, but it allocates storage just like `int x { 0 };`. The safe convention is: definitions have no `extern`; declarations have `extern` and no initializer.

**Mistake 3 — Forgetting that `const` globals are internal by default.** Placing `const int maxSize { 100 };` in a header and including it in multiple `.cpp` files gives each file its own private copy — there is no linker error because each copy has internal linkage. This means changes to the value require recompiling every file that includes the header, and you cannot take the address of the "shared" constant and pass it between translation units meaningfully. When true sharing is needed, use `extern const` in the definition file and a matching `extern const` declaration elsewhere.

## When to use this

External linkage is the right tool when a variable or function genuinely serves the whole program — not just one file. In practice this is rarer than beginners expect; most helpers and module-private state should stay internal. When you do need shared state, the safest pattern is to put the definition in one `.cpp` file and declare it `extern` everywhere else, rather than embedding global definitions in headers. The next lessons explore better alternatives — `const` globals with internal linkage and `inline constexpr` for shared compile-time constants — that avoid the fragility of mutable shared state.

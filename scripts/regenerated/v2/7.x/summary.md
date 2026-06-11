## The idea

Chapter 7 was about one overarching question: **where does a name live, how long does it exist, and who can see it?** Every topic in the chapter — blocks, namespaces, local variables, global variables, shadowing, linkage, inline functions, static locals, and `using` — is an answer to part of that question for some category of name.

The three axes that govern any C++ name are:

- **Scope** — where in the source code the name can be used.
- **Duration** (storage duration) — how long the object backing the name exists at runtime.
- **Linkage** — which translation units can refer to the same name.

Master these three concepts and the rest of chapter 7 falls into place.

## How it works

**Scope** is the region of code where a name is visible. A name declared in a block is in scope from its declaration to the closing brace; a name declared at file scope (outside all blocks) is in scope from its declaration to the end of the file. User-defined namespaces create a named scope that can be accessed with the scope resolution operator `::`. The scope of a name can be extended with a `using` declaration or `using` directive, but those tools add the name to the current scope — they do not change where the underlying object lives.

```cpp
int x = 10;           // file scope — visible until end of file

int main() {
    int x = 20;       // block scope — shadows the outer x
    {
        int x = 30;   // inner block scope — shadows both
        // only this x is visible here
    }
    // x = 20 is visible again
}
```

**Storage duration** governs the lifetime of the object itself:

- **Automatic duration** — local variables. Created when the enclosing block is entered, destroyed when it exits. Stack-allocated. The default for variables declared inside a function.
- **Static duration** — global variables and `static` local variables. Created before `main` runs (or on first use for `static` locals), destroyed when the program ends. Lives in a fixed memory region, not the stack.
- **Dynamic duration** — heap allocation with `new`; covered in a later chapter.

```cpp
void countCalls() {
    static int calls = 0;   // static local: initialized once, persists across calls
    ++calls;
    std::cout << calls << "\n";
}
```

Each call to `countCalls` increments the same `calls` object, because its duration extends for the life of the program even though its scope is limited to `countCalls`.

**Linkage** controls which translation units can refer to the same entity:

- **No linkage** — local variables. Each declaration is a unique object; nothing outside the block can name it.
- **Internal linkage** — `static` globals, `const` globals (by default in C++), and everything inside an unnamed namespace. Accessible anywhere in the same translation unit but invisible to the linker.
- **External linkage** — non-`static`, non-`const` globals and functions. The linker can connect a declaration in one file to a definition in another. `extern` is the keyword that introduces a forward declaration for an externally-linked entity.
- **Inline linkage** — `inline` variables (C++17). Multiple definitions across translation units are allowed; the linker folds them into one. The canonical use is a header-only global constant shared across files.

The clearest mental model: think of linkage as the linker's visibility rule. Internal = private to the file; external = public to the program; inline = "defined here, but identical definitions elsewhere are OK."

```cpp
// --- a.cpp ---
static int privateCount = 0;     // internal linkage — only a.cpp can see this

inline const int MAX_SIZE = 256; // inline linkage — can appear in a header

extern void doWork();             // external linkage forward declaration

// --- b.cpp ---
void doWork() { /* definition */ } // external linkage definition
```

**Scope resolution operator and namespaces.** `::name` refers to the global namespace. `Foo::name` refers to namespace `Foo`. Unnamed namespaces give internal linkage without the verbosity of `static`. Inline namespaces let a nested namespace's contents resolve through the enclosing namespace, useful for versioned APIs.

## Common mistakes

**Mistake 1: confusing scope with duration.**

A variable's scope (where its name is visible) and its duration (how long the object lives) are independent. A `static` local variable has block scope — its name is only visible inside the function — but it has static duration: the object persists for the program's entire life. Learners often expect a `static` local to be destroyed when the function returns, but it is not.

**Mistake 2: using a non-`const` global as a convenience.**

Global variables with external linkage can be modified from any translation unit. When a bug corrupts a global's value, every function that reads it is a suspect. The lesson "Why (non-const) global variables are evil" covered this in detail. The safe pattern is: if you need a global, make it `const` or `constexpr` (or wrap it in a function that returns it).

**Mistake 3: `using namespace std;` in a header file.**

A `using` directive at file scope in a header pollutes every translation unit that includes the header. Names from the directive bleed into code that never asked for them, causing hard-to-trace ambiguity errors when two libraries happen to define the same name.

## When to use this

Use **local variables** as the default. They have automatic duration (no manual cleanup), no linkage (no accidental sharing), and their scope is as narrow as possible.

Reach for **`static` local variables** when a function needs persistent state across calls — a call counter, a one-time initialization flag — without exposing that state globally.

Use **`const`/`constexpr` global variables** when a value is truly program-wide and immutable: physical constants, configuration maximums, fixed lookup tables. Put them in a header as `inline constexpr` if they need to be shared across multiple `.cpp` files.

Avoid **non-`const` global variables** unless you have a compelling reason and have exhausted alternatives. When you do use them, wrap them behind accessor functions to limit mutation points.

Use **user-defined namespaces** to group related names in a library or module, preventing collisions with names in other libraries. Use **unnamed namespaces** in `.cpp` files to give internal linkage to helper functions and types without `static`. Use **inline namespaces** when shipping versioned APIs.

Use **`using` declarations** (not `using namespace`) inside function bodies to reduce typing for frequently used names. Never use `using namespace` at file scope in a header.

These rules are not arbitrary: each one follows directly from scope, duration, and linkage. When you understand why each rule exists, you no longer have to memorize the list.

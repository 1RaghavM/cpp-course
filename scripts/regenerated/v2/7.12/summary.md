## The idea

Chapter 7 introduced a cluster of related ideas that all govern the same question: given a name written in code, how long does the thing behind that name live, and from where can you reach it? The answer involves three independent axes:

- **Scope** — which region of source code can see the name at all?
- **Duration** — how long does the object's memory actually exist at runtime?
- **Linkage** — can the name refer to the same entity across different translation units (files)?

These three axes combine in a small number of configurations. A local variable has block scope, automatic duration, and no linkage. A global `static` variable has file scope, static duration, and internal linkage. An `inline const` in a header has global scope, static duration, and external linkage. Knowing which combination you are dealing with is the skill this lesson asks you to consolidate.

## How it works

**Scope**

Scope is purely a compile-time concept. A name is in scope from its point of declaration to the end of the block (for local names) or the end of the translation unit (for globals). Blocks nest; inner blocks can shadow names from outer blocks. Namespaces create named scopes so you can have two `process` functions in `Render::` and `Audio::` without conflict.

```cpp
#include <iostream>

int x = 1;          // global scope — visible everywhere below

int main() {
    int x = 2;      // local scope — shadows the global
    {
        int x = 3;  // inner block — shadows the local
        std::cout << x << "\n";  // 3
    }
    std::cout << x << "\n";      // 2
    std::cout << ::x << "\n";    // 1  (global via ::)
    return 0;
}
```

**Duration**

Duration is a runtime concept. It answers "when is the memory allocated and when is it freed?"

- **Automatic duration**: local variables, allocated on entry to the block, freed on exit.
- **Static duration**: global variables and `static` locals, allocated when the program starts, freed when it ends.
- **Dynamic duration**: variables created with `new` — covered in a later chapter.

A `static` local has block scope (only visible inside the function) but static duration (it survives between calls):

```cpp
#include <iostream>

void count() {
    static int n = 0;  // block scope, static duration
    std::cout << ++n << "\n";
}

int main() {
    count(); // 1
    count(); // 2
    count(); // 3
    return 0;
}
```

**Linkage**

Linkage determines whether the linker considers two occurrences of a name in different files to be the same entity.

- **No linkage**: local variables. Each copy is its own object; the linker never connects them.
- **Internal linkage** (`static` on a global, or `const` at namespace scope): visible only within the current translation unit. Other files cannot refer to it, even with `extern`.
- **External linkage**: the default for non-`const`, non-`static` globals and for `inline` definitions. The linker connects all uses across translation units to the same object.

```cpp
// a.cpp
int gShared = 42;            // external linkage — other files can see it
static int gPrivate = 7;     // internal linkage — private to a.cpp
inline const int kConst = 5; // external linkage via inline — safe in a header
```

**Quick lookup — common combinations**

- `int x;` inside a function: block scope, automatic duration, no linkage.
- `int x;` at global scope: global scope, static duration, external linkage.
- `static int x;` at global scope: global scope, static duration, internal linkage.
- `static int x;` inside a function: block scope, static duration, no linkage.
- `inline const int k = 1;` in a header: global scope, static duration, external linkage.

## Common mistakes

**Assuming `static` always means "internal linkage"**

```cpp
void f() {
    static int counter = 0; // NOT internal linkage — this is static duration
    ++counter;
}
```

`static` on a local variable means static *duration*, not internal *linkage*. The variable has no linkage at all — it belongs entirely to the function. Only `static` applied to a name at namespace/global scope gives internal linkage. The same keyword has two roles, and confusing them is one of the most common chapter 7 mistakes.

**Thinking a `const` global automatically has external linkage**

```cpp
const int kLimit = 100; // at global scope — internal linkage in C++
```

In C++, a `const` or `constexpr` variable at namespace scope has **internal linkage** by default (unlike non-`const` globals). Including this in a header compiles fine because each translation unit gets its own copy with internal linkage — but that means multiple objects in the binary, not one shared object. To explicitly share one object, use `inline const int kLimit = 100;`.

**Mixing up scope and duration**

```cpp
void g() {
    static int x = 0; // block scope, static duration
    // x is only visible here, but lives for the whole program
}
// x is out of scope here — cannot be named — but the object still exists
```

Scope ends at `}`. Duration ends when the program exits. These are independent. The object behind a static local outlives its scope — you just cannot name it from outside `g`.

## When to use this

The three-axis model (scope / duration / linkage) is the mental framework for every decision in this chapter. Use it when reading unfamiliar code to answer "where can this variable be changed?" and "how long does it live?" Use internal linkage (`static` globals or unnamed namespaces) to prevent accidental name collisions across files. Use `inline const` for constants you need in multiple files. Use `static` locals for function-private persistent state like counters and caches. Avoid non-`const` globals except where truly necessary — they combine wide scope with static duration and external linkage, the worst combination for reasoning about program state.

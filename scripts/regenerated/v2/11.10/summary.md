## The idea

When you write a regular (non-template) function, the split is clean: put the declaration in a header file (`.h`) and the definition in a single `.cpp` file. The linker finds the one definition and wires everything up. Templates break this model in a subtle but fundamental way. A function template is not a function — it is a *recipe* the compiler uses to stamp out real functions on demand. To stamp out that function, the compiler must see the full recipe at the moment it processes each call site. If the definition is buried in a `.cpp` file that the compiler has already finished reading, the recipe is gone and the instantiation fails.

The practical consequence: function template definitions must live in header files, or in files that are included wherever the template is used.

## How it works

Consider a two-file project that tries the classic non-template split:

```cpp
// math_utils.h
template <typename T>
T add(T a, T b);          // declaration only
```

```cpp
// math_utils.cpp
#include "math_utils.h"
template <typename T>
T add(T a, T b) { return a + b; }  // definition
```

```cpp
// main.cpp
#include "math_utils.h"
#include <iostream>
int main() {
    std::cout << add(3, 4) << '\n';  // linker error: undefined reference to add<int>
}
```

`main.cpp` sees only the declaration. When the compiler processes `add(3, 4)`, it needs the full definition to instantiate `add<int>`. It is not there, so the linker later reports an undefined reference.

The fix is to move the definition into the header so every translation unit that includes the header gets the full recipe:

```cpp
// math_utils.h  (corrected — definition in the header)
template <typename T>
T add(T a, T b) { return a + b; }
```

Now `main.cpp` includes `math_utils.h`, sees the full definition, and the compiler can instantiate `add<int>` right there. Every other file that includes the header can do the same. If two files both instantiate `add<int>`, the linker merges the duplicates automatically — the One Definition Rule permits this for templates.

You can also split the template neatly for readability without breaking compilation by putting the definition at the bottom of the header, after the declaration:

```cpp
// math_utils.h
template <typename T>
T multiply(T a, T b);   // declaration (optional but improves readability)

// --- implementation below ---
template <typename T>
T multiply(T a, T b) { return a * b; }
```

Some projects use a `.tpp` or `.inl` file for the definition and `#include` it at the bottom of the header — this is purely a style preference and does not change the rule that the definition must be visible at the call site.

## Common mistakes

**Putting the template definition in a `.cpp` file and only the declaration in the header.** This is the most common mistake and produces linker errors that can look mysterious:

```
undefined reference to `int add<int>(int, int)'
```

The compiler processed each `.cpp` file in isolation. The file with the definition never instantiated `add<int>` (nothing called it there), and the file that called it never saw the definition. The fix is always the same: move the definition to the header.

**Thinking `extern template` solves the problem in general.** `extern template` is a performance tool that suppresses redundant instantiations across translation units, but it requires that the definition is already visible somewhere and that you manually provide it in exactly one `.cpp` file. Beginners sometimes try to use it as a way to hide template definitions in `.cpp` files — this does not work unless you are explicitly listing every type the template will ever be used with, which defeats the purpose of templates.

**Forgetting that non-type template parameters follow the same rule.** Whether your template has `typename T`, `int N`, or both, the rule is the same: the full definition must be visible at the call site. There is no exception based on what kind of parameter the template takes.

## When to use this

Put all function template definitions in header files. This is the standard practice used by every C++ standard library implementation and most production codebases. If a header with template definitions becomes large, factor it into a `.tpp` file `#include`d at the bottom of the header — that is a common large-project pattern. Only consider explicit instantiation in a `.cpp` file when you control every type the template will ever be used with and you specifically want to reduce compile times by instantiating once and hiding the definition. For everyday learning and most practical work, headers-only is the right call.

The rule applies equally to templates with non-type parameters and to function templates with multiple type parameters — there is no variant of the template mechanism that somehow allows the definition to live in a `.cpp` file while remaining usable from other files without explicit instantiation lists. When in doubt, default to headers. The cost is a slightly larger header file; the benefit is that every translation unit that includes the header can instantiate the template with any type or value it needs, without linker surprises.

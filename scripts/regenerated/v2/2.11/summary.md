## The idea

When a program grows beyond a single file, functions defined in one `.cpp` file need to be visible to other `.cpp` files that call them. You already know that a forward declaration tells the compiler "this function exists" before it sees the full definition. Header files are a way to write those forward declarations once and then share them everywhere they are needed, without copying and pasting.

Think of a header file as a public notice board. The `.cpp` file that implements a function is the author — it does the real work. The header is the announcement: "here is the name, return type, and parameters of what I provide." Any other file that includes the header gets to see the announcement and knows how to call the function, even before the linker stitches the compiled pieces together.

The C++ standard library itself works this way. When you write `#include <iostream>`, you are pulling in a header that declares `std::cout`, `std::cin`, and related symbols. The actual machine code for those is inside a pre-built library; the header is just the set of declarations that lets your code compile.

## How it works

A user-defined header file has a `.h` (or `.hpp`) extension. It typically contains only declarations — not definitions — so that multiple `.cpp` files can include it without violating the one-definition rule.

**Example 1 — declaring a function in a header**

Suppose you have two files: `math_utils.h` and `math_utils.cpp`.

```cpp
// math_utils.h
int add(int a, int b);   // declaration only
int multiply(int a, int b);
```

```cpp
// math_utils.cpp
#include "math_utils.h"  // include your own header
#include <iostream>

int add(int a, int b) {
    return a + b;
}

int multiply(int a, int b) {
    return a * b;
}
```

```cpp
// main.cpp
#include "math_utils.h"  // pulls in the declarations
#include <iostream>

int main() {
    std::cout << add(3, 4) << "\n";       // 7
    std::cout << multiply(3, 4) << "\n";  // 12
    return 0;
}
```

Notice that `math_utils.cpp` also includes its own header. This is intentional: the compiler then checks that the definitions in the `.cpp` file actually match the declarations in the `.h` file. If they do not match, you get a compile error right away instead of a confusing linker error later.

**Example 2 — the difference between angle brackets and quotes**

There are two forms of `#include`:

```cpp
#include <iostream>   // angle brackets: search system/standard paths
#include "math_utils.h"  // quotes: search relative to the current file first
```

Use angle brackets for standard library and third-party headers. Use double quotes for headers that belong to your own project. The compiler searches a different set of directories depending on which form you use.

**Example 3 — what belongs in a header**

Headers should contain declarations, not definitions of functions that will appear in multiple `.cpp` files. The exception: headers can define things that are inherently safe to repeat — but for now (before you know about `inline` or templates), keep definitions in `.cpp` files.

```cpp
// good_header.h  — declarations only
int square(int x);
void printBanner();
```

```cpp
// bad_header.h  — function body in the header
int square(int x) { return x * x; }  // risky if included in multiple .cpp files
```

If two `.cpp` files both include `bad_header.h`, the linker sees two definitions of `square` and refuses to link.

## Common mistakes

**Mistake 1 — including `.cpp` files instead of `.h` files**

New learners sometimes write `#include "math_utils.cpp"` instead of `#include "math_utils.h"`. This compiles the entire source file as part of the includer, leading to duplicate definitions and linker errors. Headers exist precisely so you never need to include a `.cpp` file.

```cpp
// wrong
#include "math_utils.cpp"  // do NOT do this

// right
#include "math_utils.h"
```

**Mistake 2 — forgetting to include the header in the `.cpp` that defines the functions**

If `math_utils.cpp` does not include `math_utils.h`, the compiler cannot verify that the definition matches the declaration. A mismatch in parameter types or return type may go undetected until runtime in subtle ways (or until a linker error surfaces with a confusing message).

```cpp
// math_utils.cpp — MISSING the include
// int add(int a, int b) now has no declaration to check against
int add(int a, int b) { return a + b; }
```

Always include the corresponding header in the `.cpp` that owns the definitions.

**Mistake 3 — putting function bodies in headers that are included by multiple files**

If you define a non-inline function in a header and two `.cpp` files include it, the linker sees two definitions and reports "multiple definition of …". The rule is: the declaration goes in the header; the definition goes in the `.cpp`.

```cpp
// problem.h
int square(int x) { return x * x; }  // definition in header — linker error
```

The fix: move the body to a `.cpp` file and keep only `int square(int x);` in the header.

## When to use this

Use header files whenever you split a program across multiple `.cpp` files, which is almost always appropriate once a program grows beyond a few dozen lines. The header is the "interface" of a translation unit; it says what the unit provides without showing how. If you only have a single `main.cpp` and everything fits, there is no need for a separate header. As the program grows — separate utilities, multiple callers — creating matching `.h` and `.cpp` pairs keeps each file focused and compilation fast.

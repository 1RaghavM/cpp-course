## The idea

A single `.cpp` file works fine for small programs, but it does not scale. Once a project grows to hundreds or thousands of lines, putting everything in one file becomes unmanageable: finding code is slow, understanding it requires reading everything, and two people cannot work on different parts without constantly stepping on each other's edits.

The solution C++ uses is to split a program across multiple `.cpp` files, called **translation units**. Each file is compiled independently into an object file (`.o` or `.obj`). A tool called the **linker** then combines those object files into a single executable. This means each file is a self-contained piece that only needs to know about the functions it calls, not where those functions are implemented.

The catch is the same one we saw with forward declarations: the compiler reads each file independently and must see a declaration of any function it calls before it can accept the call. Declarations travel between files through **header files** — but this lesson focuses on the mechanics of how multiple `.cpp` files work together before diving into headers in a later lesson.

## How it works

**The two-file model**

Suppose you have two files: `math.cpp` defines helper functions, and `main.cpp` uses them.

`math.cpp`:
```cpp
int square(int x)
{
    return x * x;
}

int cube(int x)
{
    return x * x * x;
}
```

`main.cpp`:
```cpp
#include <iostream>

int square(int x);   // forward declaration
int cube(int x);     // forward declaration

int main()
{
    std::cout << square(4) << "\n";
    std::cout << cube(3) << "\n";
    return 0;
}
```

To build this, you compile both files and link them:

```
g++ -std=c++20 main.cpp math.cpp -o program
```

The compiler produces `main.o` and `math.o`. The linker sees that `main.o` references `square` and `cube` but does not define them. It finds those definitions in `math.o` and wires them together into `program`.

**Why each file needs declarations**

The compiler processes `main.cpp` in complete isolation. It does not read `math.cpp` at compile time. The forward declarations in `main.cpp` tell the compiler "trust me, these functions exist and have these signatures — you will find the bodies elsewhere." Without them, the compiler cannot type-check the calls and will report errors.

This is exactly the same mechanism as the single-file forward declaration you saw in the previous lesson. The only difference is that the definition now lives in a separate file rather than later in the same file.

**One definition rule**

A critical rule: a function may be defined only once across all `.cpp` files in a program. Defining `square` in both `main.cpp` and `math.cpp` causes a linker error — the linker finds two bodies for the same name and refuses to choose between them. Declarations, however, may appear in many files without conflict.

**Single-file equivalent with forward declarations**

Everything that multi-file programs do can be demonstrated in a single file using forward declarations. Since exercises in this platform use single `.cpp` files, the same mental model applies: think of each function as if it lived in its own module — give it a clear declaration and keep its implementation separate from the call site.

```cpp
#include <iostream>

// Declarations (simulate what would normally come from a header)
int square(int x);
int cube(int x);

int main()
{
    std::cout << square(3) << "\n";  // 9
    std::cout << cube(2) << "\n";    // 8
    return 0;
}

// Definitions (simulate what would be in math.cpp)
int square(int x) { return x * x; }
int cube(int x)   { return x * x * x; }
```

## Common mistakes

**Mistake 1: Defining a function in both files**

```
// main.cpp
int square(int x) { return x * x; }

// math.cpp
int square(int x) { return x * x; }
```

Even if both definitions are identical, the linker sees two definitions for the same symbol and reports a "multiple definition" error. Functions must be defined in exactly one file.

**Mistake 2: Forgetting to pass all `.cpp` files to the compiler**

If you compile only `main.cpp`, the linker has no `math.o` to pull definitions from and reports "undefined reference to `square`". The full compile command must list every `.cpp` file that contains definitions used by the program. Missing a file is the most common beginner mistake when first splitting code across files.

**Mistake 3: Confusing "compiled together" with "compiled at the same time"**

The compiler does not mix the two files together like concatenating them. Each file is independently compiled. This means a variable or function defined without a forward declaration in `math.cpp` is completely invisible to `main.cpp` at compile time. The linker can connect definitions to references, but only for names that were properly declared at compile time.

## When to use this

Split code into multiple `.cpp` files once a single file is long enough to make navigation or comprehension difficult — a rough threshold is 200–400 lines, though the right split point is wherever there is a natural boundary between concerns (math utilities, input/output, game logic, etc.). For very small programs with one or two helper functions, a single file is cleaner. The approach you will use in practice almost always pairs multi-file code with header files (covered in "Header files"), which move the forward declarations to a shared `.h` file so you do not have to duplicate them in every `.cpp` that needs them.

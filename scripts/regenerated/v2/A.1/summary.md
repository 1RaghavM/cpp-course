## The idea

When you write a program of any real size, you rarely write everything from scratch. You rely on code that someone else wrote — or that you wrote previously and want to reuse. That pre-compiled, reusable code is packaged as a **library**. The C++ standard library itself is a library. So is any third-party library you pull into a project: an image-loading utility, a math toolkit, a network layer.

Libraries come in two fundamentally different packaging formats: **static** and **dynamic** (also called shared). The difference is not about what code is inside; it is about *when* and *how* that code gets combined with your executable.

A static library is baked into your program at link time. When the linker produces your final executable, it copies the relevant machine code from the library directly into the output file. The result is one self-contained binary that carries everything it needs.

A dynamic library stays as a separate file on disk — a `.dll` on Windows, a `.so` on Linux, a `.dylib` on macOS. Your executable records *which* dynamic libraries it needs and *which symbols* it borrows from them, but it does not copy their code in. At runtime, the operating system's loader finds those library files and maps them into your process's memory before `main()` starts.

## How it works

**Anatomy of a static library**

A static library is an archive — conceptually just a collection of `.o` object files bundled together with a directory that lists what is inside. On Linux and macOS the tool that builds one is `ar`; on Windows, `lib.exe` or the equivalent. The file extension is `.a` on Unix systems and `.lib` on Windows.

When the linker encounters `libmath.a` it walks through the archive and copies *only the object files that satisfy an unresolved symbol* into the output. Unused code is left behind, so the final binary is not necessarily enormous.

```cpp
// mathutils.h — a tiny static library header
#pragma once
int add(int a, int b);
int multiply(int a, int b);
```

```cpp
// mathutils.cpp — compiled into mathutils.o, archived into libmathutils.a
#include "mathutils.h"
int add(int a, int b)      { return a + b; }
int multiply(int a, int b) { return a * b; }
```

```cpp
// main.cpp — links against libmathutils.a
#include <iostream>
#include "mathutils.h"

int main() {
    std::cout << add(3, 4) << '\n';       // 7
    std::cout << multiply(3, 4) << '\n';  // 12
}
```

To build and link on a Unix system:
```
g++ -c mathutils.cpp -o mathutils.o
ar rcs libmathutils.a mathutils.o
g++ main.cpp -L. -lmathutils -o myapp
```

The `-L.` flag tells the linker to search the current directory for libraries; `-lmathutils` instructs it to look for `libmathutils.a` (or a `.so` by the same stem).

**Anatomy of a dynamic library**

A dynamic library (shared object) is built with position-independent code so its machine instructions can be loaded at any virtual address. On Unix:

```
g++ -fPIC -c mathutils.cpp -o mathutils.o
g++ -shared -o libmathutils.so mathutils.o
g++ main.cpp -L. -lmathutils -o myapp
```

The resulting `myapp` executable is smaller than the static version, but it will not run unless `libmathutils.so` is findable at runtime — either in the standard system library paths, in the directory recorded in `RPATH`, or in a path listed in `LD_LIBRARY_PATH`.

**Header files and the two-file model**

In both cases the *header* declares the interface that callers see. The compiled library provides the implementation. Your `#include` pulls in declarations; the linker resolves the symbols by finding definitions in the library.

## Common mistakes

**Mistake 1: forgetting to ship the dynamic library**

A common early mistake is distributing only the executable built against a `.so`/`.dll`, not the library file itself. The program compiles and links fine on the developer's machine (because the library is in the system path there), but crashes on the target machine with "cannot open shared object file" or "DLL not found". Static linking avoids this at the cost of a larger binary.

**Mistake 2: header-only vs. compiled confusion**

Some modern C++ libraries are *header-only* — all their code lives in `.h` or `.hpp` files and you simply `#include` them. Learners sometimes try to link against them as if they were compiled libraries and are confused by "file not found" linker errors. Check the library's documentation: if it is header-only, there is nothing to link.

**Mistake 3: getting the link order wrong**

On many Unix linkers, the order of objects and libraries on the command line matters. If you write:

```
g++ -lmathutils main.cpp   # WRONG on GNU ld — symbols resolved left-to-right
```

the linker may search `libmathutils` before it has seen `main.cpp`'s unresolved references, find no demand for those symbols, and discard the archive. The fix is to put library flags *after* the source files or object files that need them:

```
g++ main.cpp -L. -lmathutils   # correct
```

## When to use this

Prefer **static linking** when you are distributing a standalone executable and do not want to worry about the runtime environment — a CLI tool, a game binary, or any deployment where you cannot guarantee what libraries are installed on the target machine. The trade-off is a larger file and that bug fixes in the library require you to recompile and redistribute.

Prefer **dynamic linking** when multiple programs on the same system share a large library (such as a graphics driver or the C++ runtime itself) and memory or disk footprint matters. It also allows library updates to take effect without recompiling every consumer. Most operating systems ship the C and C++ runtimes as shared libraries precisely for this reason.

Many real-world projects use a mix: they link against system-provided shared libraries (the OS C runtime, OpenGL, etc.) while statically bundling a few niche third-party libraries to reduce deployment dependencies.

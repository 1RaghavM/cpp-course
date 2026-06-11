## The idea

Your source code does not turn into a running program in a single step. Three separate tools each do a distinct part of the work: the compiler, the linker, and optionally a library system. Understanding what each one does — and which one reports a given error — is essential for diagnosing problems that would otherwise be baffling.

Think of building a program like constructing a building from prefabricated sections. The compiler is the factory that manufactures each section from architectural drawings. The linker is the crew that assembles the sections into a single, complete structure on-site. A library is a catalog of pre-built components — windows, doors, staircases — that you order instead of designing from scratch. You do not manufacture these components; you specify which ones you need and the linker installs them.

This separation exists because large programs are built from many source files. Each file compiles independently, and only the linker sees the whole picture. The split between compilation and linking enables faster incremental builds — when you change one file, only that file needs to recompile; the linker just re-links the resulting object files.

## How it works

**The compiler** takes one translation unit at a time. A translation unit is roughly one `.cpp` file plus all the headers it includes. The compiler checks that the code is syntactically valid C++, resolves types, enforces language rules, and generates an object file — a chunk of machine code that is not yet a complete program. If any rule is violated, the compiler stops and reports an error with the file name and line number.

Object files contain two things: machine code for the functions and data defined in that translation unit, and a symbol table — a list of names the file defines or depends on. A function defined in `math.cpp` appears in its object file as a defined symbol. A call to that function in `main.cpp` appears in `main.cpp`'s object file as an undefined reference. The connection between them is not made until link time.

**The linker** receives all the object files and resolves those undefined references. It scans the symbol tables, matches each reference to a definition, and patches the machine code so every call reaches the right destination. The linker also incorporates any library code your program uses. Once all references are resolved, it writes the final executable to disk.

If the linker cannot find a definition for a symbol, it reports a linker error — typically "undefined reference to" on GCC/Clang, or "unresolved external symbol" on MSVC. This error has nothing to do with syntax; the syntax was already validated by the compiler. The problem is that a piece of compiled code expects something that does not exist in any of the compiled inputs.

**Libraries** are collections of pre-compiled object code packaged together. The C++ Standard Library — which provides `std::cout`, `std::string`, containers, and algorithms — is a library. You do not compile it yourself; when you include `<iostream>` or `<vector>`, you get the declarations, and the linker provides the compiled implementations automatically. For other libraries you add to a project, you typically need to tell both the compiler (where the headers are) and the linker (where the compiled library file is).

There are two packaging styles for libraries:

- Static libraries (`.lib` on Windows, `.a` on Linux/macOS) are copied into your executable at link time. The result is completely self-contained and requires nothing extra to run on another machine.
- Dynamic libraries (`.dll` on Windows, `.so` on Linux/macOS) stay as separate files. The executable contains references to the library, and the operating system loads the library at runtime. This keeps executables smaller and allows multiple programs to share one copy of the library in memory, but the library file must be present on any machine that runs the program.

## Common mistakes

A very common mistake is blaming the compiler for linker errors. Compile errors say things like "expected ';' before '}'." Linker errors say things like "undefined reference to `add(int, int)`." The distinction matters: compile errors mean your code violates C++ syntax or type rules; linker errors mean a definition is missing, misspelled, or not included in the build. Fixing a linker error usually means adding a `.cpp` file to your project, or telling the linker where a library is — not fixing syntax.

Another misunderstanding is thinking the compiler runs your code. It does not. The compiler reads your source and produces machine code in an object file, but that machine code does not execute during compilation. "Compile time" and "runtime" are two completely separate phases of a program's life. A value that is computed when your program runs — user input, a random number, a file's contents — is not available to the compiler. This distinction becomes crucial in later chapters when you encounter features that operate at compile time.

A third mistake is trying to `#include` a `.cpp` file as if it were a header. You include headers (`.h` or `.hpp` files), which contain declarations. You compile `.cpp` files separately into object files and let the linker connect them. Including a `.cpp` file directly causes the compiler to process its definitions twice — once from the include and once from the direct compilation — leading to "multiple definition" linker errors.

## When to use this

Every time you get a build error, the first question is: where in the toolchain did this originate? Knowing that compiler errors, linker errors, and runtime errors have different causes and different diagnostic strategies makes debugging faster. An "undefined reference" error is not a syntax problem; searching for a missing semicolon will not help.

This knowledge also matters when you add a third-party library to a project. Adding a library requires two steps: telling the compiler where the headers are (so declarations are visible), and telling the linker where the compiled library code is (so definitions are found). Missing either step produces a different class of error, and knowing the toolchain model tells you which step you missed.

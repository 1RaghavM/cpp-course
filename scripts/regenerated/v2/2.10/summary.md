## The idea

Before the C++ compiler ever sees your code, a separate program called the **preprocessor** runs first and transforms the source text. The preprocessor knows nothing about C++ — it is purely a text processor. It looks for lines that begin with `#` (called **preprocessor directives**) and acts on them: it can paste the contents of another file in place of a `#include`, replace every occurrence of a named token via a `#define`, or conditionally include or exclude blocks of code with `#ifdef` and `#ifndef`.

Think of the preprocessor as a macro recorder running over a plain text document before the editor ever opens it. It can search and replace words (`#define`), copy-paste sections from other documents (`#include`), and skip sections based on whether a keyword has been defined (`#ifdef`). The result of all these transformations is handed to the actual C++ compiler, which never sees the original `#` directives.

Understanding the preprocessor matters because every file you write starts with `#include <iostream>`. That line is a preprocessor directive, not a C++ statement. Knowing what it does — and what can go wrong when `#define` macros expand unexpectedly — makes you a safer C++ programmer.

## How it works

**`#include` — pasting file contents**

`#include <iostream>` tells the preprocessor: find the standard header named `iostream` and paste its entire contents at this point in the file. The compiler then sees all the declarations from `iostream` as if you had typed them yourself.

There are two forms:
- `#include <name>` — searches the compiler's standard include directories (for system and library headers)
- `#include "name"` — searches the current file's directory first, then the standard directories (for your own headers)

The distinction matters when you start writing your own header files (covered in the next lesson).

**`#define` — object-like macros**

A `#define` tells the preprocessor to replace every subsequent occurrence of a token with a replacement text:

```cpp
#include <iostream>

#define MAX_STUDENTS 30

int main()
{
    std::cout << "Class size: " << MAX_STUDENTS << "\n";
    return 0;
}
```

Before the compiler sees this file, the preprocessor replaces `MAX_STUDENTS` with the literal text `30`. The compiler sees `std::cout << "Class size: " << 30 << "\n";`. The `#define` itself disappears entirely — it is not a variable, not a type, just a text substitution.

By convention, object-like macros use ALL_CAPS names to signal to readers that substitution will happen.

**`#define` without a value — feature flags**

A macro can also be defined without a replacement value. This is used purely to mark that a symbol "exists":

```cpp
#define DEBUG_MODE
```

No text replacement happens here — `DEBUG_MODE` expands to nothing. Its only purpose is to let `#ifdef`/`#ifndef` directives check for its existence. This pattern is the foundation of **header guards**, which you will see in a later lesson.

**Conditional compilation with `#ifdef`**

`#ifdef NAME` includes the block of code that follows only if `NAME` has been defined via `#define`. `#endif` closes the block.

```cpp
#include <iostream>

#define VERBOSE

int main()
{
    std::cout << "Running\n";
#ifdef VERBOSE
    std::cout << "Verbose mode on\n";
#endif
    return 0;
}
```

If `VERBOSE` is defined (as it is here), the preprocessor keeps the second `cout` line. If you comment out or remove the `#define VERBOSE` line, the preprocessor strips out everything between `#ifdef VERBOSE` and `#endif`, and the program prints only `Running`.

## Common mistakes

**Mistake 1: Treating `#define` as a typed constant**

A `#define` performs pure text substitution with no type checking. If you write `#define SIZE 5 + 3` and then use `SIZE * 2`, the preprocessor produces `5 + 3 * 2`, which evaluates to `11` — not `16` as you might expect. There is no type, no parenthesisation, and no protection from operator-precedence surprises.

```cpp
#define WIDTH 3 + 2
// std::cout << WIDTH * 4; expands to std::cout << 3 + 2 * 4; → prints 11, not 20
```

This is why experienced programmers prefer `const int width = 3 + 2;` over `#define` for numeric constants (a topic covered in "Introduction to symbolic constants"). For now, understand that `#define` is a text tool, not a value tool.

**Mistake 2: Putting a semicolon at the end of `#define`**

Preprocessor directives do not end with a semicolon. If you write `#define MAX 100;` and then use `MAX` in an expression like `int arr[MAX]`, the preprocessor substitutes `100;`, making the declaration read `int arr[100;]` — a syntax error.

```cpp
#define COUNT 5;           // wrong — trailing semicolon
// int x = COUNT + 1;  →  int x = 5; + 1;  — syntax error
```

Leave the semicolons out of `#define` replacements.

**Mistake 3: Expecting `#include` to import only certain names**

`#include` pastes the entire header file verbatim. You cannot write `#include <iostream> only cout`. Every name in the header becomes visible. In large projects this contributes to longer compile times; in small programs it is invisible. The point to remember is that `#include` is a copy-paste — it has no selectivity.

## When to use this

Use `#include` for every header you need — it is unavoidable and correct. Use `#define` for feature flags (symbols without values) and for header guards (which you will see next). Avoid using `#define` to create named numeric or string constants, because it has no type safety; once you know about `const` (covered soon), you will use that instead. Use conditional compilation (`#ifdef`, `#ifndef`) sparingly — it makes code harder to read because the reader must mentally simulate two different preprocessing outcomes. The preprocessor is a powerful but blunt instrument; most of its use in modern C++ code is limited to `#include` and header guards.

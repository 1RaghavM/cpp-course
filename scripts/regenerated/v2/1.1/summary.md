## The idea

Every C++ program is a set of instructions you hand to the computer. Those instructions come in two forms: **statements** and the broader **structure** that organizes them. Think of a statement like a sentence in English — it expresses one complete action, and it ends with a period (in C++, a semicolon). The structure is the grammar that tells the computer where a group of related sentences begins and ends, and which group to run first when the program starts.

The key mental model is this: a C++ source file is text. The compiler reads that text and turns it into a machine program. The machine program then runs from a fixed, named entry point. That entry point is always `int main()`. Without it, the compiler does not know where execution should begin.

Statements are sequential by default. The computer runs them one after another, top to bottom, exactly in the order they appear inside the braces. There is no magic — if statement A appears before statement B, A runs first.

## How it works

Every program you write in this course will follow this skeleton:

```cpp
#include <iostream>

int main()
{
    // statements go here
    return 0;
}
```

Walk through it piece by piece:

- `#include <iostream>` — a **preprocessor directive** that pulls in the standard input/output library so you can print text to the terminal. It is not a statement (no semicolon) and runs before compilation.
- `int main()` — the **function definition** for the program's entry point. `int` means the function returns an integer when it is done. `main` is the required name. The parentheses `()` hold parameters — empty here.
- `{` and `}` — **braces** that open and close the body of `main`. Everything between them belongs to `main`.
- `return 0;` — a **return statement** that hands back the value 0 to the operating system, signaling that the program finished without errors. This is a statement, so it ends with a semicolon.

The simplest complete program that actually does something visible:

```cpp
#include <iostream>

int main()
{
    std::cout << "Hello, world!\n";
    return 0;
}
```

`std::cout` is the standard output stream. The `<<` operator sends text to it. The `\n` at the end of the string moves the cursor to a new line. This is a single **expression statement**: an expression followed by a semicolon.

You can stack multiple statements, and they run in order:

```cpp
#include <iostream>

int main()
{
    std::cout << "Line one\n";
    std::cout << "Line two\n";
    std::cout << "Line three\n";
    return 0;
}
```

Output:
```
Line one
Line two
Line three
```

The program executes the first `std::cout` line, then the second, then the third, then `return 0`. Order matters completely.

## Common mistakes

**Forgetting the semicolon at the end of a statement.** Each statement must end with `;`. Leaving it off causes a compiler error on the *next* line — which confuses beginners who look at the wrong place.

```cpp
// Wrong — missing semicolons
std::cout << "Hello"
std::cout << " world\n"
```

The compiler reports something like `error: expected ';' before 'std'` on the *second* line, not the first. The fix is to put a semicolon at the end of every statement.

**Confusing the preprocessor directive with a statement.** `#include <iostream>` does not end with a semicolon and must appear at the top of the file, outside of any function. Putting it inside `main()` or adding a semicolon after it are both mistakes:

```cpp
// Wrong
int main()
{
    #include <iostream>;   // wrong on both counts
    return 0;
}
```

Always write `#include` lines at the top, before `int main()`, with no trailing semicolon.

**Misspelling `main` or giving it the wrong return type.** The entry point must be spelled exactly `main` (lowercase) and declared as returning `int`. A function named `Main` or `mane` will compile but will not be treated as the entry point — the linker will complain about a missing `main`.

```cpp
// Wrong — capital M
int Main()
{
    return 0;
}
// Linker error: undefined reference to 'main'
```

## When to use this

Every single C++ program you write uses this structure — there is no alternative. `int main()` is the one required piece; statements inside it are how you express what the program does. As your programs grow, you will break logic into additional functions (covered later), but every chain of execution still starts at `main`. If you ever see a compile or linker error involving `main`, check the spelling and return type first.

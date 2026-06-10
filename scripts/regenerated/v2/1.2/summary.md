## The idea

When you write code, you are communicating with two audiences simultaneously: the compiler and the human who reads the source file later (which is often you, six months from now). Comments exist for the human audience. The compiler ignores them completely — they are stripped away before the code is turned into a running program.

Think of a comment as a sticky note attached to your code. A sticky note on a filing cabinet does not change what is inside the cabinet — it just helps the next person understand what they are looking at. Comments work the same way: they appear in the source file, explain your intent, and vanish before the program runs.

Good comments answer *why*, not *what*. The code already shows what is happening; a comment that merely restates it word for word adds no value and ages badly (when the code changes, a redundant comment becomes wrong). A comment that explains the reasoning behind a decision, or that warns of a non-obvious trap, earns its place in the file.

Comments have a second practical use during development: temporarily disabling a statement. Instead of deleting a line you might need again, you prefix it with `//` and it becomes invisible to the compiler. You can bring it back at any time by removing the `//`. This is called "commenting out" code.

## How it works

C++ provides two comment styles.

**Single-line comments** begin with `//` and run to the end of that line. Everything after `//` on that line is ignored by the compiler.

```cpp
#include <iostream>

int main()
{
    // This prints a greeting to the terminal
    std::cout << "Hello!\n";
    return 0; // 0 means success
}
```

The first comment is on its own line (an *above* comment). The second appears after a statement on the same line (a *trailing* comment). Both styles are common in real code. Use whichever makes the surrounding code easier to read.

**Multi-line comments** begin with `/*` and end with `*/`. Everything between those delimiters is ignored, even if it spans many lines.

```cpp
#include <iostream>

int main()
{
    /*
        This block intentionally prints nothing.
        It is a placeholder while we decide on
        the final output format.
    */
    return 0;
}
```

Multi-line comments are useful for writing a longer explanation that would feel cramped on a single line, or for temporarily disabling a whole block of statements at once.

Commenting out a single statement with `//` looks like this:

```cpp
#include <iostream>

int main()
{
    std::cout << "Line A\n";
    // std::cout << "Line B\n";  // disabled for now
    std::cout << "Line C\n";
    return 0;
}
```

Output:
```
Line A
Line C
```

Line B is never executed. The compiler sees it as a comment and skips it entirely.

## Common mistakes

**Nesting multi-line comments.** The `/* */` style does not nest. If you wrap a block that already contains a `/* ... */` comment inside another `/* ... */`, the inner `*/` ends the *outer* comment earlier than you intended. Everything after that point is treated as code, which typically causes a compile error.

```cpp
/*
    /* This inner comment ends the outer one early */
    std::cout << "The compiler sees this as code now!\n";
*/
// The stray */ above causes a compile error.
```

When you need to comment out code that might already contain `/* ... */` comments, use `//` on each line instead. Most editors let you select multiple lines and toggle `//` comments with a keyboard shortcut.

**Commenting the obvious.** A comment that merely re-states what the code already says is noise. It wastes the reader's attention and becomes a maintenance liability — when the code changes, the stale comment now tells a lie.

```cpp
// BAD: adds no information
std::cout << "Hello\n"; // prints Hello followed by a newline
```

A more useful comment explains context or intent that the code cannot express on its own:

```cpp
// GOOD: explains why, not just what
std::cout << "Hello\n"; // placeholder until we read the user's name from stdin
```

**Forgetting to close a `/* */` comment.** If you open a `/*` but never write the matching `*/`, the compiler treats everything that follows — potentially the rest of the file — as part of the comment. The resulting error messages can look very confusing because the code the compiler complains about is not the code you were editing. Single-line `//` comments are immune to this problem because they always end at the line boundary.

## When to use this

Comments are not needed on every line, but they earn their place whenever the intent behind a piece of code is not obvious from reading it. Good candidates include: explaining a non-obvious arithmetic choice, noting that an empty block is intentional, or flagging a known temporary workaround. During development, `//` is the fastest way to disable a statement without deleting it, letting you restore it quickly if needed. Avoid comments that just repeat what the code says — keep them focused on the *why* and the *what-might-surprise-you*. As your programs grow into multiple functions and files, good commenting habits will become increasingly valuable.

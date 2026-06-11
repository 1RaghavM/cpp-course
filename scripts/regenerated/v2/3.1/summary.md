## The idea

When you write C++ code and something goes wrong, the problem falls into one of two fundamentally different categories. The first category — syntax errors — is the compiler catching you breaking the language's grammatical rules. The second category — semantic errors — is when your code is grammatically perfect but says the wrong thing. These are different in the same way that "He go store yesterday" (broken grammar) differs from "She bought milk" when she actually bought juice (correct grammar, wrong meaning).

Understanding which kind of error you have completely changes how you find and fix it. Syntax errors are caught before your program ever runs; the compiler points at the problem with a message and refuses to produce an executable. Semantic errors slip past the compiler and only reveal themselves at runtime, producing wrong output, unexpected behavior, or a crash — the compiler had no idea you meant something different from what you wrote.

## How it works

**Syntax errors** occur when you violate the rules that define valid C++ text. Missing semicolons, mismatched braces, misspelled keywords, and calling a function that doesn't exist are all syntax errors. The compiler detects these during compilation and prints an error message with a file and line number.

```cpp
#include <iostream>

int main()
{
    std::cout << "Hello"   // missing semicolon
    return 0;
}
```

Compiling this gives something like: `error: expected ';' before 'return'`. The program never runs. You fix the syntax, recompile, and proceed.

One thing to watch out for: the line number in a syntax error message is sometimes one line *after* the actual mistake. A missing semicolon on line 5 is often reported on line 6, because the compiler only realizes something is wrong when it reads line 6 and finds an unexpected token. Always look at the reported line and the line just before it.

**Semantic errors** are trickier because the compiler cannot detect them. Your program compiles and runs, but produces the wrong result. A classic example:

```cpp
#include <iostream>

int add(int x, int y)
{
    return x - y;   // bug: should be +, not -
}

int main()
{
    std::cout << add(3, 4) << "\n";   // prints -1, not 7
    return 0;
}
```

The compiler sees valid C++ throughout. The function subtracts instead of adds, but subtraction is legal C++. Only when you run the program and see `-1` instead of `7` do you know something is wrong.

Here is a slightly subtler semantic error — integer arithmetic doing the wrong thing:

```cpp
#include <iostream>

int main()
{
    int total = 7;
    int count = 2;
    std::cout << total / count << "\n";   // prints 3, not 3.5
    return 0;
}
```

Both `total` and `count` are `int`, so `/` performs integer division and truncates the result to `3`. The compiler sees valid code. You expected `3.5` but got `3`. That is a semantic error — the code does not express what you intended.

## Common mistakes

**Mistaking a semantic error for a syntax error.** When a program produces wrong output, beginners often stare at the code looking for a typo or missing character — something the compiler "should have caught." But semantic errors compile cleanly. The cure is to run the program with a known input and verify the output step by step, rather than rereading the source hoping to spot bad syntax.

**Trusting the error count.** Some compilers report dozens of errors from a single missing brace or semicolon. The real mistake is often the first error on the list; subsequent errors are cascading confusion. Fix the first reported error, recompile, and reassess. Trying to fix ten errors at once when they all stem from one root cause wastes time and can introduce new mistakes.

**Assuming the bug is near the symptom.** A semantic error can produce wrong output at the end of the program while the actual bug lives at the beginning. The subtraction-instead-of-addition example above produces its wrong output immediately, but in a longer program, a wrong value computed in one function might be passed through several others before its effect is visible. Never assume the bug is on the line where the wrong value appears — trace backward from the symptom to the source.

## When to use this

This distinction shapes your entire debugging workflow. When the compiler refuses to build your program, you have a syntax error: read the error message, find the line, fix the grammar. When the program builds but misbehaves, you have a semantic error: the compiler cannot help you, so you must reason about what the code actually does versus what you intended.

For early programs like those in chapters 1 and 2, nearly all of your errors will be syntax errors — you are still learning the grammar of C++. As your programs grow, semantic errors become more common and more subtle, which is why the rest of this chapter is devoted to strategies and tools for tracking them down.

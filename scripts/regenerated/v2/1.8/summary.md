## The idea

C++ gives you almost total freedom over the whitespace and layout of your source code. The compiler ignores extra spaces, blank lines, and indentation — it cares only about the tokens (keywords, identifiers, operators, literals) and the rules that connect them. You could write an entire program on one line and the compiler would accept it.

But programs are not written for the compiler alone. They are written to be read by humans — including you, six months from now, when you have forgotten why you wrote something. Consistent formatting is the difference between code that communicates clearly and code that is exhausting to read. Every professional C++ codebase follows a formatting style, and this course adopts a simple, industry-standard one that you should internalize from the start.

## How it works

**What whitespace the compiler ignores**

Whitespace tokens — spaces, tabs, newlines — are treated as delimiters between other tokens. One space and ten spaces are identical to the compiler. The only place whitespace *inside* a token matters is inside a string literal.

```cpp
#include<iostream>
int main(){int x=5;std::cout<<x<<'\n';return 0;}
```

This compiles and runs correctly. But compare it to the formatted version:

```cpp
#include <iostream>

int main()
{
    int x = 5;
    std::cout << x << '\n';
    return 0;
}
```

The compiler sees the same program either way. Every human who reads your code sees the second version and immediately understands its structure.

**The basic rules this course follows**

Indentation: use four spaces (or one tab, if your editor converts tabs to four spaces) per level of nesting. The body of `main` is one level deep.

Opening brace placement: the opening brace of a function body goes on its own line, directly under the function header. This is the Allman style, which is common in the C++ world:

```cpp
int main()
{
    // body here, indented four spaces
    return 0;
}
```

One statement per line: each statement ends with `;` and occupies its own line. Never squeeze two statements onto the same line.

```cpp
int main()
{
    int a = 3;   // good: one statement per line
    int b = 4;
    std::cout << a + b << '\n';
    return 0;
}
```

Spaces around operators: place a single space on each side of `=`, `+`, `-`, `*`, `/`, `<<`, and `>>`. Do not add a space between a function name and its parentheses.

```cpp
int x = 5 + 3;            // good
std::cout << x << '\n';   // good
```

**Blank lines for visual structure**

Use blank lines to group logically related code. A blank line between the variable declarations and the input/output block makes the program easier to scan:

```cpp
#include <iostream>

int main()
{
    int width = 0;
    int height = 0;

    std::cin >> width >> height;

    std::cout << "Area: " << width * height << '\n';

    return 0;
}
```

One or two blank lines is enough. More than that adds visual noise without adding clarity.

## Common mistakes

**Mistake 1 — Inconsistent indentation**

Mixing tabs and spaces, or using two spaces in one function and four in another, makes code look broken even if it compiles perfectly.

```cpp
int main()
{
  int x = 5;        // 2 spaces
      int y = 10;   // 6 spaces — clearly wrong
    return 0;       // 4 spaces — inconsistent
}
```

This compiles fine but signals carelessness. Pick one indentation size and use it everywhere.

**Mistake 2 — Forgetting spaces around operators**

Omitting spaces does not cause errors, but it makes expressions hard to read at a glance.

```cpp
int z=x+y*2-1;       // compiles, hard to parse
int z = x + y * 2 - 1;  // same expression, easy to parse
```

The second form takes only a moment longer to type and saves time on every future read.

**Mistake 3 — Trailing whitespace and invisible characters**

Leaving spaces at the end of lines or mixing Windows-style line endings (`\r\n`) with Unix-style (`\n`) in the same file can cause unexpected diffs in version control and, occasionally, subtle tool issues. Most editors have a setting to strip trailing whitespace on save. Enable it early.

## When to use this

Formatting is not a one-time choice — it applies to every line of every file you write. The rules in this lesson are non-negotiable habits: one statement per line, consistent indentation, spaces around operators, braces on their own lines. The compiler does not enforce them, but code reviews and team norms do, and the cost of retrofitting poor formatting onto a large codebase is enormous.

As you progress through this course, every code example follows these conventions. If you write new code that looks different, ask yourself whether the difference is intentional or just noise.

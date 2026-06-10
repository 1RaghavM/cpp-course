## The idea

Every name you invent in a C++ program — for a variable, a function, a type, anything — is called an *identifier*. Not every character combination is a valid identifier, and some are permanently off-limits because the language itself has claimed them. These reserved words are called *keywords*.

Think of keywords as the grammar of C++. Words like `int`, `return`, and `main` already carry specific meaning to the compiler. If you tried to name a variable `int`, the compiler would be confused: is this a type declaration or a variable name? Because keywords are reserved, the confusion never arises — you simply cannot use them as identifiers.

Beyond keywords, C++ has its own style conventions for naming identifiers. These conventions exist so that a codebase written by multiple people (or the same person six months apart) remains readable. Following them makes your code look professional and avoids subtle bugs caused by confusing, ambiguous names.

## How it works

**What makes a valid identifier**

An identifier must start with a letter (`a`–`z`, `A`–`Z`) or an underscore (`_`), and every subsequent character must be a letter, digit (`0`–`9`), or underscore. Spaces, hyphens, and punctuation are not allowed.

```cpp
// Valid identifiers:
int userAge;
int total_score;
int _tempValue;
int x2;

// Invalid identifiers (compiler errors):
// int 2x;         ← starts with a digit
// int user-age;   ← hyphens are not allowed
// int my value;   ← spaces are not allowed
```

**Keywords you already know and why they cannot be reused**

The words in the following list are keywords you have already encountered in this course: `int`, `return`. Both are reserved by the language and cannot be used as variable names. If you try, the compiler immediately reports a syntax error.

```cpp
// WRONG — 'return' is a keyword
int return = 5;    // error: expected unqualified-id before 'return'

// CORRECT — choose a different name
int result = 5;
```

**Naming conventions**

Two dominant conventions exist in C++ codebases, and this course follows the first:

- *camelCase*: the first word is lowercase, each subsequent word starts with an uppercase letter — `userName`, `totalScore`, `itemCount`.
- *snake_case*: all lowercase, words separated by underscores — `user_name`, `total_score`, `item_count`.

Both are fine; mixing them in the same file is not. The most important rule is consistency.

A few additional naming rules that experienced C++ programmers follow:

- Names starting with a double underscore (`__`) or an underscore followed by an uppercase letter (`_X`) are reserved for the implementation (compiler and standard library). Never create such names.
- Single-letter names (`a`, `x`, `i`) are acceptable only for very short-lived variables whose meaning is obvious from context.
- Choose names that describe purpose, not type: `userAge` is better than `intAge` or `n`.

```cpp
#include <iostream>

int main()
{
    int playerScore = 0;
    int roundNumber = 1;

    std::cin >> playerScore;
    std::cout << "Round " << roundNumber << " score: " << playerScore << '\n';
    return 0;
}
```

The names `playerScore` and `roundNumber` immediately communicate what the variables hold without any comment.

## Common mistakes

**Mistake 1 — Using a keyword as a variable name**

This is a pure compile error, so it is easy to catch. The compiler reports something like "expected identifier" or "expected unqualified-id". The fix is always to rename the variable.

```cpp
// WRONG
int int = 42;    // error: 'int' is a keyword

// FIXED
int value = 42;
```

**Mistake 2 — Identifier case mismatch (C++ is case-sensitive)**

C++ treats `Score`, `score`, and `SCORE` as three entirely distinct names. A common mistake is declaring a variable with one capitalization and using it with another.

```cpp
#include <iostream>

int main()
{
    int Score = 100;
    std::cout << score << '\n';    // error: 'score' was not declared in this scope
    return 0;
}
```

The identifier `score` (lowercase `s`) was never declared; only `Score` (uppercase `S`) was. The compiler reports a "not declared in this scope" error. Fix: be consistent with capitalization everywhere.

**Mistake 3 — Names that are technically valid but deeply misleading**

C++ will compile a program with perfectly legal but confusing names. This is a logic / style bug, not a compile error.

```cpp
int main()
{
    int height = 42;     // variable is named 'height'
    int width  = height; // reading from 'height' for the width — confusing!
    return 0;
}
```

Neither statement is wrong syntactically, but a reviewer would wonder why `width` is initialized from `height`. Choosing clear, accurate names prevents this class of confusion entirely.

## When to use this

Naming identifiers well is something you do every single time you write code. There is no feature to "reach for" — the rule is simply: pick a name that describes exactly what the variable holds, respect the case-sensitivity of the language, and never reach for a keyword. As programs grow larger (more variables, more functions), good names pay off enormously: they make the code self-documenting and reduce the chance of mixing up two variables with similar but different meanings.

The naming conventions learned here carry forward through the entire course. Every variable, every function, and every type you declare from now on should follow these rules.

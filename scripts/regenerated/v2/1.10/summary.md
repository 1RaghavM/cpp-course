## The idea

An expression is any combination of literals, variables, and operators that the compiler can evaluate to produce a single value. Every time you write `3 + 4`, `x * 2`, or even just `42` standing alone, you are writing an expression. The value that an expression produces is called its *result* or *value*. Statements, by contrast, are the complete instructions that the program executes — many statements are built around one or more expressions.

Think of an expression like a question your program asks mid-execution: "what is `x + 5`?" The compiler evaluates the question and hands back an integer answer. Statements are the full sentences; expressions are the sub-clauses inside them.

This distinction matters because it shapes how you read C++ code. Once you recognize that `std::cout << x + 5` involves evaluating the expression `x + 5` first, and then passing its result to `std::cout`, the flow of execution becomes easier to trace.

## How it works

**The simplest expressions**

A single literal or a single variable is already a complete expression:

```cpp
#include <iostream>

int main()
{
    int width = 8;

    std::cout << 42 << '\n';     // literal 42 is an expression
    std::cout << width << '\n';  // variable width is an expression
    return 0;
}
```

Evaluation of `42` just produces `42`. Evaluation of `width` looks up the stored value and produces `8`.

**Compound expressions and sub-expressions**

Expressions can be nested. The inner parts are evaluated first, and their results feed into the outer expression:

```cpp
#include <iostream>

int main()
{
    int length = 6;
    int width = 4;

    // (length * width) is a sub-expression; its result feeds into std::cout
    std::cout << "Area: " << length * width << '\n';

    // The whole right-hand side is also an expression
    int perimeter = 2 * length + 2 * width;
    std::cout << "Perimeter: " << perimeter << '\n';
    return 0;
}
```

`length * width` is evaluated to `24`. Then `"Area: " << 24` is printed. In `2 * length + 2 * width`, both multiplications happen before the addition (because `*` has higher precedence than `+`), producing `12 + 8 = 20`.

**Expression statements**

An expression followed by a semicolon becomes an *expression statement*. The most common form is assignment:

```cpp
#include <iostream>

int main()
{
    int score = 0;
    score = 42;         // expression statement: evaluate 42, assign to score
    score = score + 1;  // expression statement: evaluate score+1, assign back
    std::cout << score << '\n';  // prints 43
    return 0;
}
```

The entire `score = 42` is an expression (the assignment operator produces the assigned value), and the semicolon turns it into a statement.

## Common mistakes

**Mistake 1 — expecting `=` to produce equality, not an assignment**

```cpp
int x = 5;
x = x + 10;  // x is now 15 — NOT "x equals x plus 10 forever"
```

When you write `x = x + 10`, C++ evaluates the right side (`x + 10`, which is `15`), then overwrites `x` with that value. The old value of `x` on the right side is read before the assignment happens on the left. Beginners sometimes think the line creates a permanent relationship ("x is always x + 10"); in C++, it is a one-time store.

**Mistake 2 — discarding a result without realizing it**

```cpp
int a = 10;
int b = 3;
a + b;   // evaluates to 13, but the result is immediately discarded
```

The expression `a + b` is valid, but writing it as a standalone statement computes `13` and throws it away. The compiler may warn about this. If you want to save the result, you need `int sum = a + b;`.

**Mistake 3 — misreading operator precedence in compound expressions**

```cpp
int result = 2 + 3 * 4;  // result is 14, not 20
```

`*` has higher precedence than `+`, so `3 * 4` is evaluated first (giving `12`), and then `2 + 12 = 14`. Beginners who read left-to-right without accounting for precedence expect `5 * 4 = 20`. When in doubt, add parentheses: `(2 + 3) * 4` explicitly gives `20`, and `2 + (3 * 4)` explicitly gives `14`.

## When to use this

Expressions are unavoidable — you write them in every program. The key takeaway for this lesson is recognizing the difference between an expression (a piece of code that produces a value) and a statement (a complete instruction that the program executes). When tracing through a program, first identify the inner expressions and evaluate them in precedence order, then see how the results feed into outer expressions or get stored in variables. This mental model becomes load-bearing the moment you write more complex calculations, and it is the basis for understanding every operator and statement you will encounter in future lessons.

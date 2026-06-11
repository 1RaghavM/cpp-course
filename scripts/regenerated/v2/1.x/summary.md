## The idea

Chapter 1 introduced the essential skeleton of every C++ program and the basic ingredients for computing with integers. The unifying theme is: C++ is a statically typed, compiled language where you write source code, a compiler translates it into machine instructions, and then you run the result. Nothing happens at runtime that was not expressed explicitly in the source. Understanding how programs are structured, how variables hold and change values, and how expressions are evaluated gives you a foundation for everything that follows.

This chapter is not about memorizing syntax. It is about building the right mental models: a statement is an instruction; an expression is a value-producing sub-unit inside statements; a variable is a named storage location with a fixed type; and operators are the vocabulary for combining values.

## How it works

**Statements and program structure (1.1, 1.8)**

A C++ program is a sequence of statements inside `int main()`. Statements execute one after another, top to bottom. Every statement ends with a semicolon. The overall shape is always:

```cpp
#include <iostream>

int main()
{
    // statements go here
    return 0;
}
```

Whitespace and indentation do not affect execution, but consistent formatting makes code readable. Use one statement per line and indent the body of `main`.

**Variables and initialization (1.3, 1.4)**

A variable is a named location in memory that holds a typed value. In chapter 1, the only type used is `int`. A variable must be declared before it is used, and should always be initialized to avoid undefined behavior:

```cpp
int apples = 5;      // copy initialization
int oranges{ 3 };    // list initialization
int total = apples + oranges;  // initialized from an expression
```

Assignment (`=`) stores a new value into an existing variable. The right side is evaluated first using the current values, then the result overwrites the left side.

**Input and output (1.5)**

`std::cout` with `<<` sends values to standard output. `std::cin` with `>>` reads from standard input. Multiple values can be chained:

```cpp
int x = 0;
int y = 0;
std::cin >> x >> y;
std::cout << "Sum: " << x + y << '\n';
```

Prefer `'\n'` over `std::endl` — both end the line, but `std::endl` also flushes the buffer, which is slower and unnecessary in most programs.

**Literals and operators (1.9, 1.10)**

A literal is a fixed value in source code (`42`, `-7`). Operators combine values into expressions. Arithmetic operators `+`, `-`, `*`, `/`, `%` all produce integer results when applied to integer operands. The most important rule: integer division truncates toward zero, so `7 / 2` is `3`, not `3.5`. The `%` operator gives the remainder.

Expressions follow operator precedence: `*`, `/`, and `%` bind more tightly than `+` and `-`. Use parentheses when the default order is not what you want.

## Common mistakes

**Forgetting that integer division truncates**

```cpp
int half = 7 / 2;  // 3, not 3.5
```

There is no rounding. The fractional part is simply dropped. This trips up almost every programmer the first time they compute an average or split a value.

**Using an uninitialized variable**

```cpp
int total;
std::cout << total << '\n';  // undefined behavior — garbage value
```

A local variable that is declared but never assigned holds whatever happened to be in memory. The program compiles; the output is unpredictable. Always initialize: `int total = 0;`.

**Confusing assignment with equality**

`=` stores a value into a variable. It is not a mathematical equality claim. `x = x + 1` reads the current value of `x`, adds 1, and writes the result back — a perfectly valid statement that increments `x` by 1.

## When to use this

Every chapter 1 concept appears in literally every C++ program you will ever write. `int main()`, `#include <iostream>`, `std::cout`, and `std::cin` are the skeleton. Variable declarations and arithmetic expressions are the flesh. The plan-then-code approach from lesson 1.11 — define input and output, list the steps, write one step at a time — scales to programs of any size. When you move into chapter 2 (functions) and beyond, the only thing that changes is the size of the vocabulary; the underlying structure stays exactly the same.

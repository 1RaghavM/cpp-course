## The idea

Programs are interesting because they can remember values and work with them. The mechanism that makes this possible is the **variable**. A variable is a named storage location in memory. You give it a name, tell the compiler what kind of data it will hold, and from then on you can store a value in it or read back whatever was last stored.

The more precise term for a variable in C++ is an **object** — a region of memory that has a type. Not everything in memory is an object (raw bytes, for instance, have no type attached), but every variable you declare is an object. These terms are used interchangeably in early chapters; the distinction matters more later.

Think of a variable like a labeled box. The label (the name you choose) does not change. The box has a fixed shape that determines what can fit inside (the type). What is actually inside the box can be swapped out whenever you want — that is assignment, covered in the next lesson. Right now, the key idea is simply: to hold data, you first have to declare a box.

## How it works

Declaring a variable requires two things: a **type** and a **name**. In this chapter, the only type you need is `int`, which holds a whole number (an integer). The syntax is:

```cpp
int age;
```

This tells the compiler: "reserve enough memory to hold one integer, and let me refer to that memory by the name `age`." The semicolon ends the declaration statement.

Variable names follow rules: they may contain letters, digits, and underscores, they must start with a letter or underscore (not a digit), and they may not be a C++ keyword (words like `int`, `return`, `main`). By convention, variable names for ordinary values use lowercase letters, with underscores between words (`player_score`, not `PlayerScore` or `playerscore`).

You can declare multiple variables of the same type on separate lines, or on one line separated by commas. Separate lines are usually clearer:

```cpp
#include <iostream>

int main()
{
    int width;
    int height;
    int depth;

    width = 10;
    height = 5;
    depth = 3;

    std::cout << width << "\n";
    std::cout << height << "\n";
    std::cout << depth << "\n";
    return 0;
}
```

Output:
```
10
5
3
```

Here, `width`, `height`, and `depth` are three separate objects in memory. Each is an `int`. After declaring them, we assign values with `=` and then print them with `std::cout`.

You can also declare and assign in a single step — called **initialization** — which is covered thoroughly in the next lesson. For now, just note that the above two-step pattern (declare, then assign) is valid C++.

A single `std::cout` statement can print multiple values by chaining `<<` operators:

```cpp
#include <iostream>

int main()
{
    int score;
    score = 42;
    std::cout << "Score: " << score << "\n";
    return 0;
}
```

Output:
```
Score: 42
```

The compiler replaces `score` with whatever value is stored in that memory location at the time the statement executes.

## Common mistakes

**Declaring a variable but never assigning it before reading it.** In C++, a declared variable with no initializer holds *garbage* — whatever random bits happen to be at that memory address. Reading it produces undefined behavior: the program might print a bizarre number, crash, or behave inconsistently across different compilers or runs.

```cpp
#include <iostream>

int main()
{
    int value;
    std::cout << value << "\n"; // BUG: value was never assigned
    return 0;
}
```

Always assign a value to a variable before reading it. If you have no meaningful value yet, initialize it to zero: `int value = 0;` (initialization syntax is covered next).

**Using a variable before declaring it.** Variables must be declared before they are used. The compiler reads code top to bottom; if you reference a name that has not been declared yet, it will report an "undeclared identifier" error.

```cpp
#include <iostream>

int main()
{
    std::cout << count << "\n"; // error: 'count' was not declared
    int count;
    count = 5;
    return 0;
}
```

Move the declaration of `count` to before its first use.

**Choosing names that are C++ keywords.** Words like `int`, `return`, `main`, `for`, `while` are reserved by the language. You cannot use them as variable names. The compiler will give you a syntax error immediately.

```cpp
int int;   // error: 'int' is a keyword
int return; // error: 'return' is a keyword
```

Choose descriptive names that are not reserved words. If you are unsure, your editor's syntax highlighting will typically color keywords differently.

## When to use this

You declare a variable whenever a program needs to remember a value between statements — a count, a measurement, an intermediate calculation. Without variables, each statement would be isolated: you could print a literal, but you could not build up a result over several steps. As your programs grow, you will also learn to declare variables closer to their first use (rather than at the top of a function) to keep the code readable. For now, declaring `int` variables at the start of `main` is a good habit.

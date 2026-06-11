## The idea

Writing a program for the first time is not just about knowing the right keywords — it is about having a process. A program begins as a problem description in plain English, then becomes a step-by-step plan, and only then becomes C++ code. This lesson is about that three-stage loop: understand the problem, break it into steps, and write those steps in code.

The key mental shift is resisting the urge to open a text editor and start typing syntax before you have answered two questions: what does the program need as input, and what should it produce as output? Once you can state both clearly, the code almost writes itself.

## How it works

**Step 1: Define the problem in plain English**

Before touching a keyboard, write a one-sentence description of what the program does. For example: "Read two integers, compute their sum, and print it." This sentence is more important than any line of code you write. Everything else follows from it.

**Step 2: Break the problem into sub-steps**

A solution to "read two integers and print their sum" decomposes naturally:
1. Declare two variables to hold the inputs.
2. Read the first integer from the user.
3. Read the second integer from the user.
4. Compute the sum.
5. Print the sum.

This ordered list is your algorithm. Write it on paper or as code comments before writing any C++.

**Step 3: Write the code, one step at a time**

Translate each numbered step directly into C++. Start with the skeleton (`#include <iostream>`, `int main()`, `return 0;`) and fill in the body:

```cpp
#include <iostream>

int main()
{
    // Step 1: declare variables
    int first = 0;
    int second = 0;

    // Step 2-3: read inputs
    std::cin >> first;
    std::cin >> second;

    // Step 4: compute
    int sum = first + second;

    // Step 5: print
    std::cout << sum << '\n';

    return 0;
}
```

Each comment matches a step from the plain-English plan. When you write this way, the code is self-documenting and easy to debug because the structure is visible.

**Extending the program**

Suppose the requirement expands: also print the product. You do not need to rewrite the program. Identify where to add the new step (after step 4, before `return 0;`), add the variable, and add the output line:

```cpp
#include <iostream>

int main()
{
    int first = 0;
    int second = 0;
    std::cin >> first;
    std::cin >> second;

    int sum = first + second;
    int product = first * second;

    std::cout << "Sum: " << sum << '\n';
    std::cout << "Product: " << product << '\n';

    return 0;
}
```

Adding labels to the output ("Sum: " and "Product: ") makes the output readable when multiple values are printed. This is a small detail with real impact on anyone using the program.

## Common mistakes

**Mistake 1 — writing code before understanding the problem**

Many beginners type `int main()` immediately, then figure out the logic while they code. This leads to programs where variables are added in the middle, output lines are scattered, and the code does not match the original requirement. Spending 60 seconds writing a plain-English sentence about what the program should do saves 10 minutes of confused debugging.

**Mistake 2 — forgetting to initialize variables used before assignment**

```cpp
int total;
std::cout << total << '\n';  // undefined behavior — total has garbage value
```

If `total` is declared but never assigned a value before it is used, the program reads whatever happened to be in memory at that address — a garbage value. The program compiles, but the output is unpredictable. Always initialize variables: `int total = 0;`.

**Mistake 3 — printing the expression instead of the variable**

```cpp
int a = 3;
int b = 4;
int sum = a + b;
std::cout << "a + b" << '\n';  // prints the string "a + b", not 7
```

When you put `a + b` inside double quotes, it becomes a string literal and is printed as-is. Remove the quotes to print the computed value: `std::cout << a + b << '\n';` or `std::cout << sum << '\n';`.

## When to use this

Every single program you write benefits from the plan-then-code approach: define input and output, list the steps, write one step at a time. For small programs it takes under a minute; for larger programs it prevents hours of structural rework. As you add more C++ features in future lessons — decisions, loops, functions — the approach stays the same: understand the requirement first, plan the steps, then write code. The concrete skills from this lesson (declaring variables, reading stdin, doing arithmetic, printing results with labels) form the template that the rest of the course builds on.

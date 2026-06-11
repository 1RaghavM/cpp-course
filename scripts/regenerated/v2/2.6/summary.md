## The idea

Imagine writing a cooking recipe where every time you need to "chop an onion" you write out all seven steps in full — peel, cut in half, slice, dice — at every point in the recipe where an onion is needed. That would be exhausting to write, hard to read, and a nightmare to fix when you realise your dicing technique was off. Functions solve the same problem in code: you name a procedure once, and call it wherever you need it. You do not repeat yourself, and when the procedure needs to change, you change one place.

That is the central insight behind why functions matter. Code without functions tends to grow in a straight line: the programmer writes everything in `main`, top to bottom, until `main` is hundreds of lines long and nobody — including the original author — can tell at a glance what any part does. Functions break that straight line into labelled chunks. Each chunk has a name that explains its purpose, a clear set of inputs (parameters), and a clear output (return value). The program becomes a table of contents instead of one endless chapter.

Beyond organisation, functions make code reusable. A function that computes the square of an integer can be called from anywhere in the program. Every caller benefits automatically when you improve the implementation. Without functions, you would need to copy the same arithmetic to every site, and updating it would mean hunting down every copy.

## How it works

**Decomposing a task into functions**

Suppose you want to print a short report: a header line, two computed values, and a footer. Written entirely in `main`, the code becomes one tangled block. Decomposed into functions, the intent is obvious:

```cpp
#include <iostream>

void printHeader()
{
    std::cout << "=== Report ===\n";
}

void printFooter()
{
    std::cout << "==============\n";
}

int doubleValue(int x)
{
    return x * 2;
}

int main()
{
    printHeader();
    std::cout << "Value: " << doubleValue(7) << "\n";
    std::cout << "Value: " << doubleValue(13) << "\n";
    printFooter();
    return 0;
}
```

`main` now reads almost like a summary. You do not need to study the internals of `printHeader` to understand that it prints a header. The name tells you.

**The Don't Repeat Yourself principle**

Consider needing the same calculation in two places. Without a function, you copy the code:

```cpp
int a = 5 * 5;       // square of 5
int b = 9 * 9;       // square of 9
```

With a function, you centralise it:

```cpp
int square(int n)
{
    return n * n;
}

int a = square(5);
int b = square(9);
```

Now if you discover the calculation needs to change — say, you want to clamp the result — you change `square` once, and every call site benefits. With the copy-paste approach, you would need to find and update every duplicate.

**Keeping functions focused**

A function works best when it does exactly one thing. A function named `computeAndPrint` is a warning sign: it should probably be split into `compute` and `print`. A practical rule of thumb is that a function body should fit in a screen without scrolling — roughly 20 lines or fewer. If it is longer, look for a natural sub-task that could move to its own function.

Here is an example of splitting a longer task:

```cpp
#include <iostream>

int readNumber()
{
    int n;
    std::cin >> n;
    return n;
}

int add(int a, int b)
{
    return a + b;
}

void printResult(int result)
{
    std::cout << "Sum: " << result << "\n";
}

int main()
{
    int x = readNumber();
    int y = readNumber();
    printResult(add(x, y));
    return 0;
}
```

`main` orchestrates three separate concerns — reading, computing, printing — each cleanly isolated in its own function. Testing one part in isolation is now straightforward.

## Common mistakes

**Mistake 1: Doing too much in one function**

Beginners often write one enormous function because "it all goes together". The result compiles, but becomes fragile: changing one part accidentally breaks another because everything shares the same local variables and control flow.

```cpp
// Bad: one function doing three different jobs
void doEverything(int x, int y)
{
    // compute
    int sum = x + y;
    int diff = x - y;
    // print
    std::cout << "Sum: " << sum << "\n";
    std::cout << "Diff: " << diff << "\n";
    // more unrelated work ...
}
```

Prefer two focused functions: one that computes, one that prints. A reader who only needs to understand the printing logic should not have to wade through the computation.

**Mistake 2: Duplicating logic instead of calling a function**

A very common trap is writing a small piece of arithmetic directly at each call site rather than factoring it into a function. The code compiles and runs correctly — until you need to change the logic, and you discover you have six copies scattered across the file.

```cpp
// Three copies of the same formula — fragile
int perimeter1 = 2 * (width1 + height1);
int perimeter2 = 2 * (width2 + height2);
int perimeter3 = 2 * (width3 + height3);
```

Factor it once:

```cpp
int perimeter(int width, int height)
{
    return 2 * (width + height);
}
```

**Mistake 3: Naming a function after its implementation instead of its purpose**

`multiplyByTwo` describes how; `doubleValue` describes what. When the implementation changes, an implementation-focused name becomes misleading. Always name functions by what they accomplish, not how they accomplish it.

## When to use this

Break code into functions whenever you notice the same logic appearing in more than one place, or whenever a block of code is long enough that you need a comment to explain what it does. If you find yourself writing a comment like `// compute the perimeter`, that comment is a strong hint that the code underneath should be its own function named `computePerimeter`. Use void functions (covered in "Void functions") for procedures that produce side effects like printing, and value-returning functions (covered in "Function return values") for computations that produce a result. As programs grow across multiple files — something you will see soon in "Programs with multiple code files" — well-named functions become the primary tool for keeping each file readable on its own.

## The idea

Think of a function as a named recipe. You write the recipe once — "how to make pizza" — and then anyone in the kitchen can say "make pizza" without needing to know every step. In C++, a function lets you bundle a sequence of statements under a name and call that name from anywhere in your program. The result is code you can reuse instead of copy-paste, and code you can read as a series of high-level steps instead of an undifferentiated wall of instructions.

Before functions, every program you wrote lived entirely in `main()`. That works for small examples, but becomes unmanageable as soon as a program does more than a handful of things. Functions give you the ability to break a large problem into small, named sub-problems that you can write, test, and reason about one at a time.

## How it works

A function has three parts: a return type, a name, and a body wrapped in curly braces. For now, every function that does not give back a value uses the return type `void`, and the function that the operating system calls to start your program has the fixed name `main` and return type `int`.

```cpp
#include <iostream>

void sayHello()
{
    std::cout << "Hello!\n";
}

int main()
{
    sayHello();   // call the function
    sayHello();   // call it again — runs the body a second time
    return 0;
}
```

When the program runs, `main` is called first. The first statement inside `main` is `sayHello()`. Execution jumps to the top of `sayHello`, runs its body (prints "Hello!"), and then returns to `main` at the next statement. The second call repeats the same journey.

This "jump-run-return" behaviour is the core mechanic. The body of a function runs from top to bottom, then execution resumes right after the call site.

```cpp
#include <iostream>

void printDivider()
{
    std::cout << "----------\n";
}

void printGreeting()
{
    printDivider();
    std::cout << "Welcome to cpproad!\n";
    printDivider();
}

int main()
{
    printGreeting();
    return 0;
}
```

Here `printGreeting` itself calls `printDivider`. Functions can call other functions freely. Execution follows the call chain wherever it leads, always returning to the next statement after each call.

A function must be defined before it is called — or at least declared before (covered in a later lesson). For now, place helper functions above `main` so the compiler sees them first.

```cpp
#include <iostream>

void countToThree()
{
    std::cout << "1\n";
    std::cout << "2\n";
    std::cout << "3\n";
}

int main()
{
    std::cout << "Counting:\n";
    countToThree();
    std::cout << "Done.\n";
    return 0;
}
```

Output:
```
Counting:
1
2
3
Done.
```

The call to `countToThree()` does not interrupt the surrounding output — "Counting:" appears first, then the three numbers, then "Done.".

## Common mistakes

**Calling a function before it is defined.**

```cpp
#include <iostream>

int main()
{
    greet();   // ERROR: 'greet' was not declared in this scope
    return 0;
}

void greet()
{
    std::cout << "Hi!\n";
}
```

The compiler reads files top to bottom. When it reaches `greet()` inside `main`, it has not seen the definition of `greet` yet and reports an error. Fix this by moving `greet` above `main`, or by adding a forward declaration (covered later in this chapter).

**Forgetting the parentheses when calling a function.**

```cpp
#include <iostream>

void sayHello()
{
    std::cout << "Hello!\n";
}

int main()
{
    sayHello;   // does nothing — this is a reference to the function, not a call
    return 0;
}
```

This compiles without error on some compilers but prints nothing. The parentheses `()` are what trigger the call. Without them, the name `sayHello` is just a reference to the function and the body never runs. Always write `sayHello()`.

**Putting statements outside of any function.**

```cpp
#include <iostream>

std::cout << "Hello!\n";  // ERROR: statements must be inside a function

int main()
{
    return 0;
}
```

In C++, executable statements must be inside a function body. Only declarations, type definitions, and a handful of other constructs can appear at file scope. The compiler will reject any bare statement found outside braces.

## When to use this

Reach for a function whenever you find yourself about to write the same sequence of steps more than once, or whenever a block of code represents a single logical action that deserves a name. Even a three-line block is worth extracting if naming it makes `main` easier to read.

The opposite extreme — putting everything in `main` — is fine for toy programs but quickly produces code that is hard to understand, hard to test, and impossible to reuse. Once you introduce function parameters and return values (covered in the next few lessons), functions become the primary tool for structuring any C++ program.

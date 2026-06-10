## The idea

Imagine you call the same function dozens of times, and in 90% of those calls you pass the exact same value for one of the parameters. You end up typing that value over and over, and if it ever needs to change, you have to update every call site. Default arguments solve this problem by letting you specify a fallback value for a parameter directly in the function declaration. If the caller doesn't supply that argument, the compiler fills in the default automatically. It's a way of saying "use this value unless told otherwise."

Default arguments are especially common in configuration-style functions — think printing utilities, formatting helpers, or initialization routines where most callers want the standard behavior and only occasionally need to override it.

## How it works

A default argument is specified by assigning a value to a parameter in the function declaration:

```cpp
#include <iostream>

void printDivider(int width = 40, char fill = '-')
{
    for (int i = 0; i < width; ++i)
        std::cout << fill;
    std::cout << '\n';
}

int main()
{
    printDivider();          // uses width=40, fill='-'
    printDivider(20);        // uses width=20, fill='-'
    printDivider(10, '=');   // uses width=10, fill='='
    return 0;
}
```

Output:
```
----------------------------------------
--------------------
==========
```

When you call `printDivider()` with no arguments, the compiler substitutes `40` and `'-'` automatically. When you call `printDivider(20)`, the first argument is explicitly `20` but the second still defaults to `'-'`. You can override any leading arguments, but you cannot skip a middle argument to override a later one — arguments are always matched left to right.

This leads to an important rule: **parameters with default arguments must appear at the right end of the parameter list.** You cannot put a defaulted parameter before a non-defaulted one.

```cpp
// GOOD: defaults are at the right
void log(std::string msg, int level = 1, bool timestamp = false);

// BAD: non-defaulted after defaulted — won't compile
// void log(int level = 1, std::string msg);
```

When a function is declared in a header and defined in a separate translation unit, the default arguments belong on the **declaration** only, not the definition:

```cpp
// header.h
void greet(std::string name, std::string greeting = "Hello");

// greet.cpp — no default here
void greet(std::string name, std::string greeting)
{
    std::cout << greeting << ", " << name << "!\n";
}
```

Putting the default on the definition and omitting it from the declaration is a common error: callers only see the header, so they won't know about the default.

Here is a slightly more realistic example that shows defaults helping with a formatting function:

```cpp
#include <iostream>
#include <string>

void printLabel(std::string text, int indent = 0, bool upper = false)
{
    for (int i = 0; i < indent; ++i)
        std::cout << ' ';

    if (upper)
    {
        for (char c : text)
            std::cout << (char)(c >= 'a' && c <= 'z' ? c - 32 : c);
    }
    else
    {
        std::cout << text;
    }
    std::cout << '\n';
}

int main()
{
    printLabel("chapter 1");           // "chapter 1" at column 0
    printLabel("section A", 4);       // indented 4 spaces
    printLabel("title", 0, true);     // all caps
    return 0;
}
```

This function has three parameters, but most callers just want `printLabel("some text")` without caring about indentation or capitalisation.

## Common mistakes

**1. Trying to override a later default without providing an earlier one.**

Defaults only work from right to left. You cannot skip the second argument to reach the third:

```cpp
void configure(int width = 80, int height = 24, bool color = true);

// Intended: use width=80, height=24, override color to false
// configure(false);     // WRONG: passes false as width (int), not color
configure(80, 24, false); // correct — must supply all preceding args
```

Because `false` converts to the integer `0`, the call `configure(false)` compiles without error but sets `width` to `0`, which is almost certainly not what you wanted.

**2. Placing the default on the definition instead of the declaration.**

```cpp
// mylib.h
void init(int timeout);     // ← caller only sees this; no default

// mylib.cpp
void init(int timeout = 5)  // ← default is here, but callers can't see it
{
    // ...
}
```

Callers who include `mylib.h` will see a compile error if they try `init()` with no arguments, because the declaration they see has no default. The fix: move the default to the declaration in the header.

**3. Non-defaulted parameter after a defaulted one.**

```cpp
// compile error
void draw(int x = 0, int y, int z = 0);  // y has no default but follows x
```

The compiler requires that once you start providing defaults, all remaining parameters must also have defaults.

## When to use this

Reach for default arguments when a function has one or more parameters whose "usual" value is well-defined and callers rarely need to change it. Logging functions, output formatters, and setup routines are classic cases. They can reduce overloading: instead of writing `printBox()`, `printBox(int width)`, and `printBox(int width, char border)` as three separate overloads, one function with defaults handles all three call patterns cleanly.

However, avoid defaults when the "usual" value is ambiguous or when all callers are expected to supply every argument — in those cases explicit arguments communicate intent more clearly. Also avoid using defaults to paper over a poorly designed parameter list; if a function needs six parameters, defaults on four of them probably signal that the function is doing too much.

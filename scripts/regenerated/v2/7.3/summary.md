## The idea

Every variable in a C++ program has two independent attributes that govern how long it lives and where it can be seen: its *duration* (when memory is allocated and released) and its *scope* (what region of source code can name it).

Local variables — variables you define inside a function body or a block — have *automatic storage duration* and *block scope*. "Automatic" means the runtime creates the variable when execution enters the block and destroys it when execution leaves. "Block scope" means the variable is only visible from its point of definition to the closing brace of the block it was defined in. These two ideas go hand in hand for locals, though they are conceptually separate.

Think of a local variable like a sticky note you write when you walk into a room: it exists and is readable only while you are in that room. The moment you walk out, the note is thrown away.

## How it works

**Scope: where can you use the name?**

A variable's scope starts at the point of definition and ends at the closing brace of its enclosing block. Code before the definition or outside the block cannot see the name:

```cpp
#include <iostream>

int main()
{
    // cannot use 'score' here — it doesn't exist yet
    int score { 100 };
    std::cout << score << '\n';   // 100  — in scope
    return 0;
}
// score is out of scope here
```

Attempting to print `score` before its declaration causes a compile error: the name does not exist at that point.

**Duration: when is memory allocated?**

Local variables are created when execution reaches their definition and destroyed when the enclosing block ends. Each function call gets its own fresh copy:

```cpp
#include <iostream>

void greet()
{
    int callCount { 0 };   // fresh variable each call — always starts at 0
    callCount = callCount + 1;
    std::cout << "count: " << callCount << '\n';
}

int main()
{
    greet();   // prints count: 1
    greet();   // prints count: 1 (not 2 — fresh variable each call)
    return 0;
}
```

Because `callCount` has automatic duration, it is destroyed when `greet` returns and recreated (at zero) on the next call. (Static local variables, covered later in this chapter, break this pattern intentionally.)

**Nested blocks reduce scope further**

A variable defined in an inner block is not visible in the outer block or in sibling blocks:

```cpp
#include <iostream>

int main()
{
    int a { 5 };

    {
        int b { 10 };
        std::cout << a << ' ' << b << '\n';   // OK: 5 10
    }

    std::cout << a << '\n';   // OK: 5
    // std::cout << b;        // ERROR: b is out of scope here
    return 0;
}
```

`b` is limited to the inner block. `a` is visible everywhere within `main` after its definition.

## Common mistakes

**Using a variable before it is defined**

C++ requires a variable to be defined before it can be used. This is not always intuitive for people coming from languages where declarations are hoisted:

```cpp
int main()
{
    std::cout << x << '\n';   // ERROR: 'x' was not declared in this scope
    int x { 7 };
    return 0;
}
```

The compiler rejects this even though `x` appears in the same function — scope starts at the *definition*, not at the top of the block.

**Assuming a variable retains its value across function calls**

Because local variables have automatic duration, they start fresh every call. A common mistake is expecting a local counter to accumulate across calls:

```cpp
void count()
{
    int n { 0 };
    n = n + 1;
    std::cout << n << '\n';   // always prints 1, never 2, 3, ...
}
```

The variable `n` is destroyed and recreated every time `count` is called. If you need a variable that persists between calls, you must use a static local (covered later) or pass state through parameters/return values.

**Expecting a variable from an inner block to be usable outside it**

Defining a variable in a nested block and accessing it after the block closes is a compile error:

```cpp
int main()
{
    {
        int temp { 42 };
    }
    std::cout << temp << '\n';   // ERROR: 'temp' was not declared in this scope
    return 0;
}
```

Move `temp` to the outer block if you need it after the inner block ends.

## When to use this

Define local variables as close to their first use as possible — this is good C++ style because it makes the scope as small as the name's actual lifetime. Tight scopes prevent accidentally reusing a variable for two unrelated purposes and make the program easier to read.

Local variables are the right choice for almost all intermediate values, counters, and temporaries inside a function. When you need a value to outlive the function call — for example, to communicate results back to the caller — use function return values (covered in chapter 2). When you need a value shared across all function calls, a global constant (covered later in chapter 7) or a static local variable may be appropriate.

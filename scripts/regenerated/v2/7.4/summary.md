## The idea

Every variable you have seen so far lives inside a function — it comes into existence when the function is called and is destroyed when the function returns. Global variables are different: they are defined outside any function and live for the entire duration of the program. They are created before `main()` starts and destroyed after `main()` returns.

Think of a global variable like a whiteboard in the hallway of an office: anyone can walk up and read or change it at any time, from any part of the building. This is powerful, but it also means every function is a potential reader or writer — which is why globals require care.

## How it works

**Defining a global variable**

A global variable is defined at file scope — outside every function. Like local variables, they should be initialized at definition:

```cpp
#include <iostream>

int g_maxScore { 100 };   // global variable

void printMax()
{
    std::cout << "Max: " << g_maxScore << '\n';
}

int main()
{
    printMax();   // Max: 100
    return 0;
}
```

The convention of prefixing global variables with `g_` is common in C++ codebases to make it obvious at the call site that you are reading or modifying a global.

**Global variables are zero-initialized by default**

Unlike local variables, which have indeterminate values if not explicitly initialized, global variables are zero-initialized before any user-written initialization runs:

```cpp
#include <iostream>

int g_count;   // initialized to 0 automatically (still, prefer explicit initialization)

int main()
{
    std::cout << g_count << '\n';   // 0
    return 0;
}
```

This is a language guarantee. Relying on it silently is still bad style — always write the initializer explicitly so the intent is obvious.

**Visibility: global variables in the same file**

A global variable is visible from the point of its definition to the end of the file. Functions defined below the global definition can use it without any qualifier:

```cpp
#include <iostream>

int g_level { 1 };

void levelUp()
{
    g_level = g_level + 1;
}

int main()
{
    std::cout << g_level << '\n';   // 1
    levelUp();
    std::cout << g_level << '\n';   // 2
    return 0;
}
```

`levelUp` modifies `g_level` directly. `main` sees the updated value because both access the same storage.

## Common mistakes

**Accidentally shadowing a global with a local of the same name**

If a local variable has the same name as a global, the local takes precedence inside that scope. The global is silently hidden:

```cpp
#include <iostream>

int g_value { 10 };

int main()
{
    int g_value { 20 };           // local shadows the global
    std::cout << g_value << '\n'; // prints 20, not 10
    return 0;
}
```

You can access the global with the scope resolution prefix `::g_value` (covered in lesson 7.5), but shadowing globals is a code smell — renaming one of them is the right fix.

**Assuming a global is only read by one function**

Global variables can be modified by any function. When a bug causes the wrong value, every function that writes the global is a suspect. This makes bugs harder to track down as programs grow:

```cpp
int g_score { 0 };

void addBonus()  { g_score = g_score + 50; }
void applyFine() { g_score = g_score - 30; }

// If g_score is wrong, you must trace ALL call sites.
```

This is the fundamental reason non-const global variables are considered problematic (a topic covered in detail in lesson 7.8).

**Forgetting that global lifetime is the whole program**

Unlike local variables that are cleaned up at the end of a function, globals live until the program exits. If a global holds a large buffer or an open resource, it occupies memory for the entire run — even when it is only needed briefly.

## When to use this

Non-const global variables should be rare. They are appropriate for program-wide configuration that genuinely cannot be passed as parameters — for example, a verbosity flag that dozens of independent functions check. Even then, consider encapsulating the global inside a namespace to prevent name collisions and communicate intent.

The legitimate and common use of global scope is for compile-time constants, covered in chapter 7 after this lesson (`const` and `constexpr` globals, shared across files). A global constant such as `const double pi { 3.14159 }` carries no risk because it can never be modified.

For everything else, prefer passing values through function parameters and return values — this keeps data flow explicit and makes each function independently testable.

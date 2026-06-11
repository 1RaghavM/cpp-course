## The idea

Imagine a whiteboard covered in old scribbles from a previous session. When someone hands you a marker and says "write the answer," you pick up the marker — but the scribbles are still there. If you try to read the whiteboard before writing anything new, you might misread the leftover marks as meaningful data.

That is exactly what happens when you declare a variable in C++ and read its value before storing anything in it. The variable occupies some bytes of memory, but those bytes contain whatever data happened to be there before — old function arguments, a previous program's stack frame, random initialization noise from the OS. The C++ standard calls this *undefined behavior*: the program is technically broken, and the compiler is allowed to do anything at all, including producing different results on different machines, different builds, or even different runs.

This is not a hypothetical danger. Uninitialized variables are one of the most common sources of real bugs in production C++ programs, and modern compilers warn about them for good reason. The rule is simple and absolute: every variable must be given a value before you read from it.

## How it works

**What uninitialized memory looks like**

When you declare `int x;` without assigning a value, the compiler reserves four bytes for `x` on the stack. Those bytes are not zeroed. They hold whatever bits were left behind from the last function that used that memory.

```cpp
#include <iostream>

int main()
{
    int x;                     // declared but NOT initialized
    std::cout << x << '\n';    // undefined behavior — reads garbage
    return 0;
}
```

On one run you might see `0`. On another run, on a different machine, or with a different compiler flag, you might see `-858993460` or `32767` or any other value. Compilers compiled with address sanitizers will actively crash the program and report the violation. The output is not predictable.

**The sanitizer catches it**

Modern compilers can insert runtime checks that detect uninitialized reads. With g++ and `-fsanitize=undefined` the program above prints a diagnostic and aborts rather than printing a garbage value. In this course, exercises are tested with warnings enabled (`-Wall -Wextra`), which often catches uninitialized reads at compile time:

```
warning: 'x' is used uninitialized in this function
```

That warning is the compiler telling you your program has undefined behavior. Treat it as an error.

**The fix: always initialize**

The cure is to give the variable a value at the point of declaration (copy initialization, direct initialization, or list initialization — covered in the prior lesson "Variable assignment and initialization"):

```cpp
#include <iostream>

int main()
{
    int x = 0;                 // initialized — safe to read
    std::cin >> x;             // replace with a user-supplied value
    std::cout << x << '\n';    // always prints the value from cin
    return 0;
}
```

Now `x` is always `0` if the user provides no input before `cin` fails, and whatever value `cin` stored otherwise. The behavior is defined in every case.

## Common mistakes

**Mistake 1 — Declaring and forgetting to initialize before a conditional read**

A subtle variant happens when a branch might skip the initialization:

```cpp
// Imagine a future lesson with if; shown here as a pattern to watch for
int result;
// if the user skips giving input, result is never set
std::cin >> result;
std::cout << result << '\n';  // fine only if cin succeeded
```

Even with `cin`, if extraction fails (for example, the user types text instead of a number), the variable is left unchanged. Since it was never initialized, reading it after a failed extraction is undefined behavior. The safe habit is `int result = 0;` before calling `cin`, so the variable has a known fallback.

**Mistake 2 — Assuming a debug build's zero-initialization carries to release**

Some compilers and operating systems zero-initialize stack memory in debug builds as a debugging convenience. A program that "works" in debug might silently break in release because the zeroing disappears. Never rely on debug-mode behavior as a substitute for explicit initialization.

**Mistake 3 — Confusing "declared" with "initialized"**

```cpp
int a;   // declared — no value yet
int b = 5; // declared AND initialized — has the value 5

std::cout << b << '\n';   // fine: b is 5
std::cout << a << '\n';   // undefined behavior: a is uninitialized
```

Declaration just reserves the name and the memory. Initialization is the act of giving the memory a first value. Until initialization happens, reading from the variable is forbidden.

## When to use this

The lesson "Uninitialized variables and undefined behavior" is less about a feature you reach for and more about a trap you avoid every single day you write C++. Any time you declare a variable, ask yourself immediately: does this variable have a well-defined value before the first read? If not, assign a sensible default right at the declaration site.

Initializing to a placeholder value like `0` costs nothing at runtime and eliminates an entire class of difficult bugs. Once you move on to user-defined types and classes (much later in this course), constructors will handle initialization automatically — but for the primitive types like `int` you are working with now, that responsibility is entirely yours.

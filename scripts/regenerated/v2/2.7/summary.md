## The idea

When you call a friend on the phone, you only need to know their number — you do not need to be standing next to them. C++ has a similar idea: before you call a function, the compiler only needs to know that the function exists, what parameters it takes, and what it returns. It does not need to see the full body yet. That advance notice is a **forward declaration** (also called a **function prototype**).

Without forward declarations, the order in which you write your functions matters enormously. The compiler reads a file from top to bottom, so if `main` calls `square` and `square` appears below `main`, the compiler will complain that `square` is unknown. A forward declaration placed above `main` tells the compiler: "trust me, a function with this signature exists; I will provide the body later in this file."

This distinction also introduces an important vocabulary pair: a **declaration** tells the compiler about a name and its type information, while a **definition** provides the actual implementation (the function body). Every definition is also a declaration, but a forward declaration alone is not a definition.

## How it works

**The problem without forward declarations**

```cpp
#include <iostream>

int main()
{
    std::cout << square(5) << "\n"; // error: 'square' was not declared
    return 0;
}

int square(int x)
{
    return x * x;
}
```

The compiler sees `square(5)` in `main` before it has seen any declaration of `square`. It reports an error.

**Adding a forward declaration**

A forward declaration is just the function signature followed by a semicolon — the body is omitted:

```cpp
#include <iostream>

int square(int x);  // forward declaration

int main()
{
    std::cout << square(5) << "\n"; // OK — compiler knows square exists
    return 0;
}

int square(int x)   // definition
{
    return x * x;
}
```

Now the compiler sees the declaration before the call, so it accepts the call. It then finds the full definition later in the file and uses that body when generating code.

**Parameter names are optional in declarations**

The compiler only needs the parameter *types* in a forward declaration. Parameter names are allowed but not required:

```cpp
int add(int, int);   // valid — types only
int add(int a, int b); // also valid — names included
```

Both declare the same function. Many programmers include the names anyway for readability, since they serve as documentation.

**Declaration vs definition: a precise distinction**

```cpp
int square(int x);          // declaration (no body)
int square(int x) { return x * x; } // definition (has body)
```

You can have many declarations of the same function, but only one definition (in a single translation unit). Providing two definitions for the same function in the same file causes a "multiple definitions" error.

## Common mistakes

**Mistake 1: Mismatch between declaration and definition**

If the declaration and the definition disagree on parameter types or return type, the compiler will report an error — or worse, silently call the wrong overload in more advanced code. Always keep them in sync.

```cpp
int square(int x);          // declared as int
// ... later ...
void square(int x) { ... }  // defined as void — mismatch, compile error
```

The fix is to make the return types identical in both the declaration and the definition.

**Mistake 2: Forgetting the semicolon on the declaration**

A forward declaration ends with a semicolon. Omitting it causes the compiler to interpret the next line as the start of the function body and produces a confusing error.

```cpp
int square(int x)   // missing semicolon — compiler reads next line as body start
int main() { ... }  // parse error here
```

Every forward declaration must end with `;`.

**Mistake 3: Believing the declaration alone is enough to link**

A forward declaration satisfies the compiler — the translation phase. But at link time, the linker must find the actual definition. If you declare a function and never provide its body anywhere, you will get a linker error ("undefined reference to `square`") even though the file compiled without errors.

```cpp
int square(int x);  // declared but never defined

int main()
{
    std::cout << square(4); // compiles OK, linker error: undefined reference
    return 0;
}
```

The definition — the body — must exist somewhere the linker can find it.

## When to use this

Use a forward declaration whenever the natural call order in a file requires a function to appear after the point where it is called — for example, when two functions call each other (mutual recursion), or when you prefer to put `main` at the top of the file so readers see the program's high-level logic first. Forward declarations also become essential when a function is defined in a separate `.cpp` file, which you will explore in the next lesson, "Programs with multiple code files." In that context, the declarations move into header files so every file that needs them can include them without duplicating the body. For small, single-file programs where call order is not a constraint, you can avoid forward declarations entirely by simply defining each function before its first call.

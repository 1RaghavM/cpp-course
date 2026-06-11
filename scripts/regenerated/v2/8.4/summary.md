## The idea

A regular `if`/`else` is a runtime branch: the program evaluates the condition when it runs and decides which path to take. `constexpr if` is a compile-time branch: the compiler evaluates the condition when it compiles and discards the branch that is not taken — it never enters the binary at all. If the discarded branch contains code that would not compile for the current type or template argument, that is fine because the compiler never instantiates it.

The analogy is a conditional comment in a build system. A `#if 0 ... #endif` preprocessor block is also discarded at compile time, but it is text-level and knows nothing about types or values. `constexpr if` operates at the language level inside a template, which lets it express conditions that depend on type properties rather than simple macros.

`constexpr if` is used almost exclusively inside function templates (lesson 11.x) and `if consteval` blocks. At this stage in the course you are not yet writing templates, so this lesson focuses on the mechanism and on the one non-template use that appears in ordinary code: `if constexpr` with a `constexpr` variable.

## How it works

The syntax adds the `constexpr` keyword between `if` and the opening parenthesis. The condition must be a constant expression — something the compiler can evaluate at compile time.

```cpp
#include <iostream>

int main()
{
    constexpr bool debugMode { true };

    if constexpr (debugMode)
        std::cout << "Debug: starting up\n";

    std::cout << "Running\n";

    return 0;
}
```

When `debugMode` is `true`, the compiler keeps the `cout` statement and discards nothing. When `debugMode` is `false`, the compiler removes the `cout` line entirely — no branch instruction in the binary, no runtime cost, as if the line were never written.

Compare this with a plain `if`:

```cpp
constexpr bool debugMode { false };

if (debugMode)                       // runtime branch
    std::cout << "Debug\n";          // exists in binary, never taken

if constexpr (debugMode)             // compile-time branch
    std::cout << "Debug\n";          // removed from binary entirely
```

Both behave identically at runtime when the condition is `false`. The difference is that the `if constexpr` version produces slightly tighter code because the dead branch is gone, and — crucially in templates — the dead branch is not type-checked.

The real power shows up inside templates. Without templates you cannot easily trigger a type-check failure in a discarded branch, but you can still observe the compile-time nature with a `static_assert`:

```cpp
#include <iostream>

int main()
{
    constexpr int platform { 64 };

    if constexpr (platform == 64)
    {
        std::cout << "64-bit path\n";
    }
    else
    {
        static_assert(platform == 32, "Unsupported platform");
        std::cout << "32-bit path\n";
    }

    return 0;
}
```

When `platform` is 64, the `else` branch is discarded, so the `static_assert` inside it never fires. If you changed `platform` to 32, the 64-bit branch would be discarded and the 32-bit path would compile fine. If `platform` were something else entirely, the `static_assert` would trigger a compile error. This pattern — using `static_assert` in a discarded branch to catch impossible combinations — is common in real systems code.

## Common mistakes

**Using `constexpr if` when the condition is not a constant expression.** This is a hard error:

```cpp
int main()
{
    int x {};
    std::cin >> x;

    if constexpr (x > 0)    // error: x is not a constant expression
        std::cout << "Positive\n";

    return 0;
}
```

The compiler cannot evaluate `x > 0` at compile time because `x` comes from user input. Use a plain `if` here. `constexpr if` requires the condition to be evaluable without any runtime information.

**Expecting `constexpr if` to affect the surrounding function's compilation outside a template.** In a non-template function, both branches must still be syntactically valid C++, even though one is discarded. The type-checking relaxation only applies to template instantiations. This surprises people who learned about `constexpr if` primarily in a template context.

**Confusing `constexpr if` with `#ifdef`/`#if` preprocessor directives.** The preprocessor runs before the compiler and understands only macro-defined tokens. `constexpr if` runs inside the compiler and understands C++ types and values. They solve similar problems but at different stages and with different power. Prefer `constexpr if` over preprocessor conditionals whenever both could work, because `constexpr if` respects scope, types, and the rest of the language.

## When to use this

In everyday non-template code, `constexpr if` replaces a plain `if` when the condition is a compile-time constant and you want to document that fact — or when you want the dead branch to be entirely absent from the binary (e.g., debug-only logging). It is a stylistic tool here.

Its primary home is in function templates and `if consteval` blocks, both of which appear in later chapters. When you reach chapter 11 (templates), `constexpr if` becomes essential for writing functions that behave differently depending on the type of their argument. The pattern you learn here — write the condition, write the two branches, trust the compiler to discard the right one — carries directly into that context.

If a condition can only be known at runtime, use a plain `if`. If it can be known at compile time and you want the binary to reflect that, use `if constexpr`.

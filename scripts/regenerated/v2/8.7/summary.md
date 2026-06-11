## The idea

Before structured control flow (if/else, switch, loops) was common, early programming languages used `goto` to jump from one point in a program to another arbitrary point identified by a label. You can think of it as a teleport: the label is the destination, and `goto labelname` instantly moves execution there, skipping over everything in between.

In modern C++, `goto` is almost universally discouraged. The reason is not philosophical — it is practical. When you read a function with `goto`, you cannot follow execution linearly from top to bottom. You must mentally simulate jumps, and functions with multiple `goto` statements quickly become impossible to reason about. The term "spaghetti code" was coined specifically to describe programs full of `goto` jumps that tangle the control flow like a plate of spaghetti.

Understanding `goto` matters because it appears in legacy codebases, in some OS kernel and embedded code, and in occasional C code that is imported into C++ projects. Knowing what it does — and why it is dangerous — makes you a better reader of that code.

## How it works

A `goto` statement jumps to a label. A label is a name followed by a colon that can appear anywhere in the same function. Labels have function scope — you cannot `goto` a label in a different function.

```cpp
#include <iostream>

int main() {
    std::cout << "step 1\n";
    goto skip;
    std::cout << "step 2\n";  // never executed
skip:
    std::cout << "step 3\n";
    return 0;
}
```

Output:
```
step 1
step 3
```

`goto skip;` transfers control directly to the `skip:` label, bypassing the `step 2` output completely. Labels do not need to be declared ahead of time; the compiler resolves them after parsing the whole function.

You can also jump backward with `goto`, which creates a loop-like construct. This is one of the few semi-legitimate uses of `goto` in C — simulating a loop before loop keywords existed:

```cpp
#include <iostream>

int main() {
    int count = 0;
loop:
    if (count < 3) {
        std::cout << count << "\n";
        ++count;
        goto loop;
    }
    return 0;
}
```

Output:
```
0
1
2
```

This is exactly what a `while` loop does, but written with `goto`. Modern C++ programmers would never write this — `while (count < 3)` is cleaner, safer, and understood at a glance.

The C++ standard imposes one hard restriction on `goto`: you cannot jump forward over a variable initialization in a way that would leave the variable in scope but uninitialized. The compiler enforces this:

```cpp
int main() {
    goto past;
    int x = 10;    // ERROR: jump to 'past' crosses initialization of 'x'
past:
    return 0;
}
```

This mirrors the same restriction you saw with `switch` case labels. The fix is either to restructure the code to not jump over the initialization, or to limit the variable's scope to a block that the jump does not cross.

## Common mistakes

**Jumping forward into a block that uses a variable initialized before the jump.** The compiler catches explicit initializations, but it is easy to accidentally create unreachable initialization paths in complex functions. Always prefer restructuring the logic to avoid forward jumps entirely.

**Using `goto` to avoid refactoring.** A common temptation is to write `goto cleanup` in a function with multiple error paths, to share a cleanup block:

```cpp
int process() {
    if (/* error */) goto done;
    if (/* other error */) goto done;
    // ... work ...
done:
    std::cout << "cleanup\n";
    return 0;
}
```

In C this is occasionally acceptable because C lacks destructors. In C++, local objects clean up automatically when they go out of scope, so the `goto cleanup` pattern is rarely needed. An `if`/`else` chain or early `return` is almost always cleaner.

**Confusing labels with variable names.** Label names share no namespace with variable names, so you can have both a variable named `end` and a label named `end:` in the same function. This is legal but confusing:

```cpp
int end = 5;
goto end;       // jumps to the label named end
end:
    return 0;   // this is the label
```

The compiler resolves `goto end` as the label jump, not the variable. Avoid reusing names between labels and variables.

## When to use this

In practice, never write `goto` in new C++ code. Every pattern that `goto` enables — error cleanup, loop simulation, skipping code — is covered by structured alternatives: `if`/`else`, `switch`, `while`, `for`, early `return`, and in C++ specifically, RAII (destructors that run on scope exit). These alternatives are always clearer.

When reading legacy C or embedded C++ code, you may encounter `goto` for error-path cleanup or as an optimization inside tight inner loops. Recognize the pattern, trace the destination label, and you will be able to follow the code. When maintaining such code, prefer to leave existing `goto` patterns intact rather than refactoring them blindly — subtle differences in cleanup order can hide real bugs.

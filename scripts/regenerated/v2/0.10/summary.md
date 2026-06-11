## The idea

The C++ language is defined by a standard — an official document produced by an international committee that specifies exactly what valid C++ code is and what it means when executed. Compiler vendors — the teams that build GCC, Clang, and MSVC — implement that standard in their compiler. However, compilers have historically also added features that are not in the standard: vendor-specific extensions.

Compiler extensions are extra syntax, behaviors, or library functions that a specific compiler supports but that are not part of standard C++. They exist because compilers were written before the standard covered every corner case, because compiler teams wanted to experiment with new features, or because hardware-specific capabilities required an interface. The central problem with extensions is that code relying on one may not compile on a different compiler, and may silently behave differently even on the same compiler when certain settings change or a newer version is installed.

For learning C++, extensions are a hazard. If you unknowingly use an extension, you think you are writing standard C++ when you are not. The code passes your compiler's checks, you internalize those behaviors as the language, and then later you hit a wall when the code fails on a different platform or in a compiler upgrade.

## How it works

Extensions come in several forms. Some are syntactic shortcuts that the compiler quietly accepts even though the standard does not permit them. A widely encountered example is variable-length arrays (VLAs), where the size of a stack-allocated array is determined by a value that is only known at runtime. The C standard includes VLAs; the C++ standard does not. GCC and Clang accept VLA syntax as an extension when compiling C++ code, but MSVC correctly rejects it as non-standard.

```cpp
int n = 5;
int arr[n];  // NOT standard C++ — a GCC/Clang extension; MSVC rejects this
```

If you write this, it compiles on GCC without a complaint. You might not discover the problem until you or a colleague tries to build the same code with MSVC, or until you explicitly enable conformance checks.

Other extensions manifest as pragmas or compiler-specific attributes: `__attribute__((packed))` in GCC, `__declspec(noinline)` in MSVC, and similar annotations. These control alignment, inlining, calling conventions, and other platform-specific behaviors. For code that is intentionally targeting a single platform, extensions of this kind are legitimate and common. For portable or learning code, they are a trap.

To tell the compiler to reject non-standard extensions, pass these flags:

- GCC and Clang: `-pedantic` emits warnings for extension usage; `-pedantic-errors` promotes those warnings to errors and stops the build.
- MSVC: `/permissive-` enables stricter standard conformance mode.

In your IDE's project settings there is often a "conformance mode" or "language standard" option that controls this. Setting it to strict conformance is the recommended starting point for any new project.

This course recommends disabling extensions for all learning exercises. The goal is to write portable, standard C++. The standard is also a more stable foundation: what the standard guarantees will continue to work on any conforming compiler, now and in the future. What a specific compiler's extension does is subject to change.

## Common mistakes

The most common mistake is writing code that depends on an extension without knowing it. Variable-length arrays are a classic example: the syntax looks entirely reasonable, the compiler accepts it without complaint, and nothing in the output hints that something non-standard is happening. The code works on your machine, fails to compile for someone else with a different toolchain, and you cannot understand why. The fix is to enable pedantic checking from the start so the compiler tells you immediately.

Another mistake is enabling `-pedantic` and then being baffled by errors in code that previously compiled cleanly. If turning on strict conformance produces a flood of new errors, it means the code was silently relying on extensions all along. The errors are not a regression; they are revealing issues that were always there. Work through each one and replace the extension usage with standard C++.

A third mistake is conflating compiler extensions with undefined behavior. They overlap in some cases but are different things. Undefined behavior is behavior that the standard explicitly does not define — the standard says the outcome is unpredictable, and anything can happen including seemingly working correctly. Compiler extensions are behaviors the compiler explicitly defines beyond what the standard requires — documented, predictable on that compiler, but non-portable. Both produce code that does not work reliably everywhere, but for different reasons.

## When to use this

Disable compiler extensions — by enabling `-pedantic-errors` in GCC/Clang or `/permissive-` in MSVC — when writing learning exercises, library code, or anything intended to be portable across compilers or platforms. Do this as part of initial project setup, alongside setting the language standard and enabling warnings.

Extensions are appropriate only in narrow, intentional situations: platform-specific code where the extension provides access to hardware or operating system features, the non-portability is acceptable, and the use is explicitly documented. In a learning context, that situation essentially never arises.

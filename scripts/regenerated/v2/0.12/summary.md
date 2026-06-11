## The idea

C++ is not a static language. It has evolved continuously since its creation, with the committee releasing new official versions of the standard at roughly three-year intervals: C++11, C++14, C++17, C++20, C++23. Each version adds features, fixes problems, deprecates outdated patterns, and occasionally removes things that should no longer be used. The language you write in C++20 is noticeably richer than C++11, and dramatically different from C++98.

This matters because your compiler does not automatically use the latest standard. By default, most compilers use an older standard — sometimes as far back as C++14 or even C++11 — to preserve backward compatibility and avoid breaking existing codebases that rely on older behavior. If you try to use a feature introduced in C++20 without telling the compiler to use that standard, you will get a compile error, and the error message may not make the cause obvious. It might say the type or function was not declared, rather than mentioning the language standard at all.

Choosing a language standard explicitly is a one-time project setting that controls which features of the language and standard library are available to you. Getting it right at the start of a project avoids confusing, hard-to-diagnose errors later.

## How it works

Language standards are selected by passing a flag to the compiler at build time:

- `-std=c++11` — C++11
- `-std=c++14` — C++14
- `-std=c++17` — C++17
- `-std=c++20` — C++20
- `-std=c++23` — C++23

In your IDE, there is usually a project or build settings panel where you can select the C++ standard from a dropdown menu without typing the flag manually. For MSVC, the flag syntax is slightly different: `/std:c++20` instead of `-std=c++20`, but the effect is the same.

This course uses C++20 as its baseline standard. C++20 is broadly supported by GCC 10 and later, Clang 10 and later, and MSVC 2019 version 16.11 and later — all of which have been available for several years and are widely installed. The features used in this course fall well within what those compiler versions support.

Why not always use the absolute latest standard? In professional settings, you choose the standard based on what your target compilers actually support and what the rest of the codebase already uses. Mixing standards in a large codebase creates confusion and maintenance burden. Some embedded or legacy platforms have compilers that only support older standards, and you must work within that constraint. For new learning projects, using the latest well-supported standard is the right default.

The standard also affects more than just which features are available. Some constructs that produce warnings in C++17 become errors in C++20. Some behaviors that were left up to the implementation in older standards become well-defined in newer ones. Choosing the standard sets the full set of rules the compiler applies — not just the list of available keywords and library features.

## Common mistakes

A common mistake is using a C++20 feature and wondering why it does not compile, without first checking which standard the project is configured to use. Error messages for "feature not available in this language version" range from clear ("this function is only available in C++17 and later") to cryptic ("identifier not found in this scope"). Confirming the language standard setting is always the first step when a feature fails to compile unexpectedly.

Another mistake is assuming that code written for C++11 will always compile identically under C++20. In practice it almost always does — the committee works hard to preserve backward compatibility — but there are genuine edge cases where stricter rules in newer standards break code that older standards permitted. When working with an existing codebase, use the standard it was written for unless you are explicitly upgrading.

A third mistake is thinking the standard choice only affects syntax and new keywords. It also affects the standard library. Some containers, algorithms, and utility types were added in specific standard versions: `std::optional` arrived in C++17, ranges and concepts arrived in C++20. Using these in a project configured for an older standard produces "not found" errors, even though the documentation describes them as available.

## When to use this

Set the language standard to C++20 when starting any new project for learning or personal work. Do it as the very first configuration step after creating the project, so it is established before you write any code.

For professional work, the standard is typically dictated by your organization's policy or by the oldest compiler version the project must support. Knowing how to change the language standard setting — and what it controls — is important whenever you join an existing codebase or need to upgrade a project from an older standard to a newer one.

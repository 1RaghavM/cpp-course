## The idea

You can configure your project to use a specific language standard, but at some point you might need to verify which standard your compiler is actually using. Perhaps you are working with a project you did not set up yourself, or you want to confirm that the standard setting you applied in your IDE's project panel actually took effect, or you are trying to understand why a feature you expected to work is not compiling.

C++ provides a way to check the active language standard at compile time: a predefined macro called `__cplusplus`. This macro is automatically defined by every conforming C++ compiler, and its value is a numeric constant that identifies the standard version being compiled against. It requires no header to be included — the preprocessor defines it before it processes any of your code.

A macro, in this context, is a name that the preprocessor replaces with a value before the compiler sees your code. Predefined macros are set by the compiler itself based on how it was invoked. `__cplusplus` is one of several predefined macros that provide information about the compilation environment.

## How it works

The `__cplusplus` macro has a specific long integer value for each language standard version:

- `199711L` — C++98 or C++03
- `201103L` — C++11
- `201402L` — C++14
- `201703L` — C++17
- `202002L` — C++20
- `202302L` — C++23

To check which standard is active, write and run this small diagnostic program:

```cpp
#include <iostream>

int main()
{
    std::cout << __cplusplus << std::endl;
    return 0;
}
```

When compiled and run, this prints the numeric value of `__cplusplus`. If you configured your project for C++20 and the program prints `202002`, the configuration is correct. If it prints `201703`, the compiler is actually using C++17 despite what your IDE shows — check the project's language standard setting and recompile.

Beyond diagnostics, `__cplusplus` appears in real-world C++ library headers to enable conditional compilation — code that compiles differently depending on the active standard. A library header might provide a basic implementation under C++14 and a richer one under C++17, wrapping the two alternatives in `#if __cplusplus >= 201703L`. This pattern is common in header-only libraries that need to support multiple standards. You do not need to write such code now, but recognizing it when you read library headers is useful.

For this course, `__cplusplus` has a single practical use: confirming that your toolchain is configured as expected. If a lesson introduces a C++20 feature and it fails to compile despite what you believe your settings say, printing `__cplusplus` is the fastest way to determine whether the problem is a code error or a configuration mismatch.

## Common mistakes

A common mistake is trusting the IDE's dropdown or project settings panel without verifying the actual behavior. Some IDEs have multiple locations where the language standard can be configured — global IDE preferences, project-level settings, and individual build target settings — and they can conflict. When there is a conflict, the most specific setting typically wins, but the rule varies by IDE. Printing `__cplusplus` is a ground-truth check that is more reliable than reading settings panels.

Another mistake is expecting `__cplusplus` to tell you whether a specific feature is available. The macro reports which standard the compiler is targeting, but compiler support for individual features is not uniform across compilers or versions. A compiler can declare itself C++20-conforming while still lacking partial support for some C++20 features. For any specific feature, compiler support tables — such as those on cppreference.com — give a more accurate picture than the macro value alone.

A third mistake is using `__cplusplus` for conditional compilation in a way that makes the code hard to maintain. Standard-version guards can accumulate in a codebase until no one is sure which parts of the code compile under which conditions. Use the technique intentionally and sparingly. For new code, pick a minimum required standard and require it through your build system settings rather than working around missing features with `#if` blocks.

## When to use this

Use `__cplusplus` as a diagnostic tool whenever you suspect a mismatch between the standard you configured and the one the compiler is actually applying. Specific situations where it helps:

- A feature from the course does not compile and you cannot determine whether the problem is the code itself or the language standard setting.
- You have just set up a new machine or installed a new IDE and want to confirm the toolchain is using the right standard.
- You inherited a project and need to determine which standard it was built against before making changes.

Once your setup is verified and working, `__cplusplus` recedes into the background. The value of this lesson is knowing the tool exists and knowing when to reach for it — not knowing it by heart or using it in every program you write.
